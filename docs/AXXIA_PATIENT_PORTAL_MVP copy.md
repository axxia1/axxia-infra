# AXXIA_PATIENT_PORTAL_MVP.md

> **Objetivo**: Implementar el **MVP del Portal/App del Paciente Axxia** reutilizando el diseño del módulo **“Consulta de Resultados”** como patrón UI para: Resultados, Recetas, Medicación, Vacunas, Citas y **Mi Red de Salud**.  
> **Principio clave**: **No** introducir cambios disruptivos de esquema. Usar **mapeo** a tablas/campos existentes. Cualquier adición es **opcional, idempotente** y con `IF NOT EXISTS`.

---

## 0) Principios de implementación

- **Schema-first por reutilización**: usar tablas/campos existentes:
  - `axxia.patients`, `axxia.providers`, `axxia.clinical_events`, `axxia.event_permissions`, `axxia.access_logs`, `axxia.identity_mapping`, `axxia.referrals`, `axxia.gamification_scores`.
- **Evitar enums nuevos**: derivar tipos por `AXXIA ID` (`AXX-{TT}-...`, `TT`=02=proveedor, 03=institución, etc.).
- **Idempotencia**: migraciones con `IF NOT EXISTS`. No romper FKs/RLS existentes.
- **UI reutilizable**: clonar patrón **Consulta de Resultados** (layout, filtros, cards, panel lateral) para todos los módulos de lectura.
- **RLS consistente**: para vistas, usar `security barrier` y filtrar por `auth.uid()` o `patient_id` según convención actual.
- **Naming**: mantener prefijos `axxia.*` y rutas `/api/*` ya usadas en tu proyecto.

---

## 1) Mapeo de datos (sin cambios de schema)

> **Instrucción a Bolt**: mapear campos a las columnas existentes; **no** crear nuevas columnas por defecto.

### 1.1 Identidades
- **Paciente**: `axxia.patients(id, axxia_id, display_name?, ...)`
- **Proveedor**: `axxia.providers(id, axxia_id, display_name?/legal_name, specialty?, ...)`
- **Tipo derivado**: `tipo = SUBSTRING(axxia_id, 5, 2)` → `01=paciente`, `02=proveedor individual`, `03=institución`, `08=laboratorio`, etc.

### 1.2 Eventos clínicos
- **Fuente principal**: `axxia.clinical_events(id, patient_id, provider_id, occurred_at, event_type, payload_json, ...)`
  - *Representa consultas, resultados, notas, recetas, vacunas, etc., según configuración actual.*
  - `event_type` (string) y `payload_json` (detalles) ya operan como contenedor flexible.

### 1.3 Permisos y auditoría
- **Granularidad de acceso**: `axxia.event_permissions`
- **Bitácora**: `axxia.access_logs` (quién accedió, cuándo, a qué).

### 1.4 Referidos y gamificación
- **Referencias**: `axxia.referrals`
- **Puntos/score**: `axxia.gamification_scores`

---

## 2) “Mi Red de Salud” (sin tablas nuevas por defecto)

> Construye la red del paciente **derivando interacciones reales** (eventos + accesos). Favoritos/notas son **opcionales** mediante una tabla pequeña.

### 2.1 Vista derivada de contactos por interacción

```sql
-- Vista: contactos de salud de un paciente, inferidos por interacciones
create view if not exists axxia.health_network_contacts_v
security barrier
as
with interactions as (
  -- Proveedores con eventos clínicos del paciente
  select
    ce.patient_id,
    ce.provider_id,
    pvr.axxia_id                      as contact_axxia_id,
    coalesce(pvr.display_name, pvr.legal_name, pvr.axxia_id) as contact_name,
    substring(pvr.axxia_id from 5 for 2) as contact_type_code,
    max(ce.occurred_at)                as last_interaction_at,
    count(*)                           as interaction_count
  from axxia.clinical_events ce
  join axxia.providers pvr on pvr.id = ce.provider_id
  group by 1,2,3,4,5

  union all

  -- Proveedores que accedieron al expediente (vía permisos/accesos)
  select
    al.patient_id,
    al.provider_id,
    pvr.axxia_id,
    coalesce(pvr.display_name, pvr.legal_name, pvr.axxia_id),
    substring(pvr.axxia_id from 5 for 2),
    max(al.accessed_at),
    count(*)
  from axxia.access_logs al
  join axxia.providers pvr on pvr.id = al.provider_id
  group by 1,2,3,4,5
),
agg as (
  select
    i.patient_id,
    i.provider_id,
    i.contact_axxia_id,
    i.contact_name,
    i.contact_type_code,
    max(i.last_interaction_at) as last_interaction,
    sum(i.interaction_count)   as total_interactions
  from interactions i
  group by 1,2,3,4,5
)
select
  gen_random_uuid()           as id,
  a.patient_id,
  a.provider_id,
  a.contact_axxia_id,
  a.contact_name,
  case a.contact_type_code
    when '02' then 'medico'
    when '03' then 'institucion'
    when '08' then 'laboratorio'
    when '07' then 'farmacia'
    when '04' then 'aseguradora'
    else 'proveedor'
  end                         as contact_type,
  a.total_interactions,
  least(100, 20 + (a.total_interactions * 10))::int as relationship_strength, -- calculado
  a.last_interaction
from agg a;
```

**Notas**  
- `relationship_strength` es **calculado**, no persistido.  
- Si el nombre del proveedor difiere (`name`, `full_name`), mapear en la `coalesce(...)`.

### 2.2 (Opcional) Pins del paciente (favoritos/nota)

> Crear solo si necesitas favoritos/notas **propiedad del paciente**.

```sql
create table if not exists axxia.patient_contact_pins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references axxia.patients(id) on delete cascade,
  contact_axxia_id varchar(64) not null,
  is_favorite boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  unique (patient_id, contact_axxia_id)
);

alter table axxia.patient_contact_pins enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'axxia' and tablename = 'patient_contact_pins' and policyname = 'pins_owner_rw'
  ) then
    create policy pins_owner_rw on axxia.patient_contact_pins
      using (patient_id = auth.uid()) with check (patient_id = auth.uid());
  end if;
end $$;
```

---

## 3) UI/UX — Patrón “Consulta de Resultados” (clonar)

> **Bolt**: clonar layout, componentes y navegación del módulo **Consulta de Resultados** para los **seis** módulos del MVP.  
> Reutilizar **cards**, **filtros**, **buscador**, **panel lateral** de detalle y **acciones universales**.

### 3.1 Módulos

1. **Resultados de Estudios**  
2. **Recetas** (bandeja de recetas auto-delivery)  
3. **Medicamentos** (plan de medicación + adherencia)  
4. **Vacunas** (cartilla digital + recordatorios)  
5. **Citas** (agenda unificada + check-in QR)  
6. **Mi Red de Salud** (desde `health_network_contacts_v` y *pins* si existen)

### 3.2 Comportamientos comunes

- **Encabezado** con: búsqueda y filtros por **fecha**, **tipo**, **proveedor**.  
- **Cards** con metadatos clave (nombre, fecha, proveedor, estado, tags).  
- **Panel lateral**: detalle completo + **acciones** (descargar, **compartir**, **revocar**, **favorito**, **agregar a Mi Red**).  
- **Acciones universales**:
  - **Compartir seguro** (flujo granular: qué, con quién, tiempo).  
  - **Ver bitácora** (si aplica) leyendo `axxia.access_logs`.  
  - **Agregar a Mi Red** → upsert en `patient_contact_pins` (si existe).  
- **Empty states** útiles (CTA para conectar documentos, invitar médico, completar perfil).

---

## 4) APIs (sin cambiar modelos)

> **Bolt**: implementar estos handlers **consultando las tablas actuales**. No agregar campos nuevos.

### 4.1 Mi Red de Salud

**GET** `/api/health-network`  
- Retorna contactos del `patient_id = auth.uid()` desde `axxia.health_network_contacts_v`.  
- Si existe `axxia.patient_contact_pins`, fusionar por `contact_axxia_id` para `is_favorite` y `notes`.

**POST** `/api/health-network/pin` *(opcional)*  
- Body: `{ contact_axxia_id: string, is_favorite?: boolean, notes?: string }`  
- Upsert en `axxia.patient_contact_pins` (requiere tabla opcional).

### 4.2 Compartir seguro

**POST** `/api/sharing/grant`  
- Crea/actualiza permiso en `axxia.event_permissions` con:
  - `subject_id` (médico/institución receptor), `scope` (lista de tipos o `event_id`s), `expires_at` (opcional), `granted_by = auth.uid()`.

**POST** `/api/sharing/revoke`  
- Revoca permiso por `permission_id` o por `subject_id + scope` vigente.

**GET** `/api/sharing/logs?event_id=...`  
- Retorna accesos desde `axxia.access_logs` para mostrar bitácora al paciente.

### 4.3 Gamificación

**POST** `/api/gamification/earn`  
- Suma puntos en `axxia.gamification_scores` (reglas actuales).  
- Triggers de UI: completar perfil, adherencia, asistir a citas, referir, agregar a Mi Red (1ª vez por contacto).

**GET** `/api/gamification/me`  
- Devuelve progreso, niveles, insignias (si ya existen) y saldo.

### 4.4 Recordatorios & Notificaciones

- **Medicamentos**: leer de eventos tipo `prescription`/`medication_plan` para programar notificaciones.  
- **Citas**: T-24h / T-2h.  
- **Resultados**: push cuando se inserta evento `result` para el paciente.

> Usa la infraestructura de notificaciones existente; si no la hay, crear *job queue* mínima y un sender de push/email (respeta preferencias del paciente).

---

## 5) Privacidad & Controles (reutilización)

- **Permisos granulares**: reusar `axxia.event_permissions` (scope por tipo o por `event_id`s).  
- **Bitácora**: mostrar `axxia.access_logs` con filtros por fecha/recurso.  
- **Modo privado**: en cliente, ocultar diagnósticos sensibles (flag de lista del paciente o tags en `payload_json`).  
- **Portabilidad**: exportar bundles FHIR desde los eventos filtrados (si ya existe endpoint, reutilizar).

---

## 6) Reglas RLS para vistas/tabla opcional

> Mantener la coherencia con políticas vigentes. Ejemplos:

```sql
-- Asegurar que la vista sólo exponga contactos del paciente autenticado
-- (Ajusta la relación si tu auth mapea auth.uid() <> patients.id)
-- Si tu proyecto usa mapping auth.uid() -> patients.id en otra tabla, filtra allí.

-- Ejemplo de wrapper seguro (opcional) si necesitas filtrar por auth.uid():
create view if not exists axxia.health_network_contacts_secure_v
security barrier
as
select *
from axxia.health_network_contacts_v v
where v.patient_id = auth.uid();  -- ajustar si tu mapeo difiere
```

```sql
-- RLS para patient_contact_pins (si la tabla opcional se creó)
alter table axxia.patient_contact_pins enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'axxia' and tablename = 'patient_contact_pins' and policyname = 'pins_owner_rw'
  ) then
    create policy pins_owner_rw on axxia.patient_contact_pins
      using (patient_id = auth.uid()) with check (patient_id = auth.uid());
  end if;
end $$;
```

> **Nota**: si tu `auth.uid()` no corresponde directo a `patients.id`, crea una vista adicional que haga el join con la tabla de identidades para filtrar por el paciente autenticado.

---

## 7) Recordatorios y Notificaciones — detalle

- **Preferencias** del paciente (canales, horarios de no molestar).  
- **Medicamentos**: crear *jobs* por dosis de cada prescripción activa.  
- **Citas**: notificaciones T-24h, T-2h y post consulta (encuesta / NPS).  
- **Resultados**: al insertar evento `result`, enviar push + deep link a la card.  
- **Vacunas**: si en `payload_json` existe `next_due_at`, generar recordatorio.

---

## 8) Cockpit de Participación (Tokens/Niveles)

- **Puntos AXX** por:
  - Completar perfil clínico (diagnósticos, alergias, vacunas).  
  - **Adherencia** (marcar tomas durante 7 días seguidos = streak).  
  - **Asistencia** a citas.  
  - **Referir** (ya integrado con `referrals`).  
  - **Agregar a Mi Red** (sólo 1 vez por proveedor).

- **Leaderboard** (opt-in): mostrar ranking general y por comunidad (empresa/escuela) si existe agrupación.  
- **Niveles**: Bronce/Plata/Oro/Platino con umbrales simples (e.g., cada 100 puntos = +1 nivel).  
- **Recompensas**: descuentos en estudios/consultas, prioridad en agenda, badges (si ya existen campos JSON, reutilizarlos).

---

## 9) Métricas del MVP (sin nuevas tablas)

- **Onboarding** completo (% pacientes con perfil ≥80%).  
- **Recetas** vistas y **adherencia** (% de tomas registradas).  
- **Citas** gestionadas in-app (% de totales).  
- **Compartidos** creados/revocados (desde permisos/logs).  
- **Red de Salud**: tamaño medio, % con favoritos.  
- **Referencias** completadas (de `axxia.referrals`).  
- **Engagement**: DAU/WAU/MAU, D1/D7/D30 retention.

---

## 10) Pruebas de aceptación (QA funcional)

1. **Permisos**: un proveedor sin permiso no accede a resultados compartidos a otro.  
2. **Vista Mi Red**: sólo muestra contactos inferidos por interacciones del paciente.  
3. **Pins** (si existe tabla): crear/eliminar favorito no modifica datos clínicos.  
4. **Compartir**: expiración, revocación y bitácora visibles.  
5. **Notificaciones**: receta nueva → push; cita reagendada → notificación actualizada.  
6. **UI patrón**: todos los módulos replican filtros/cards/panel lateral del diseño “Consulta de Resultados”.

---

## 11) Rollout seguro (orden recomendado)

1) Desplegar **vistas** (`health_network_contacts_v`).  
2) Activar UI **Mi Red** en **read-only** (sin pins).  
3) Habilitar **pins** (`patient_contact_pins`) si se requiere favoritos/nota.  
4) Vincular **gamificación** a eventos de uso (agregar a red, adherencia, referencias).

---

## 12) Notas a Bolt

- **No crear enums** ni columnas nuevas salvo `axxia.patient_contact_pins` (opcional).  
- Si difieren nombres de columnas, **mapear** en SQL/UI sin alterar schema.  
- Replicar **exactamente** el patrón UI de *Consulta de Resultados* (cards + filtros + panel detalle).  
- Respetar **RLS** existente; para vistas, usar `security barrier` y filtros por paciente autenticado.  
- Cualquier discrepancia, priorizar **no romper** y reportar el campo esperado vs disponible para ajustar el mapeo.

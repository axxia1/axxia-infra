# AXXIA - Referencia de Base de Datos para ChatGPT

> **INSTRUCCIONES PARA CHATGPT**: Este documento contiene la estructura completa de la base de datos del proyecto AXXIA. **DEBES** consultar este archivo ANTES de escribir cualquier query SQL, migración, o código que interactúe con la base de datos. Los nombres de campos aquí documentados son los únicos válidos y NO deben cambiarse o duplicarse.

---

## 🎯 REGLAS OBLIGATORIAS

### 1. Nomenclatura de Identificadores
- **AXXIA IDs**: Siempre usa `axxia_id` (tipo `text` o `varchar`)
- **UUIDs internos**: Siempre usa `id` (tipo `uuid`)
- **Patient references**: `patient_id` (uuid) o `patient_axxia_id` (text)
- **Provider references**: `provider_id` (uuid) o `provider_axxia_id` (text)

### 2. Campos de Nombres (NUNCA cambiar)
```sql
first_name text
middle_name text (nullable)
last_name_paternal text
last_name_maternal text
```
**❌ NUNCA uses:** `display_name`, `full_name`, `legal_name`, `name`

### 3. Construcción de Nombres Completos
```sql
-- Patrón OBLIGATORIO:
trim(concat(first_name, ' ', last_name_paternal, ' ', coalesce(last_name_maternal, '')))
```

---

## 📋 TABLA: `axxia.patients`

```sql
CREATE TABLE axxia.patients (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  axxia_id              varchar NOT NULL UNIQUE,
  curp                  varchar,
  email                 text,
  phone_mobile          varchar,              -- ❌ NO 'phone'
  first_name            text,
  middle_name           text,
  last_name_paternal    text,
  last_name_maternal    text,
  date_of_birth         date,
  gender                varchar,
  city                  text,
  state                 text,
  state_of_birth        text,
  country               varchar DEFAULT 'MX',
  blood_type            varchar,
  curp_verified         boolean DEFAULT false,
  auth_user_id          uuid REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

---

## 📋 TABLA: `axxia.providers`

```sql
CREATE TABLE axxia.providers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  axxia_id              varchar NOT NULL UNIQUE,
  professional_id       varchar NOT NULL,
  email                 text NOT NULL,
  first_name            text NOT NULL,
  middle_name           text,
  last_name_paternal    text,
  last_name_maternal    text,
  specialty_id          uuid REFERENCES axxia.provider_specialties(id),
  license_number        varchar,
  cedula_general        varchar,
  cedula_specialty      varchar,
  date_of_birth         date,
  state_of_birth        text,
  phone_mobile          varchar,
  phone_office_1        varchar,
  phone_office_2        varchar,
  phone_office_3        varchar,
  curp                  varchar,
  curp_verified         boolean DEFAULT false,
  rfc                   varchar,
  gender                char,
  street_address        text,
  postal_code           varchar,
  city                  text,
  state                 text,
  country               varchar DEFAULT 'MX',
  logo_url              text,
  signature_public_key  text,
  verified              boolean DEFAULT false,
  auth_user_id          uuid REFERENCES auth.users(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

---

## 📋 TABLA CRÍTICA: `axxia.clinical_events`

**⚠️ ESTA ES LA TABLA MÁS IMPORTANTE** - Almacena TODOS los eventos clínicos del sistema.

```sql
CREATE TABLE axxia.clinical_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  axxia_id                text NOT NULL,
  patient_axxia_id        text,                -- ❌ NO 'patient_id'
  provider_axxia_id       text,                -- ❌ NO 'provider_id'
  institution_clues       text,                -- Código CLUES
  event_type              clinical_event_type NOT NULL,
  event_date              timestamptz,         -- ❌ NO 'occurred_at'
  title                   text NOT NULL,
  description             text,
  category                text,
  specialty               text,
  fhir_resource_type      text,
  fhir_data               jsonb DEFAULT '{}',
  metadata                jsonb DEFAULT '{}',  -- Datos específicos del evento
  storage_path            text,
  storage_hash            text,
  storage_size_bytes      bigint,
  storage_mime_type       text,
  hedera_topic_id         text,
  hedera_sequence_number  bigint,
  is_critical             boolean DEFAULT false,
  is_visible              boolean DEFAULT true,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
```

### Enum: `clinical_event_type`
```sql
CREATE TYPE clinical_event_type AS ENUM (
  'consultation',
  'lab_result',
  'imaging_study',
  'prescription',
  'clinical_note',
  'document',
  'vital_signs',
  'allergy',
  'immunization',
  'appointment'
);
```

### Uso del campo `metadata` por tipo de evento

#### Para Recetas (`prescription`)
```json
{
  "medications": [
    {
      "name": "Paracetamol 500mg",
      "dosage": "1 tableta cada 8 horas",
      "duration": "7 días",
      "instructions": "Tomar con alimentos"
    }
  ]
}
```

#### Para Citas (`appointment`)
```json
{
  "type": "consultation",
  "status": "scheduled",
  "reason": "Revisión general",
  "notes": "Traer estudios previos",
  "location": "Consultorio 3",
  "duration_minutes": 30
}
```

#### Para Vacunas (`immunization`)
```json
{
  "vaccine_name": "COVID-19",
  "vaccine_code": "CVX-207",
  "manufacturer": "Pfizer",
  "lot_number": "EW0150",
  "dose_number": 1,
  "dose_series": 2,
  "route": "Intramuscular",
  "site": "Deltoides izquierdo",
  "next_dose_date": "2024-02-01"
}
```

---

## 📋 TABLA: `axxia.cat_institutions_mx`

Catálogo oficial de instituciones médicas en México.

```sql
CREATE TABLE axxia.cat_institutions_mx (
  id                  serial PRIMARY KEY,
  axxia_id            varchar NOT NULL,
  name                text NOT NULL,
  clues               text UNIQUE NOT NULL,  -- Clave Única de Establecimientos de Salud
  type_norm           text,
  source_type         text,
  city                text NOT NULL,
  state               text NOT NULL,
  ownership           text,
  institution_group   text,
  phone1              text,
  phone2              text,
  rfc                 text,
  active              boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);
```

**⚠️ IMPORTANTE:** Los joins con instituciones se hacen por `clues`, NO por `id` o `axxia_id`.

```sql
-- ✅ CORRECTO:
LEFT JOIN cat_institutions_mx inst ON inst.clues = ce.institution_clues

-- ❌ INCORRECTO:
LEFT JOIN cat_institutions_mx inst ON inst.id = ce.institution_id
```

---

## 📋 TABLAS DE GAMIFICACIÓN (Fase 2)

### `axxia.gamification_scores`
```sql
CREATE TABLE axxia.gamification_scores (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            uuid REFERENCES axxia.patients(id) UNIQUE,
  total_points          int DEFAULT 0,
  level                 text DEFAULT 'Bronze',  -- Bronze, Silver, Gold, Platinum
  current_streak_days   int DEFAULT 0,
  longest_streak_days   int DEFAULT 0,
  last_activity_date    date,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);
```

### `axxia.engagement_actions`
```sql
CREATE TABLE axxia.engagement_actions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid REFERENCES axxia.patients(id),
  action_type   text NOT NULL,
  action_key    text UNIQUE,
  points_earned int DEFAULT 0,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);
```

**Tipos de acciones válidos:**
- `profile_complete`, `profile_update`
- `medication_adherence`
- `appointment_attended`
- `referral_completed`
- `health_network_add`
- `document_upload`
- `consent_authorized`

### `axxia.patient_achievements`
```sql
CREATE TABLE axxia.patient_achievements (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id                uuid REFERENCES axxia.patients(id),
  achievement_code          text NOT NULL,
  achievement_name          text NOT NULL,
  achievement_description   text,
  icon_name                 text,
  earned_at                 timestamptz DEFAULT now(),
  UNIQUE(patient_id, achievement_code)
);
```

### `axxia.reward_redemptions`
```sql
CREATE TABLE axxia.reward_redemptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    uuid REFERENCES axxia.patients(id),
  reward_code   text NOT NULL,
  reward_name   text NOT NULL,
  points_cost   int NOT NULL,
  status        text DEFAULT 'pending',  -- pending, fulfilled, cancelled
  redeemed_at   timestamptz DEFAULT now(),
  fulfilled_at  timestamptz,
  notes         text
);
```

---

## 📋 TABLAS DE CITAS (Fase 2)

### `axxia.appointment_check_ins`
```sql
CREATE TABLE axxia.appointment_check_ins (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id      uuid REFERENCES axxia.clinical_events(id),
  patient_axxia_id    text NOT NULL,
  checked_in_at       timestamptz DEFAULT now(),
  check_in_method     text DEFAULT 'manual',  -- 'qr', 'manual', 'kiosk'
  location_verified   boolean DEFAULT false,
  notes               text,
  created_at          timestamptz DEFAULT now()
);
```

---

## 📊 VISTAS PRINCIPALES

### `axxia.patient_timeline_v`
Vista unificada del historial clínico completo.

```sql
SELECT
  ce.id,
  ce.axxia_id,
  ce.patient_axxia_id,
  ce.provider_axxia_id,
  ce.institution_clues,
  ce.event_type,
  ce.event_date,
  ce.title,
  ce.description,
  trim(concat(pvr.first_name, ' ', pvr.last_name_paternal, ' ', coalesce(pvr.last_name_maternal, ''))) as provider_name,
  inst.name as institution_name,
  ce.storage_path,
  ce.fhir_resource_type,
  ce.metadata,
  p.id as patient_id
FROM axxia.clinical_events ce
LEFT JOIN axxia.providers pvr ON pvr.axxia_id = ce.provider_axxia_id
LEFT JOIN axxia.cat_institutions_mx inst ON inst.clues = ce.institution_clues
LEFT JOIN axxia.patients p ON p.axxia_id = ce.patient_axxia_id;
```

### `axxia.patient_appointments_v`
Vista especializada para citas médicas.

```sql
SELECT
  ce.id,
  ce.patient_axxia_id,
  ce.event_date as appointment_date,
  ce.title,
  ce.metadata->>'type' as appointment_type,
  ce.metadata->>'status' as status,
  ce.metadata->>'reason' as reason,
  ce.metadata->>'notes' as notes,
  ce.metadata->>'location' as location,
  (ce.metadata->>'duration_minutes')::int as duration_minutes,
  ce.provider_axxia_id,
  trim(concat(pvr.first_name, ' ', pvr.last_name_paternal, ' ', coalesce(pvr.last_name_maternal, ''))) as provider_name,
  inst.name as institution_name,
  inst.axxia_id as institution_axxia_id,
  ci.checked_in_at,
  ci.check_in_method,
  CASE
    WHEN ci.checked_in_at IS NOT NULL THEN 'checked_in'
    WHEN ce.metadata->>'status' = 'cancelled' THEN 'cancelled'
    WHEN ce.metadata->>'status' = 'completed' THEN 'completed'
    WHEN ce.event_date < now() THEN 'missed'
    WHEN ce.event_date < now() + interval '24 hours' THEN 'upcoming_soon'
    ELSE 'upcoming'
  END as computed_status,
  p.id as patient_id
FROM axxia.clinical_events ce
LEFT JOIN axxia.providers pvr ON pvr.axxia_id = ce.provider_axxia_id
LEFT JOIN axxia.cat_institutions_mx inst ON inst.clues = ce.institution_clues
LEFT JOIN axxia.appointment_check_ins ci ON ci.appointment_id = ce.id
LEFT JOIN axxia.patients p ON p.axxia_id = ce.patient_axxia_id
WHERE ce.event_type = 'appointment';
```

### `axxia.patient_vaccinations_v`
Vista especializada para vacunación.

```sql
SELECT
  ce.id,
  ce.patient_axxia_id,
  ce.event_date as vaccination_date,
  ce.metadata->>'vaccine_name' as vaccine_name,
  ce.metadata->>'vaccine_code' as vaccine_code,
  ce.metadata->>'manufacturer' as manufacturer,
  ce.metadata->>'lot_number' as lot_number,
  (ce.metadata->>'dose_number')::int as dose_number,
  (ce.metadata->>'dose_series')::int as dose_series,
  ce.metadata->>'route' as route,
  ce.metadata->>'site' as site,
  ce.metadata->>'next_dose_date' as next_dose_date,
  ce.metadata->>'notes' as notes,
  ce.provider_axxia_id,
  trim(concat(pvr.first_name, ' ', pvr.last_name_paternal, ' ', coalesce(pvr.last_name_maternal, ''))) as provider_name,
  inst.name as institution_name,
  p.id as patient_id
FROM axxia.clinical_events ce
LEFT JOIN axxia.providers pvr ON pvr.axxia_id = ce.provider_axxia_id
LEFT JOIN axxia.cat_institutions_mx inst ON inst.clues = ce.institution_clues
LEFT JOIN axxia.patients p ON p.axxia_id = ce.patient_axxia_id
WHERE ce.event_type = 'immunization';
```

### `axxia.leaderboard_v`
Tabla de líderes de gamificación.

```sql
SELECT
  gs.patient_id,
  trim(concat(p.first_name, ' ', p.last_name_paternal, ' ', coalesce(p.last_name_maternal, ''))) as patient_name,
  gs.total_points,
  gs.level,
  gs.current_streak_days,
  gs.longest_streak_days,
  COUNT(DISTINCT pa.id) as achievement_count,
  RANK() OVER (ORDER BY gs.total_points DESC) as rank
FROM axxia.gamification_scores gs
JOIN axxia.patients p ON p.id = gs.patient_id
LEFT JOIN axxia.patient_achievements pa ON pa.patient_id = gs.patient_id
GROUP BY gs.patient_id, p.first_name, p.last_name_paternal, p.last_name_maternal,
         gs.total_points, gs.level, gs.current_streak_days, gs.longest_streak_days
ORDER BY gs.total_points DESC;
```

---

## 🔧 FUNCIONES RPC PRINCIPALES

### Registro de Pacientes
```sql
axxia.register_patient(
  p_curp varchar,
  p_email text,
  p_phone_mobile varchar,
  p_first_name text,
  p_middle_name text,
  p_last_name_paternal text,
  p_last_name_maternal text,
  p_date_of_birth date,
  p_gender varchar,
  p_state_of_birth text,
  p_city text,
  p_state text,
  p_street_address text,
  p_postal_code varchar
) RETURNS json
```

### Registro de Proveedores
```sql
axxia.register_provider(
  p_professional_id varchar,
  p_email text,
  p_first_name text,
  p_middle_name text,
  p_last_name_paternal text,
  p_last_name_maternal text,
  p_specialty_id uuid,
  p_license_number varchar,
  p_cedula_general varchar,
  p_cedula_specialty varchar,
  p_date_of_birth date,
  p_state_of_birth text,
  p_phone_mobile varchar,
  p_phone_office_1 varchar,
  p_phone_office_2 varchar,
  p_phone_office_3 varchar,
  p_curp varchar,
  p_rfc varchar,
  p_gender char,
  p_street_address text,
  p_postal_code varchar,
  p_city text,
  p_state text,
  p_logo_url text
) RETURNS json
```

### Crear Evento Clínico
```sql
public.create_clinical_event(
  p_patient_axxia_id text,
  p_provider_axxia_id text,
  p_institution_clues text,
  p_event_type text,
  p_event_date timestamptz,
  p_title text,
  p_description text,
  p_category text,
  p_specialty text,
  p_metadata jsonb
) RETURNS json
```

### Check-in de Cita
```sql
axxia.check_in_appointment(
  p_appointment_id uuid,
  p_check_in_method text DEFAULT 'manual',
  p_location_verified boolean DEFAULT false,
  p_notes text DEFAULT null
) RETURNS json
```

### Sistema de Puntos
```sql
axxia.earn_points(
  p_patient_id uuid,
  p_action_type text,
  p_action_key text DEFAULT null,
  p_points int DEFAULT null,
  p_metadata jsonb DEFAULT null
) RETURNS json

axxia.check_achievements(p_patient_id uuid) RETURNS void

axxia.calculate_level(points int) RETURNS text
```

### Red de Salud
```sql
axxia.get_health_network(
  p_patient_id uuid DEFAULT null
) RETURNS TABLE (
  id uuid,
  patient_id uuid,
  provider_id uuid,
  contact_axxia_id varchar,
  contact_name text,
  contact_type text,
  total_interactions int,
  relationship_strength int,
  last_interaction timestamptz,
  is_favorite boolean,
  notes text
)
```

### Esquema de Vacunación
```sql
axxia.get_vaccination_schedule(
  p_patient_id uuid DEFAULT null
) RETURNS TABLE (
  vaccine_name text,
  total_doses int,
  received_doses int,
  last_dose_date timestamptz,
  next_dose_date text,
  is_complete boolean
)
```

---

## ❌ ERRORES COMUNES A EVITAR

### 1. Nombres de columnas incorrectos
```sql
-- ❌ INCORRECTO:
SELECT * FROM clinical_events WHERE patient_id = '...'
SELECT * FROM clinical_events WHERE occurred_at > now()
SELECT * FROM providers WHERE display_name = 'Dr. Smith'
SELECT * FROM patients WHERE phone = '555-1234'

-- ✅ CORRECTO:
SELECT * FROM clinical_events WHERE patient_axxia_id = '...'
SELECT * FROM clinical_events WHERE event_date > now()
SELECT * FROM providers WHERE concat(first_name, ' ', last_name_paternal) = 'Dr. Smith'
SELECT * FROM patients WHERE phone_mobile = '555-1234'
```

### 2. Joins incorrectos con instituciones
```sql
-- ❌ INCORRECTO:
LEFT JOIN cat_institutions_mx inst ON inst.id = ce.institution_id
LEFT JOIN cat_institutions_mx inst ON inst.axxia_id = ce.institution_axxia_id

-- ✅ CORRECTO:
LEFT JOIN cat_institutions_mx inst ON inst.clues = ce.institution_clues
```

### 3. Joins incorrectos con proveedores
```sql
-- ❌ INCORRECTO:
LEFT JOIN providers pvr ON pvr.id = ce.provider_id

-- ✅ CORRECTO:
LEFT JOIN providers pvr ON pvr.axxia_id = ce.provider_axxia_id
```

### 4. Construcción incorrecta de nombres
```sql
-- ❌ INCORRECTO:
SELECT display_name FROM providers
SELECT full_name FROM patients
SELECT name FROM providers

-- ✅ CORRECTO:
SELECT trim(concat(first_name, ' ', last_name_paternal, ' ', coalesce(last_name_maternal, ''))) as full_name
FROM providers
```

---

## ✅ PATRONES CORRECTOS

### Obtener eventos de un paciente
```sql
SELECT *
FROM axxia.clinical_events
WHERE patient_axxia_id = 'PAT-ABC123'
  AND is_visible = true
ORDER BY event_date DESC;
```

### Obtener recetas de un paciente
```sql
SELECT
  id,
  event_date,
  title,
  metadata->>'medications' as medications
FROM axxia.clinical_events
WHERE patient_axxia_id = 'PAT-ABC123'
  AND event_type = 'prescription'
ORDER BY event_date DESC;
```

### Obtener citas próximas
```sql
SELECT *
FROM axxia.patient_appointments_v
WHERE patient_id = '...'
  AND appointment_date >= now()
  AND computed_status IN ('upcoming', 'upcoming_soon')
ORDER BY appointment_date ASC;
```

### Insertar evento clínico
```sql
INSERT INTO axxia.clinical_events (
  patient_axxia_id,
  provider_axxia_id,
  institution_clues,
  event_type,
  event_date,
  title,
  description,
  metadata
) VALUES (
  'PAT-ABC123',
  'PRV-XYZ789',
  'CSSSA000001',
  'prescription',
  now(),
  'Prescripción de Antibióticos',
  'Tratamiento para infección respiratoria',
  '{"medications": [{"name": "Amoxicilina 500mg", "dosage": "1 tableta cada 8 horas", "duration": "7 días"}]}'::jsonb
);
```

---

## 📝 CHECKLIST ANTES DE ESCRIBIR CÓDIGO

Antes de escribir cualquier query, migración o código que interactúe con la base de datos:

- [ ] He consultado este documento de referencia
- [ ] Estoy usando los nombres de columnas exactos documentados aquí
- [ ] No estoy inventando nuevos nombres de campos que ya existen
- [ ] Estoy usando `axxia_id` (text) para identificadores AXXIA
- [ ] Estoy usando `id` (uuid) para claves primarias internas
- [ ] Estoy usando el patrón correcto para construir nombres completos
- [ ] Estoy usando `clues` para joins con instituciones
- [ ] Estoy usando `*_axxia_id` para joins con pacientes/proveedores
- [ ] Estoy usando `event_date` (no `occurred_at`) en clinical_events
- [ ] Estoy usando `phone_mobile` (no `phone`) en pacientes/proveedores
- [ ] Estoy usando las vistas existentes cuando sea posible

---

## 📅 Información de Versión

- **Última actualización**: 2025-11-07
- **Versión del esquema**: 1.0
- **Última migración aplicada**: `20251107030000_create_gamification_system`
- **Total de tablas**: 15+
- **Total de vistas**: 6+
- **Total de funciones RPC**: 20+

---

## 🚨 RECORDATORIO FINAL PARA CHATGPT

**ANTES de escribir CUALQUIER código SQL:**
1. Busca en este documento el nombre correcto de la tabla
2. Busca en este documento los nombres correctos de las columnas
3. Verifica el tipo de dato correcto (text vs uuid, etc.)
4. Usa los patrones de joins documentados aquí
5. NO inventes nuevos nombres de campos

**SI necesitas un campo que no existe:**
1. Pregunta al usuario primero
2. Propón una migración nueva que siga las convenciones existentes
3. NO dupliques funcionalidad que ya existe con otro nombre

---

**Generado por:** Claude Code (Anthropic)
**Para uso de:** ChatGPT y otros sistemas de desarrollo asistido por IA
**Proyecto:** AXXIA - Sistema de Gestión de Salud con Blockchain

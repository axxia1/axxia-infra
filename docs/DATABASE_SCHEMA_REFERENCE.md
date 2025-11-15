# AXXIA Database Schema Reference

**⚠️ IMPORTANTE:** Este documento es la fuente de verdad para los nombres de columnas y tablas. **SIEMPRE** consulta este archivo antes de crear queries, componentes o migraciones.

## 📋 Convenciones Generales

### Nomenclatura de Identificadores
- **AXXIA IDs**: Campo `axxia_id` (tipo `text` o `varchar`) - NUNCA `id` para identificadores AXXIA
- **UUIDs**: Campo `id` (tipo `uuid`) - Para claves primarias internas
- **Patient IDs**: `patient_id` (uuid) o `patient_axxia_id` (text) según contexto
- **Provider IDs**: `provider_id` (uuid) o `provider_axxia_id` (text) según contexto

### Campos de Auditoría Estándar
```sql
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### Campos de Nombres (Pacientes/Proveedores)
```sql
first_name text
middle_name text (nullable)
last_name_paternal text
last_name_maternal text
-- NUNCA: display_name, full_name, legal_name
```

## 🗂️ Tablas Principales

### `axxia.patients`
Tabla maestra de pacientes.

**Columnas clave:**
```sql
id                    uuid PRIMARY KEY
axxia_id              varchar NOT NULL UNIQUE  -- ⚠️ NO es 'patient_axxia_id'
curp                  varchar
email                 text
phone_mobile          varchar  -- ⚠️ NO es 'phone'
first_name            text
middle_name           text
last_name_paternal    text
last_name_maternal    text
date_of_birth         date
gender                varchar
city                  text
state                 text
state_of_birth        text
country               varchar DEFAULT 'MX'
blood_type            varchar
curp_verified         boolean DEFAULT false
auth_user_id          uuid (FK to auth.users)
created_at            timestamptz
updated_at            timestamptz
```

### `axxia.providers`
Tabla maestra de proveedores médicos.

**Columnas clave:**
```sql
id                    uuid PRIMARY KEY
axxia_id              varchar NOT NULL UNIQUE  -- ⚠️ Agregado recientemente
professional_id       varchar NOT NULL
email                 text NOT NULL
first_name            text NOT NULL
middle_name           text
last_name_paternal    text
last_name_maternal    text
specialty_id          uuid (FK to provider_specialties)
license_number        varchar
cedula_general        varchar
cedula_specialty      varchar
date_of_birth         date
state_of_birth        text
phone_mobile          varchar
phone_office_1        varchar
phone_office_2        varchar
phone_office_3        varchar
curp                  varchar
curp_verified         boolean DEFAULT false
rfc                   varchar
gender                char
street_address        text
postal_code           varchar
city                  text
state                 text
country               varchar DEFAULT 'MX'
logo_url              text
signature_public_key  text
verified              boolean DEFAULT false
auth_user_id          uuid
created_at            timestamptz
updated_at            timestamptz
```

### `axxia.clinical_events`
**⚠️ TABLA CRÍTICA** - Almacena TODOS los eventos clínicos

**Columnas clave:**
```sql
id                      uuid PRIMARY KEY
axxia_id                text NOT NULL  -- AXXIA ID del evento
patient_axxia_id        text           -- ⚠️ NO es 'patient_id'
provider_axxia_id       text           -- ⚠️ NO es 'provider_id'
institution_clues       text           -- Código CLUES de institución
event_type              clinical_event_type ENUM
event_date              timestamptz    -- ⚠️ NO es 'occurred_at'
title                   text NOT NULL
description             text
category                text
specialty               text
fhir_resource_type      text
fhir_data               jsonb DEFAULT '{}'
metadata                jsonb DEFAULT '{}'  -- ⚠️ Datos específicos del evento
storage_path            text
storage_hash            text
storage_size_bytes      bigint
storage_mime_type       text
hedera_topic_id         text
hedera_sequence_number  bigint
is_critical             boolean DEFAULT false
is_visible              boolean DEFAULT true
created_at              timestamptz
updated_at              timestamptz
```

**Event Types (ENUM `clinical_event_type`):**
- `consultation`
- `lab_result`
- `imaging_study`
- `prescription`
- `clinical_note`
- `document`
- `vital_signs`
- `allergy`
- `immunization`
- `appointment` ⚠️ **Agregado en Fase 2**

**⚠️ IMPORTANTE:**
- Para recetas: `event_type = 'prescription'`, datos en `metadata->>'medications'`
- Para citas: `event_type = 'appointment'`, datos en `metadata`
- Para vacunas: `event_type = 'immunization'`, datos en `metadata`

### `axxia.cat_institutions_mx`
Catálogo de instituciones médicas de México.

**Columnas clave:**
```sql
id                  serial PRIMARY KEY
axxia_id            varchar NOT NULL
name                text NOT NULL
clues               text UNIQUE  -- ⚠️ Clave Única de Establecimientos de Salud
type_norm           text
source_type         text
city                text NOT NULL
state               text NOT NULL
ownership           text
institution_group   text
phone1              text
phone2              text
rfc                 text
active              boolean DEFAULT true
created_at          timestamptz
```

## 🎯 Tablas de Fase 2 (Appointments, Vaccinations, Gamification)

### `axxia.appointment_check_ins`
Registro de check-ins a citas.

```sql
id                  uuid PRIMARY KEY
appointment_id      uuid FK(clinical_events.id)
patient_axxia_id    text NOT NULL
checked_in_at       timestamptz DEFAULT now()
check_in_method     text DEFAULT 'manual'  -- 'qr', 'manual', 'kiosk'
location_verified   boolean DEFAULT false
notes               text
created_at          timestamptz
```

### `axxia.gamification_scores`
Puntos y niveles de gamificación.

```sql
id                    uuid PRIMARY KEY
patient_id            uuid FK(patients.id) UNIQUE
total_points          int DEFAULT 0
level                 text DEFAULT 'Bronze'  -- Bronze, Silver, Gold, Platinum
current_streak_days   int DEFAULT 0
longest_streak_days   int DEFAULT 0
last_activity_date    date
created_at            timestamptz
updated_at            timestamptz
```

### `axxia.engagement_actions`
Log de acciones de engagement.

```sql
id            uuid PRIMARY KEY
patient_id    uuid FK(patients.id)
action_type   text NOT NULL
action_key    text UNIQUE (cuando no es null)
points_earned int DEFAULT 0
metadata      jsonb
created_at    timestamptz
```

**Action Types:**
- `profile_complete`, `profile_update`
- `medication_adherence`
- `appointment_attended`
- `referral_completed`
- `health_network_add`
- `document_upload`
- `consent_authorized`

### `axxia.patient_achievements`
Insignias ganadas.

```sql
id                        uuid PRIMARY KEY
patient_id                uuid FK(patients.id)
achievement_code          text NOT NULL
achievement_name          text NOT NULL
achievement_description   text
icon_name                 text
earned_at                 timestamptz
UNIQUE(patient_id, achievement_code)
```

### `axxia.reward_redemptions`
Canjes de recompensas.

```sql
id            uuid PRIMARY KEY
patient_id    uuid FK(patients.id)
reward_code   text NOT NULL
reward_name   text NOT NULL
points_cost   int NOT NULL
status        text DEFAULT 'pending'  -- pending, fulfilled, cancelled
redeemed_at   timestamptz
fulfilled_at  timestamptz
notes         text
```

## 📊 Vistas Importantes

### `axxia.patient_timeline_v`
Vista unificada del historial clínico del paciente.

**Campos retornados:**
```sql
id, axxia_id, patient_axxia_id, provider_axxia_id, institution_clues
event_type, event_date, title, description
provider_name  -- Construido como: concat(first_name, ' ', last_name_paternal, ' ', last_name_maternal)
institution_name
storage_path, fhir_resource_type, metadata
patient_id  -- UUID del paciente (join con patients)
```

### `axxia.patient_appointments_v`
Vista de citas médicas.

**Campos retornados:**
```sql
id, patient_axxia_id, appointment_date (event_date)
title, appointment_type, status, reason, notes, location, duration_minutes
provider_axxia_id, provider_name, institution_name, institution_axxia_id
checked_in_at, check_in_method
computed_status  -- upcoming, upcoming_soon, checked_in, missed, completed, cancelled
patient_id
```

### `axxia.patient_vaccinations_v`
Vista de vacunas (usa event_type='immunization').

**Campos retornados:**
```sql
id, patient_axxia_id, vaccination_date (event_date)
vaccine_name, vaccine_code, manufacturer, lot_number
dose_number, dose_series, route, site, next_dose_date, notes
provider_axxia_id, provider_name, institution_name
patient_id
```

### `axxia.leaderboard_v`
Tabla de líderes de gamificación.

```sql
patient_id, patient_name, total_points, level
current_streak_days, longest_streak_days
achievement_count, rank
```

## 🔧 Funciones RPC Importantes

### Citas
```sql
-- Check-in a cita
axxia.check_in_appointment(
  p_appointment_id uuid,
  p_check_in_method text DEFAULT 'manual',
  p_location_verified boolean DEFAULT false,
  p_notes text DEFAULT null
) RETURNS json

-- Obtener citas próximas
axxia.get_upcoming_appointments(
  p_patient_id uuid DEFAULT null,
  p_days_ahead int DEFAULT 30
) RETURNS TABLE(...)
```

### Vacunas
```sql
-- Esquema de vacunación
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

### Gamificación
```sql
-- Ganar puntos
axxia.earn_points(
  p_patient_id uuid,
  p_action_type text,
  p_action_key text DEFAULT null,
  p_points int DEFAULT null,
  p_metadata jsonb DEFAULT null
) RETURNS json

-- Revisar logros
axxia.check_achievements(p_patient_id uuid) RETURNS void

-- Calcular nivel
axxia.calculate_level(points int) RETURNS text
```

### Red de Salud
```sql
-- Obtener red de salud con pins
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

## ⚠️ Errores Comunes a Evitar

### ❌ NO USAR:
```sql
-- MAL:
SELECT * FROM clinical_events WHERE patient_id = ...
SELECT * FROM clinical_events WHERE occurred_at = ...
SELECT * FROM providers WHERE display_name = ...
SELECT * FROM patients WHERE phone = ...

-- BIEN:
SELECT * FROM clinical_events WHERE patient_axxia_id = ...
SELECT * FROM clinical_events WHERE event_date = ...
SELECT * FROM providers WHERE concat(first_name, ' ', last_name_paternal) = ...
SELECT * FROM patients WHERE phone_mobile = ...
```

### ✅ Construcción de Nombres Completos
```sql
-- SIEMPRE usa este patrón:
trim(concat(first_name, ' ', last_name_paternal, ' ', coalesce(last_name_maternal, '')))
```

### ✅ Joins con Instituciones
```sql
-- SIEMPRE usa CLUES:
FROM clinical_events ce
LEFT JOIN cat_institutions_mx inst ON inst.clues = ce.institution_clues
```

### ✅ Joins con Providers
```sql
-- SIEMPRE usa axxia_id:
FROM clinical_events ce
LEFT JOIN providers pvr ON pvr.axxia_id = ce.provider_axxia_id
```

### ✅ Filtrado de Eventos Clínicos
```sql
-- Para recetas:
WHERE event_type = 'prescription'
-- Datos en: metadata->>'medications' (array JSON)

-- Para citas:
WHERE event_type = 'appointment'
-- Datos en: metadata->>'status', metadata->>'type', etc.

-- Para vacunas:
WHERE event_type = 'immunization'
-- Datos en: metadata->>'vaccine_name', metadata->>'dose_number', etc.
```

## 📝 Notas para ChatGPT y Desarrollo

1. **SIEMPRE** consulta este archivo antes de escribir queries
2. **NUNCA** asumas nombres de columnas sin verificar
3. Los campos `*_axxia_id` son de tipo TEXT, no UUID
4. `clinical_events` es el corazón del sistema - todos los eventos van ahí
5. El campo `metadata` en `clinical_events` es JSONB flexible para datos específicos
6. Las vistas `*_v` ya tienen los joins correctos - úsalas cuando sea posible
7. Para construir nombres completos, SIEMPRE usa el patrón `trim(concat(...))`
8. Las instituciones se joinean por `clues`, NO por `id` o `axxia_id`

## 🔄 Última Actualización

- **Fecha**: 2025-11-07
- **Versión**: 1.0
- **Migraciones aplicadas hasta**: `20251107030000_create_gamification_system`

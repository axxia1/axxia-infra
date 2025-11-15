# Flujos de Registro - Axxia Platform

## Resumen

Se han implementado los flujos completos de registro para pacientes y médicos según las especificaciones de `bolt_spec_registration.md`.

## Funcionalidades Implementadas

### 1. Base de Datos

#### Nuevas Tablas

- **`cat_states_mx`** - Catálogo de 32 estados mexicanos + "Extranjero"
- **`prescription`** - Recetas electrónicas con firma digital
- **`prescription_item`** - Ítems de receta (medicamentos y estudios)

#### Campos Agregados a Tablas Existentes

**`patients`:**
- `middle_name` - Segundo nombre (opcional)
- `last_name_paternal` - Apellido paterno (requerido)
- `last_name_maternal` - Apellido materno (requerido)
- `date_of_birth` - Fecha de nacimiento (requerido)
- `state_of_birth` - Estado de nacimiento (requerido, FK a cat_states_mx)
- `phone_mobile` - Celular E.164 (requerido, único)
- `curp_verified` - Bandera de verificación de CURP
- `gender` - Sexo ('M', 'F', 'X')

**`providers`:**
- `middle_name` - Segundo nombre (opcional)
- `last_name_paternal` - Apellido paterno (requerido)
- `last_name_maternal` - Apellido materno (requerido)
- `date_of_birth` - Fecha de nacimiento (requerido)
- `state_of_birth` - Estado de nacimiento (requerido, FK a cat_states_mx)
- `phone_mobile` - Celular E.164 (requerido, único)
- `curp` - CURP (opcional)
- `curp_verified` - Bandera de verificación de CURP
- `gender` - Sexo ('M', 'F', 'X')
- `cedula_general` - Cédula profesional (requerido, único)
- `cedula_specialty` - Cédula de especialidad (opcional)
- `specialty_name` - Nombre de especialidad (opcional)
- `signature_public_key` - Clave pública para firma digital (requerido)
- `verified` - Bandera de verificación del médico

#### Funciones Helper

- **`generate_curp_placeholder()`** - Genera CURP temporal basado en datos personales
  - Toma: nombres, fecha nacimiento, estado, género
  - Retorna: CURP de 18 caracteres (placeholder hasta integrar API gubernamental)

- **`generate_axxia_id()`** - Genera ID único de paciente
  - Formato: AX + 8 caracteres alfanuméricos
  - Excluye caracteres ambiguos (O, 0, I, 1)

### 2. Interfaz de Usuario

#### Componentes Nuevos

**`PatientRegistrationForm.tsx`**
- Formulario completo de alta de paciente
- Validación en tiempo real de:
  - Nombres (requeridos: primer nombre, apellidos paterno y materno)
  - Fecha de nacimiento
  - Estado de nacimiento (dropdown con 33 opciones)
  - Celular formato E.164 (+52XXXXXXXXXX)
  - Email
- Mensajes de error claros
- Diseño responsive

**`DoctorRegistrationForm.tsx`**
- Formulario completo de alta de médico
- Incluye todo de paciente más:
  - Cédula profesional (7-8 dígitos, requerida)
  - Cédula de especialidad (7-8 dígitos, opcional)
  - Nombre de especialidad
  - Checkbox para generar par de claves de firma
- Validación de formato de cédulas
- Mensaje sobre verificación pendiente

**`src/types/registration.ts`**
- Tipos TypeScript completos para:
  - `PatientRegistration` / `PatientRegistrationResponse`
  - `DoctorRegistration` / `DoctorRegistrationResponse`
  - `Prescription` / `PrescriptionItem`
  - Tipos para crear y firmar recetas
- Constante `MEXICAN_STATES` con todos los estados
- Funciones de validación:
  - `validateEmail()` - Formato RFC email
  - `validatePhoneMobile()` - E.164 format
  - `validateCURP()` - Regex básico CURP
  - `validateCedula()` - 7-8 dígitos
  - `formatPhoneForDisplay()` - Formatea +52 XXX XXX XXXX

#### Actualización de App.tsx

- Nuevas vistas: `'registerPatient'` | `'registerDoctor'`
- Botones prominentes en página principal para registro
- Handlers mock para demostración:
  - `handlePatientRegistration()` - Genera AXXIA ID y muestra confirmación
  - `handleDoctorRegistration()` - Genera ID profesional y muestra mensaje de verificación
- Navegación con botón "Volver"

### 3. Recetas Electrónicas (Prescripciones)

#### Estructura de Datos

**Tabla `prescription`:**
- `id` - UUID único
- `doctor_id` - FK a providers
- `patient_id` - FK a patients
- `created_at` - Timestamp de creación
- `signed_at` - Timestamp de firma (NULL si no firmada)
- `signature_hash` - Hash de firma digital
- `status` - Estado: 'draft', 'signed', 'shared', 'dispensed', 'cancelled'
- `notes` - Notas generales

**Tabla `prescription_item`:**
- `id` - UUID único
- `prescription_id` - FK a prescription
- `item_type` - 'MED' (medicamento) o 'STUDY' (estudio)
- `code_system` - 'ATC', 'RXNORM', o 'LOINC'
- `code` - Código del catálogo correspondiente
- `display` - Nombre legible
- `dose` - Dosis (opcional)
- `route` - Vía de administración (opcional)
- `frequency` - Frecuencia (opcional)
- `duration_days` - Duración en días (opcional)
- `notes` - Notas específicas del ítem

#### Row Level Security (RLS)

Políticas implementadas:
- Doctores pueden ver solo sus propias recetas
- Pacientes pueden ver solo sus propias recetas
- Doctores pueden crear recetas solo para sí mismos como prescriptor
- Doctores pueden actualizar solo sus propias recetas
- Items siguen las reglas de acceso de la receta padre

### 4. Seguridad y Validación

#### Validaciones Implementadas

**Frontend:**
- Nombres requeridos (first_name, last_name_paternal, last_name_maternal)
- Fecha de nacimiento requerida y no futura
- Estado de nacimiento de catálogo oficial
- Formato E.164 para teléfono: `+\d{10,15}`
- Formato email RFC estándar
- Cédulas: 7-8 dígitos numéricos
- CURP: 18 caracteres alfanuméricos (regex básico)

**Base de Datos:**
- Constraints NOT NULL en campos requeridos
- Foreign keys a `cat_states_mx`
- Unique indexes en: email, phone_mobile, cedula_general
- Check constraints en gender ('M', 'F', 'X')
- Check constraints en prescription status
- Check constraints en item_type y code_system

#### Datos Sensibles

- CURP puede ser NULL hasta verificación
- `curp_verified` default false
- Médicos tienen bandera `verified` default false
- `signature_public_key` requerida pero es placeholder hasta integración real

### 5. Integraciones Futuras (Placeholders)

**Gobierno:**
- `generate_curp_placeholder()` → Reemplazar con API de RENAPO
- Verificación de cédulas profesionales → API de SEP

**Firma Electrónica:**
- `signature_public_key` → Integrar con e.firma del SAT
- Generación de keypair → Usar certificado SAT válido
- `signature_hash` → Firma FIEL completa

**Comunicaciones:**
- Compartir receta por email → Integrar SMTP provider
- Compartir receta por WhatsApp → WhatsApp Business API

### 6. Endpoints de API (Pendientes de Implementación Backend)

#### Pacientes

```typescript
POST /api/patient/register
Body: PatientRegistration
Response: PatientRegistrationResponse

GET /api/patient/{axxiaId}
Response: PatientProfile (masked para terceros)

GET /api/patient/{axxiaId}/me
Response: PatientProfile (completo para el paciente)
```

#### Médicos

```typescript
POST /api/doctor/register
Body: DoctorRegistration
Response: DoctorRegistrationResponse

GET /api/doctor/{doctorId}
Response: DoctorProfile (masked para terceros)
```

#### Recetas

```typescript
POST /api/prescription
Body: PrescriptionCreate
Response: Prescription

POST /api/prescription/{id}/sign
Body: PrescriptionSignRequest
Response: Prescription (con signed_at y signature_hash)

GET /api/prescription/{id}
Response: Prescription (con consent enforcement)

POST /api/prescription/{id}/share
Body: PrescriptionShareRequest ('email' | 'whatsapp')
Response: { success: boolean, shared_via: string }
```

## Flujo de Usuario

### Registro de Paciente

1. Usuario hace clic en "Registro de Paciente"
2. Completa formulario con:
   - 4 componentes del nombre
   - Fecha de nacimiento
   - Sexo
   - Estado de nacimiento (de catálogo)
   - Celular E.164
   - Email
3. Sistema valida formato en frontend
4. Backend genera:
   - UUID para id
   - AXXIA ID único (AX + 8 chars)
   - CURP temporal con `generate_curp_placeholder()`
5. Usuario recibe confirmación con AXXIA ID

### Registro de Médico

1. Usuario hace clic en "Registro de Médico"
2. Completa formulario con datos personales + profesionales:
   - 4 componentes del nombre
   - Fecha de nacimiento
   - Sexo
   - Estado de nacimiento
   - Celular y email
   - Cédula profesional (requerida)
   - Cédula de especialidad (opcional)
   - Especialidad
   - Opción de generar keypair para firma
3. Sistema valida cédulas (7-8 dígitos)
4. Backend genera:
   - UUID para id
   - professional_id único
   - Placeholder para signature_public_key
5. Usuario recibe mensaje: "Tu cuenta será verificada"
6. Admin verifica cédulas y activa cuenta

### Creación de Receta

1. Médico busca paciente (vía QR/consent)
2. Crea nueva prescripción
3. Agrega items:
   - Medicamentos (ATC codes) con dosis, frecuencia, duración
   - Estudios (LOINC codes)
4. Guarda como 'draft'
5. Firma digitalmente → status = 'signed'
6. Comparte con paciente vía email/WhatsApp

## Migraciones Aplicadas

**Archivo:** `supabase/migrations/YYYYMMDDHHMMSS_add_registration_fields.sql`

- Crea `cat_states_mx` con 33 filas
- Agrega columnas a `patients` (si no existen)
- Agrega columnas a `providers` (si no existen)
- Crea `prescription` y `prescription_item`
- Crea funciones helper
- Configura RLS en todas las tablas
- Crea índices necesarios

## Testing Manual

### Verificar Formularios

```bash
npm run dev
```

1. Navegar a http://localhost:5173
2. Click "Registro de Paciente"
3. Llenar formulario completo
4. Verificar validaciones en tiempo real
5. Enviar y ver AXXIA ID generado

6. Volver, click "Registro de Médico"
7. Llenar formulario incluyendo cédulas
8. Verificar validación de cédulas
9. Enviar y ver mensaje de verificación

### Verificar Base de Datos

```sql
-- Ver estados cargados
SELECT * FROM axxia.cat_states_mx;

-- Ver estructura de patients
\d axxia.patients

-- Ver estructura de providers
\d axxia.providers

-- Ver tablas de recetas
\d axxia.prescription
\d axxia.prescription_item

-- Probar función helper
SELECT axxia.generate_curp_placeholder(
  'Juan', 'Pérez', 'García',
  '1990-05-15'::date, 'Ciudad de México', 'M'
);

SELECT axxia.generate_axxia_id();
```

## Próximos Pasos

1. **Backend API (FastAPI)**
   - Implementar endpoints de registro
   - Integrar con Supabase
   - Validación server-side
   - OTP para verificación de email/teléfono

2. **Verificaciones**
   - Integrar API de RENAPO para CURP real
   - Integrar API de SEP para cédulas
   - Flujo de verificación de médicos por admin

3. **Firma Electrónica**
   - Integrar e.firma del SAT
   - Generación de keypair en HSM
   - Workflow de firma con FIEL

4. **Recetas**
   - UI completa para crear recetas
   - Búsqueda en catálogos ATC/LOINC
   - Preview de receta PDF
   - Envío por email/WhatsApp

5. **Mobile App (Expo)**
   - Formularios de registro en app móvil
   - Escaneo de QR para compartir AXXIA ID
   - Visualización de recetas electrónicas

## Cumplimiento de Especificaciones

✅ Estructura de 4 nombres (first, middle, paternal, maternal)
✅ Fecha de nacimiento requerida
✅ Estado de nacimiento con catálogo oficial de 33 estados
✅ Teléfono formato E.164
✅ Email validado
✅ CURP generado con placeholder
✅ Cédulas profesionales (general + especialidad)
✅ Clave pública para firma (placeholder)
✅ Tablas de prescription con firma digital
✅ RLS en todas las tablas
✅ Validación frontend completa
✅ Tipos TypeScript completos
✅ UI responsive y accesible
✅ Build exitoso sin errores

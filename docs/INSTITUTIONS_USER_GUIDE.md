# Guía de Usuario - Catálogo de Instituciones

## Descripción General

El sistema de instituciones permite a los médicos gestionar sus afiliaciones a diferentes instituciones de salud donde ejercen su práctica médica. Esta información se utiliza para:

1. Identificar la procedencia del médico en cada consulta
2. Mostrar el historial completo del paciente con contexto institucional
3. Generar reportes y estadísticas por institución

## Características Principales

### 1. Catálogo de Instituciones

El sistema incluye un catálogo pre-poblado con instituciones de salud mexicanas:

- **Tipos de Instituciones:**
  - Pública (hospitales del sector salud)
  - Privada (hospitales y clínicas privadas)
  - Académica (hospitales universitarios y de enseñanza)
  - Otra

- **Instituciones Pre-cargadas:**
  - Hospital General de México (Pública, CDMX)
  - Hospital Ángeles Pedregal (Privada, CDMX)
  - Hospital Civil de Guadalajara (Pública, Jalisco)
  - Hospital ABC (Privada, CDMX)
  - Instituto Nacional de Cardiología (Académica, CDMX)
  - Hospital Universitario UANL (Académica, Nuevo León)
  - Hospital Regional de Puebla (Pública, Puebla)

### 2. Gestión de Afiliaciones del Médico

#### Límites y Reglas

- **Mínimo:** 1 institución (requerido)
- **Máximo:** 5 instituciones
- **Institución Principal:** Una y solo una debe ser marcada como principal

#### Proceso de Adscripción

**Después del Registro:**

1. El médico completa su registro básico (datos personales, cédulas, especialidad)
2. Inmediatamente después, aparece la sección "Instituciones de Adscripción"
3. El médico debe seleccionar al menos 1 institución de la lista
4. La primera institución se marca automáticamente como principal
5. Puede agregar hasta 4 instituciones adicionales
6. Puede cambiar cuál es la principal en cualquier momento

**Gestión de Instituciones:**

- ✅ **Agregar:** Seleccionar del dropdown y hacer clic en "Agregar"
- ⭐ **Marcar como Principal:** Hacer clic en el ícono de estrella vacía
- 🗑️ **Eliminar:** Hacer clic en el ícono de papelera (no se puede eliminar si solo hay una)

### 3. Uso en Consultas

#### Formulario de Visita

Cuando el médico registra una nueva consulta:

1. El formulario de visita incluye un campo "Institución (Opcional)"
2. Muestra todas las instituciones a las que está adscrito el médico
3. Por defecto, muestra "Sin institución" pero el médico puede seleccionar una
4. La institución seleccionada se asocia a esa consulta específica

#### Visualización Recomendada

Aunque no está implementado en el código actual, se recomienda:
- Pre-seleccionar automáticamente la institución principal del médico
- Permitir cambiarla si la consulta ocurre en otra institución

### 4. Historial del Paciente

#### Información Mostrada

En el timeline del paciente, cada visita muestra:

```
📅 15 de octubre de 2025 - Consulta General
   Motivo: Dolor abdominal

   🩺 Cardiología               ← Especialidad del médico tratante
   🏥 Hospital ABC              ← Institución donde ocurrió la consulta
   📍 Ciudad de México          ← Ubicación
```

#### Beneficios

1. **Contexto Completo:** El paciente y otros médicos pueden ver dónde ocurrió cada consulta
2. **Trazabilidad:** Facilita el seguimiento de atención en múltiples instituciones
3. **Integración:** Útil para sistemas de referencia y contra-referencia

## Flujo de Trabajo Completo

### Ejemplo: Dr. Juan Pérez

**1. Registro Inicial**
```
Nombre: Juan Pérez García
Cédula: 12345678
Especialidad: Cardiología
```

**2. Adscripción a Instituciones**
```
✅ Hospital ABC (Principal) ⭐
✅ Instituto Nacional de Cardiología
✅ Hospital Ángeles Pedregal
```

**3. Primera Consulta - Paciente María López**
```
Fecha: 15/Oct/2025
Motivo: Dolor de pecho
Institución: Hospital ABC ← Se asocia a esta consulta
```

**4. Segunda Consulta - Mismo Paciente**
```
Fecha: 20/Oct/2025
Motivo: Seguimiento
Institución: Instituto Nacional de Cardiología ← Diferente institución
```

**5. Historial del Paciente**
```
Timeline:
- 20/Oct/2025: Seguimiento | Cardiología | Inst. Nal. Cardiología | CDMX
- 15/Oct/2025: Dolor de pecho | Cardiología | Hospital ABC | CDMX
```

## Aspectos Técnicos

### Base de Datos

**Tabla: `axxia.cat_institutions`**
- Catálogo de instituciones con tipo y ubicación
- FK a estados mexicanos

**Tabla: `axxia.provider_affiliations`**
- Relación many-to-many entre médicos e instituciones
- Campo `is_primary` para marcar la principal
- Índice único parcial garantiza solo una primary por médico

**Tabla: `axxia.visits`**
- Campo opcional `institution_id` (FK a instituciones)

### API Endpoints

```
GET  /api/institutions/                     # Listar todas las instituciones
GET  /api/institutions/{id}                 # Obtener institución específica
POST /api/institutions/                     # Crear nueva institución

GET  /api/doctor-affiliations/provider/{id} # Listar afiliaciones del médico
POST /api/doctor-affiliations/              # Crear afiliación
PUT  /api/doctor-affiliations/{id}/primary  # Marcar como principal
DELETE /api/doctor-affiliations/{id}        # Eliminar afiliación
```

### Validaciones

**Frontend:**
- Mínimo 1 institución
- Máximo 5 instituciones
- Confirmación antes de eliminar
- No permite eliminar si solo hay una

**Backend:**
- Índice único parcial previene múltiples primaries
- Foreign keys garantizan integridad referencial
- RLS protege el acceso a datos

## Casos de Uso

### Caso 1: Médico en Hospital Público + Consultorio Privado

```
Dr. Ana Martínez
- Hospital General de México (Principal) ⭐
- Consultorio Privado (agregado manualmente como "Otra")
```

### Caso 2: Médico en Rotación (Residente)

```
Dr. Carlos Ruiz (Residente)
- Hospital Universitario UANL (Principal) ⭐
- Hospital Regional de Puebla (Rotación temporal)
```

### Caso 3: Especialista Multi-institucional

```
Dr. Laura Sánchez (Cirujano Cardiovascular)
- Hospital ABC (Principal) ⭐
- Hospital Ángeles Pedregal
- Instituto Nacional de Cardiología
- Hospital Medica Sur (agregado manualmente)
```

## Preguntas Frecuentes

**P: ¿Qué pasa si mi institución no está en el catálogo?**
R: Actualmente debe ser agregada por un administrador del sistema. En futuras versiones se podrá solicitar agregar nuevas instituciones.

**P: ¿Puedo cambiar mi institución principal?**
R: Sí, en cualquier momento. Solo haz clic en la estrella de la institución que quieras marcar como principal.

**P: ¿Es obligatorio seleccionar una institución en cada consulta?**
R: No, el campo es opcional. Sin embargo, se recomienda siempre especificarlo para mantener un historial completo.

**P: ¿Puedo estar adscrito a más de 5 instituciones?**
R: No, el límite es 5 instituciones. Esto es para mantener la calidad de los datos y facilitar la gestión.

**P: ¿Qué pasa si elimino una institución que tiene consultas asociadas?**
R: Las consultas históricas mantienen la referencia a la institución, pero ya no aparecerá en tu lista de instituciones activas.

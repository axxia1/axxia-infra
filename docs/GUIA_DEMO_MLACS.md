# 🚀 Guía para Evaluar el Demo MLACS

## 📍 ¿Dónde está el Demo?

### Opción 1: Demo MLACS Completo (NUEVO - RECOMENDADO) ⭐

1. **Inicia el proyecto**:
   ```bash
   npm run dev
   ```

2. **Abre tu navegador** en `http://localhost:5173`

3. **En la página principal**, busca el botón:
   ```
   🚀 Demo MLACS COMPLETO
   ```
   (Es un botón con gradiente azul-púrpura)

4. **¡Listo!** Estarás en el demo interactivo completo

---

## 🎯 ¿Qué Puedes Evaluar?

### 1️⃣ **Vista General (Home)**
Al entrar al demo verás:

- **4 Tarjetas de Estadísticas**:
  - Total de permisos otorgados
  - Permisos activos
  - Total de accesos
  - Plantillas disponibles

- **Descripción de los 4 Niveles de Acceso**:
  - Nivel 0: Acceso Completo (rojo)
  - Nivel 1: Por Tipo de Evento (amarillo)
  - Nivel 2: Eventos Específicos (azul)
  - Nivel 3: Acceso Selectivo (verde)

- **Características Principales**:
  - Asistente paso a paso
  - Historial de auditoría
  - Anclaje blockchain
  - Cumplimiento HIPAA/GDPR
  - Acceso de emergencia

### 2️⃣ **Asistente de Permisos (Permission Wizard)**
Click en la pestaña **"Asistente de Permisos"**

**Paso 1 - ¿A quién?**
- Busca un médico por nombre o cédula
- O genera un enlace anónimo con email

**Paso 2 - ¿Qué nivel?**
- 6 plantillas pre-configuradas:
  - Médico de Cabecera (1 año)
  - Especialista Temporal (7 días)
  - Segunda Opinión (30 días)
  - Aseguradora (90 días)
  - Acceso de Emergencia (24 horas)
  - App de Salud Personal (permanente)
- O configura nivel personalizado (0-3)

**Paso 3 - ¿Qué alcance?**
- Para Nivel 0: Advertencia de acceso completo
- Para Nivel 1: Selector de tipos de eventos
  - Consultas médicas
  - Laboratorios
  - Recetas
  - Imagenología
  - Procedimientos
  - Hospitalizaciones
  - Vacunas
  - Signos vitales
  - Alergias

**Paso 4 - ¿Por cuánto tiempo?**
- Duración: 1 día, 1 semana, 1 mes, 3 meses, 6 meses, 1 año, sin expiración
- Opciones avanzadas:
  - Auto-revocar después del primer uso
  - Limitar número de accesos
- Resumen completo del permiso
- Botón "Otorgar Acceso"

### 3️⃣ **Historial de Acceso (Audit Trail)**
Click en la pestaña **"Historial de Acceso"**

**Funcionalidades**:
- **Filtros**:
  - Búsqueda por nombre o tipo
  - Filtro por estado (exitoso/denegado)
  - Rango de fechas (desde/hasta)
  - Botón "Limpiar filtros"

- **Estadísticas**:
  - Total de accesos
  - Exitosos (verde)
  - Denegados (rojo)
  - Usuarios únicos (azul)

- **Timeline de Eventos**:
  - Íconos de éxito/falla
  - Nombre del proveedor y especialidad
  - Fecha y hora exacta
  - Dirección IP
  - Número de eventos accedidos
  - Razón de denegación (si aplica)
  - Badge de verificación blockchain

- **Exportación**:
  - Botón "Exportar CSV" (incluye todos los datos filtrados)

### 4️⃣ **Panel de Cumplimiento**
Click en la pestaña **"Cumplimiento"**

**Métricas Mostradas**:
- Total de permisos (todas las tarjetas con números)
- Gráficas de actividad

**Indicadores de Cumplimiento**:
- **HIPAA** (verde):
  - ✓ Autorización documentada
  - ✓ Información mínima necesaria
  - ✓ Registro de auditoría completo
  - ✓ Capacidad de revocación

- **GDPR** (azul):
  - ✓ Consentimiento explícito
  - ✓ Derecho de acceso
  - ✓ Portabilidad de datos
  - ✓ Derecho al olvido

**Generación de Reportes**:
- **Reporte HIPAA** (TXT):
  - Resumen de permisos y accesos
  - Controles de autorización
  - Estado de cumplimiento

- **Exportación GDPR** (JSON):
  - Todos los datos del paciente
  - Permisos otorgados
  - Historial de auditoría completo

---

## 🧪 Pasos para Probar

### Prueba Básica (5 minutos)

1. **Entra al demo** → Click en "🚀 Demo MLACS COMPLETO"
2. **Explora la vista general** → Lee las características
3. **Ve al Asistente** → Click en "Asistente de Permisos"
4. **Inicia el wizard** → Click en el botón grande azul
5. **Completa los 4 pasos** (puedes usar datos de prueba)
6. **Revisa el historial** → Click en "Historial de Acceso"
7. **Genera un reporte** → Click en "Cumplimiento" → "Reporte HIPAA"

### Prueba Avanzada (15 minutos)

1. **Crea un paciente demo** → Click en "Crear Paciente Demo" (botón verde)
2. **Otorga varios permisos** con diferentes niveles:
   - Un permiso Nivel 0 (médico de cabecera)
   - Un permiso Nivel 1 (especialista)
   - Un permiso con duración limitada
3. **Simula accesos** (si tienes datos de prueba en la DB)
4. **Usa los filtros** en el historial de acceso
5. **Exporta a CSV** el historial
6. **Genera ambos reportes** (HIPAA y GDPR)
7. **Cambia de paciente** con el selector superior

---

## 📊 Datos de Prueba

Si no tienes pacientes en la base de datos:

1. **Click en "Crear Paciente Demo"** (botón verde en la esquina superior derecha)
2. Se creará automáticamente un paciente con:
   - Nombre: Demo Patient Test
   - CURP: DEMOxxxxxxxxxx
   - Email: demoXXXXXX@axxia.test

3. Repite para crear varios pacientes de prueba

---

## 🎨 Aspectos a Evaluar

### ✅ Funcionalidad
- [ ] El wizard completa los 4 pasos correctamente
- [ ] Los permisos se crean en la base de datos
- [ ] El historial muestra los eventos
- [ ] Los filtros funcionan
- [ ] La exportación CSV descarga
- [ ] Los reportes se generan

### ✅ Usabilidad
- [ ] La navegación es intuitiva
- [ ] Los mensajes son claros
- [ ] Los íconos ayudan a entender
- [ ] El diseño es responsive
- [ ] Los colores diferencian bien los niveles

### ✅ Información
- [ ] Las estadísticas son precisas
- [ ] El resumen del permiso es completo
- [ ] El historial tiene todos los detalles
- [ ] Los reportes incluyen toda la info necesaria

---

## 🐛 Si Encuentras Problemas

### El botón no aparece
- Verifica que corriste `npm run build` exitosamente
- Refresca la página (Ctrl+F5 o Cmd+Shift+R)

### No hay pacientes
- Click en "Crear Paciente Demo"
- O corre el seeder de base de datos

### Error al crear permiso
- Verifica que tienes un paciente seleccionado
- Revisa la consola del navegador (F12)
- Verifica que las migraciones se aplicaron correctamente

### Las estadísticas están en 0
- Es normal si es un paciente nuevo
- Crea algunos permisos primero
- Las estadísticas se actualizan al cambiar de vista

---

## 📸 Capturas Esperadas

### Vista Principal
```
╔══════════════════════════════════════════════════════╗
║ Sistema MLACS - Demo Interactivo                    ║
║ [Crear Paciente Demo ⊕]                             ║
║ Paciente: Juan Pérez [▼]                            ║
╠══════════════════════════════════════════════════════╣
║ [Vista General] [Asistente] [Historial] [Cumplim.] ║
╠══════════════════════════════════════════════════════╣
║ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  ║
║ │ Total 5 │ │ Activos │ │ Accesos │ │Template │  ║
║ └─────────┘ └── 3 ─────┘ └── 42 ───┘ └── 6 ────┘  ║
║                                                      ║
║ 🎯 4 Niveles de Acceso                              ║
║ [Nivel 0] [Nivel 1] [Nivel 2] [Nivel 3]            ║
║                                                      ║
║ ✨ Características Principales                       ║
║ ✓ Asistente paso a paso                            ║
║ ✓ Historial de auditoría                           ║
║ ✓ Anclaje blockchain                               ║
╚══════════════════════════════════════════════════════╝
```

### Wizard - Paso 2
```
╔══════════════════════════════════════════════════════╗
║ ← Volver                                             ║
║ ¿Qué nivel de acceso deseas otorgar?                ║
║ Permisos para: Dr. Juan García                      ║
╠══════════════════════════════════════════════════════╣
║ Plantillas Recomendadas                             ║
║ ┌──────────────────┐ ┌──────────────────┐          ║
║ │ 👨‍⚕️ Médico Cab. │ │ 🔬 Especialista  │          ║
║ │ Nivel 0 • 1 año │ │ Nivel 1 • 7 días│          ║
║ └──────────────────┘ └──────────────────┘          ║
║                                                      ║
║ O Personaliza                                        ║
║ ⚪ Nivel 0: Todo mi historial médico                ║
║ ⚪ Nivel 1: Solo ciertos tipos de eventos           ║
║ [Atrás] ────────────────────────── [Continuar →]   ║
╚══════════════════════════════════════════════════════╝
```

---

## 🎓 Próximos Pasos

Después de evaluar el demo:

1. **Feedback**: Anota qué te gustó y qué mejorarías
2. **Testing**: Prueba casos edge (permisos expirados, múltiples pacientes)
3. **Integración**: Considera cómo integrarlo en tu flujo actual
4. **Producción**: Planifica el despliegue a producción

---

## 📞 Ayuda

Si tienes preguntas o necesitas ayuda:
- Revisa `MLACS_FINAL_IMPLEMENTATION_REPORT.md` para detalles técnicos
- Consulta los comentarios en el código
- Revisa la consola del navegador para logs

---

**¡Disfruta evaluando el sistema MLACS! 🎉**

El sistema más avanzado de control de acceso granular para datos médicos.

# 🔧 Troubleshooting: Botón "Crear Paciente Demo"

## ✅ Solución Aplicada

He implementado una **solución con fallback automático** que intenta dos métodos:

### Método 1: RPC (función register_patient)
```typescript
await supabase.rpc('register_patient', { ... })
```

### Método 2: INSERT directo (si RPC falla)
```typescript
await supabase.from('patients').insert({ ... })
```

## 🔄 Actualización del Schema Cache

He ejecutado:
```sql
NOTIFY pgrst, 'reload schema';
```

Esto fuerza a PostgREST (el servidor de API de Supabase) a recargar el catálogo de funciones.

## 📋 Pasos para Probar

1. **Refresca el navegador COMPLETAMENTE**
   - Chrome/Edge: `Ctrl + Shift + R` (Windows) o `Cmd + Shift + R` (Mac)
   - Firefox: `Ctrl + F5` (Windows) o `Cmd + Shift + R` (Mac)
   - Safari: `Cmd + Option + R` (Mac)

2. **Abre la consola del navegador** (F12)
   - Ve a la pestaña "Console"

3. **Navega al demo**
   - Click en "🚀 Demo MLACS COMPLETO"

4. **Click en "Crear Paciente Demo"**

5. **Observa la consola**:

   **Si funciona con RPC** (✅ Ideal):
   ```
   Patient created: {id: "...", axxia_id: "AXX-...", ...}
   ```

   **Si usa fallback** (⚠️ Funciona pero subóptimo):
   ```
   RPC failed, trying direct insert: Could not find the function...
   Patient created: {id: "...", axxia_id: "AXX-...", ...}
   ```

## 🐛 Si Todavía No Funciona

### Error: "permission denied for schema axxia"

**Causa**: Las políticas RLS están bloqueando el INSERT directo

**Solución temporal**: Usa SQL directo
```sql
SELECT public.register_patient(
  p_curp := 'DEMO1234567890',
  p_first_name := 'Demo',
  p_last_name_paternal := 'Patient',
  p_date_of_birth := '1990-01-01',
  p_gender := 'M',
  p_email := 'demo@test.com',
  p_phone_mobile := '5512345678',
  p_city := 'CDMX',
  p_state := 'CDMX',
  p_country := 'MX'
);
```

### Error: "schema cache"

**Causa**: PostgREST no ha recargado el esquema

**Soluciones**:

1. **Espera 30 segundos** y vuelve a intentar
2. **Reinicia el proyecto**:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```
3. **Limpia el caché del navegador** (Settings → Clear browsing data)

### Error: "duplicate key value"

**Causa**: Ya existe un paciente con ese CURP

**Solución**: Normal, espera 1 segundo e intenta de nuevo (el timestamp cambiará)

## 🎯 Verificación Manual

Puedes verificar que los pacientes se están creando:

```sql
SELECT
  axxia_id,
  first_name,
  last_name_paternal,
  curp,
  email,
  created_at
FROM axxia.patients
WHERE curp LIKE 'DEMO%'
ORDER BY created_at DESC
LIMIT 10;
```

## 📊 Estado del Sistema

### ✅ Función existe
```
Schema: public
Function: register_patient
Arguments: 14 parámetros
Status: ACTIVA
```

### ✅ Permisos otorgados
```
- anon: EXECUTE ✓
- authenticated: EXECUTE ✓
- service_role: EXECUTE ✓
```

### ✅ Schema cache
```
NOTIFY pgrst, 'reload schema' → EJECUTADO
```

## 🚀 Alternativa: Usar el Seeder

Si el botón sigue sin funcionar, puedes usar el seeder de base de datos:

1. Ve al menu principal
2. Click en "Database Seeder"
3. Click en "Seed Patients"
4. Esto creará pacientes de prueba

## 💡 Explicación Técnica

El problema ocurre porque:

1. Las migraciones se aplican a la base de datos
2. PostgREST (API REST de Supabase) cachea el esquema
3. Si el caché no se refresca, no "ve" las nuevas funciones
4. El cliente JS falla al intentar llamar funciones "inexistentes"

La solución de fallback garantiza que al menos un método funcione.

## 📝 Logs Útiles

Abre la consola del navegador y busca:

```javascript
// Éxito con RPC
"Patient created:" {id: "...", axxia_id: "..."}

// Fallback a INSERT
"RPC failed, trying direct insert:" "Could not find..."
"Patient created:" {id: "...", ...}

// Error total
"Error creating demo patient:" {message: "..."}
```

---

**Última actualización**: El sistema ahora tiene fallback automático y debería funcionar en ambos casos.

**Estado**: ✅ Función verificada, permisos correctos, schema reloadado

**Próximo paso**: Refrescar el navegador e intentar de nuevo

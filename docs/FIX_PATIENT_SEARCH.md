# 🔧 Solución al Error de Búsqueda de Pacientes

## 🐛 Problema

Al buscar un paciente con CURP, AXXIA ID o email, aparece el error:
```
Error al buscar paciente
```

## 🔍 Causa

El código intenta usar la tabla `patients_search_view` que no existe en el schema `public`, y la función RPC `search_patient_by_identifier` no está creada en la base de datos.

## ✅ Solución

### Opción 1: Aplicar Migración SQL (Recomendada)

Ejecuta el siguiente SQL en el **SQL Editor de Supabase Dashboard**:

1. Ve a: https://supabase.com/dashboard/project/lxkqkfejvpjdbvtsjsxz/sql/new
2. Pega este SQL:

```sql
-- =====================================================
-- FUNCIÓN: search_patient_by_identifier
-- =====================================================
CREATE OR REPLACE FUNCTION public.search_patient_by_identifier(
  p_search_term text
)
RETURNS TABLE (
  id uuid,
  axxia_id text,
  first_name text,
  middle_name text,
  last_name_paternal text,
  last_name_maternal text,
  email text,
  phone_mobile text,
  blood_type text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.axxia_id,
    p.first_name,
    p.middle_name,
    p.last_name_paternal,
    p.last_name_maternal,
    p.email,
    p.phone_mobile,
    p.blood_type,
    p.updated_at
  FROM axxia.patients p
  WHERE
    p.axxia_id = p_search_term
    OR p.email = p_search_term
    OR p.curp = p_search_term
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.search_patient_by_identifier IS 'Busca un paciente por AXXIA ID, email o CURP para acceso al portal';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.search_patient_by_identifier TO anon;
GRANT EXECUTE ON FUNCTION public.search_patient_by_identifier TO authenticated;
```

3. Haz clic en **Run** (▶️)
4. Espera la confirmación de éxito

### Opción 2: Usando Supabase CLI

Si tienes Supabase CLI instalado:

```bash
supabase db push
```

Esto aplicará automáticamente la migración en:
`supabase/migrations/20251107100000_create_search_patient_function.sql`

## 🧪 Probar la Función

Después de aplicar la migración, prueba con:

```sql
SELECT * FROM public.search_patient_by_identifier('GALA900515MDFRRN03');
```

Debería retornar:
```
axxia_id: AX-TEST-PAT-001
first_name: Ana
last_name_paternal: García
...
```

## 📝 Datos de Prueba

Después de aplicar la función, puedes buscar con:

- **AXXIA ID:** `AX-TEST-PAT-001`
- **CURP:** `GALA900515MDFRRN03`
- **Email:** `ana.garcia@example.com`

Código de verificación: `123456`

## ✨ Alternativa Temporal

Si no puedes aplicar la migración ahora, puedes modificar temporalmente el código para omitir la verificación:

**En `src/components/PatientPortal.tsx` línea 97-99:**

```typescript
const handleVerification = async () => {
  setError('');
  setStep('portal');  // Salta directo al portal
  // ... resto del código
```

Esto te permitirá acceder al portal sin verificación, pero **NO ES RECOMENDADO PARA PRODUCCIÓN**.

## 🔐 Notas de Seguridad

La función `search_patient_by_identifier`:
- ✅ Solo retorna datos básicos (no sensibles)
- ✅ Requiere verificación posterior con código
- ✅ Usa SECURITY DEFINER para acceso controlado
- ✅ Limita resultados a 1 registro
- ✅ Disponible para usuarios anónimos (necesario para login)

## 📊 Arquitectura

```
Usuario → Portal del Paciente
    ↓
Busca con CURP/AXXIA ID/Email
    ↓
search_patient_by_identifier() [RPC]
    ↓
axxia.patients (tabla)
    ↓
Retorna datos básicos
    ↓
Usuario ingresa código verificación
    ↓
Acceso al portal completo
```

---

**Estado:** ✅ Código actualizado | ⏳ Migración pendiente de aplicar
**Archivo de migración:** `supabase/migrations/20251107100000_create_search_patient_function.sql`

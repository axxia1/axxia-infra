-- =====================================================
-- CORRECCIÓN: Función de búsqueda de pacientes
-- =====================================================
-- Esta versión usa los tipos correctos de la tabla axxia.patients

DROP FUNCTION IF EXISTS public.search_patient_by_identifier(text);

CREATE OR REPLACE FUNCTION public.search_patient_by_identifier(
  p_search_term text
)
RETURNS TABLE (
  id uuid,
  axxia_id varchar(20),
  first_name text,
  middle_name text,
  last_name_paternal text,
  last_name_maternal text,
  email text,
  phone_mobile varchar(20),
  blood_type varchar(10),
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

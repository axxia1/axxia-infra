-- AXXIA ID schema & seed
CREATE TABLE IF NOT EXISTS stakeholder_types (
  code CHAR(2) PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stakeholders (
  id BIGSERIAL PRIMARY KEY,
  axxia_id VARCHAR(20) NOT NULL UNIQUE,
  type_code CHAR(2) NOT NULL REFERENCES stakeholder_types(code),
  display_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT,
  source_module TEXT
);

CREATE TABLE IF NOT EXISTS axxia_id_audit (
  id BIGSERIAL PRIMARY KEY,
  axxia_id VARCHAR(20) NOT NULL,
  type_code CHAR(2) NOT NULL,
  actor TEXT,
  source_module TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION is_valid_axxia_id(text) RETURNS boolean AS $$
  SELECT $1 ~ '^AXX-(\\d{2})-([0-9A-HJKMNP-TV-Z]{6})-([0-9A-HJKMNP-TV-Z]{5})$';
$$ LANGUAGE sql IMMUTABLE;

ALTER TABLE stakeholders
  ADD CONSTRAINT chk_axxia_id_format CHECK (is_valid_axxia_id(axxia_id));

INSERT INTO stakeholder_types (code, name) VALUES
('01','Paciente'),
('02','Proveedor Médico (individual)'),
('03','Proveedor Institución'),
('04','Aseguradora'),
('05','Agente de Seguros'),
('06','Trabajadora Social'),
('07','Farmacia / Distribuidor'),
('08','Laboratorio Clínico / Imagen'),
('09','Empresa / Empleador'),
('10','Gobierno / Institución Pública'),
('11','Academia / Investigación'),
('12','Desarrollador / Integrador')
ON CONFLICT (code) DO NOTHING;
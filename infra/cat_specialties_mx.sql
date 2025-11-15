/*
  # Catalog of Medical Specialties (Mexico)

  Creates and seeds the `axxia.cat_specialties_mx` table with official Mexican medical specialties.

  This migration is idempotent - it can be run multiple times safely.

  1. Tables
    - `cat_specialties_mx` - Catalog of medical specialties recognized in Mexico
      - `id` (bigint, primary key, auto-increment)
      - `name_es` (text, Spanish name)
      - `name_en` (text, English name for reference)
      - `popularity` (integer, usage ranking)
      - `active` (boolean, whether specialty is currently active)
      - `created_at` (timestamptz, timestamp)

  2. Data
    - Seeds with 60 official Mexican medical specialties
    - Includes both general and specialized fields
    - Popularity rankings based on common usage patterns

  3. Security
    - Enable RLS on table
    - Allow public read access (specialties are public reference data)
*/

-- Ensure axxia schema exists
CREATE SCHEMA IF NOT EXISTS axxia;

-- Create catalog table if not exists
CREATE TABLE IF NOT EXISTS axxia.cat_specialties_mx (
  id bigserial PRIMARY KEY,
  name_es text NOT NULL UNIQUE,
  name_en text,
  popularity integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE axxia.cat_specialties_mx ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Specialties are publicly readable" ON axxia.cat_specialties_mx;
END $$;

-- Allow public read access (specialties are reference data)
CREATE POLICY "Specialties are publicly readable"
  ON axxia.cat_specialties_mx
  FOR SELECT
  TO public
  USING (active = true);

-- Seed data (idempotent using ON CONFLICT)
-- Popularity: 100 = most common, decreasing for less common specialties
INSERT INTO axxia.cat_specialties_mx (name_es, name_en, popularity) VALUES
  ('Medicina Interna', 'Internal Medicine', 100),
  ('Medicina Familiar', 'Family Medicine', 98),
  ('Pediatría', 'Pediatrics', 96),
  ('Ginecología y Obstetricia', 'Gynecology and Obstetrics', 94),
  ('Cirugía General', 'General Surgery', 92),
  ('Cardiología', 'Cardiology', 90),
  ('Medicina de Urgencias', 'Emergency Medicine', 88),
  ('Ortopedia y Traumatología', 'Orthopedics and Traumatology', 86),
  ('Dermatología', 'Dermatology', 84),
  ('Anestesiología', 'Anesthesiology', 82),
  ('Oftalmología', 'Ophthalmology', 80),
  ('Otorrinolaringología', 'Otolaryngology', 78),
  ('Psiquiatría', 'Psychiatry', 76),
  ('Neurología', 'Neurology', 74),
  ('Gastroenterología', 'Gastroenterology', 72),
  ('Endocrinología', 'Endocrinology', 70),
  ('Neumología', 'Pulmonology', 68),
  ('Nefrología', 'Nephrology', 66),
  ('Urología', 'Urology', 64),
  ('Radiología e Imagen', 'Radiology and Imaging', 62),
  ('Radiología', 'Radiology', 62),
  ('Hematología', 'Hematology', 60),
  ('Reumatología', 'Rheumatology', 58),
  ('Oncología Médica', 'Medical Oncology', 56),
  ('Infectología', 'Infectious Diseases', 54),
  ('Geriatría', 'Geriatrics', 52),
  ('Alergia e Inmunología Clínica', 'Allergy and Clinical Immunology', 50),
  ('Medicina Crítica', 'Critical Care Medicine', 48),
  ('Terapia Intensiva', 'Intensive Care', 46),
  ('Neonatología', 'Neonatology', 44),
  ('Medicina de Rehabilitación', 'Rehabilitation Medicine', 42),
  ('Medicina del Trabajo', 'Occupational Medicine', 40),
  ('Medicina Preventiva', 'Preventive Medicine', 38),
  ('Medicina del Deporte', 'Sports Medicine', 36),
  ('Nutriología Clínica', 'Clinical Nutrition', 34),
  ('Patología Clínica', 'Clinical Pathology', 32),
  ('Anatomía Patológica', 'Anatomical Pathology', 30),
  ('Neurocirugía', 'Neurosurgery', 28),
  ('Cirugía Plástica y Reconstructiva', 'Plastic and Reconstructive Surgery', 26),
  ('Medicina Paliativa', 'Palliative Medicine', 25),
  ('Cirugía Cardiotorácica', 'Cardiothoracic Surgery', 24),
  ('Cirugía Pediátrica', 'Pediatric Surgery', 22),
  ('Cirugía Oncológica', 'Surgical Oncology', 20),
  ('Salud Pública', 'Public Health', 20),
  ('Cirugía Torácica', 'Thoracic Surgery', 18),
  ('Angiología y Cirugía Vascular', 'Angiology and Vascular Surgery', 16),
  ('Oncología Pediátrica', 'Pediatric Oncology', 15),
  ('Cirugía Vascular y Endovascular', 'Vascular and Endovascular Surgery', 14),
  ('Coloproctología', 'Colorectal Surgery', 12),
  ('Cirugía Maxilofacial', 'Maxillofacial Surgery', 10),
  ('Inmunología', 'Immunology', 10),
  ('Cardiología Intervencionista', 'Interventional Cardiology', 8),
  ('Audiología, Otoneurología y Foniatría', 'Audiology, Otoneurology and Phoniatrics', 8),
  ('Endoscopía Gastrointestinal', 'Gastrointestinal Endoscopy', 6),
  ('Medicina Nuclear', 'Nuclear Medicine', 5),
  ('Radioterapia', 'Radiation Therapy', 4),
  ('Psiquiatría Infantil y de la Adolescencia', 'Child and Adolescent Psychiatry', 35),
  ('Medicina Forense', 'Forensic Medicine', 3),
  ('Medicina Legal y Forense', 'Legal and Forensic Medicine', 3),
  ('Medicina Aeroespacial', 'Aerospace Medicine', 2)
ON CONFLICT (name_es) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  popularity = EXCLUDED.popularity,
  active = EXCLUDED.active;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_specialties_popularity
  ON axxia.cat_specialties_mx (popularity DESC, name_es ASC)
  WHERE active = true;

-- Add comment
COMMENT ON TABLE axxia.cat_specialties_mx IS 'Catalog of medical specialties recognized in Mexico. Reference data for doctor registration and filtering.';

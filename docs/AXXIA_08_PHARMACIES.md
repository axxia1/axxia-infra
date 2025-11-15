# AXXIA – Pharmacies Module (Rx Checker)

The Pharmacies module allows pharmacies to validate and process electronic prescriptions issued through AXXIA.

## 1. Objectives

- Provide pharmacies with a way to:
  - validate that a prescription is authentic,
  - see the exact prescribed medication and instructions,
  - optionally record that the prescription was filled.
- Avoid requiring pharmacies to use ATC/DDD codes directly.
- Prepare the system for future premium features like:
  - generic vs brand comparisons,
  - multi-pharmacy price quotes.

## 2. Core features

1. **Prescription validation**
   - A pharmacy can:
     - scan a QR code, OR
     - receive a prescription token from the patient.
   - AXXIA:
     - verifies the prescription,
     - displays medication list and instructions.

2. **Filling confirmation**
   - The pharmacy can mark:
     - fully filled,
     - partially filled,
     - not filled.
   - AXXIA records a dispensing event.

3. **Audit and safety**
   - AXXIA can track:
     - which pharmacy filled the prescription,
     - when,
     - for which patient (by AXXIA ID, de-identified at pharmacy level if needed).

## 3. Data model (summary)

Prescription events (from Doctor App) should include:

- `patient_axxia_id`
- `doctor_axxia_id`
- one or more prescription line items:
  - local medication catalog id,
  - dose,
  - frequency,
  - duration,
  - additional instructions.

A dispensing event (optional, created by pharmacies) includes:

- `prescription_id`
- `pharmacy_axxia_id`
- date/time
- status (filled/partially filled/not filled)
- any notes.

## 4. React components – Pharmacies

`/modules/pharmacy/components/`

### 4.1 PrescriptionValidator

- Allows a pharmacy to:
  - input/scanner for a prescription token (QR, code, etc.).
  - see:
    - medication list,
    - dosage,
    - instructions,
    - validity.

### 4.2 DispenseForm

- Used to:
  - mark the prescription as filled or partially filled.
  - record any issues (e.g. medication not available).

## 5. Permissions and privacy

- Pharmacies should **not** have general access to a patient’s longitudinal record.
- They should only see:
  - prescription details shared with them via:
    - a token
    - or patient-driven sharing.
- Any data they submit back (dispensing events) becomes part of the patient’s record, with:
  - appropriate source type (e.g. `manual_provider` with `provider_type = 'pharmacy'`).

## 6. Implementation rules for Bolt

- Keep the first version simple:
  - validation of prescriptions,
  - optional recording of dispense events.
- Use the semantic engine:
  - but show only local medication names to the pharmacy.

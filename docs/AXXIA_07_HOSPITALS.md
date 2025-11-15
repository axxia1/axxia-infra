# AXXIA – Hospitals Module (Clinical Bridge)

The Hospitals module provides a bridge between hospital-based care and a patient’s longitudinal outpatient record in AXXIA.

## 1. Objectives

- Allow hospitals to contribute key events to the patient’s AXXIA record:
  - admissions,
  - discharges,
  - surgical procedures,
  - relevant reports.
- Do not require hospitals to abandon their existing HIS/EMR systems.
- Use AXXIA as a complementary continuity-of-care layer.

## 2. Core features (overview)

1. Ability for a hospital to:
   - receive relevant outpatient information (if permitted),
   - push summary events to AXXIA (admission, discharge summaries, etc.).
2. Structured summary events:
   - not a full hospital chart,
   - only a clinically useful summary for longitudinal care.
3. Basic hospital portal:
   - view and send these summaries.

## 3. Event types for hospital module

Suggested event types:

- `hospital_admission`
- `hospital_discharge`
- `surgery`
- `hospital_note`
- `icu_stay` (optional, future)

Each event must include:

- `patient_axxia_id`
- `hospital_axxia_id`
- `event_type`
- `date_start` / `date_end` (for stays)
- notes or summaries
- responsible physician AXXIA ID (optional)

## 4. React components – Hospitals

`/modules/hospital/components/`

### 4.1 HospitalDashboard

- Shows:
  - recent admissions (linked to AXXIA),
  - recently pushed summaries.

### 4.2 HospitalEventEditor

- Allows hospital staff to:
  - create a discharge summary,
  - associate diagnoses and procedures (using semantic engine),
  - mark it as visible to:
    - patient,
    - specific doctors,
    - or broader set depending on patient permissions.

## 5. Permissions considerations

- Hospitals must be treated as another stakeholder type subject to the permissions engine.
- Patients may:
  - allow hospitals to read certain outpatient history components,
  - allow hospitals to push summary data back to AXXIA.
- Hospital internal records remain separate; AXXIA stores only the shared clinical summary.

## 6. Implementation rules for Bolt

- Do not overcomplicate this module early on.
- Focus on:
  - admission/discharge summary events,
  - surgical summary events.
- Design the schema so it can be extended later (e.g. to include more hospital structured data).

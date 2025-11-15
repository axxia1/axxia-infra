# AXXIA – Insurers Module (Axxia Claims)

The Insurers module aims to simplify health insurance claims for patients and insurers, while keeping data under patient control.

## 1. Objectives

- Help patients organise and submit information needed for medical claims.
- Provide insurers with structured clinical data (when permitted) to evaluate claims faster.
- Preserve privacy and patient control at all times.

## 2. Current pain points (context)

Today, patients often must:

- collect bills, reports, prescriptions,
- scan or photograph them,
- fill out forms manually,
- email or upload to insurer portals.

Insurers then:

- re-interpret documentation manually,
- often request additional information,
- delay payment.

AXXIA can help by structuring this process.

## 3. Core features (concept)

1. **Claims package builder (patient)**:
   - The patient selects:
     - which events (consultations, studies, treatments) are part of a claim.
     - which documents (invoices, results, prescriptions) to include.
   - AXXIA bundles them into a “claim package”.
2. **Insurer access (with permission)**:
   - The insurer can:
     - view the package,
     - see structured data (diagnoses, procedures, dates),
     - download supporting documents.

## 4. Data model (high level)

A `claim_package` might include:

- `id`
- `patient_axxia_id`
- `insurer_axxia_id`
- `status` (draft/submitted/under_review/approved/rejected/paid)
- `created_at`, `updated_at`

It links to:

- a set of clinical events (by IDs),
- a set of uploaded documents (invoices, receipts),
- summary fields (e.g. total claimed amount).

## 5. Permissions

- The patient explicitly grants the insurer access to:
  - the claim package,
  - optionally, some related clinical context.
- This permission is:
  - limited in time,
  - limited in scope (only claim-related events/documents).

## 6. React components – Insurers

`/modules/insurer/components/`

### 6.1 PatientClaimsView (patient side)

- Lets patient:
  - create a new claim package,
  - add events/documents,
  - submit to an insurer.

### 6.2 InsurerClaimsDashboard

- For insurer staff:
  - view list of claim packages,
  - filter by status,
  - open each package to review.

## 7. Implementation rules for Bolt

- Do not implement full insurer logic at once.
- Focus first on:
  - letting the patient group events and documents into a package,
  - letting the insurer see that package when permitted.
- Integrate with the permissions engine instead of creating ad-hoc rules.

# AXXIA – Diagnostic Center Module (Axxia Connect)

The Diagnostic Center module connects imaging centers and laboratories with AXXIA, without forcing them to replace or radically change their legacy systems.

## 1. Objectives

- Allow centers to receive and manage **electronic orders**.
- Let them upload and link **results** to those orders.
- Use their own **local study catalogs**, while mapping to LOINC internally.
- Notify patients and doctors automatically when results are ready.

## 2. Core features (free tier)

1. List of incoming orders:
   - by patient,
   - by referring doctor,
   - by date.
2. Ability to mark orders as:
   - received,
   - in progress,
   - completed.
3. Uploading results:
   - attach PDF reports,
   - optionally structured values later.
4. Using the center’s study catalog:
   - no need to change their existing naming.

## 3. Study catalog for centers

As described in the semantic engine document:

```sql
create table if not exists diagnostic_center_studies (
  id uuid primary key default gen_random_uuid(),
  center_axxia_id uuid not null,
  local_code text not null,
  local_display_name text not null,

  standard_system text null,      -- 'LOINC'
  standard_code text null,        -- e.g. '24606-6'
  standard_display_name text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz null
);
```

Bolt must:

- Use or extend existing catalogs if they already exist.
- Keep the local names visible everywhere in the Center UI.

## 4. Orders and results workflow

### 4.1 Order creation (from Doctor App)

- Doctor creates a lab/imaging order.
- Orders specify:
  - patient AXXIA ID,
  - study IDs (center-specific or generic),
  - suspected diagnosis (if any),
  - referring doctor AXXIA ID,
  - target center AXXIA ID (optional but recommended).

### 4.2 Center portal

AXXIA exposes a portal where centers can:

- Authenticate as a diagnostic center.
- See a list of orders addressed to them:
  - filter by date/status/patient/doctor.
- Open each order to:
  - see requested studies (with the center’s local names),
  - see basic patient information (if permitted),
  - see clinical indications (if shared).

### 4.3 Result upload

When a study is completed, the center can:

- Upload a PDF report (or multiple).
- Optionally:
  - enter structured values (for labs).
  - mark the status as completed.

AXXIA must:

- Create a `lab_result` or `imaging_result` event for the patient.
- Link it to:
  - the original order,
  - the center,
  - the referring doctor.
- Notify:
  - the patient’s app,
  - the doctor’s app (if permitted by the patient).

## 5. React components – Diagnostic Center

`/modules/diagnostic-center/components/`

### 5.1 OrderList

File: `OrderList.tsx`

- Shows:
  - patient name or alias,
  - study names (local),
  - status (new, in progress, completed),
  - referring doctor (if any).
- Supports filters and basic search.

### 5.2 OrderDetail

File: `OrderDetail.tsx`

- Shows:
  - patient info (limited, per permissions),
  - list of requested studies,
  - clinical indications,
  - actions to:
    - update status,
    - upload results.

### 5.3 ResultUploader

File: `ResultUploader.tsx`

- Allows:
  - uploading one or more PDF files,
  - optionally entering basic structured data.
- After saving:
  - triggers creation of a result event in the patient record.

### 5.4 LocalStudyCatalogManager (admin-only)

File: `LocalStudyCatalogManager.tsx`

- Allows center administrators to:
  - manage their local study list,
  - edit local names,
  - manage mapping to LOINC (optional now, important later).

## 6. Permissions and privacy

- Centers must not see more patient information than necessary.
- Access to a patient’s history should be limited to:
  - the specific order,
  - optionally, relevant recent results as per permission policies.
- The patient is still the owner of their data; the center’s internal record is separate.

## 7. Implementation rules for Bolt

- Do not force centers to adopt AXXIA as their only system:
  - treat this as a complementary portal.
- Keep inbound data structures simple and robust.
- Implement clear linking between:
  - order events,
  - result events,
  - and center identity.

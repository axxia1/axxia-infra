# AXXIA – Freemium Model and Monetization

AXXIA must grow primarily through **value and adoption**, not by charging upfront fees. The freemium model is key.

## 1. Core principle

- The **base of the pyramid** (most patients and doctors) must be able to use AXXIA’s **core capabilities for free**:
  - building and accessing longitudinal records,
  - integrating legacy data,
  - exchanging prescriptions, orders and results,
  - managing permissions.

- Paid (premium) features must:
  - provide convenience, depth or advanced capabilities,
  - **not** be required to make the ecosystem function.

## 2. Main revenue streams

1. **Anonymised data exploitation** (with opt-in and robust governance):
   - aggregated analytics,
   - research,
   - quality metrics.
2. **Licensing to institutions**:
   - hospitals,
   - insurers,
   - diagnostic networks.
3. **Premium add-ons** for patients and doctors:
   - optional, high-value features.

## 3. Example: Free features

### For patients (free):

- Create and view longitudinal medical record.
- Upload legacy documents (basic OCR and manual capture).
- Receive digital prescriptions, orders and results.
- Manage permissions and privacy.
- Use the basic directory and My Health Network.

### For doctors (free):

- Basic agenda.
- Record consultations.
- Create electronic prescriptions and orders.
- View allowed parts of patient histories.
- Receive and view diagnostic results.

### For centers/hospitals/insurers (free):

- Basic portals for:
  - receiving orders,
  - uploading results or summaries,
  - reviewing claim packages (insurers).

## 4. Example: Premium features

### Patients (premium):

- Advanced OCR (tables, structured lab values).
- Trends and analytics over time (graphs, risk indicators).
- Preventive alerts and personalised recommendations.
- Enhanced export for second opinions.
- Optional blockchain vault for critical documents.

### Doctors (premium):

- Advanced agenda (automated reminders by SMS/WhatsApp/email).
- Telemedicine tools (video, secure chat).
- Online payments and invoicing.
- Advanced analytics on their patient population.

### Institutions (premium/licensing):

- Deeper integration:
  - HL7/FHIR connectors,
  - tailored dashboards,
  - custom reporting.

## 5. Implementation in code

Bolt should:

- Introduce a simple subscription/feature flag system, e.g.:

```sql
create table if not exists user_feature_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature_key text not null,
  is_enabled boolean not null default false,
  created_at timestamptz not null default now()
);
```

- Use this to control access to premium features.
- Avoid gating:
  - patient’s access to their own basic medical information,
  - basic prescription/order flows,
  - permission management.

## 6. UX rules

- Premium features should be clearly marked.
- If a free user tries to use a premium feature:
  - they should see:
    - a clear explanation,
    - the benefit of upgrading,
    - an option to dismiss without breaking basic flows.

## 7. Implementation rules for Bolt

- Start with the assumption that **everything is free**.
- Then add conditional checks for:
  - advanced analytics,
  - advanced OCR,
  - telemedicine,
  - etc.
- Keep premium logic centralised (e.g. helper functions) to avoid scattering feature-flag checks throughout the codebase.

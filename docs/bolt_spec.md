# Project: Axxia — Clinical Data Platform (MVP)

You are an autonomous dev agent. Build and deploy a production-ready MVP per below. Use the repo structure and files if present; otherwise scaffold them.

## Objectives
- Freemium platform for **consultorio** administration and **patient longitudinal record** with **unique AXXIA ID**.
- **QR-based granular consent**: patients authorize doctors to read masked history (no previous doctor names; only specialty, date, notes, codes).
- Data is **structured** using **ICD-10/11, SNOMED CT, LOINC, ATC/RxNorm**.
- **Monetization** later from **anonymized OLAP**; for MVP focus on capture + consent + retrieval.
- **Terminology Resolver** endpoint must power autosuggest across the app.

## Tech Stack (opinionated)
- **Backend**: Python 3.11, FastAPI, asyncpg, Redis (aioredis), pydantic, uvicorn.
- **DB**: PostgreSQL 16 (SQL files provided). Enable `pg_trgm`.
- **Front Web (Doctor)**: Next.js (App Router), TypeScript.
- **Mobile (Patient)**: Expo React Native (placeholder ok).
- **Infra**: Dockerfile, docker-compose, Render blueprint (preferred), Procfile.
- **Auth (MVP)**: Passwordless email magic-link for doctors; OTP for patients. (Stub allowed; wire-ready interfaces ok).

## Must-haves (MVP)
1. **Terminology Resolver** (already provided):
   - Endpoints: `/terminology/resolve`, `/terminology/bump` using DB funcs `axxia.resolve_*`.
2. **QR Consent Flow**:
   - `POST /auth/qr/scan` (validate short-lived token).
   - `POST /consent/grant` (create/update consent after patient approves in-app).
   - `GET /patient/{axxiaId}/summary?window=last_12m` (respect **consent scope** + **masking**).
   - `GET /visit/{visitId}` and `POST /visit` + `POST /visit/{visitId}/note` (SOAP structured JSON + free text).
3. **Masking rules**:
   - Hide previous **provider names**; show only **specialty**, date, and structured data (symptoms, dx, meds, labs).
4. **Audit trail**: every read/write must log to `audit_log` with `consent_id` when applicable.
5. **Doctor Web** (Next.js):
   - Page with search field using `/terminology/resolve` (exists).
   - Page to scan QR (input field/file-QR) → show masked `PatientSummary`.
   - Editor to add clinical note (SOAP JSON) mapped to catalogs.
6. **Patient Mobile** (Expo):
   - Show **AXXIA ID** and **dynamic QR token**; button to approve consent prompts.
7. **ETL Placeholder**: create schema and one script that copies OLTP to OLAP anonymized tables (star schema placeholders).

## Provided Files (expected relative paths)
- `infra/axxia_schema.sql`
- `infra/axxia_terminology_migration.sql`
- `infra/axxia_seed_subsets.sql`
- `apps/backend/axxia_terminology_api_fastapi.py` (extend here)
- `infra/Dockerfile`, `infra/docker-compose.yml`, `infra/render.yaml`, `infra/Procfile`

If any file is missing, generate it.

## Environment Variables
- `PG_DSN` e.g. `postgresql://axxia:axxia@localhost:5432/axxia`
- `REDIS_URL` e.g. `redis://localhost:6379/0`
- `APP_URL` public base URL (used in magic links; placeholder ok).

## Deployment Target
Prefer **Render** using `infra/render.yaml`. If unavailable, ensure **Docker Compose** works locally. Add a GitHub Action (`infra/.github/workflows/ci.yml`) to run backend smoke tests.

## Tasks (ordered)
1. Ensure DB is migrated: run the three SQL files above.
2. Expand backend:
   - Implement `/auth/qr/scan`, `/consent/grant`, `/patient/{axxiaId}/summary`, `/visit`, `/visit/{id}`, `/visit/{id}/note` per OpenAPI we include below.
   - Enforce masking: return specialty only, not provider names, on summaries.
   - Implement `AUDIT_LOG` writes on access (ALLOW/DENY) with hash-chaining (can be SHA256(prev_hash||event)).
   - Add simple email OTP endpoints: `POST /auth/request_otp`, `POST /auth/verify_otp` (store temp codes in Redis).
3. Frontend Web:
   - Add `/qr` page to paste/scan a token; call `/auth/qr/scan`; if consent missing, trigger patient app approval mock.
   - Add `/patient/[axxiaId]` to display masked summary.
   - Add `/visit/new` to create visit + note (SOAP structure with terminology autosuggest).
4. Mobile App:
   - Screen to display **AXXIA ID** and generate **QR token** (call backend `POST /qr/new`, or reuse `/auth/qr/scan` token creation helper).
   - Modal to **approve** consent requests.
5. ETL script placeholder:
   - Create `scripts/etl_olap.sql` building `fact_visits`, `fact_labs`, `fact_rx`, `fact_dx` with pseudonymized `pid_hash` (HMAC).

## Acceptance Tests (must pass)
- Terminology resolve “chest pain” returns SNOMED 271807003.
- Create patient P, provider D; create visit + note with structured JSON; save dx ICD-10.
- Generate patient QR; scan from doctor web; consent prompt; summary visible with provider names **hidden** but specialties present.
- Audit logs include the read with `ALLOW` and valid hash chain.
- Docker Compose: `curl localhost:8080/healthz` returns `{ ok: true }`.

## OpenAPI (seed)
Use `infra/axxia_openapi.yaml` if present; otherwise reconstruct per above.

## Notes
- Write code that compiles and runs; prefer pragmatic stubs over completeness.
- Keep secrets in env; do not hardcode credentials.
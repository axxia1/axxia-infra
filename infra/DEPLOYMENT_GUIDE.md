# Deployment Guide - Medical Specialties Catalog

## Quick Start

The medical specialties catalog has been integrated into the Axxia platform. Follow these steps to deploy:

### 1. Run the Database Migration

The migration is located at `infra/cat_specialties_mx.sql` and is **idempotent** (safe to run multiple times).

#### Option A: Using Supabase (Current Project Setup)

Since this project is using Supabase, you can run the migration using the Supabase SQL Editor:

1. Go to your Supabase Dashboard: https://lxkqkfejvpjdbvtsjsxz.supabase.co
2. Navigate to the SQL Editor
3. Copy the contents of `infra/cat_specialties_mx.sql`
4. Paste and execute

Or use the Supabase CLI if you have it set up:

```bash
supabase db push
```

#### Option B: Using psql Directly

If you have direct database access:

```bash
psql $PG_DSN -f infra/cat_specialties_mx.sql
```

### 2. Verify the Migration

Check that the catalog was created successfully:

```sql
SELECT COUNT(*) as total_specialties
FROM axxia.cat_specialties_mx
WHERE active = true;
```

Expected result: 47 active specialties

### 3. Start the FastAPI Backend

The backend API must be running for the frontend to fetch specialties.

```bash
cd backend
pip install -r requirements.txt
uvicorn axxia_terminology_api_fastapi:app --reload --host 0.0.0.0 --port 8000
```

Set the required environment variable:
```bash
export PG_DSN="postgresql://user:password@host:port/database"
```

For Supabase, use your connection string from the Supabase Dashboard.

### 4. Test the API Endpoint

Verify the specialties endpoint is working:

```bash
curl http://localhost:8000/catalog/specialties
```

Expected response:
```json
{
  "items": [
    "Medicina Interna",
    "Cardiología",
    "Pediatría",
    ...
  ]
}
```

### 5. Start the Frontend

The frontend will automatically fetch specialties from the API:

```bash
npm run dev
```

The doctor registration form will now load specialties from the FastAPI endpoint.

## Environment Variables

### Frontend (.env)

```env
VITE_SUPABASE_URL=https://lxkqkfejvpjdbvtsjsxz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

### Backend

```bash
export PG_DSN="postgresql://user:password@host:port/database"
```

For production, set `VITE_API_URL` to your deployed FastAPI URL.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Vite/React)                   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     DoctorRegistrationForm.tsx                       │  │
│  │                                                       │  │
│  │  - Fetches: GET /catalog/specialties                 │  │
│  │  - Displays dropdown with 47 specialties             │  │
│  │  - Has fallback list if API unavailable              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP Request
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  axxia_catalog_router.py                             │  │
│  │                                                       │  │
│  │  GET /catalog/specialties                            │  │
│  │  - Queries database for active specialties           │  │
│  │  - Returns ordered by popularity + name              │  │
│  │  - Falls back to hardcoded list if DB fails          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Query
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL/Supabase)             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  axxia.cat_specialties_mx                            │  │
│  │                                                       │  │
│  │  - 47 medical specialties                            │  │
│  │  - Includes popularity rankings                      │  │
│  │  - RLS enabled (public read access)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Migration ran successfully
- [ ] Database contains 47 active specialties
- [ ] API endpoint returns specialty list
- [ ] API health check passes
- [ ] Frontend loads specialties dropdown
- [ ] Dropdown displays specialties ordered by popularity
- [ ] Form works with fallback data when API is down
- [ ] Build completes without errors

## Troubleshooting

### API Returns Empty List

Check that the migration was run and data was seeded:
```sql
SELECT * FROM axxia.cat_specialties_mx LIMIT 5;
```

### Frontend Shows Fallback List

- Verify `VITE_API_URL` is set correctly in `.env`
- Check that the FastAPI backend is running
- Test the endpoint directly with curl
- Check browser console for CORS errors

### CORS Errors

The FastAPI router includes CORS handling. If you see CORS errors, verify:
- Backend is running on the expected port
- `VITE_API_URL` matches the backend URL
- Backend logs show the request being received

## Production Deployment

### Backend

Deploy the FastAPI app to your hosting platform (Render, Railway, etc.):

1. Set `PG_DSN` environment variable with production database URL
2. Deploy `backend/` directory
3. Ensure `axxia_catalog_router.py` is included
4. Run migration on production database

### Frontend

1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy `dist/` directory to static hosting

## Next Steps

- [ ] Add usage analytics to track specialty popularity
- [ ] Implement admin interface for managing specialties
- [ ] Add internationalization for English specialty names
- [ ] Consider adding subspecialty relationships
- [ ] Add certification board references

# Medical Specialties Catalog

## Overview

This directory contains the SQL migration and documentation for the Mexican medical specialties catalog used in the Axxia platform.

## Files

- `cat_specialties_mx.sql` - Idempotent migration that creates and seeds the specialties catalog

## Database Schema

### Table: `axxia.cat_specialties_mx`

Stores the official catalog of medical specialties recognized in Mexico.

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigserial | Primary key, auto-increment |
| `name_es` | text | Spanish name of the specialty (unique) |
| `name_en` | text | English name for reference |
| `popularity` | integer | Usage ranking (0-100) |
| `active` | boolean | Whether specialty is currently active |
| `created_at` | timestamptz | Creation timestamp |

### Indexes

- `idx_specialties_popularity` - Optimizes queries ordered by popularity and name

### Security

- Row Level Security (RLS) enabled
- Public read access for active specialties only
- Reference data accessible without authentication

## API Endpoint

The catalog is exposed through the FastAPI backend:

```
GET /catalog/specialties
```

**Response:**
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

Specialties are returned ordered by:
1. Popularity (descending)
2. Spanish name (ascending)

The endpoint includes fallback data for resilience when the database is unavailable.

## Deployment

### First-time Setup

#### Using Render

After deploying the project to Render, run the migration:

```bash
psql $PG_DSN -f infra/cat_specialties_mx.sql
```

#### Using Docker Compose

Inside the API container:

```bash
psql $PG_DSN -f /app/infra/cat_specialties_mx.sql
```

#### Using Supabase

Use the Supabase SQL editor or CLI to run the migration:

```bash
supabase db push
```

Or copy the contents of `cat_specialties_mx.sql` into the Supabase SQL editor and execute.

### Re-running the Migration

The migration is **idempotent** and can be safely run multiple times. It will:
- Create the table if it doesn't exist
- Update existing records with new data (using `ON CONFLICT`)
- Preserve any custom specialties added manually

## Data

The catalog includes 47 official Mexican medical specialties with popularity rankings:

### High Priority (95-100)
- Medicina Interna
- Cardiología
- Pediatría
- Ginecología y Obstetricia
- Cirugía General

### Medium Priority (50-94)
- Medicina Familiar
- Traumatología y Ortopedia
- Dermatología
- Radiología e Imagen
- And more...

### Lower Priority (1-49)
- Specialized surgical fields
- Niche specialties
- Research-focused specialties

## Frontend Integration

The doctor registration form automatically loads specialties from the API endpoint:

```typescript
// Fetches from: GET /catalog/specialties
const response = await fetch(`${API_URL}/catalog/specialties`);
const data = await response.json();
// data.items contains array of specialty names
```

If the API is unavailable, the form falls back to a hardcoded list of common specialties.

## Maintenance

### Adding New Specialties

Add new specialties directly to the database:

```sql
INSERT INTO axxia.cat_specialties_mx (name_es, name_en, popularity, active)
VALUES ('Nueva Especialidad', 'New Specialty', 50, true);
```

Or update the migration file and re-run it (idempotent).

### Updating Popularity

Adjust popularity based on usage patterns:

```sql
UPDATE axxia.cat_specialties_mx
SET popularity = 95
WHERE name_es = 'Medicina de Urgencias';
```

### Deactivating Specialties

Instead of deleting, mark specialties as inactive:

```sql
UPDATE axxia.cat_specialties_mx
SET active = false
WHERE name_es = 'Old Specialty';
```

This preserves historical data while removing from active selections.

## Testing

Verify the catalog is working:

```bash
# Check database
psql $PG_DSN -c "SELECT COUNT(*) FROM axxia.cat_specialties_mx WHERE active = true;"

# Check API endpoint
curl http://localhost:8000/catalog/specialties

# Check catalog health
curl http://localhost:8000/catalog/health
```

Expected results:
- Database should return count of 47 active specialties
- API should return JSON with items array containing specialty names
- Health endpoint should show database connected

## Notes

- The catalog is considered **reference data** and is publicly readable
- Specialties are listed in Spanish (`name_es`) as the primary display name
- English names (`name_en`) are included for reference and future internationalization
- Popularity rankings can be adjusted based on usage analytics
- The fallback list in the API router should match the most common specialties in the database

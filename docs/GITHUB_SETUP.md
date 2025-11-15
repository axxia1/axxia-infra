# GitHub Setup Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Configure repository:
   - **Repository name:** `axxia-health-platform`
   - **Visibility:** ⚠️ **PRIVATE** (Critical - contains health data schemas)
   - **Description:** "Plataforma de Decisiones Médicas Inteligentes - Medical Health Records System"
   - ❌ **DO NOT** initialize with README
   - ❌ **DO NOT** add .gitignore (already exists)
   - ❌ **DO NOT** add license yet

3. Click "Create repository"

## Step 2: Get Repository URL

After creation, GitHub will show you commands. Copy the HTTPS URL:

```
https://github.com/YOUR-USERNAME/axxia-health-platform.git
```

## Step 3: Connect Local Repository

The system will automatically handle Git initialization and commits.

Share the repository URL you created, and the connection will be configured.

## What's Already Protected

The `.gitignore` file excludes:

- ✅ `.env` files (Supabase credentials)
- ✅ Large CSV catalogs (59k institutions, 83k LOINC)
- ✅ `node_modules` and build artifacts
- ✅ Database files
- ✅ Python cache files

## Repository Structure

```
axxia-health-platform/
├── src/                    # React frontend
├── backend/               # FastAPI (future)
│   └── data/             # CSV catalogs
├── supabase/             # Database migrations
│   └── migrations/       # SQL migration files
├── db/                   # Legacy SQL scripts
├── infra/                # Infrastructure docs
├── public/               # Static assets
└── package.json          # Node dependencies
```

## Next Steps After GitHub Setup

1. ✅ Repository created and connected
2. 🚀 Configure GitHub Actions (CI/CD) - Optional
3. 🚀 Setup branch protection rules - Recommended
4. 🚀 Add collaborators if needed

## Important Security Notes

⚠️ **NEVER commit:**
- Environment variables (.env files)
- Supabase credentials
- API keys
- Patient data (PHI)
- Large binary files

✅ **Safe to commit:**
- Source code (TypeScript/React)
- Database schemas (SQL migrations)
- Configuration files (without secrets)
- Documentation (Markdown)
- Small CSV catalogs (CIE-10, medications)

---

**Once you create the repo, share the URL and we'll proceed!**

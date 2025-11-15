#!/usr/bin/env python3
"""
Load institutions from CSV to Supabase using the Supabase Python client
"""

import csv
import os
import sys

try:
    from supabase import create_client, Client
except ImportError:
    print("Installing supabase...")
    os.system("pip install supabase")
    from supabase import create_client, Client

# Read env file
env_path = ".env"
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

url = os.getenv("VITE_SUPABASE_URL")
key = os.getenv("VITE_SUPABASE_ANON_KEY")

if not url or not key:
    print("ERROR: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY")
    sys.exit(1)

print(f"Connecting to Supabase: {url}")
supabase: Client = create_client(url, key)

# Read CSV
csv_path = "backend/data/cat_institutions_mx_full.csv"
print(f"Reading CSV from {csv_path}...")

batch_size = 500
batch = []
total = 0
errors = 0

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)

    for row in reader:
        # Clean and prepare data
        record = {
            'name': row['name'].strip() if row['name'] else None,
            'type_norm': row['type_norm'].strip() if row['type_norm'] and row['type_norm'] != 'nan' else None,
            'source_type': row['source_type'].strip() if row['source_type'] and row['source_type'] != 'nan' else None,
            'city': row['city'].strip() if row['city'] else None,
            'state': row['state'].strip() if row['state'] else None,
            'ownership': row['ownership'].strip() if row['ownership'] and row['ownership'] != 'nan' else None,
            'clues': row['clues'].strip() if row['clues'] and row['clues'] != 'nan' else None,
            'institution_group': row['institution_group'].strip() if row['institution_group'] and row['institution_group'] != 'nan' else None,
            'phone1': row['phone1'].strip() if row['phone1'] and row['phone1'] != 'nan' else None,
            'phone2': row['phone2'].strip() if row['phone2'] and row['phone2'] != 'nan' else None,
            'rfc': row['rfc'].strip() if row['rfc'] and row['rfc'] != 'nan' else None,
            'active': True
        }

        # Skip if missing required fields
        if not record['name'] or not record['city'] or not record['state']:
            continue

        batch.append(record)

        if len(batch) >= batch_size:
            try:
                result = supabase.schema('axxia').table('cat_institutions_mx').insert(batch).execute()
                total += len(batch)
                print(f"✅ Loaded {total} institutions...")
            except Exception as e:
                print(f"❌ Error loading batch: {e}")
                errors += len(batch)

            batch = []

# Insert remaining rows
if batch:
    try:
        result = supabase.schema('axxia').table('cat_institutions_mx').insert(batch).execute()
        total += len(batch)
        print(f"✅ Loaded {total} institutions total")
    except Exception as e:
        print(f"❌ Error loading final batch: {e}")
        errors += len(batch)

print(f"\n{'='*50}")
print(f"✅ SUCCESS: {total} institutions loaded")
if errors > 0:
    print(f"❌ ERRORS: {errors} records failed")
print(f"{'='*50}")

# Verify count
try:
    result = supabase.schema('axxia').table('cat_institutions_mx').select("id", count='exact').limit(1).execute()
    print(f"\nTotal institutions in database: {result.count}")

    # Show sample
    sample = supabase.schema('axxia').table('cat_institutions_mx').select("id,name,city,state").limit(5).execute()
    print("\nSample institutions:")
    for inst in sample.data:
        print(f"  {inst['id']}: {inst['name']} - {inst['city']}, {inst['state']}")
except Exception as e:
    print(f"Error verifying: {e}")

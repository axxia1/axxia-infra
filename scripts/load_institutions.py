#!/usr/bin/env python3
"""
Load institutions from CSV to Supabase
Uses direct PostgreSQL connection for batch loading
"""

import csv
import os
import sys

try:
    import psycopg2
    from psycopg2.extras import execute_batch
except ImportError:
    print("Installing psycopg2...")
    os.system("pip install psycopg2-binary")
    import psycopg2
    from psycopg2.extras import execute_batch

# Get Supabase connection string from env
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "")

if not SUPABASE_URL or not SUPABASE_DB_PASSWORD:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_DB_PASSWORD environment variables")
    sys.exit(1)

# Extract project ref from URL
project_ref = SUPABASE_URL.replace("https://", "").split(".")[0]

# Build connection string
conn_string = f"postgresql://postgres.{project_ref}:{SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

print(f"Connecting to Supabase project: {project_ref}")

try:
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()

    print("Connected successfully!")

    # Clear staging table
    print("Clearing staging table...")
    cur.execute("TRUNCATE TABLE axxia._stg_institutions_csv")

    # Read CSV and insert in batches
    csv_path = "backend/data/cat_institutions_mx_full.csv"
    print(f"Reading CSV from {csv_path}...")

    batch_size = 1000
    batch = []
    total = 0

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        insert_sql = """
            INSERT INTO axxia._stg_institutions_csv
            (name, type_norm, source_type, city, state, ownership, clues, institution_group, phone1, phone2, rfc, active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        for row in reader:
            batch.append((
                row['name'],
                row['type_norm'],
                row['source_type'],
                row['city'],
                row['state'],
                row['ownership'],
                row['clues'],
                row['institution_group'],
                row['phone1'],
                row['phone2'],
                row['rfc'],
                row['active']
            ))

            if len(batch) >= batch_size:
                execute_batch(cur, insert_sql, batch)
                conn.commit()
                total += len(batch)
                print(f"Loaded {total} rows...")
                batch = []

        # Insert remaining rows
        if batch:
            execute_batch(cur, insert_sql, batch)
            conn.commit()
            total += len(batch)
            print(f"Loaded {total} rows total")

    # Now upsert from staging to main table
    print("Upserting to main table...")
    cur.execute("""
        INSERT INTO axxia.cat_institutions_mx
        (name, type_norm, source_type, city, state, ownership, clues, institution_group, phone1, phone2, rfc, active)
        SELECT
          NULLIF(TRIM(name), '') as name,
          NULLIF(TRIM(type_norm), '') as type_norm,
          NULLIF(TRIM(source_type), '') as source_type,
          NULLIF(TRIM(city), '') as city,
          NULLIF(TRIM(state), '') as state,
          NULLIF(TRIM(ownership), '') as ownership,
          NULLIF(TRIM(clues), '') as clues,
          NULLIF(TRIM(institution_group), '') as institution_group,
          NULLIF(TRIM(phone1), '') as phone1,
          NULLIF(TRIM(phone2), '') as phone2,
          NULLIF(TRIM(rfc), '') as rfc,
          CASE WHEN LOWER(active) IN ('t','true','1','yes','y') THEN TRUE ELSE TRUE END
        FROM axxia._stg_institutions_csv s
        WHERE NULLIF(TRIM(name), '') IS NOT NULL
          AND NULLIF(TRIM(city), '') IS NOT NULL
          AND NULLIF(TRIM(state), '') IS NOT NULL
        ON CONFLICT (clues) DO UPDATE
        SET name = EXCLUDED.name,
            type_norm = EXCLUDED.type_norm,
            source_type = EXCLUDED.source_type,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            ownership = EXCLUDED.ownership,
            institution_group = EXCLUDED.institution_group,
            phone1 = EXCLUDED.phone1,
            phone2 = EXCLUDED.phone2,
            rfc = EXCLUDED.rfc,
            active = EXCLUDED.active
    """)

    conn.commit()

    # Check final count
    cur.execute("SELECT COUNT(*) FROM axxia.cat_institutions_mx")
    count = cur.fetchone()[0]
    print(f"\n✅ SUCCESS! Loaded {count} institutions into cat_institutions_mx")

    # Show sample
    cur.execute("SELECT id, name, city, state FROM axxia.cat_institutions_mx LIMIT 5")
    print("\nSample institutions:")
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]} - {row[2]}, {row[3]}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

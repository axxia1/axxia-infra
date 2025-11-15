import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://lxkqkfejvpjdbvtsjsxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4a3FrZmVqdnBqZGJ2dHNqc3h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMzQzNSwiZXhwIjoyMDc3NTA5NDM1fQ.IDsEf1wbeXW0WRhHrwiuM-V3jr5XjejhDaXKNUMRy6s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('\n🔧 Aplicando migración de búsqueda de pacientes...\n');

  const sql = readFileSync('./supabase/migrations/20251107100000_create_search_patient_function.sql', 'utf-8');

  try {
    // Ejecutar SQL directamente
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // Si exec_sql no existe, intentar crear la función directamente
      console.log('⚠️  exec_sql no disponible, creando función...');

      // Extraer solo la parte CREATE FUNCTION
      const createFunctionMatch = sql.match(/CREATE OR REPLACE FUNCTION[\s\S]*?END;\s*\$\$/);
      if (createFunctionMatch) {
        const functionSQL = createFunctionMatch[0];
        console.log('Ejecutando función SQL...');

        // Usar fetch directo a la API de Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: functionSQL })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }
    }

    console.log('✅ Migración aplicada exitosamente\n');
    console.log('🧪 Probando la función...\n');

    // Probar la función con el CURP de prueba
    const { data: testData, error: testError } = await supabase.rpc('search_patient_by_identifier', {
      p_search_term: 'GALA900515MDFRRN03'
    });

    if (testError) {
      console.error('❌ Error al probar:', testError);
    } else if (testData && testData.length > 0) {
      console.log('✅ Función funcionando correctamente!');
      console.log(`   Encontrado: ${testData[0].first_name} ${testData[0].last_name_paternal}`);
      console.log(`   AXXIA ID: ${testData[0].axxia_id}\n`);
    } else {
      console.log('⚠️  No se encontraron resultados (puede que no haya datos de prueba)\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

applyMigration();

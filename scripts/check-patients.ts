import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxkqkfejvpjdbvtsjsxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4a3FrZmVqdnBqZGJ2dHNqc3h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMzQzNSwiZXhwIjoyMDc3NTA5NDM1fQ.IDsEf1wbeXW0WRhHrwiuM-V3jr5XjejhDaXKNUMRy6s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPatients() {
  console.log('\n📊 Verificando pacientes en la base de datos...\n');

  try {
    // Usar service_role key para acceder directamente al schema axxia
    const { data, error } = await supabase.rpc('exec_sql', {
      query: 'SELECT COUNT(*) as total FROM axxia.patients'
    });

    if (error) {
      console.log('Intentando query directo con service role...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: 'SELECT id, axxia_id, first_name, last_name_paternal, email, curp FROM axxia.patients LIMIT 5'
        })
      });

      console.log('Status:', response.status);
      console.log('Response:', await response.text());
      return;
    }

    console.log('Resultado:', data);

  } catch (err: any) {
    console.error('💥 Error:', err.message);
  }
}

checkPatients();

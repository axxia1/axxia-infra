import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxkqkfejvpjdbvtsjsxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4a3FrZmVqdnBqZGJ2dHNqc3h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTkzMzQzNSwiZXhwIjoyMDc3NTA5NDM1fQ.IDsEf1wbeXW0WRhHrwiuM-V3jr5XjejhDaXKNUMRy6s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTestPatients() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   PACIENTES DE PRUEBA - AXXIA PORTAL   ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Usar SQL directo con rpc
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT axxia_id, first_name, last_name_paternal, last_name_maternal,
             email, phone_mobile, curp
      FROM axxia.patients
      LIMIT 10
    `
  }).then(async (result) => {
    // Si RPC no existe, intentar tabla directa
    if (result.error) {
      return await supabase
        .from('patients')
        .select('axxia_id, first_name, last_name_paternal, last_name_maternal, email, phone_mobile, curp')
        .limit(10);
    }
    return result;
  });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No se encontraron pacientes en la base de datos.\n');
    return;
  }

  data.forEach((patient, index) => {
    const fullName = `${patient.first_name} ${patient.last_name_paternal} ${patient.last_name_maternal || ''}`.trim();

    console.log(`\n${index + 1}. ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   🆔 AXXIA ID:  ${patient.axxia_id}`);
    console.log(`   👤 Nombre:    ${fullName}`);
    if (patient.curp) {
      console.log(`   📋 CURP:      ${patient.curp}`);
    }
    if (patient.email) {
      console.log(`   📧 Email:     ${patient.email}`);
    }
    if (patient.phone_mobile) {
      console.log(`   📱 Teléfono:  ${patient.phone_mobile}`);
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\n✨ Total de pacientes: ${data.length}\n`);
  console.log('💡 Para acceder al portal:');
  console.log('   1. Usa cualquier AXXIA ID de arriba');
  console.log('   2. El código de verificación es: 123456');
  console.log('   3. O inicia sesión con email/contraseña si tienes cuenta\n');
}

getTestPatients();

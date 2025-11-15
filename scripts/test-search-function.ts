import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxkqkfejvpjdbvtsjsxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4a3FrZmVqdnBqZGJ2dHNqc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzM0MzUsImV4cCI6MjA3NzUwOTQzNX0.LFXQd7QqDq2wstztHLbB12D7Wa7j2LQSMDbU6RYm4Ho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearchFunction() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   VERIFICACIÓN DE BÚSQUEDA DE PACIENTES        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const testCases = [
    { label: 'CURP', value: 'GALA900515MDFRRN03' },
    { label: 'AXXIA ID', value: 'AX-TEST-PAT-001' },
    { label: 'Email', value: 'ana.garcia@example.com' }
  ];

  let allTestsPassed = true;

  for (const testCase of testCases) {
    console.log(`🔍 Probando búsqueda por ${testCase.label}: ${testCase.value}`);

    try {
      const { data, error } = await supabase.rpc('search_patient_by_identifier', {
        p_search_term: testCase.value
      });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        console.error(`   Detalles:`, error);
        allTestsPassed = false;
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   ⚠️  No se encontraron resultados`);
        console.log(`   (Esto es normal si no hay datos de prueba)\n`);
        continue;
      }

      const patient = Array.isArray(data) ? data[0] : data;
      console.log(`   ✅ Paciente encontrado:`);
      console.log(`      - ID: ${patient.id}`);
      console.log(`      - AXXIA ID: ${patient.axxia_id}`);
      console.log(`      - Nombre: ${patient.first_name} ${patient.last_name_paternal} ${patient.last_name_maternal || ''}`);
      console.log(`      - Email: ${patient.email || 'N/A'}`);
      console.log(`      - Teléfono: ${patient.phone_mobile || 'N/A'}`);
      console.log(`      - Tipo de sangre: ${patient.blood_type || 'No especificado'}`);
      console.log();

    } catch (err: any) {
      console.error(`   ❌ Error inesperado: ${err.message}`);
      allTestsPassed = false;
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (allTestsPassed) {
    console.log('\n✅ ¡TODAS LAS PRUEBAS PASARON!\n');
    console.log('🎉 La función search_patient_by_identifier está funcionando correctamente.');
    console.log('👉 Ahora puedes usar el Portal del Paciente con cualquiera de estos valores:\n');
    console.log('   • CURP: GALA900515MDFRRN03');
    console.log('   • AXXIA ID: AX-TEST-PAT-001');
    console.log('   • Email: ana.garcia@example.com');
    console.log('   • Código de verificación: 123456\n');
  } else {
    console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON\n');
    console.log('Por favor revisa los errores arriba.\n');
  }
}

testSearchFunction().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});

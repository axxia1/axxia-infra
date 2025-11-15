import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lxkqkfejvpjdbvtsjsxz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4a3FrZmVqdnBqZGJ2dHNqc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MzM0MzUsImV4cCI6MjA3NzUwOTQzNX0.LFXQd7QqDq2wstztHLbB12D7Wa7j2LQSMDbU6RYm4Ho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealPatient() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║   PRUEBA CON PACIENTE REAL                     ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const testCases = [
    { label: 'CURP', value: 'RASC950214MDFRML01' },
    { label: 'AXXIA ID', value: 'AXX-01-GCHQGC-STTCK' },
    { label: 'Email', value: 'carmen.ramirez@email.com' }
  ];

  let allTestsPassed = true;

  for (const testCase of testCases) {
    console.log(`🔍 Buscando por ${testCase.label}: ${testCase.value}`);

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
        console.log(`   ❌ No se encontraron resultados`);
        allTestsPassed = false;
        continue;
      }

      const patient = Array.isArray(data) ? data[0] : data;
      const fullName = [
        patient.first_name,
        patient.last_name_paternal || '',
        patient.last_name_maternal || ''
      ].filter(Boolean).join(' ');

      console.log(`   ✅ ¡Paciente encontrado!`);
      console.log(`      - ID: ${patient.id}`);
      console.log(`      - AXXIA ID: ${patient.axxia_id}`);
      console.log(`      - Nombre: ${fullName}`);
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
    console.log('🎉 La función está funcionando perfectamente.');
    console.log('\n📋 Datos de prueba disponibles:\n');
    console.log('   Paciente: Carmen Ramírez');
    console.log('   • CURP: RASC950214MDFRML01');
    console.log('   • AXXIA ID: AXX-01-GCHQGC-STTCK');
    console.log('   • Email: carmen.ramirez@email.com');
    console.log('\n   Paciente: Elena Castro');
    console.log('   • CURP: CAME911208MDFSRL01');
    console.log('   • AXXIA ID: AXX-01-MSRGMS-K7W2P');
    console.log('   • Email: elena.castro@email.com\n');
  } else {
    console.log('\n⚠️  ALGUNAS PRUEBAS FALLARON\n');
  }
}

testRealPatient().catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});

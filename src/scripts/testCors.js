const fetch = require('node-fetch');

/**
 * Script para probar la configuración de CORS
 * Simula requests desde diferentes orígenes
 */
async function testCors() {
  console.log('🧪 Probando configuración de CORS...\n');

  const baseUrl = process.env.BACKEND_URL || 'https://omniwp-backend-production.up.railway.app';
  const testOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://omniwp-frontend.vercel.app',
    'https://omniwp.vercel.app',
    'https://www.omniwp.com'
  ];

  console.log(`🔗 Probando contra: ${baseUrl}\n`);

  for (const origin of testOrigins) {
    console.log(`📡 Probando origin: ${origin}`);
    
    try {
      // Probar preflight request (OPTIONS)
      const preflightResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization'
        }
      });

      console.log(`   OPTIONS Status: ${preflightResponse.status}`);
      console.log(`   Access-Control-Allow-Origin: ${preflightResponse.headers.get('access-control-allow-origin')}`);
      console.log(`   Access-Control-Allow-Methods: ${preflightResponse.headers.get('access-control-allow-methods')}`);
      console.log(`   Access-Control-Allow-Headers: ${preflightResponse.headers.get('access-control-allow-headers')}`);
      console.log(`   Access-Control-Allow-Credentials: ${preflightResponse.headers.get('access-control-allow-credentials')}`);

      if (preflightResponse.status === 200) {
        console.log('   ✅ Preflight request exitoso\n');
      } else {
        console.log('   ❌ Preflight request falló\n');
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  // Probar endpoint de disponibilidad
  console.log('📡 Probando endpoint de disponibilidad...');
  try {
    const response = await fetch(`${baseUrl}/api/v1/whatsapp/availability`);
    const data = await response.json();
    console.log('✅ Endpoint disponible:', data);
  } catch (error) {
    console.log('❌ Error en endpoint:', error.message);
  }

  console.log('\n🎉 Pruebas de CORS completadas!');
  console.log('\n📝 Si localhost:3000 no funciona:');
  console.log('   1. Verifica que el backend esté desplegado');
  console.log('   2. Revisa los logs del servidor en Railway');
  console.log('   3. Asegúrate de que la variable de entorno esté configurada');
}

// Ejecutar pruebas
if (require.main === module) {
  testCors();
}

module.exports = testCors;

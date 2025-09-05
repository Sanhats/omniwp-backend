const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script para simular exactamente lo que hace el frontend
 */
async function testFrontendSimulation() {
  try {
    console.log('🧪 Simulando comportamiento del frontend...\n');

    const baseUrl = 'https://omniwp-backend-production.up.railway.app/api/v1';
    
    // 1. Login
    console.log('🔐 Haciendo login...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'tomas@test.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login exitoso');

    // 2. Probar endpoint de debug
    console.log('\n🔍 Probando endpoint de debug...');
    const debugResponse = await fetch(`${baseUrl}/messages/debug`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug endpoint funcionando:');
      console.log('   - Mensaje:', debugData.message);
      console.log('   - Cliente:', debugData.client.name);
      console.log('   - Pedido:', debugData.order.description);
      console.log('   - Debug flag:', debugData.debug);
    } else {
      console.log('❌ Debug endpoint falló:', debugResponse.status);
    }

    // 3. Simular request del frontend
    console.log('\n📝 Simulando request del frontend...');
    
    const frontendData = {
      templateType: 'confirmacion',
      clientId: '68bb43988aaa7f51faebe8a6',
      orderId: '68bb43a88aaa7f51faebe8a7'
    };

    console.log('   Datos enviados:', frontendData);

    const templateResponse = await fetch(`${baseUrl}/messages/template`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(frontendData)
    });

    console.log(`   Status: ${templateResponse.status} ${templateResponse.statusText}`);

    if (templateResponse.ok) {
      const templateData = await templateResponse.json();
      console.log('✅ Template generado exitosamente:');
      console.log('   - Mensaje:', templateData.message);
      console.log('   - Cliente:', templateData.client.name);
      console.log('   - Pedido:', templateData.order.description);
      console.log('   - Status del pedido:', templateData.order.status);
      
      // Simular lo que hace el frontend al copiar al portapapeles
      console.log('\n📋 Simulando copia al portapapeles:');
      console.log('   - Mensaje copiado:', templateData.message);
      console.log('   - ¿Es undefined?', templateData.message === undefined);
      console.log('   - Tipo:', typeof templateData.message);
      console.log('   - Longitud:', templateData.message ? templateData.message.length : 'N/A');
      
    } else {
      const errorData = await templateResponse.json();
      console.log('❌ Error generando template:');
      console.log('   - Error:', errorData);
    }

    console.log('\n🎉 Simulación completada');

  } catch (error) {
    console.error('❌ Error en simulación:', error.message);
  }
}

// Ejecutar simulación
testFrontendSimulation()
  .then(() => {
    console.log('🎉 Simulación finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en simulación:', error);
    process.exit(1);
  });

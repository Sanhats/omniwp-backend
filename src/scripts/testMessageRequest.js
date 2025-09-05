const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script para probar el request de generación de mensajes
 */
async function testMessageRequest() {
  try {
    console.log('🧪 Probando request de generación de mensajes...\n');

    const baseUrl = 'https://omniwp-backend-production.up.railway.app/api/v1';
    
    // 1. Hacer login para obtener token
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

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login exitoso, token obtenido');

    // 2. Obtener clientes
    console.log('\n👥 Obteniendo clientes...');
    const clientsResponse = await fetch(`${baseUrl}/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!clientsResponse.ok) {
      throw new Error(`Clients failed: ${clientsResponse.status} ${clientsResponse.statusText}`);
    }

    const clients = await clientsResponse.json();
    console.log(`✅ Clientes obtenidos: ${clients.length}`);

    if (clients.length === 0) {
      console.log('❌ No hay clientes disponibles para probar');
      return;
    }

    const client = clients[0];
    console.log(`   - Cliente: ${client.name} (${client.id})`);

    // 3. Obtener pedidos
    console.log('\n📦 Obteniendo pedidos...');
    const ordersResponse = await fetch(`${baseUrl}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!ordersResponse.ok) {
      throw new Error(`Orders failed: ${ordersResponse.status} ${ordersResponse.statusText}`);
    }

    const orders = await ordersResponse.json();
    console.log(`✅ Pedidos obtenidos: ${orders.length}`);

    if (orders.length === 0) {
      console.log('❌ No hay pedidos disponibles para probar');
      return;
    }

    const order = orders[0];
    console.log(`   - Pedido: ${order.description} (${order.id})`);

    // 4. Probar endpoint de mensajes
    console.log('\n📝 Probando endpoint de mensajes...');
    
    // Probar endpoint de prueba primero
    const testResponse = await fetch(`${baseUrl}/messages/test`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Endpoint de prueba funcionando:', testData.message);
    } else {
      console.log('❌ Endpoint de prueba falló:', testResponse.status);
    }

    // 5. Probar generación de template
    console.log('\n🎯 Probando generación de template...');
    
    const templateData = {
      clientId: client.id,
      orderId: order.id,
      templateType: 'confirmacion'
    };

    console.log('   Datos enviados:', templateData);

    const templateResponse = await fetch(`${baseUrl}/messages/template`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });

    console.log(`   Status: ${templateResponse.status} ${templateResponse.statusText}`);

    if (templateResponse.ok) {
      const templateResult = await templateResponse.json();
      console.log('✅ Template generado exitosamente:');
      console.log('   Mensaje:', templateResult.message);
      console.log('   Cliente:', templateResult.client);
      console.log('   Pedido:', templateResult.order);
    } else {
      const errorData = await templateResponse.json();
      console.log('❌ Error generando template:');
      console.log('   Error:', errorData);
    }

    console.log('\n🎉 Prueba completada');

  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.status, error.response.statusText);
    }
  }
}

// Ejecutar prueba si se llama directamente
if (require.main === module) {
  testMessageRequest()
    .then(() => {
      console.log('🎉 Prueba finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en prueba:', error);
      process.exit(1);
    });
}

module.exports = { testMessageRequest };

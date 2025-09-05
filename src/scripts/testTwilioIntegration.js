const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script para probar la integración completa de Twilio
 */
async function testTwilioIntegration() {
  try {
    console.log('🧪 Probando integración completa de Twilio...\n');

    const baseUrl = 'https://omniwp-backend-production.up.railway.app/api/v1';
    
    // 1. Hacer login
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
    console.log('✅ Login exitoso');

    // 2. Obtener clientes
    console.log('\n👥 Obteniendo clientes...');
    const clientsResponse = await fetch(`${baseUrl}/clients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!clientsResponse.ok) {
      throw new Error(`Clients failed: ${clientsResponse.status}`);
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
      throw new Error(`Orders failed: ${ordersResponse.status}`);
    }

    const orders = await ordersResponse.json();
    console.log(`✅ Pedidos obtenidos: ${orders.length}`);

    if (orders.length === 0) {
      console.log('❌ No hay pedidos disponibles para probar');
      return;
    }

    const order = orders[0];
    console.log(`   - Pedido: ${order.description} (${order.id})`);

    // 4. Probar templates disponibles
    console.log('\n📝 Probando templates disponibles...');
    const templatesResponse = await fetch(`${baseUrl}/messages/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log('✅ Templates obtenidos:');
      templatesData.templates.forEach(template => {
        console.log(`   - ${template.id}: ${template.content.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ Error obteniendo templates');
    }

    // 5. Probar envío de mensaje WhatsApp (simulado)
    console.log('\n📱 Probando envío de mensaje WhatsApp...');
    
    const whatsappData = {
      clientId: client.id,
      orderId: order.id,
      channel: 'whatsapp',
      templateType: 'confirmacion',
      variables: {
        clientName: client.name,
        orderDescription: order.description
      }
    };

    console.log('   Datos WhatsApp:', whatsappData);

    const whatsappResponse = await fetch(`${baseUrl}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(whatsappData)
    });

    console.log(`   Status WhatsApp: ${whatsappResponse.status}`);

    if (whatsappResponse.ok) {
      const whatsappResult = await whatsappResponse.json();
      console.log('✅ Mensaje WhatsApp enviado:');
      console.log(`   - Message ID: ${whatsappResult.messageId}`);
      console.log(`   - Status: ${whatsappResult.status}`);
      console.log(`   - Provider ID: ${whatsappResult.providerMessageId}`);
    } else {
      const errorData = await whatsappResponse.json();
      console.log('❌ Error enviando WhatsApp:');
      console.log(`   - Error: ${errorData.message}`);
      console.log(`   - Code: ${errorData.code}`);
    }

    // 6. Probar envío de mensaje Email (simulado)
    console.log('\n📧 Probando envío de mensaje Email...');
    
    const emailData = {
      clientId: client.id,
      orderId: order.id,
      channel: 'email',
      templateType: 'confirmacion',
      subject: 'Confirmación de tu pedido - {clientName}',
      variables: {
        clientName: client.name,
        orderDescription: order.description
      }
    };

    console.log('   Datos Email:', emailData);

    const emailResponse = await fetch(`${baseUrl}/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    console.log(`   Status Email: ${emailResponse.status}`);

    if (emailResponse.ok) {
      const emailResult = await emailResponse.json();
      console.log('✅ Mensaje Email enviado:');
      console.log(`   - Message ID: ${emailResult.messageId}`);
      console.log(`   - Status: ${emailResult.status}`);
      console.log(`   - Provider ID: ${emailResult.providerMessageId}`);
    } else {
      const errorData = await emailResponse.json();
      console.log('❌ Error enviando Email:');
      console.log(`   - Error: ${errorData.message}`);
      console.log(`   - Code: ${errorData.code}`);
    }

    // 7. Probar historial de mensajes
    console.log('\n📋 Probando historial de mensajes...');
    const historyResponse = await fetch(`${baseUrl}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ Historial obtenido:');
      console.log(`   - Total mensajes: ${historyData.total}`);
      console.log(`   - Mensajes en respuesta: ${historyData.messages.length}`);
      
      if (historyData.messages.length > 0) {
        const lastMessage = historyData.messages[0];
        console.log(`   - Último mensaje: ${lastMessage.channel} - ${lastMessage.status}`);
      }
    } else {
      console.log('❌ Error obteniendo historial');
    }

    // 8. Probar webhook de Twilio (simulado)
    console.log('\n🔔 Probando webhook de Twilio...');
    const webhookData = {
      EventType: 'message-status',
      MessageSid: 'test-message-sid-123',
      MessageStatus: 'delivered'
    };

    const webhookResponse = await fetch(`${baseUrl}/webhooks/twilio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(webhookData)
    });

    console.log(`   Status Webhook: ${webhookResponse.status}`);

    if (webhookResponse.ok) {
      const webhookResult = await webhookResponse.json();
      console.log('✅ Webhook procesado:');
      console.log(`   - Success: ${webhookResult.success}`);
      console.log(`   - Message: ${webhookResult.message}`);
    } else {
      console.log('❌ Error procesando webhook');
    }

    console.log('\n🎉 Prueba de integración completada');

  } catch (error) {
    console.error('❌ Error en prueba de integración:', error.message);
  }
}

// Ejecutar prueba
testTwilioIntegration()
  .then(() => {
    console.log('\n🎉 Prueba finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en prueba:', error);
    process.exit(1);
  });

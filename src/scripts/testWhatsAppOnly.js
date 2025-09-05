const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script para probar solo la funcionalidad de WhatsApp
 */
async function testWhatsAppOnly() {
  try {
    console.log('📱 Probando funcionalidad de WhatsApp...\n');

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

    // 2. Verificar configuración de Twilio
    console.log('\n🔧 Verificando configuración de Twilio...');
    
    // Probar endpoint de health para ver si el servidor está funcionando
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.ok) {
      console.log('✅ Servidor funcionando correctamente');
    } else {
      console.log('❌ Servidor no responde');
      return;
    }

    // 3. Obtener clientes
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
    console.log(`   - Teléfono: ${client.phone}`);

    // 4. Obtener pedidos
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

    // 5. Probar templates disponibles
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

    // 6. Probar envío de mensaje WhatsApp
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
      
      if (whatsappResult.providerMessageId) {
        console.log('🎉 ¡Mensaje enviado exitosamente a Twilio!');
        console.log('📱 Revisa tu WhatsApp para ver el mensaje');
      }
    } else {
      const errorData = await whatsappResponse.json();
      console.log('❌ Error enviando WhatsApp:');
      console.log(`   - Error: ${errorData.message}`);
      console.log(`   - Code: ${errorData.code}`);
      
      if (errorData.code === 'TWILIO_NOT_CONFIGURED') {
        console.log('\n🔧 CONFIGURACIÓN REQUERIDA:');
        console.log('   1. Ve a Railway → Variables');
        console.log('   2. Agrega TWILIO_ACCOUNT_SID');
        console.log('   3. Agrega TWILIO_AUTH_TOKEN');
        console.log('   4. Agrega TWILIO_WHATSAPP_NUMBER');
        console.log('   5. Reinicia el servicio');
      }
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
        console.log(`   - Texto: ${lastMessage.text}`);
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

    console.log('\n🎉 Prueba de WhatsApp completada');

  } catch (error) {
    console.error('❌ Error en prueba de WhatsApp:', error.message);
  }
}

// Ejecutar prueba
testWhatsAppOnly()
  .then(() => {
    console.log('\n🎉 Prueba finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en prueba:', error);
    process.exit(1);
  });

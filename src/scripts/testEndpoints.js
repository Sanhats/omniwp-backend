const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

/**
 * Script para probar endpoints específicos
 */
async function testEndpoints() {
  try {
    console.log('🧪 Probando endpoints específicos...\n');

    const baseUrl = 'https://omniwp-backend-production.up.railway.app/api/v1';
    
    // 1. Health check
    console.log('🏥 1. Health Check');
    try {
      const healthResponse = await fetch(`${baseUrl}/health`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('✅ Health check OK:', healthData.status);
      } else {
        console.log('❌ Health check failed:', healthResponse.status);
      }
    } catch (error) {
      console.log('❌ Health check error:', error.message);
    }

    // 2. Login
    console.log('\n🔐 2. Login');
    let token = null;
    try {
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

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        token = loginData.token;
        console.log('✅ Login OK');
      } else {
        console.log('❌ Login failed:', loginResponse.status);
      }
    } catch (error) {
      console.log('❌ Login error:', error.message);
    }

    if (!token) {
      console.log('❌ No token, saltando pruebas autenticadas');
      return;
    }

    // 3. Probar templates
    console.log('\n📝 3. Templates');
    try {
      const templatesResponse = await fetch(`${baseUrl}/messages/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`   Status: ${templatesResponse.status}`);
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        console.log('✅ Templates OK:', templatesData.templates?.length || 0, 'templates');
      } else {
        const errorData = await templatesResponse.json();
        console.log('❌ Templates failed:', errorData.message || errorData);
      }
    } catch (error) {
      console.log('❌ Templates error:', error.message);
    }

    // 4. Probar config status
    console.log('\n🔧 4. Config Status');
    try {
      const configResponse = await fetch(`${baseUrl}/messages/config/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log(`   Status: ${configResponse.status}`);
      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('✅ Config OK:', configData.config?.isConfigured ? 'Configurado' : 'No configurado');
      } else {
        const errorData = await configResponse.json();
        console.log('❌ Config failed:', errorData.message || errorData);
      }
    } catch (error) {
      console.log('❌ Config error:', error.message);
    }

    // 5. Probar send message
    console.log('\n📱 5. Send Message');
    try {
      const sendResponse = await fetch(`${baseUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: '68bb4c4a53e1967513ced420',
          orderId: '68bb4c5b53e1967513ced421',
          channel: 'whatsapp',
          templateType: 'confirmacion'
        })
      });

      console.log(`   Status: ${sendResponse.status}`);
      if (sendResponse.ok) {
        const sendData = await sendResponse.json();
        console.log('✅ Send OK:', sendData.messageId);
      } else {
        const errorData = await sendResponse.json();
        console.log('❌ Send failed:', errorData.message || errorData);
      }
    } catch (error) {
      console.log('❌ Send error:', error.message);
    }

    // 6. Probar webhook
    console.log('\n🔔 6. Webhook');
    try {
      const webhookResponse = await fetch(`${baseUrl}/webhooks/twilio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          EventType: 'message-status',
          MessageSid: 'test-123',
          MessageStatus: 'delivered'
        })
      });

      console.log(`   Status: ${webhookResponse.status}`);
      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('✅ Webhook OK:', webhookData.message);
      } else {
        const errorData = await webhookResponse.json();
        console.log('❌ Webhook failed:', errorData.message || errorData);
      }
    } catch (error) {
      console.log('❌ Webhook error:', error.message);
    }

    console.log('\n🎉 Prueba de endpoints completada');

  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
  }
}

// Ejecutar prueba
testEndpoints()
  .then(() => {
    console.log('\n🎉 Prueba finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en prueba:', error);
    process.exit(1);
  });

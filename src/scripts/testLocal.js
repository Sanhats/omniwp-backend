const { PrismaClient } = require('@prisma/client');
const MessageService = require('../services/messageService');
const config = require('../config');

/**
 * Script para probar localmente
 */
async function testLocal() {
  try {
    console.log('🧪 Probando localmente...\n');

    // 1. Verificar configuración
    console.log('🔧 Configuración:');
    console.log('   - TWILIO_ACCOUNT_SID:', config.twilio.accountSid ? '✅ Configurado' : '❌ No configurado');
    console.log('   - TWILIO_AUTH_TOKEN:', config.twilio.authToken ? '✅ Configurado' : '❌ No configurado');
    console.log('   - TWILIO_WHATSAPP_NUMBER:', config.twilio.whatsappNumber);
    console.log('   - TWILIO_WEBHOOK_SECRET:', config.twilio.webhookSecret ? '✅ Configurado' : '❌ No configurado');

    // 2. Probar templates
    console.log('\n📝 Templates:');
    const templates = config.templates;
    Object.entries(templates).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value}`);
    });

    // 3. Probar extractPlaceholders
    console.log('\n🔍 Probando extractPlaceholders:');
    const testTemplate = "Hola {clientName}, tu pedido '{orderDescription}' está confirmado 🚀";
    const placeholders = extractPlaceholders(testTemplate);
    console.log(`   - Template: ${testTemplate}`);
    console.log(`   - Placeholders: ${JSON.stringify(placeholders)}`);

    // 4. Probar MessageService
    console.log('\n📤 Probando MessageService:');
    const messageService = new MessageService();
    
    // Simular envío de mensaje
    try {
      const result = await messageService.sendMessage({
        userId: 'test-user-id',
        clientId: 'test-client-id',
        orderId: 'test-order-id',
        channel: 'whatsapp',
        templateType: 'confirmacion',
        variables: {
          clientName: 'Juan',
          orderDescription: 'Pedido de prueba'
        }
      });
      console.log('   - Resultado:', result);
    } catch (error) {
      console.log('   - Error esperado (sin credenciales):', error.message);
    }

    console.log('\n✅ Prueba local completada');

  } catch (error) {
    console.error('❌ Error en prueba local:', error.message);
  }
}

/**
 * Extraer placeholders de un template
 */
function extractPlaceholders(template) {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  
  return matches.map(match => match.slice(1, -1)); // Remover { y }
}

// Ejecutar prueba
testLocal()
  .then(() => {
    console.log('\n🎉 Prueba finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en prueba:', error);
    process.exit(1);
  });

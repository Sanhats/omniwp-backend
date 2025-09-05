const { PrismaClient } = require('@prisma/client');
const TwilioWhatsAppProvider = require('../services/twilioWhatsAppProvider');
const config = require('../config');

const prisma = new PrismaClient();

/**
 * Script para debuggear el envío de WhatsApp
 */
async function debugWhatsApp() {
  try {
    console.log('🔍 Debuggeando envío de WhatsApp...\n');

    // 1. Verificar configuración
    console.log('🔧 1. Configuración de Twilio:');
    console.log(`   - Account SID: ${config.twilio.accountSid ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`   - Auth Token: ${config.twilio.authToken ? '✅ Configurado' : '❌ No configurado'}`);
    console.log(`   - WhatsApp Number: ${config.twilio.whatsappNumber}`);
    console.log(`   - Webhook Secret: ${config.twilio.webhookSecret ? '✅ Configurado' : '❌ No configurado'}`);

    // 2. Verificar cliente
    console.log('\n👤 2. Cliente:');
    const client = await prisma.client.findFirst({
      where: {
        name: 'Lourdes Gabriela Rocha'
      }
    });

    if (client) {
      console.log(`   - Nombre: ${client.name}`);
      console.log(`   - Teléfono: ${client.phone}`);
      console.log(`   - ID: ${client.id}`);
    } else {
      console.log('   ❌ Cliente no encontrado');
      return;
    }

    // 3. Verificar pedido
    console.log('\n📦 3. Pedido:');
    const order = await prisma.order.findFirst({
      where: {
        description: 'Turno para corte de uñas'
      }
    });

    if (order) {
      console.log(`   - Descripción: ${order.description}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - ID: ${order.id}`);
    } else {
      console.log('   ❌ Pedido no encontrado');
      return;
    }

    // 4. Probar TwilioWhatsAppProvider directamente
    console.log('\n📱 4. Probando TwilioWhatsAppProvider:');
    const whatsappProvider = new TwilioWhatsAppProvider();
    
    console.log(`   - Configurado: ${whatsappProvider.isConfigured()}`);
    
    if (whatsappProvider.isConfigured()) {
      try {
        // Probar formato de número
        const formattedNumber = whatsappProvider.formatWhatsAppNumber(client.phone);
        console.log(`   - Número formateado: ${formattedNumber}`);

        // Probar template
        const template = config.templates.confirmacion;
        console.log(`   - Template: ${template}`);

        // Probar reemplazo de placeholders
        const message = whatsappProvider.replacePlaceholders(template, {
          clientName: client.name,
          orderDescription: order.description
        });
        console.log(`   - Mensaje final: ${message}`);

        // Intentar envío real
        console.log('\n📤 5. Intentando envío real...');
        const result = await whatsappProvider.sendTemplateMessage(
          formattedNumber,
          template,
          {
            clientName: client.name,
            orderDescription: order.description
          }
        );

        console.log('   - Resultado:', result);

      } catch (error) {
        console.log(`   ❌ Error en envío: ${error.message}`);
        console.log(`   - Código: ${error.code || 'N/A'}`);
        console.log(`   - Stack: ${error.stack}`);
      }
    } else {
      console.log('   ❌ TwilioWhatsAppProvider no configurado');
    }

    console.log('\n🎉 Debug completado');

  } catch (error) {
    console.error('❌ Error en debug:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar debug
debugWhatsApp()
  .then(() => {
    console.log('\n🎉 Debug finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en debug:', error);
    process.exit(1);
  });

/**
 * Script para debugging de conexión WhatsApp
 * Ayuda a identificar problemas comunes de conexión
 */

const { PrismaClient } = require('@prisma/client');
const WhatsAppWebService = require('../services/whatsappWebService');

const prisma = new PrismaClient();

async function debugWhatsAppConnection() {
  console.log('🔍 Iniciando debugging de conexión WhatsApp...\n');

  try {
    // 1. Verificar configuración del entorno
    console.log('📋 1. Verificando configuración del entorno:');
    console.log(`   - Node.js: ${process.version}`);
    console.log(`   - Plataforma: ${process.platform}`);
    console.log(`   - Redis URL: ${process.env.REDIS_URL ? 'Configurado' : 'No configurado'}`);
    console.log(`   - WhatsApp Web habilitado: ${process.env.WHATSAPP_WEB_ENABLED || 'No configurado'}`);
    console.log('');

    // 2. Verificar conexión a Redis
    console.log('📋 2. Verificando conexión a Redis:');
    const whatsappService = new WhatsAppWebService();
    await whatsappService.initialize();
    
    if (whatsappService.redisService.isReady()) {
      console.log('   ✅ Redis conectado correctamente');
    } else {
      console.log('   ⚠️ Redis no disponible, usando almacenamiento en memoria');
    }
    console.log('');

    // 3. Verificar usuarios en la base de datos
    console.log('📋 3. Verificando usuarios en la base de datos:');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    console.log(`   - Total de usuarios: ${users.length}`);
    if (users.length > 0) {
      console.log(`   - Primer usuario: ${users[0].email} (ID: ${users[0].id})`);
    }
    console.log('');

    // 4. Simular creación de sesión
    if (users.length > 0) {
      const testUserId = users[0].id;
      console.log(`📋 4. Simulando creación de sesión para usuario: ${testUserId}`);
      
      try {
        const result = await whatsappService.createSession(testUserId);
        console.log(`   ✅ Sesión creada: ${result.success ? 'Éxito' : 'Error'}`);
        console.log(`   - Estado: ${result.status}`);
        console.log(`   - Mensaje: ${result.message}`);
        
        // Esperar un poco para ver si se genera QR
        console.log('   ⏳ Esperando generación de QR (10 segundos)...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const qrCode = await whatsappService.getQRCode(testUserId);
        if (qrCode) {
          console.log('   ✅ QR generado correctamente');
        } else {
          console.log('   ⚠️ QR no generado aún');
        }
        
        const status = await whatsappService.getConnectionStatus(testUserId);
        console.log(`   - Estado actual: ${status.status}`);
        console.log(`   - Conectado: ${status.connected}`);
        
      } catch (error) {
        console.log(`   ❌ Error creando sesión: ${error.message}`);
      }
    }
    console.log('');

    // 5. Verificar configuración de Puppeteer
    console.log('📋 5. Verificando configuración de Puppeteer:');
    const puppeteerArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ];
    console.log('   - Argumentos de Puppeteer configurados:');
    puppeteerArgs.forEach(arg => console.log(`     ${arg}`));
    console.log('');

    // 6. Recomendaciones
    console.log('📋 6. Recomendaciones para problemas comunes:');
    console.log('   🔧 Si el QR no se genera:');
    console.log('     - Verifica que Redis esté funcionando');
    console.log('     - Asegúrate de que el servidor tenga acceso a internet');
    console.log('     - Revisa los logs del servidor para errores de Puppeteer');
    console.log('');
    console.log('   🔧 Si el QR se genera pero no se puede escanear:');
    console.log('     - El QR expira en 2 minutos, genera uno nuevo');
    console.log('     - Asegúrate de que tu teléfono tenga conexión a internet');
    console.log('     - Verifica que WhatsApp esté actualizado en tu teléfono');
    console.log('');
    console.log('   🔧 Si aparece "no se pudo vincular el dispositivo":');
    console.log('     - Intenta desconectar todas las sesiones de WhatsApp Web en tu teléfono');
    console.log('     - Reinicia la aplicación de WhatsApp en tu teléfono');
    console.log('     - Espera unos minutos y vuelve a intentar');
    console.log('     - Verifica que no tengas muchas sesiones activas de WhatsApp Web');
    console.log('');

  } catch (error) {
    console.error('❌ Error durante el debugging:', error);
  } finally {
    await prisma.$disconnect();
    console.log('✅ Debugging completado');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugWhatsAppConnection().catch(console.error);
}

module.exports = { debugWhatsAppConnection };

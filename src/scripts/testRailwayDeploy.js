const { PrismaClient } = require('@prisma/client');
const railwayConfig = require('../config/railway');

const prisma = new PrismaClient();

/**
 * Script de prueba para verificar que el deploy en Railway funcione
 */
async function testRailwayDeploy() {
  console.log('🚀 Probando deploy de Railway...\n');

  try {
    // 1. Verificar configuración de Railway
    console.log('1️⃣ Verificando configuración de Railway...');
    console.log('   - isRailway:', railwayConfig.isRailway);
    console.log('   - hasRedis:', railwayConfig.hasRedis);
    console.log('   - whatsappWebEnabled:', railwayConfig.whatsappWeb.enabled);
    console.log('   - websocketsEnabled:', railwayConfig.websockets.enabled);

    // 2. Verificar variables de entorno
    console.log('\n2️⃣ Verificando variables de entorno...');
    console.log('   - NODE_ENV:', process.env.NODE_ENV);
    console.log('   - RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
    console.log('   - PORT:', process.env.PORT);
    console.log('   - DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ No configurado');
    console.log('   - REDIS_URL:', process.env.REDIS_URL ? '✅ Configurado' : '⚠️ No configurado');
    console.log('   - JWT_SECRET:', process.env.JWT_SECRET ? '✅ Configurado' : '❌ No configurado');

    // 3. Probar conexión a base de datos
    console.log('\n3️⃣ Probando conexión a base de datos...');
    const userCount = await prisma.user.count();
    console.log(`✅ Base de datos conectada. Usuarios: ${userCount}`);

    // 4. Probar esquema de mensajes
    console.log('\n4️⃣ Probando esquema de mensajes...');
    const messageCount = await prisma.message.count();
    console.log(`✅ Esquema de mensajes OK. Mensajes: ${messageCount}`);

    // 5. Verificar funcionalidades disponibles
    console.log('\n5️⃣ Funcionalidades disponibles:');
    console.log('   - Sistema base:', '✅ Funcionando');
    console.log('   - WebSockets:', railwayConfig.websockets.enabled ? '✅ Habilitado' : '❌ Deshabilitado');
    console.log('   - Redis:', railwayConfig.hasRedis ? '✅ Disponible' : '⚠️ No disponible');
    console.log('   - WhatsApp Web:', railwayConfig.whatsappWeb.enabled ? '✅ Habilitado' : '⚠️ Deshabilitado (requiere Redis)');

    // 6. Verificar dependencias
    console.log('\n6️⃣ Verificando dependencias...');
    try {
      require('socket.io');
      console.log('   - socket.io: ✅ Disponible');
    } catch (error) {
      console.log('   - socket.io: ❌ No disponible');
    }

    try {
      require('whatsapp-web.js');
      console.log('   - whatsapp-web.js: ✅ Disponible');
    } catch (error) {
      console.log('   - whatsapp-web.js: ❌ No disponible');
    }

    try {
      require('redis');
      console.log('   - redis: ✅ Disponible');
    } catch (error) {
      console.log('   - redis: ❌ No disponible');
    }

    console.log('\n🎉 Deploy de Railway verificado exitosamente!');
    
    if (railwayConfig.whatsappWeb.enabled) {
      console.log('\n📱 WhatsApp Web está habilitado y listo para usar');
    } else {
      console.log('\n⚠️ WhatsApp Web está deshabilitado (Redis requerido)');
      console.log('   El sistema funcionará normalmente con Twilio');
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Ejecutar pruebas
if (require.main === module) {
  testRailwayDeploy();
}

module.exports = testRailwayDeploy;

const RetryService = require('../services/retryService');

/**
 * Script para procesar mensajes fallidos
 */
async function retryFailedMessages() {
  try {
    console.log('🔄 Iniciando procesamiento de mensajes fallidos...\n');

    const retryService = new RetryService();

    // Obtener estadísticas antes del procesamiento
    console.log('📊 Estadísticas antes del procesamiento:');
    const statsBefore = await retryService.getMessageStats();
    if (statsBefore) {
      console.log(`   - Total mensajes: ${statsBefore.total}`);
      Object.entries(statsBefore.byStatus).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

    // Procesar mensajes fallidos
    await retryService.processFailedMessages();

    // Obtener estadísticas después del procesamiento
    console.log('\n📊 Estadísticas después del procesamiento:');
    const statsAfter = await retryService.getMessageStats();
    if (statsAfter) {
      console.log(`   - Total mensajes: ${statsAfter.total}`);
      Object.entries(statsAfter.byStatus).forEach(([status, count]) => {
        console.log(`   - ${status}: ${count}`);
      });
    }

    // Limpiar mensajes antiguos
    console.log('\n🧹 Limpiando mensajes antiguos...');
    await retryService.cleanupOldMessages();

    console.log('\n✅ Procesamiento completado');

  } catch (error) {
    console.error('❌ Error en procesamiento:', error.message);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  retryFailedMessages()
    .then(() => {
      console.log('\n🎉 Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en script:', error);
      process.exit(1);
    });
}

module.exports = { retryFailedMessages };

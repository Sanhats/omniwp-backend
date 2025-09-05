const { PrismaClient } = require('@prisma/client');
const MessageService = require('./messageService');

const prisma = new PrismaClient();
const messageService = new MessageService();

/**
 * Servicio para manejo de reintentos de mensajes fallidos
 */
class RetryService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 segundos
  }

  /**
   * Procesar mensajes fallidos para reintento
   */
  async processFailedMessages() {
    try {
      console.log('🔄 Procesando mensajes fallidos...');

      // Buscar mensajes fallidos que no han excedido el máximo de reintentos
      const failedMessages = await prisma.message.findMany({
        where: {
          status: 'failed',
          errorCode: {
            not: 'MAX_RETRIES_EXCEEDED'
          }
        },
        include: {
          client: true,
          order: true
        },
        take: 10 // Procesar máximo 10 mensajes por vez
      });

      console.log(`📋 Encontrados ${failedMessages.length} mensajes fallidos`);

      for (const message of failedMessages) {
        await this.retryMessage(message);
      }

      console.log('✅ Procesamiento de mensajes fallidos completado');

    } catch (error) {
      console.error('❌ Error procesando mensajes fallidos:', error.message);
    }
  }

  /**
   * Reintentar un mensaje específico
   * @param {Object} message - Mensaje a reintentar
   */
  async retryMessage(message) {
    try {
      console.log(`🔄 Reintentando mensaje ${message.id}...`);

      // Incrementar contador de reintentos
      const retryCount = (message.variables?.retryCount || 0) + 1;
      
      if (retryCount > this.maxRetries) {
        console.log(`❌ Mensaje ${message.id} excedió máximo de reintentos`);
        
        await prisma.message.update({
          where: { id: message.id },
          data: {
            status: 'failed',
            errorCode: 'MAX_RETRIES_EXCEEDED',
            errorMessage: 'Máximo de reintentos excedido',
            variables: {
              ...message.variables,
              retryCount,
              lastRetryAt: new Date().toISOString()
            }
          }
        });
        
        return;
      }

      // Actualizar variables con contador de reintentos
      const updatedVariables = {
        ...message.variables,
        retryCount,
        lastRetryAt: new Date().toISOString()
      };

      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'queued',
          variables: updatedVariables
        }
      });

      // Esperar un poco antes del reintento
      await this.delay(this.retryDelay * retryCount);

      // Reintentar envío
      const result = await messageService.sendMessage({
        userId: message.userId,
        clientId: message.clientId,
        orderId: message.orderId,
        channel: message.channel,
        templateType: message.templateType,
        variables: message.variables,
        subject: message.subject,
        messageId: message.id // Pasar ID para actualizar el mensaje existente
      });

      if (result.success) {
        console.log(`✅ Mensaje ${message.id} reenviado exitosamente`);
      } else {
        console.log(`❌ Mensaje ${message.id} falló en reintento: ${result.error}`);
      }

    } catch (error) {
      console.error(`❌ Error reintentando mensaje ${message.id}:`, error.message);
      
      // Marcar como fallido con error de reintento
      await prisma.message.update({
        where: { id: message.id },
        data: {
          status: 'failed',
          errorCode: 'RETRY_ERROR',
          errorMessage: error.message,
          variables: {
            ...message.variables,
            retryCount: (message.variables?.retryCount || 0) + 1,
            lastRetryAt: new Date().toISOString()
          }
        }
      });
    }
  }

  /**
   * Obtener estadísticas de mensajes
   */
  async getMessageStats(userId = null) {
    try {
      const where = userId ? { userId } : {};

      const stats = await prisma.message.groupBy({
        by: ['status'],
        where,
        _count: {
          status: true
        }
      });

      const totalMessages = await prisma.message.count({ where });

      return {
        total: totalMessages,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {})
      };

    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error.message);
      return null;
    }
  }

  /**
   * Limpiar mensajes antiguos (más de 30 días)
   */
  async cleanupOldMessages() {
    try {
      console.log('🧹 Limpiando mensajes antiguos...');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedCount = await prisma.message.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          status: {
            in: ['delivered', 'read', 'failed']
          }
        }
      });

      console.log(`✅ Eliminados ${deletedCount.count} mensajes antiguos`);

    } catch (error) {
      console.error('❌ Error limpiando mensajes antiguos:', error.message);
    }
  }

  /**
   * Delay helper
   * @param {number} ms - Milisegundos a esperar
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RetryService;

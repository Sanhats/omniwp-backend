const crypto = require('crypto');
const MessageService = require('../services/messageService');
const config = require('../config');

const messageService = new MessageService();

/**
 * Validar firma de webhook de Twilio
 * @param {string} signature - Firma del webhook
 * @param {string} url - URL del webhook
 * @param {Object} params - Parámetros del webhook
 * @returns {boolean} - Si la firma es válida
 */
function validateTwilioSignature(signature, url, params) {
  try {
    if (!config.twilio.webhookSecret) {
      console.warn('⚠️ TWILIO_WEBHOOK_SECRET no configurado, saltando validación');
      return true; // En desarrollo, permitir sin validación
    }

    // Crear string de parámetros ordenados
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');

    // Crear string a firmar
    const stringToSign = url + sortedParams;

    // Calcular HMAC
    const hmac = crypto.createHmac('sha1', config.twilio.webhookSecret);
    hmac.update(stringToSign, 'utf8');
    const computedSignature = hmac.digest('base64');

    // Comparar firmas
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(computedSignature, 'base64')
    );

  } catch (error) {
    console.error('❌ Error validando firma de Twilio:', error.message);
    return false;
  }
}

/**
 * Procesar webhook de Twilio
 */
const processTwilioWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const params = req.body;

    console.log('🔔 Webhook de Twilio recibido:');
    console.log('   - Signature:', signature);
    console.log('   - URL:', url);
    console.log('   - EventType:', params.EventType);
    console.log('   - MessageSid:', params.MessageSid);
    console.log('   - MessageStatus:', params.MessageStatus);

    // Validar firma
    if (!validateTwilioSignature(signature, url, params)) {
      console.error('❌ Firma de webhook inválida');
      return res.status(403).json({
        error: true,
        message: 'Firma de webhook inválida',
        code: 'INVALID_SIGNATURE'
      });
    }

    // Procesar según el tipo de evento
    const eventType = params.EventType;
    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus;

    if (eventType === 'message-status' && messageSid) {
      // Mapear status de Twilio a nuestros status
      let status;
      switch (messageStatus) {
        case 'sent':
          status = 'sent';
          break;
        case 'delivered':
          status = 'delivered';
          break;
        case 'read':
          status = 'read';
          break;
        case 'failed':
        case 'undelivered':
          status = 'failed';
          break;
        default:
          status = 'sent'; // Status desconocido, asumir sent
      }

      // Actualizar mensaje en la base de datos
      try {
        await messageService.updateMessageStatus(
          messageSid,
          status,
          params.ErrorCode || null,
          params.ErrorMessage || null
        );

        console.log('✅ Status actualizado:', {
          messageSid,
          status,
          errorCode: params.ErrorCode,
          errorMessage: params.ErrorMessage
        });

      } catch (error) {
        console.error('❌ Error actualizando status:', error.message);
        // No fallar el webhook por esto
      }
    }

    // Responder a Twilio
    res.status(200).json({
      success: true,
      message: 'Webhook procesado correctamente'
    });

  } catch (error) {
    console.error('❌ Error procesando webhook de Twilio:', error.message);
    next(error);
  }
};

/**
 * Endpoint de prueba para webhooks
 */
const testWebhook = async (req, res, next) => {
  try {
    console.log('🧪 Test webhook recibido:');
    console.log('   - Headers:', req.headers);
    console.log('   - Body:', req.body);

    res.status(200).json({
      success: true,
      message: 'Test webhook funcionando',
      timestamp: new Date().toISOString(),
      headers: req.headers,
      body: req.body
    });

  } catch (error) {
    console.error('❌ Error en test webhook:', error.message);
    next(error);
  }
};

module.exports = {
  processTwilioWebhook,
  testWebhook
};

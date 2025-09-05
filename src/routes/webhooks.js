const express = require('express');
const { processTwilioWebhook, testWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Middleware para parsear form data (Twilio envía form-encoded)
router.use(express.urlencoded({ extended: true }));

// POST /webhooks/twilio - Webhook de Twilio
router.post('/twilio', processTwilioWebhook);

// POST /webhooks/test - Test webhook
router.post('/test', testWebhook);

module.exports = router;

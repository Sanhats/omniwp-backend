# 🔧 Configuración de Twilio WhatsApp

## 📋 Variables de Entorno Requeridas

Configura estas variables en Railway:

```bash
# Twilio WhatsApp (REQUERIDAS)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
TWILIO_WEBHOOK_SECRET="your_webhook_secret_here"

# SendGrid (OPCIONAL - para más adelante)
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL=""
SENDGRID_FROM_NAME=""

# Rate Limiting (OPCIONAL - usar defaults)
MESSAGE_RATE_LIMIT_WHATSAPP=10
MESSAGE_RATE_LIMIT_EMAIL=30
MESSAGE_RATE_LIMIT_GENERAL=100
```

## 🚀 Pasos para Configurar

### 1. Obtener Credenciales de Twilio
1. Ve a [console.twilio.com](https://console.twilio.com)
2. En el dashboard principal, copia:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: Haz clic en "Show" para verlo

### 2. Configurar WhatsApp Sandbox
1. Ve a **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Activa el sandbox
3. Anota el número: `whatsapp:+14155238886`
4. Conecta tu WhatsApp personal con el código que te den

### 3. Configurar Webhook
1. En la configuración del sandbox, busca **"Webhook URL"**
2. Configura: `https://omniwp-backend-production.up.railway.app/api/v1/webhooks/twilio`
3. Copia el **Webhook Secret** que te muestre

### 4. Configurar en Railway
1. Ve a tu proyecto en Railway
2. Ve a **Variables**
3. Agrega cada variable de entorno
4. Reinicia el servicio

## 🧪 Probar Configuración

Una vez configurado, ejecuta:

```bash
npm run test-twilio
```

Esto probará:
- ✅ Login y autenticación
- ✅ Obtención de clientes y pedidos
- ✅ Envío de mensaje WhatsApp
- ✅ Webhook de Twilio

## 📱 Conectar WhatsApp Personal

1. Envía un mensaje de WhatsApp al número sandbox: `+14155238886`
2. Envía el código que te den en la consola
3. ¡Listo! Tu WhatsApp estará conectado al sandbox

## 🔍 Verificar Logs

Revisa los logs de Railway para ver:
- ✅ "WhatsApp enviado exitosamente"
- ✅ "Webhook procesado correctamente"
- ❌ Cualquier error de configuración

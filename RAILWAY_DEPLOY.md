# 🚀 Deploy en Railway - OmniWP Backend

## ✅ Problema Resuelto

El error `Cannot find module 'socket.io'` se ha solucionado agregando las dependencias faltantes al `package.json` y haciendo el código más robusto para el entorno de producción.

## 🔧 Cambios Realizados

### 1. **Dependencias Agregadas** ✅
```json
{
  "whatsapp-web.js": "^1.23.0",
  "qrcode-terminal": "^0.12.0",
  "redis": "^4.6.0",
  "socket.io": "^4.7.0"
}
```

### 2. **Fallback para Redis** ✅
- El servicio de Redis ahora tiene fallback a almacenamiento en memoria
- El sistema funciona sin Redis (modo limitado)
- WhatsApp Web se deshabilita automáticamente si no hay Redis

### 3. **Configuración de Railway** ✅
- Archivo `src/config/railway.js` para configuración específica
- Detección automática del entorno Railway
- Configuración optimizada de Puppeteer para Railway

### 4. **Endpoints de Disponibilidad** ✅
- `GET /api/v1/whatsapp/availability` - Verificar qué funcionalidades están disponibles
- Middleware que deshabilita WhatsApp Web si no hay Redis

## 🚀 Deploy en Railway

### Variables de Entorno Requeridas

```env
# Base de datos (requerido)
DATABASE_URL="mongodb+srv://..."

# JWT (requerido)
JWT_SECRET="tu-secreto-jwt"

# Redis (opcional - para WhatsApp Web)
REDIS_URL="redis://..."

# WhatsApp Web (opcional)
WHATSAPP_WEB_ENABLED=true
WHATSAPP_SESSION_PATH="./sessions"
```

### Variables Opcionales

```env
# Twilio (para WhatsApp tradicional)
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"

# SendGrid (para emails)
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="noreply@omniwp.com"

# Rate Limiting
MESSAGE_RATE_LIMIT_WHATSAPP=10
MESSAGE_RATE_LIMIT_EMAIL=30
MESSAGE_RATE_LIMIT_GENERAL=100
```

## 📊 Estados del Sistema

### Con Redis Configurado
- ✅ WhatsApp Web habilitado
- ✅ Sesiones persistentes
- ✅ WebSockets funcionando
- ✅ Todas las funcionalidades disponibles

### Sin Redis (Modo Limitado)
- ⚠️ WhatsApp Web deshabilitado
- ✅ WebSockets funcionando
- ✅ Sistema básico funcionando
- ✅ Fallback a Twilio para mensajes

## 🔍 Verificar Estado

### Endpoint de Disponibilidad
```bash
GET /api/v1/whatsapp/availability
```

**Respuesta con Redis:**
```json
{
  "success": true,
  "whatsappWeb": {
    "enabled": true,
    "hasRedis": true,
    "isRailway": true,
    "reason": "WhatsApp Web está disponible"
  },
  "features": {
    "websockets": true,
    "redis": true,
    "whatsappWeb": true
  }
}
```

**Respuesta sin Redis:**
```json
{
  "success": true,
  "whatsappWeb": {
    "enabled": false,
    "hasRedis": false,
    "isRailway": true,
    "reason": "WhatsApp Web no está disponible (Redis requerido)"
  },
  "features": {
    "websockets": true,
    "redis": false,
    "whatsappWeb": false
  }
}
```

## 🛠️ Configuración de Redis en Railway

### Opción 1: Redis Upstash (Recomendado)
1. Ir a Railway Dashboard
2. Crear nuevo servicio "Database"
3. Seleccionar "Redis"
4. Copiar la URL de conexión
5. Agregar como variable de entorno `REDIS_URL`

### Opción 2: Redis Externo
1. Usar Redis Cloud, AWS ElastiCache, etc.
2. Agregar URL como variable de entorno `REDIS_URL`

### Opción 3: Sin Redis
- El sistema funcionará en modo limitado
- WhatsApp Web estará deshabilitado
- Todas las demás funcionalidades funcionarán normalmente

## 📱 Funcionalidades por Configuración

### Con Redis + WhatsApp Web
- ✅ Envío de mensajes desde número real del usuario
- ✅ Recepción de mensajes en tiempo real
- ✅ Sesiones persistentes
- ✅ WebSockets para sincronización
- ✅ Fallback a Twilio si es necesario

### Sin Redis (Solo Twilio)
- ✅ Envío de mensajes via Twilio
- ✅ WebSockets básicos
- ✅ Todas las funcionalidades del sistema base
- ❌ WhatsApp Web deshabilitado

## 🚨 Notas Importantes

1. **WhatsApp Web requiere Redis** para funcionar correctamente
2. **Sin Redis**, el sistema funciona normalmente pero sin WhatsApp Web
3. **WebSockets funcionan** independientemente de Redis
4. **El sistema es robusto** y no falla si faltan servicios opcionales

## 🎉 ¡Deploy Listo!

El sistema ahora es completamente compatible con Railway y maneja graciosamente la ausencia de servicios opcionales como Redis. El deploy debería funcionar sin problemas.

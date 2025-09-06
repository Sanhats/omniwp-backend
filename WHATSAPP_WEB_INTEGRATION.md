# Integración WhatsApp Web - OmniWP Backend

## 📋 Resumen

Esta implementación permite que cada usuario de OmniWP conecte su propio número de WhatsApp al sistema usando WhatsApp Web, para enviar y recibir mensajes directamente desde su número real.

## 🚀 Características Implementadas

### ✅ Backend Completado

1. **Servicio WhatsApp Web** (`src/services/whatsappWebService.js`)
   - Manejo de sesiones individuales por usuario
   - Almacenamiento de sesiones en Redis
   - Envío y recepción de mensajes
   - Generación de códigos QR para autenticación

2. **Servicio Redis** (`src/services/redisService.js`)
   - Almacenamiento de sesiones de WhatsApp
   - Cache de códigos QR temporales
   - Gestión de estados de conexión

3. **WebSockets** (`src/services/socketService.js`)
   - Sincronización en tiempo real
   - Eventos de cambio de estado
   - Notificaciones de mensajes entrantes/salientes

4. **Endpoints de API**
   - `POST /api/v1/whatsapp/connect` - Crear nueva sesión
   - `GET /api/v1/whatsapp/status` - Estado de conexión
   - `POST /api/v1/whatsapp/disconnect` - Desconectar sesión
   - `POST /api/v1/whatsapp/restore` - Restaurar sesión existente
   - `POST /api/v1/whatsapp/send` - Enviar mensaje directo
   - `GET /api/v1/whatsapp/info` - Información del cliente
   - `GET /api/v1/whatsapp/messages` - Historial de mensajes

5. **Seguridad y Rate Limiting**
   - Rate limiting específico para WhatsApp
   - Validaciones de entrada
   - Aislamiento de sesiones entre usuarios
   - Middleware de autenticación

6. **Integración con Sistema Existente**
   - Extensión del endpoint `/messages/send`
   - Uso automático de WhatsApp Web cuando está disponible
   - Fallback a Twilio cuando no hay sesión activa

## 🔧 Configuración

### Variables de Entorno Requeridas

```env
# Redis (requerido para sesiones)
REDIS_URL="redis://localhost:6379"

# WhatsApp Web (opcional)
WHATSAPP_SESSION_PATH="./sessions"

# Rate Limiting (opcional)
MESSAGE_RATE_LIMIT_WHATSAPP=10
MESSAGE_RATE_LIMIT_EMAIL=30
MESSAGE_RATE_LIMIT_GENERAL=100
```

### Dependencias Instaladas

```json
{
  "whatsapp-web.js": "^1.23.0",
  "qrcode-terminal": "^0.12.0",
  "redis": "^4.6.0",
  "socket.io": "^4.7.0"
}
```

## 📱 Flujo de Uso

### 1. Conectar WhatsApp

```javascript
// Frontend: Conectar WhatsApp
const response = await fetch('/api/v1/whatsapp/connect', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const { qrCode, status } = await response.json();

// Mostrar QR al usuario
if (qrCode) {
  displayQRCode(qrCode);
}
```

### 2. Verificar Estado

```javascript
// Frontend: Verificar estado de conexión
const response = await fetch('/api/v1/whatsapp/status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { connected, status, qrCode } = await response.json();
```

### 3. Enviar Mensajes

```javascript
// Frontend: Enviar mensaje (automáticamente usa WhatsApp Web si está disponible)
const response = await fetch('/api/v1/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientId: 'client_id',
    orderId: 'order_id',
    channel: 'whatsapp',
    templateType: 'confirmacion'
  })
});
```

### 4. WebSockets (Tiempo Real)

```javascript
// Frontend: Conectar WebSocket
const socket = io('ws://localhost:3000', {
  auth: {
    token: userToken
  }
});

// Suscribirse a eventos de WhatsApp
socket.emit('subscribe_whatsapp');

// Escuchar eventos
socket.on('whatsapp_qr_generated', (data) => {
  displayQRCode(data.qrCode);
});

socket.on('whatsapp_status_change', (data) => {
  updateConnectionStatus(data.status);
});

socket.on('whatsapp_message_received', (data) => {
  displayIncomingMessage(data.message);
});
```

## 🔒 Seguridad

### Rate Limiting
- **Conexión/Desconexión**: 3 intentos por 5 minutos
- **Envío de mensajes**: 10 mensajes por minuto
- **Consultas generales**: 5 requests por minuto

### Validaciones
- Números de teléfono sanitizados y validados
- Longitud máxima de mensajes (4096 caracteres)
- Verificación de sesiones activas
- Aislamiento completo entre usuarios

### Autenticación
- JWT requerido para todos los endpoints
- Verificación de permisos por usuario
- Sesiones ligadas a usuarios específicos

## 📊 Estructura de Datos

### Sesión de WhatsApp
```javascript
{
  userId: "user_id",
  phoneNumber: "+5491123456789",
  name: "Usuario WhatsApp",
  connectedAt: "2024-01-01T00:00:00.000Z"
}
```

### Mensaje
```javascript
{
  id: "message_id",
  userId: "user_id",
  clientId: "client_id",
  channel: "whatsapp",
  direction: "inbound|outbound",
  provider: "whatsapp_web",
  text: "Contenido del mensaje",
  status: "sent|received|failed",
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

## 🚨 Consideraciones Importantes

### Limitaciones de WhatsApp Web
- Requiere que el usuario mantenga su teléfono conectado
- Las sesiones pueden expirar por inactividad
- WhatsApp puede limitar el número de mensajes por día

### Rendimiento
- Cada usuario tiene su propia instancia de WhatsApp Web
- Las sesiones se almacenan en Redis para persistencia
- WebSockets permiten actualizaciones en tiempo real

### Monitoreo
- Logs detallados de todas las operaciones
- Estados de conexión rastreados en Redis
- Eventos WebSocket para debugging

## 🔄 Próximos Pasos

### Para el Frontend
1. Implementar interfaz de conexión de WhatsApp
2. Mostrar códigos QR para autenticación
3. Integrar WebSockets para tiempo real
4. Manejar estados de conexión

### Para el Backend
1. Implementar métricas y monitoreo
2. Agregar tests unitarios
3. Optimizar manejo de sesiones
4. Implementar backup de sesiones

## 📝 Notas de Desarrollo

- Las sesiones se almacenan en `./sessions/` por defecto
- Redis es requerido para el funcionamiento
- Cada usuario puede tener solo una sesión activa
- Los mensajes entrantes crean clientes automáticamente si no existen

# 📊 Resumen Completo del Proyecto OmniWP Backend

## 🎯 **Visión General**

OmniWP Backend es una API REST completa para la gestión de pedidos que llegan por WhatsApp. Permite a emprendedores y profesionales gestionar clientes, pedidos y comunicaciones de manera eficiente.

## 🏗️ **Arquitectura del Sistema**

### **Stack Tecnológico**
- **Backend**: Node.js + Express.js
- **Base de Datos**: MongoDB Atlas con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Comunicaciones**: Twilio (WhatsApp + Email)
- **Validación**: Zod
- **Seguridad**: Helmet, bcryptjs, Rate Limiting
- **Deploy**: Railway (Producción)

### **Estructura del Proyecto**
```
src/
├── config/          # Configuración centralizada
│   ├── index.js     # Variables de entorno y configuración
│   └── templates.js # Templates de mensajes
├── controllers/     # Lógica de endpoints
│   ├── authController.js      # Autenticación (login/register)
│   ├── clientController.js    # CRUD de clientes
│   ├── orderController.js     # CRUD de pedidos
│   ├── messageController.js   # Gestión de mensajes
│   └── webhookController.js   # Webhooks de Twilio
├── middleware/      # Middleware personalizado
│   ├── auth.js              # Autenticación JWT
│   ├── validation.js        # Validación con Zod
│   ├── errorHandler.js      # Manejo de errores
│   └── messageRateLimit.js  # Rate limiting para mensajes
├── routes/          # Definición de rutas
│   ├── index.js     # Rutas principales
│   ├── auth.js      # Rutas de autenticación
│   ├── clients.js   # Rutas de clientes
│   ├── orders.js    # Rutas de pedidos
│   ├── messages.js  # Rutas de mensajes
│   └── webhooks.js  # Rutas de webhooks
├── services/        # Servicios de negocio
│   ├── messageService.js        # Servicio unificado de mensajes
│   ├── twilioWhatsAppProvider.js # Proveedor WhatsApp
│   ├── twilioEmailProvider.js    # Proveedor Email
│   └── retryService.js          # Servicio de reintentos
├── scripts/         # Scripts de utilidad
│   ├── seed.js      # Poblado de datos de prueba
│   ├── validation.js # Scripts de validación
│   └── test*.js     # Scripts de prueba
└── server.js        # Punto de entrada
```

## 🗄️ **Modelo de Datos**

### **Entidades Principales**

#### **User** (Usuario)
- `id`: Identificador único
- `name`: Nombre del usuario
- `email`: Email único
- `password`: Contraseña hasheada
- `createdAt/updatedAt`: Timestamps

#### **Client** (Cliente)
- `id`: Identificador único
- `userId`: Referencia al usuario propietario
- `name`: Nombre del cliente
- `phone`: Teléfono para WhatsApp
- `email`: Email para comunicaciones
- `notes`: Notas adicionales
- `createdAt/updatedAt`: Timestamps

#### **Order** (Pedido)
- `id`: Identificador único
- `userId`: Referencia al usuario propietario
- `clientId`: Referencia al cliente
- `description`: Descripción del pedido
- `status`: Estado del pedido
- `createdAt/updatedAt`: Timestamps

#### **Message** (Mensaje)
- `id`: Identificador único
- `userId`: Referencia al usuario propietario
- `clientId`: Referencia al cliente
- `orderId`: Referencia al pedido (opcional)
- `channel`: Canal de comunicación (whatsapp/email)
- `direction`: Dirección (outbound/inbound)
- `provider`: Proveedor (twilio)
- `providerMessageId`: ID del mensaje en el proveedor
- `templateType`: Tipo de template usado
- `variables`: Variables del template (JSON)
- `subject`: Asunto (solo email)
- `text`: Contenido del mensaje
- `status`: Estado del mensaje
- `errorCode/errorMessage`: Información de errores
- `createdAt/updatedAt`: Timestamps

#### **Template** (Template)
- `id`: Identificador único
- `userId`: Referencia al usuario propietario
- `channel`: Canal (whatsapp/email)
- `name`: Nombre del template
- `content`: Contenido con placeholders
- `placeholders`: Array de placeholders disponibles
- `status`: Estado (draft/approved)
- `createdAt/updatedAt`: Timestamps

## 🔌 **API Endpoints**

### **Base URL**: `https://omniwp-backend-production.up.railway.app/api/v1`

### **🔐 Autenticación**
- `POST /auth/register` - Registrar usuario
- `POST /auth/login` - Iniciar sesión

### **👥 Clientes**
- `GET /clients` - Listar clientes
- `POST /clients` - Crear cliente
- `PUT /clients/:id` - Actualizar cliente
- `DELETE /clients/:id` - Eliminar cliente

### **📦 Pedidos**
- `GET /orders` - Listar pedidos
- `POST /orders` - Crear pedido
- `PUT /orders/:id` - Actualizar pedido
- `DELETE /orders/:id` - Eliminar pedido

### **💬 Mensajes**
- `POST /messages/template` - Generar template
- `POST /messages/send` - Enviar mensaje real
- `GET /messages` - Historial de mensajes
- `GET /messages/:id` - Obtener mensaje por ID
- `GET /messages/templates` - Listar templates disponibles
- `GET /messages/config/status` - Estado de configuración

### **🔗 Webhooks**
- `POST /webhooks/twilio` - Webhook de Twilio

### **🏥 Health & Testing**
- `GET /health` - Health check
- `GET /cors-test` - Prueba de CORS
- `GET /order-status-test` - Estados de pedidos
- `GET /message-template-test` - Templates disponibles

## 🚀 **Funcionalidades Implementadas**

### **✅ Autenticación y Seguridad**
- Registro e inicio de sesión con JWT
- Hash de contraseñas con bcryptjs
- Middleware de autenticación en todas las rutas protegidas
- Rate limiting para prevenir abuso
- Validación robusta con Zod
- Headers de seguridad con Helmet

### **✅ Gestión de Clientes**
- CRUD completo de clientes
- Validación de datos de entrada
- Verificación de propiedad (solo el usuario puede ver sus clientes)
- Validación antes de eliminar (no se puede eliminar si tiene pedidos)

### **✅ Gestión de Pedidos**
- CRUD completo de pedidos
- Estados de pedidos: pendiente, en_proceso, completado, cancelado, confirmado, entregado
- Relación con clientes
- Validación de datos y estados

### **✅ Sistema de Mensajería**
- **Templates predefinidos**: confirmación, recordatorio, seguimiento, entrega, agradecimiento
- **Múltiples canales**: WhatsApp y Email
- **Proveedores**: Twilio para ambos canales
- **Variables dinámicas**: Reemplazo automático de placeholders
- **Historial completo**: Todos los mensajes se guardan en BD
- **Estados de mensaje**: queued, sent, delivered, read, failed
- **Rate limiting**: Límites específicos por canal

### **✅ Integración con Twilio**
- **WhatsApp**: Envío de mensajes vía Twilio WhatsApp API
- **Email**: Envío de emails vía SendGrid (a través de Twilio)
- **Webhooks**: Recepción de actualizaciones de estado
- **Configuración flexible**: Variables de entorno para credenciales
- **Manejo de errores**: Logging detallado y reintentos

### **✅ Validación y Manejo de Errores**
- Validación de entrada con Zod
- Mensajes de error descriptivos
- Códigos de error específicos
- Logging detallado para debugging
- Manejo centralizado de errores

### **✅ CORS y Configuración**
- CORS configurado para desarrollo y producción
- Detección automática de entorno
- Headers de seguridad apropiados
- Soporte para múltiples orígenes

## 🧪 **Scripts de Prueba y Utilidades**

### **Scripts de Validación**
- `validation.js` - Validación básica
- `simpleValidation.js` - Validación simple
- `detailedValidation.js` - Validación detallada
- `completeValidation.js` - Validación completa

### **Scripts de Prueba**
- `testEndpoints.js` - Prueba de endpoints
- `testLocal.js` - Prueba local
- `testFrontendSimulation.js` - Simulación del frontend
- `testTwilioIntegration.js` - Prueba de integración Twilio
- `testWhatsAppOnly.js` - Prueba solo WhatsApp
- `testWhatsAppConfig.js` - Prueba de configuración WhatsApp
- `testWhatsAppDirect.js` - Prueba directa WhatsApp

### **Scripts de Utilidad**
- `seed.js` - Poblado de datos de prueba
- `resetForUsers.js` - Reset para usuarios
- `retryFailedMessages.js` - Reintento de mensajes fallidos
- `updateClientPhone.js` - Actualización de teléfonos
- `debugWhatsApp.js` - Debug de WhatsApp

## 📊 **Datos de Prueba**

### **Usuarios de Prueba**
- `tomas@test.com` / `123456`
- `maria@test.com` / `123456`

### **Clientes de Prueba**
- 5 clientes con datos realistas
- Números de teléfono argentinos
- Notas descriptivas

### **Pedidos de Prueba**
- 6 pedidos en diferentes estados
- Relacionados con los clientes
- Descripciones variadas

## 🔧 **Configuración y Deploy**

### **Variables de Entorno Requeridas**
```env
# Base de datos
DATABASE_URL="mongodb+srv://..."

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Servidor
PORT=3000
NODE_ENV="production"

# Twilio (REQUERIDAS para mensajería)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
TWILIO_WEBHOOK_SECRET="..."

# SendGrid (OPCIONAL)
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="..."
SENDGRID_FROM_NAME="..."

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MESSAGE_RATE_LIMIT_WHATSAPP=10
MESSAGE_RATE_LIMIT_EMAIL=30
MESSAGE_RATE_LIMIT_GENERAL=100
```

### **Deploy en Railway**
- ✅ Configurado para deploy automático
- ✅ Variables de entorno configuradas
- ✅ Health check endpoint
- ✅ Logs de Railway disponibles

## 📈 **Métricas y Monitoreo**

### **Logs Disponibles**
- Requests HTTP con Morgan
- Errores detallados
- Estados de mensajes
- Configuración de servicios

### **Health Checks**
- Endpoint `/health` para verificar estado
- Verificación de configuración de Twilio
- Estado de la base de datos

## 🎯 **Estado Actual del Proyecto**

### **✅ Completado**
- [x] Autenticación JWT
- [x] CRUD de clientes y pedidos
- [x] Sistema de mensajería completo
- [x] Integración con Twilio
- [x] Validación robusta
- [x] Rate limiting
- [x] Deploy en Railway
- [x] Scripts de prueba
- [x] Documentación completa

### **🔄 En Progreso**
- [ ] Optimizaciones de rendimiento
- [ ] Métricas avanzadas
- [ ] Tests automatizados

### **📋 Próximos Pasos**
- [ ] Implementar notificaciones push
- [ ] Dashboard de métricas
- [ ] API de reportes
- [ ] Integración con más proveedores

## 🚀 **Cómo Usar el Sistema**

### **1. Configuración Inicial**
```bash
# Clonar y configurar
git clone <repo>
cd omniwp-backend
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus credenciales

# Configurar base de datos
npm run db:generate
npm run db:push
npm run db:seed
```

### **2. Ejecutar en Desarrollo**
```bash
npm run dev
```

### **3. Probar la API**
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tomas@test.com","password":"123456"}'
```

### **4. Enviar Mensaje**
```bash
curl -X POST http://localhost:3000/api/v1/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client_id",
    "orderId": "order_id",
    "channel": "whatsapp",
    "templateType": "confirmacion"
  }'
```

---

**🎉 El proyecto OmniWP Backend está completamente funcional y listo para producción!**

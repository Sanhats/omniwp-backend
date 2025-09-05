# 🚀 OmniWP Backend API

Backend API para el sistema de gestión de pedidos OmniWP. Permite a emprendedores y profesionales gestionar pedidos que llegan por WhatsApp.

## 📋 Características

- **Autenticación JWT** segura
- **CRUD completo** para clientes y pedidos
- **Generación de templates** para mensajes de WhatsApp
- **Validación robusta** con Zod
- **Rate limiting** para prevenir abuso
- **Logging** con Morgan
- **Manejo de errores** centralizado
- **Base de datos MongoDB** con Prisma ORM

## 🛠️ Stack Tecnológico

- **Node.js** + **Express.js**
- **Prisma** + **MongoDB Atlas**
- **JWT** para autenticación
- **Zod** para validaciones
- **bcryptjs** para hash de contraseñas
- **Morgan** para logging
- **Helmet** para seguridad

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd omniwp-backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/omniwp"
JWT_SECRET="tu-secret-key-super-seguro"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
```

### 4. Configurar base de datos
```bash
# Generar cliente Prisma
npm run db:generate

# Sincronizar esquema con la base de datos
npm run db:push

# Poblar con datos de prueba
npm run db:seed
```

### 5. Ejecutar el servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### 🔐 Autenticación

#### POST /auth/register
Registrar nuevo usuario
```json
{
  "name": "Tomas",
  "email": "tomas@example.com",
  "password": "123456"
}
```

#### POST /auth/login
Iniciar sesión
```json
{
  "email": "tomas@example.com",
  "password": "123456"
}
```

### 👥 Clientes

#### GET /clients
Listar clientes del usuario autenticado

#### POST /clients
Crear nuevo cliente
```json
{
  "name": "Juan Pérez",
  "phone": "5491112345678",
  "notes": "Cliente frecuente"
}
```

#### PUT /clients/:id
Actualizar cliente

#### DELETE /clients/:id
Eliminar cliente

### 📦 Pedidos

#### GET /orders
Listar pedidos del usuario autenticado

#### POST /orders
Crear nuevo pedido
```json
{
  "clientId": "c123",
  "description": "Pedido de 2 filtros de aceite",
  "status": "pendiente"
}
```

#### PUT /orders/:id
Actualizar pedido

#### DELETE /orders/:id
Eliminar pedido

### 💬 Mensajes

#### POST /messages/template
Generar template de mensaje para WhatsApp
```json
{
  "clientId": "c123",
  "orderId": "o123",
  "templateType": "confirmacion"
}
```

## 🔒 Autenticación

Todos los endpoints (excepto `/auth/*`) requieren autenticación JWT:

```bash
Authorization: Bearer <jwt_token>
```

## 📊 Datos de Prueba

El seed incluye:
- **2 usuarios de prueba**:
  - `tomas@test.com` / `123456`
  - `maria@test.com` / `123456`
- **5 clientes** con datos realistas
- **6 pedidos** en diferentes estados

## 🚀 Deploy

### Railway
1. Conectar repositorio a Railway
2. Configurar variables de entorno
3. Deploy automático

### Render
1. Crear nuevo Web Service
2. Conectar repositorio
3. Configurar variables de entorno
4. Deploy

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tomas@test.com","password":"123456"}'
```

## 📝 Estructura del Proyecto

```
src/
├── config/          # Configuración centralizada
├── controllers/     # Lógica de endpoints
├── middleware/      # Auth, validaciones, errores
├── routes/          # Definición de rutas
├── scripts/         # Seeds y utilidades
└── server.js        # Punto de entrada
```

## 🔧 Scripts Disponibles

- `npm start` - Ejecutar en producción
- `npm run dev` - Ejecutar en desarrollo con nodemon
- `npm run db:generate` - Generar cliente Prisma
- `npm run db:push` - Sincronizar esquema con DB
- `npm run db:seed` - Poblar con datos de prueba
- `npm run db:reset` - Resetear DB y poblar

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push al branch
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

---

**Desarrollado con ❤️ por el equipo OmniWP**

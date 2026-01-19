# 📱 Todo MERN App - Microservices Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│              (Browser / Postman / Mobile App)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTP Request
                           ↓
┌────────────────────────────────────────────────────────────┐
│                    API GATEWAY (8082)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  1. Rate Limiter (100 req/15min)                     │  │
│  │  2. Security Headers (Helmet)                        │  │
│  │  3. CORS Policy                                      │  │
│  │  4. Request Logging (Morgan)                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                │
│  ┌────────────────────────┴────────────────────────────┐   │
│  │          ROUTING & AUTHENTICATION                   │   │
│  │  /api/auth/register  → Auth Service (no auth)       │   │
│  │  /api/auth/login     → Auth Service (no auth)       │   │
│  │  /api/auth/*         → Auth Service (need auth)     │   │
│  │  /api/todos/*        → Todo Service (need auth)     │   │
│  └─────────────────────────────────────────────────────┘   │
└───────────────┬─────────────────────┬──────────────────────┘
                │                     │
       ┌────────┴────────┐   ┌────────┴────────┐
       │                 │   │                 │
       ↓                 ↓   ↓                 ↓
┌─────────────┐   ┌─────────────┐
│Auth Service │   │Todo Service │
│  (port 8080)│   │  (port 8081)│
│             │   │             │
│ - Register  │   │ - CRUD Todos│
│ - Login     │   │ - Toggle    │
│ - Get Me    │   │ - Delete All│
│ - Update    │   │             │
└──────┬──────┘   └──────┬──────┘
       │                 │
       └────────┬────────┘
                │
                ↓
       ┌─────────────────┐
       │   MongoDB       │
       │ - authentication│
       │ - todos         │
       └─────────────────┘
```

---

## 1️⃣ AUTHENTICATION SERVICE

### Service Info
- **Port:** `8080`
- **Database:** `authentication` (MongoDB)
- **Purpose:** Quản lý xác thực người dùng, JWT tokens, và thông tin tài khoản

### Features

#### **Public Endpoints** (Không cần token)
- **POST** `/auth/register` - Đăng ký tài khoản mới
- **POST** `/auth/login` - Đăng nhập và nhận JWT token

#### **Protected Endpoints** (Cần JWT token)
- **GET** `/auth/me` - Lấy thông tin user hiện tại
- **PUT** `/auth/profile` - Cập nhật thông tin profile
- **POST** `/auth/change-password` - Đổi mật khẩu
- **POST** `/auth/logout` - Đăng xuất (invalidate token)
- **POST** `/auth/refresh-token` - Làm mới access token
- **DELETE** `/auth/account` - Xóa tài khoản

### Database Schema

```javascript
User Schema:
{
  username: String (required, unique, min: 3, max: 30),
  email: String (required, unique, lowercase),
  password: String (required, hashed with bcrypt),
  avatar: String (URL),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

### Structure

```
backend/services/auth/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js      # Business logic
│   ├── models/
│   │   └── user.model.js           # User schema
│   ├── routes/
│   │   └── auth.routes.js          # API routes
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification
│   │   └── validation.middleware.js # Input validation
│   ├── utils/
│   │   ├── jwt.util.js             # Token generation
│   │   └── bcrypt.util.js          # Password hashing
│   └── server.js                   # Entry point
├── .env
└── package.json
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────┘

Client                    Auth Service              MongoDB
  │                            │                        │
  │ POST /auth/register        │                        │
  │ {username, email, pass}    │                        │
  ├───────────────────────────>│                        │
  │                            │                        │
  │                            │ 1. Validate input      │
  │                            │ 2. Check if exists     │
  │                            ├───────────────────────>│
  │                            │<───────────────────────┤
  │                            │ 3. Hash password       │
  │                            │ 4. Create user         │
  │                            ├───────────────────────>│
  │                            │<───────────────────────┤
  │                            │ 5. Generate JWT        │
  │<───────────────────────────┤                        │
  │ { token, user }            │                        │
  │                            │                        │

┌─────────────────────────────────────────────────────────────┐
│                       LOGIN FLOW                            │
└─────────────────────────────────────────────────────────────┘

Client                    Auth Service              MongoDB
  │                            │                        │
  │ POST /auth/login           │                        │
  │ {email, password}          │                        │
  ├───────────────────────────>│                        │
  │                            │                        │
  │                            │ 1. Find user by email  │
  │                            ├───────────────────────>│
  │                            │<───────────────────────┤
  │                            │ 2. Compare password    │
  │                            │ 3. Generate JWT        │
  │                            │ 4. Update lastLogin    │
  │                            ├───────────────────────>│
  │<───────────────────────────┤                        │
  │ { token, user }            │                        │
  │                            │                        │

┌─────────────────────────────────────────────────────────────┐
│                   PROTECTED ROUTE FLOW                      │
└─────────────────────────────────────────────────────────────┘

Client                    Auth Service              MongoDB
  │                            │                        │
  │ GET /auth/me               │                        │
  │ Authorization: Bearer XXX  │                        │
  ├───────────────────────────>│                        │
  │                            │                        │
  │                            │ 1. Extract token       │
  │                            │ 2. Verify JWT          │
  │                            │ 3. Find user by ID     │
  │                            ├───────────────────────>│
  │                            │<───────────────────────┤
  │<───────────────────────────┤                        │
  │ { user }                   │                        │
  │                            │                        │
```

### Security Features
- Password hashing với **bcrypt** (salt rounds: 10)
- JWT tokens với expiration (7 days)
- Input validation với **express-validator**
- Rate limiting cho login attempts
- Email verification (optional)
- Password strength requirements

### Environment Variables

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 2️⃣ TODO SERVICE

### 📊 Service Info
- **Port:** `8081`
- **Database:** `todos` (MongoDB)
- **Purpose:** Quản lý CRUD operations cho todo items

### ✅ Features

#### **All Endpoints** (Tất cả đều cần JWT token)
- **GET** `/todos` - Lấy danh sách todos của user
- **GET** `/todos/:id` - Lấy chi tiết 1 todo
- **POST** `/todos` - Tạo todo mới
- **PUT** `/todos/:id` - Cập nhật todo
- **DELETE** `/todos/:id` - Xóa 1 todo
- **PATCH** `/todos/:id/toggle` - Toggle trạng thái completed
- **DELETE** `/todos/completed` - Xóa tất cả completed todos
- **GET** `/todos/stats` - Thống kê todos (total, completed, pending)

### 🗂️ Database Schema

```javascript
Todo Schema:
{
  userId: ObjectId (required, ref: 'User'),
  title: String (required, min: 1, max: 200),
  description: String (max: 1000),
  completed: Boolean (default: false),
  priority: String (enum: ['low', 'medium', 'high'], default: 'medium'),
  dueDate: Date (optional),
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
  completedAt: Date (optional)
}
```

### 📁 Structure

```
backend/services/todo/
├── src/
│   ├── controllers/
│   │   └── todo.controller.js      # Business logic
│   ├── models/
│   │   └── todo.model.js           # Todo schema
│   ├── routes/
│   │   └── todo.routes.js          # API routes
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification
│   │   └── validation.middleware.js # Input validation
│   ├── utils/
│   │   └── query.util.js           # Query helpers
│   └── server.js                   # Entry point
├── .env
└── package.json
```

### 🔄 Todo Operations Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GET TODOS FLOW                           │
└─────────────────────────────────────────────────────────────┘

Client              API Gateway         Todo Service       MongoDB
  │                      │                    │               │
  │ GET /api/todos       │                    │               │
  │ + JWT Token          │                    │               │
  ├─────────────────────>│                    │               │
  │                      │ 1. Verify JWT      │               │
  │                      │ 2. Forward request │               │
  │                      ├───────────────────>│               │
  │                      │                    │ 3. Verify JWT │
  │                      │                    │ 4. Query DB   │
  │                      │                    ├──────────────>│
  │                      │                    │<──────────────┤
  │                      │<───────────────────┤               │
  │<─────────────────────┤                    │               │
  │ [{ id, title, ... }] │                    │               │

┌─────────────────────────────────────────────────────────────┐
│                   CREATE TODO FLOW                          │
└─────────────────────────────────────────────────────────────┘

Client              API Gateway         Todo Service       MongoDB
  │                      │                    │               │
  │ POST /api/todos      │                    │               │
  │ {title, description} │                    │               │
  │ + JWT Token          │                    │               │
  ├─────────────────────>│                    │               │
  │                      │ 1. Verify JWT      │               │
  │                      │ 2. Forward         │               │
  │                      ├───────────────────>│               │
  │                      │                    │ 3. Validate   │
  │                      │                    │ 4. Extract    │
  │                      │                    │    userId     │
  │                      │                    │ 5. Create doc │
  │                      │                    ├──────────────>│
  │                      │                    │<──────────────┤
  │                      │<───────────────────┤               │
  │<─────────────────────┤                    │               │
  │ { id, title, ... }   │                    │               │
  │                      │                    │               │

┌─────────────────────────────────────────────────────────────┐
│                   TOGGLE TODO FLOW                          │
└─────────────────────────────────────────────────────────────┘

Client              API Gateway         Todo Service       MongoDB
  │                      │                    │               │
  │ PATCH /api/todos/123 │                    │               │
  │       /toggle        │                    │               │
  │ + JWT Token          │                    │               │
  ├─────────────────────>│                    │               │
  │                      │ 1. Verify JWT      │               │
  │                      ├───────────────────>│               │
  │                      │                    │ 2. Find todo  │
  │                      │                    │ 3. Check owner│
  │                      │                    ├──────────────>│
  │                      │                    │<──────────────┤
  │                      │                    │ 4. Toggle     │
  │                      │                    │    completed  │
  │                      │                    ├──────────────>│
  │                      │<───────────────────┤               │
  │<─────────────────────┤                    │               │
  │ { completed: true }  │                    │               │
  │                      │                    │               │
```

### 🎯 Advanced Features

#### **Filtering & Sorting**
```javascript
GET /todos?completed=true
GET /todos?priority=high
GET /todos?tags=work,urgent
GET /todos?sort=-createdAt
GET /todos?page=1&limit=10
```

#### **Statistics**
```javascript
GET /todos/stats
Response:
{
  total: 25,
  completed: 15,
  pending: 10,
  byPriority: {
    low: 5,
    medium: 12,
    high: 8
  }
}
```

### 🔒 Security Features
- ✅ Todos chỉ có thể được truy cập bởi owner
- ✅ JWT verification trên mọi endpoint
- ✅ Input validation và sanitization
- ✅ XSS protection
- ✅ NoSQL injection prevention

### 📝 Environment Variables

```env
PORT=8081
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

---

## 3️⃣ API GATEWAY

### 📊 Service Info
- **Port:** `8082`
- **Purpose:** Single entry point, routing, authentication, rate limiting

### 🛡️ Responsibilities

#### **1. Request Routing**
```
/api/auth/*  → Auth Service (8080)
/api/todos/* → Todo Service (8081)
```

#### **2. Security Layer**
- Rate limiting (100 requests/15 min per IP)
- CORS policy enforcement
- Security headers (Helmet)
- JWT verification cho protected routes

#### **3. Middleware Stack**
```javascript
1. Helmet         → Security headers
2. CORS           → Cross-origin policy
3. Morgan         → Request logging
4. Rate Limiting   → DDoS protection
5. Auth Middleware → JWT verification
6. Proxy Handler  → Forward to services
```

### 📝 Environment Variables

```env
PORT=8082
AUTH_SERVICE_URL=http://localhost:8080
TODO_SERVICE_URL=http://localhost:8081
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 14
- MongoDB >= 4.4
- npm or yarn

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd Todo_mern_app

# 2. Install dependencies cho từng service
cd backend/services/auth && npm install
cd ../todo && npm install
cd ../../api_gateway && npm install

# 3. Setup environment variables
# Tạo file .env trong mỗi service (xem mẫu ở trên)

# 4. Start MongoDB
# Windows: Mở MongoDB Compass hoặc
mongod --dbpath="C:\data\db"

# 5. Start services (3 terminals)

# Terminal 1: Auth Service
cd backend/services/auth
npm run dev

# Terminal 2: Todo Service
cd backend/services/todo
npm run dev

# Terminal 3: API Gateway
cd backend/api_gateway
npm run dev
```

### 🧪 Testing

```bash
# 1. Health checks
curl http://localhost:8080/health  # Auth Service
curl http://localhost:8081/health  # Todo Service
curl http://localhost:8082/health  # API Gateway

# 2. Register user
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"123456"}'

# 3. Login
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"123456"}'

# Response: { "token": "eyJhbGci...", "user": {...} }

# 4. Create todo (use token from login)
curl -X POST http://localhost:8082/api/todos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"Buy milk","description":"From supermarket"}'

# 5. Get todos
curl http://localhost:8082/api/todos \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 API Documentation

### Auth Service Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Đăng ký tài khoản |
| POST | `/auth/login` | ❌ | Đăng nhập |
| GET | `/auth/me` | ✅ | Lấy thông tin user |
| PUT | `/auth/profile` | ✅ | Cập nhật profile |
| POST | `/auth/change-password` | ✅ | Đổi mật khẩu |
| POST | `/auth/logout` | ✅ | Đăng xuất |

### Todo Service Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/todos` | ✅ | Lấy danh sách todos |
| GET | `/todos/:id` | ✅ | Lấy chi tiết todo |
| POST | `/todos` | ✅ | Tạo todo mới |
| PUT | `/todos/:id` | ✅ | Cập nhật todo |
| DELETE | `/todos/:id` | ✅ | Xóa todo |
| PATCH | `/todos/:id/toggle` | ✅ | Toggle completed |
| DELETE | `/todos/completed` | ✅ | Xóa completed todos |
| GET | `/todos/stats` | ✅ | Thống kê todos |

---

## 🏆 Best Practices Implemented

✅ **Microservices Architecture** - Separation of concerns  
✅ **JWT Authentication** - Stateless auth  
✅ **Input Validation** - Security layer  
✅ **Error Handling** - Consistent error responses  
✅ **Logging** - Request/response tracking  
✅ **Rate Limiting** - DDoS protection  
✅ **CORS** - Cross-origin security  
✅ **Environment Variables** - Configuration management  
✅ **Database Indexing** - Performance optimization  
✅ **Password Hashing** - bcrypt security  

---

## 📦 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Helmet, CORS, bcrypt
- **Validation:** express-validator
- **Logging:** Morgan
- **Rate Limiting:** express-rate-limit
- **HTTP Client:** Axios

---

## 🔮 Future Improvements

- [ ] Add email verification
- [ ] Implement refresh tokens
- [ ] Add WebSocket for real-time updates
- [ ] Implement caching with Redis
- [ ] Add unit & integration tests
- [ ] Implement CI/CD pipeline
- [ ] Add Docker containerization
- [ ] Implement API versioning
- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement message queue (RabbitMQ/Kafka)

---

## 👨‍💻 Author

Your Name

## 📄 License

MIT


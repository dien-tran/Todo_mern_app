const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimit');
const { createProxyHandler } = require('./utils/proxy');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'API Gateway',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// ============ AUTH SERVICE ============
const authRoutes = express.Router();

// Public routes - Không cần authentication (đặt TRƯỚC)
authRoutes.post('/register', createProxyHandler(
  process.env.AUTH_SERVICE_URL, 
  '/api/auth/register', 
  '/auth/register'
));

authRoutes.post('/login', createProxyHandler(
  process.env.AUTH_SERVICE_URL, 
  '/api/auth/login', 
  '/auth/login'
));

// Protected routes - Cần authentication (đặt SAU)
authRoutes.use(authMiddleware); // Từ đây trở xuống đều cần auth

authRoutes.all('*', createProxyHandler(
  process.env.AUTH_SERVICE_URL, 
  '/api/auth', 
  '/auth'
));

app.use('/api/auth', authRoutes);

// ============ TODO SERVICE ============
const planRoutes = express.Router();
const taskRoutes = express.Router();
planRoutes.use(authMiddleware); // Tất cả routes đều cần auth

planRoutes .all('*', createProxyHandler(
  process.env.TODO_SERVICE_URL, 
  '/api/plans', 
  '/plans'
));

app.use('/api/plans', planRoutes);

taskRoutes.use(authMiddleware); // Tất cả routes đều cần auth
taskRoutes.all('*', createProxyHandler(
  process.env.TODO_SERVICE_URL,   
  '/api/tasks', 
  '/tasks'
));

app.use('/api/tasks', taskRoutes);

// ============ USER SERVICE (Optional) ============
// const userRoutes = express.Router();
// userRoutes.use(authMiddleware);
// userRoutes.all('*', createProxyHandler(
//   process.env.USER_SERVICE_URL, 
//   '/api/users', 
//   '/users'
// ));
// app.use('/api/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    tip: 'Available routes: /api/auth/*, /api/todos/*'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
  console.log(`📡 Proxy targets:`);
  console.log(`   - Auth Service: ${process.env.AUTH_SERVICE_URL}`);
  console.log(`   - Todo Service: ${process.env.TODO_SERVICE_URL}`);
  console.log(`🌐 Public routes:`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`🔒 Protected routes:`);
  console.log(`   - GET  /api/auth/me (and all other /api/auth/*)`);
  console.log(`   - ALL  /api/todos/*`);
});
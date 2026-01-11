const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const PORT = process.env.PORT || 80;
const AUTH_URL = process.env.AUTH_URL || 'http://localhost:8080'; // set đúng port auth
const TODO_URL = process.env.TODO_URL || 'http://localhost:8081'; // set đúng port todo_app

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// forward JSON body when proxying
function onProxyReqWriteBody(proxyReq, req) {
  if (!req.body || !Object.keys(req.body).length) return;
  const bodyData = JSON.stringify(req.body);
  proxyReq.setHeader('Content-Type', 'application/json');
  proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
  proxyReq.write(bodyData);
}

app.use('/api/auth', createProxyMiddleware({
  target: AUTH_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' },
  onProxyReq: onProxyReqWriteBody
}));

app.use(['/api/plans', '/api/tasks'], createProxyMiddleware({
  target: TODO_URL,
  changeOrigin: true,
  pathRewrite: (path) => path, // giữ nguyên path
  onProxyReq: onProxyReqWriteBody
}));

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API Gateway listening: http://localhost:${PORT}`);
  console.log(`Auth -> ${AUTH_URL}, Todo -> ${TODO_URL}`);
});
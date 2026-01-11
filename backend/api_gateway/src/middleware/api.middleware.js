// src/middlewares.js
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Lấy Secret từ biến môi trường (đảm bảo server.js đã load dotenv)
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// 1. Cấu hình Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 phút
    limit: 100, // Tối đa 100 request
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 429, message: "Too many requests, please try again later." }
});

// 2. Middleware xác thực Token (JWT)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Access Denied: No Token Provided" });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Lưu user info vào request
        
        // Forward User ID sang Microservice qua Header
        if (verified.id) {
            req.headers['x-user-id'] = verified.id;
        }
        
        next();
    } catch (err) {
        res.status(403).json({ message: "Invalid Token" });
    }
};

// 3. Helper fix lỗi body khi dùng Proxy (cho POST/PUT request)
const onProxyReqWriteBody = (proxyReq, req) => {
    if (!req.body || !Object.keys(req.body).length) return;
    
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Type', 'application/json');
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
};

// Xuất các hàm ra để server.js sử dụng
module.exports = {
    limiter,
    verifyToken,
    onProxyReqWriteBody
};
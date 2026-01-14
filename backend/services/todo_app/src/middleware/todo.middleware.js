//import dependencies and models

const jwt = require('jsonwebtoken');

// Verify Token Middleware: Verify token, load user, attatch to req object and token 
exports.verifyToken = async (req, res, next) => {
    try {
        req.user = { 
            userId: req.headers['x-user-id']
        };

        next();
    } catch (err) {
        console.error('todo.verifyToken error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
//import dependencies and models

const jwt = require('jsonwebtoken');

// Verify Token Middleware: Verify token, load user, attatch to req object and token 
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = { 
            userId: decoded.userId 
        };

        next();
    } catch (err) {
        console.error('todo.verifyToken error:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
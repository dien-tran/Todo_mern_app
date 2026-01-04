//import dependencies and models

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');


// Verify Token Middleware: Verify token, load user, attatch to req object and token 
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        // Check if token exists
        if (!token) return res.status(401).json({ message: 'Unauthorized' });

        // Verify token: check if token is the same with the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.userId) return res.status(401).json({ message: 'Unauthorized' });

        const user = await User.findById(decoded.userId).select('_id role email');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Normalize user object for controllers
        req.user = {
            userId: user._id.toString(),
            role: user.role || 'user',
            email: user.email
        };
        req.token = token;

        next();
    } catch (err) {
        console.error('todo.verifyToken error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};
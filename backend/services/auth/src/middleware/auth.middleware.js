//import dependencies and models

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');


// Verify Token Middleware: Verify token, load user, attatch to req object and token 
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        // Check if token exists
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify token: check if token is the same with the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Load user: to verify user still exists in DB avoid token still valid
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Attach user and token to req object
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
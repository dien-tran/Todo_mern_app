//import dependencies and models

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Register Controller 
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body; // Information from front-end register form

        // Check if user already exists
        const existUser = await User.findOne({ email });
        if (existUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password: bcrypt hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        })

        // Save to database
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        )

        // Send response
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        })
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

// Login Controller: authenticate user, generate JWT token, send response
exports.login = async (req, res) => {
    try {   
        const { email, password } = req.body;

        // Check user tồn tại
        const existUser = await User.findOne({ email });
        if (!existUser) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, existUser.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: existUser._id, email: existUser.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        // Response
        res.status(200).json({
            message: 'User logged in successfully',
            token,
            user: {
                id: existUser._id,
                username: existUser.username,
                email: existUser.email
            }
        });

    } catch (error) {
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};

// Logout Controller: handle user logout by invalidating token or clearing session
exports.logout = async (req, res) => {
    try {

    } catch (error) {

    }
}

// Helper function to generate JWT token
// Forget Password Controller: find user by email, generate reset token, send reset email
// Reset Password Controller: verify reset token, hash new password, update user password
// Change Password Controller: verify old password, hash new password, update user password
// Update Profile Controller: update user profile information



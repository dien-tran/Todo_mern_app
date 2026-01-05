const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plan name is required'],
        trim: true
    },
    // Reference to User model in the 'authentication' database
    // This establishes the relationship between Plan and User across different databases
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to User model
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema);

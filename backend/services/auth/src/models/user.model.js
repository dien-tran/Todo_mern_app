const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'], //Send error message when request is not validate
        trim: true //remove whitespaces
    },
    email: {
        type: String,
        required: [true, 'Email is required'], //Send error message when request is not validate
        unique: true, //only one user with same email
        trim: true //remove whitespaces
    },
    password: {
        type: String,
        required: [true, 'Password is required'], //Send error message when request is not validate
        minlength: 10
    }
})

module.exports = mongoose.model('User', userSchema);
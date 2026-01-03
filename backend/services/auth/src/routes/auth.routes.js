// import express, auth.controller for api routes
const express = require('express'); 
const router = express.Router();
const authController = require('../controllers/auth.controller');
const Middleware = require('../middleware/auth.middleware');

router.post('/register', authController.register); //api route for register
router.post('/login', authController.login); //api route for login

module.exports = router;

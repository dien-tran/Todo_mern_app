// import express, auth.controller for api routes
const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const Middleware = require('../middleware/todo.middleware');

// Plan routes
router.post('/create', Middleware.verifyToken, planController.createPlan);
router.get('/get', Middleware.verifyToken, planController.getPlans);
router.put('/update/status', Middleware.verifyToken, planController.updatePlan);

module.exports = router;

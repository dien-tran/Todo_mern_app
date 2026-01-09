const express = require('express');
const taskController = require('../controllers/task.controller.js') ;
const Middleware = require('../middleware/todo.middleware.js');
const router = express.Router();

router.post('/create', Middleware.verifyToken, taskController.createTask);
router.put('/update', Middleware.verifyToken, taskController.updateTask);
router.delete('/delete', Middleware.verifyToken, taskController.deleteTask);
router.get('/get', Middleware.verifyToken, taskController.getTasks);

module.exports = router;
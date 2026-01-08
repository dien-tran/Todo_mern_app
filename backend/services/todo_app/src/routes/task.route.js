const express = require('express');
const taskController = require('../controllers/task.controller.js') ;
const Middleware = require('../middleware/todo.middleware.js');
const router = express.Router();

router.post('/create', Middleware.verifyToken, taskController.createTask);
router.put('/update/:taskId', Middleware.verifyToken, taskController.updateTask);
router.delete('/delete/:taskId', Middleware.verifyToken, taskController.deleteTask);
router.get('/:planId', Middleware.verifyToken, taskController.getTasks);

module.exports = router;
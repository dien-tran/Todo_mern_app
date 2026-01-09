const mongoose = require('mongoose');
const Task = require('../models/task.model.js');
const Plan = require('../models/plan.model.js');

// Create Task Controller: Create a new task
exports.createTask = async (req, res) => {
    try {
        const { planId, name, startDate, endDate, progress = 0, note } = req.body;
        const userId = req.user.userId;

        // Validate planId
        if (!planId || !mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid planId'
            });
        }

        // Validate name
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Task name is required'
            });
        }

        // Check if the plan exists and belongs to the user
        const plan = await Plan.findOne({
            _id: planId,
            userId: userId
        });

        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found or not yours'
            });
        }

        // Create a new task with a planId
        const newTask = await Task.create({
            planId,
            name: name.trim(),
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            progress,
            note
        });

        return res.status(201).json({
            success: true,
            data: newTask
        });
    } catch (error) {
        console.error('createTask error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};



// Get Tasks Controller: Retrieve paginated tasks for a user

exports.getTasks = async (req, res) => {
    try {
        const userId = req.user.userId;
        const {planId} = req.body;

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid planId'
            });
        }

        //Check if the plan exists and belongs to the user

        const plan = await Plan.findOne({
            _id: planId,
            userId: userId
        });
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found or not yours'
            });
        }

        const tasks = await Task.find({ planId: planId }).sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        console.error('getTasks error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
// Update Task Controller: Update task information, validate taskId, make a list of updatable features

exports.updateTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { taskId } = req.body;

        //validate taskId
        if(!mongoose.Types.ObjectId.isValid(taskId)){
            return res.status(400).json({
                success: false,
                message: 'Invalid taskId'
            });
        }

        // Find a task by ID 
        const task = await Task.findById(taskId);
        if(!task){
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if task planId belongs to the a Plan
        const plan = await Plan.findOne({
            _id: task.planId,
            userId: userId
        });

        if(!plan){
            return res.status(404).json({
                success: false,
                message: 'Not allowed'
            });
        }

        // Update task fields
        const updatableFields = ['name', 'startDate', 'endDate', 'status', 'note'];

        // Update data
        const updateData = {};
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }    
        });

        if(Object.keys(updateData).length === 0){
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTask) {
            return res.status(404).json({
                success: false,
                message: 'Task update failed'
            });
        }
    
        res.status(200).json({
            success: true,
            data: updatedTask
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Update task error'
        }); 
    }
};
// Delete Task Controller: Delete a task by ID


exports.deleteTask = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { taskId } = req.body ;

        //validate taskId
        if(!mongoose.Types.ObjectId.isValid(taskId)){
            return res.status(400).json({
                success: false,
                message: 'Invalid taskId'
            });
        }

        // Find a task by ID 
        const task = await Task.findById(taskId);
        if(!task){
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        // Check if task planId belongs to the a Plan
        const plan = await Plan.findOne({
            _id: task.planId,
            userId: userId
        });
        if(!plan){
            return res.status(404).json({
                success: false,
                message: 'Not allowed'
            });
        }
        
        // Delete a task
        const deleteTask = await Task.findByIdAndDelete(taskId);
        if (!deleteTask) {
            return res.status(404).json({
                success: false,
                message: 'Task delete failed'
            });
        }
    
        res.status(200).json({
            success: true,
            data: deleteTask
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Delete task error'
        }); 
    }
};

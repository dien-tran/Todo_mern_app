const mongoose = require('mongoose');
const Plan = require('../models/plan.model');

// Create Plan Controller: Create a new plan 
exports.createPlan = async (req, res) => {
    try {
        const { planName } = req.body;
        const userId = req.user.userId

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!planName || typeof planName !== 'string' || !planName.trim()) {
            return res.status(400).json({ success: false, message: 'planName is required' });
        }

        const newPlan = new Plan({
            name: planName.trim(),
            userId: userId,
            status: 'active'
        });

        await newPlan.save();

        return res.status(201).json({
            success: true,
            data: newPlan
        });
    } catch (error) {
        console.error('createPlan error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

//Get Plan Controller: Retrieve paginated plans for a user
exports.getPlans = async (req, res) => {
    try {
        const userId = req.user.userId;
        const statusQuery = req.query.status;

        let status = 'active';

        if (statusQuery) {
            if (statusQuery !== 'inactive') {
                return res.status(400).json({
                    success: false,
                    message: 'status must be inactive'
                });
            }
            status = 'inactive';
        }

        const plans = await Plan.find({
            userId,
            status
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('getPlans error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};



// Update Plan Controller: Update a plan status: active or inactive
exports.updatePlan = async (req, res) => {
    try {
        const { planId, status } = req.body;   // planId, status từ body
        const userId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({
                success: false,
                message: 'planId is invalid'
            });
        }

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const updatedPlan = await Plan.findOneAndUpdate(
            { _id: planId, userId },
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedPlan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: updatedPlan
        });
    } catch (error) {
        console.error('updatePlan error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

import mongoose from 'mongoose';
import Plan from '../models/plan.model.js';

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
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
        const skip = (page - 1) * limit;

        // filter: status=active|inactive|all
        const statusQuery = (req.query.status || 'active').toLowerCase();
        const filter = { userId };
        if (statusQuery === 'active' || statusQuery === 'inactive') {
            filter.status = statusQuery;
        } // else 'all' => no status filter

        const [total, plans] = await Promise.all([
            Plan.countDocuments(filter),
            Plan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        ]);

        return res.status(200).json({
            success: true,
            data: plans,
            meta: { total, page, limit }
        });
    } catch (error) {
        console.error('getPlans error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }  
};


// Update Plan Controller: Update a plan status: active or inactive
exports.updatePlan = async (req, res) => {
    try {
        const { planId } = req.body;
        const statusInput = req.body.status; // prefer "status", fallback "active"
        const userId = req.user.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (!planId) {
            return res.status(400).json({ success: false, message: 'planId is required' });
        }
        if (!mongoose.Types.ObjectId.isValid(planId)) {
            return res.status(400).json({ success: false, message: 'planId is invalid' });
        }

        // normalize/validate status -> 'active' | 'inactive'
        let status = null;
        if (typeof statusInput === 'string') {
            const s = statusInput.trim().toLowerCase();
            if (s === 'active' || s === 'inactive') status = s;
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'status must be "active" or "inactive"'
            });
        }

        const updatedPlan = await Plan.findOneAndUpdate(
            { _id: planId, userId: userId },
            { status },
            { new: true, runValidators: true }
        );

        if (!updatedPlan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        return res.status(200).json({ success: true, data: updatedPlan });
    } catch (error) {
        console.error('updatePlan error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

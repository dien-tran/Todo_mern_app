// Example: How to use the User-Plan relationship across databases

const mongoose = require('mongoose');
const Plan = require('./models/plan.model');
const User = require('./models/user.model');

/**
 * Example 1: Create a plan with user reference
 * This is already being done in the application
 */
async function createPlanExample(userId, planName) {
    const plan = new Plan({
        name: planName,
        userId: userId, // ObjectId reference to User
        status: 'active'
    });
    
    await plan.save();
    return plan;
}

/**
 * Example 2: Get plans and populate user information
 * This demonstrates the cross-database reference capability
 */
async function getPlansWithUserInfo(userId) {
    // Option A: Without population (current implementation)
    const plans = await Plan.find({ userId });
    
    // Option B: With population (new capability with ref: 'User')
    const plansWithUser = await Plan.find({ userId })
        .populate('userId', 'name email'); // Fetch user name and email
    
    return plansWithUser;
}

/**
 * Example 3: Get a specific plan with user details
 */
async function getPlanById(planId) {
    const plan = await Plan.findById(planId)
        .populate('userId', 'name email');
    
    return plan;
    // Result will be:
    // {
    //   _id: "...",
    //   name: "My Plan",
    //   userId: {
    //     _id: "...",
    //     name: "John Doe",
    //     email: "john@example.com"
    //   },
    //   status: "active",
    //   createdAt: "...",
    //   updatedAt: "..."
    // }
}

/**
 * Example 4: Get full hierarchy User -> Plans -> Tasks
 */
async function getFullUserHierarchy(userId) {
    const Task = require('./models/task.model');
    
    // Get user's plans with user info
    const plans = await Plan.find({ userId })
        .populate('userId', 'name email');
    
    // Get tasks for these plans
    const planIds = plans.map(p => p._id);
    const tasks = await Task.find({ planID: { $in: planIds } })
        .populate('planID', 'name status');
    
    return {
        user: plans[0]?.userId,  // User info from populated field
        plans: plans,
        tasks: tasks
    };
}

/**
 * Example 5: Verify plan belongs to user (security check)
 */
async function verifyPlanOwnership(planId, userId) {
    const plan = await Plan.findOne({ 
        _id: planId, 
        userId: userId 
    });
    
    if (!plan) {
        throw new Error('Plan not found or does not belong to user');
    }
    
    return plan;
}

module.exports = {
    createPlanExample,
    getPlansWithUserInfo,
    getPlanById,
    getFullUserHierarchy,
    verifyPlanOwnership
};

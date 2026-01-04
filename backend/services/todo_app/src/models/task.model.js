const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    planID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
        required: true
    },
    name: {
        type: String,
        required: [true, 'Task name is required'],
        trim: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    status: {
        type: String,
        enum: {
            values: ["not started", "in_process", "done"],
            message: "Status must be either not started, in_process or done"
        },
        default: "not started"
    },
    note: {
        type: String,
        maxlength: [300, "Note must not exceed 300 characters"],
        trim: true,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
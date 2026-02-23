const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Rent', 'Electricity', 'Trainer Salary', 'Equipment', 'Misc'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentMode: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank'],
        required: true
    },
    expenseDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster searching by title and date
expenseSchema.index({ title: 1 });
expenseSchema.index({ expenseDate: 1 });

module.exports = mongoose.model('Expense', expenseSchema);

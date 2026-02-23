const mongoose = require('mongoose');

const financialSummarySchema = new mongoose.Schema({
    month: {
        type: String, // YYYY-MM format
        required: true,
        unique: true
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    totalExpenses: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Static method to update summary
financialSummarySchema.statics.updateRevenue = async function (month, amount) {
    return await this.findOneAndUpdate(
        { month },
        {
            $inc: { totalRevenue: amount },
            $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
    );
};

financialSummarySchema.statics.updateExpenses = async function (month, amount) {
    return await this.findOneAndUpdate(
        { month },
        {
            $inc: { totalExpenses: amount },
            $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('FinancialSummary', financialSummarySchema);

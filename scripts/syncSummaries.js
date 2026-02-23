require('dotenv').config();
const mongoose = require('mongoose');
const MemberFee = require('../models/MemberFee');
const Expense = require('../models/Expense');
const FinancialSummary = require('../models/FinancialSummary');
const { format } = require('date-fns');

const sync = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing summaries to avoid duplicates/confusion during first sync
        await FinancialSummary.deleteMany({});
        console.log('Cleared existing summaries');

        const summaries = {};

        // 1. Process Paid Fees
        const paidFees = await MemberFee.find({ paymentStatus: 'Paid' });
        console.log(`Processing ${paidFees.length} paid fees...`);
        for (const fee of paidFees) {
            const monthStr = format(fee.visitStartDate, 'yyyy-MM');
            if (!summaries[monthStr]) {
                summaries[monthStr] = { totalRevenue: 0, totalExpenses: 0 };
            }
            summaries[monthStr].totalRevenue += (fee.feeAmount || 0);
        }

        // 2. Process Expenses
        const expenses = await Expense.find({});
        console.log(`Processing ${expenses.length} expenses...`);
        for (const exp of expenses) {
            const monthStr = format(exp.expenseDate, 'yyyy-MM');
            if (!summaries[monthStr]) {
                summaries[monthStr] = { totalRevenue: 0, totalExpenses: 0 };
            }
            summaries[monthStr].totalExpenses += (exp.amount || 0);
        }

        // 3. Save Summaries
        console.log('Saving summaries to database...');
        for (const [month, data] of Object.entries(summaries)) {
            await FinancialSummary.create({
                month,
                totalRevenue: data.totalRevenue,
                totalExpenses: data.totalExpenses
            });
            console.log(`Synced ${month}: Revenue ₹${data.totalRevenue}, Expenses ₹${data.totalExpenses}`);
        }

        console.log('Financial summary sync complete!');
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err);
        process.exit(1);
    }
};

sync();

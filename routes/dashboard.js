const express = require('express');
const router = express.Router();
const MemberFee = require('../models/MemberFee');
const Expense = require('../models/Expense');
const { startOfMonth, endOfMonth, startOfYear, endOfYear, format } = require('date-fns');

router.get('/', async (req, res) => {
    try {
        let { month, year } = req.query;
        let dateQuery = {};
        let periodLabel = '';

        if (month) {
            const date = new Date(month);
            dateQuery = {
                $gte: startOfMonth(date),
                $lte: endOfMonth(date)
            };
            periodLabel = format(date, 'MMMM yyyy');
        } else if (year) {
            const date = new Date(`${year}-01-01`);
            dateQuery = {
                $gte: startOfYear(date),
                $lte: endOfYear(date)
            };
            periodLabel = year;
        } else {
            const date = new Date();
            dateQuery = {
                $gte: startOfMonth(date),
                $lte: endOfMonth(date)
            };
            periodLabel = format(date, 'MMMM yyyy');
            month = format(date, 'yyyy-MM'); // Set default for links
        }

        // Total Paid Fees
        const fees = await MemberFee.find({
            visitStartDate: dateQuery,
            paymentStatus: 'Paid'
        });
        const totalFees = fees.reduce((sum, f) => sum + (f.feeAmount || 0), 0);

        // Total Expenses
        const expenses = await Expense.find({
            expenseDate: dateQuery
        });
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        const netProfit = totalFees - totalExpenses;

        const expenseByCategory = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
            return acc;
        }, {});

        res.render('dashboard/index', {
            summary: {
                totalRevenue: totalFees,
                totalExpenses: totalExpenses,
                netResult: netProfit
            },
            totalFees, // Keep for potential legacy use or other parts of the view
            totalExpenses,
            netProfit,
            periodLabel,
            expenseByCategory,
            month: month || format(new Date(), 'yyyy-MM'),
            year,
            title: 'Profit & Loss Dashboard'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

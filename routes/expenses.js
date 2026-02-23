const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Admin = require('../models/Admin');
const FinancialSummary = require('../models/FinancialSummary');
const { startOfMonth, endOfMonth, startOfYear, endOfYear, format } = require('date-fns');

// Get all expenses
router.get('/', async (req, res) => {
    try {
        let { month, category } = req.query;
        if (!month) {
            month = format(new Date(), 'yyyy-MM');
        }
        let query = {};

        if (month) {
            const date = new Date(month);
            query.expenseDate = {
                $gte: startOfMonth(date),
                $lte: endOfMonth(date)
            };
        }

        if (category) {
            query.category = category;
        }

        const expenses = await Expense.find(query).sort({ expenseDate: -1 });
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        res.render('expenses/index', {
            expenses,
            totalAmount,
            month,
            category,
            title: 'Gym Expenses',
            error: req.query.error
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add new expense
router.post('/', async (req, res) => {
    try {
        const { title, category, amount, paymentMode, expenseDate } = req.body;
        const newExpense = new Expense({
            title,
            category,
            amount,
            paymentMode,
            expenseDate: expenseDate || new Date()
        });
        await newExpense.save();

        // Update Financial Summary
        const monthStr = format(newExpense.expenseDate, 'yyyy-MM');
        await FinancialSummary.updateExpenses(monthStr, newExpense.amount);

        res.redirect('/expenses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Secure Delete Expense
router.post('/delete/:id', async (req, res) => {
    try {
        const { adminPassword } = req.body;
        const adminId = req.session.adminId;

        const admin = await Admin.findById(adminId);
        if (!admin || !(await admin.comparePassword(adminPassword))) {
            return res.redirect(`/expenses?error=Invalid admin password authentication failed`);
        }

        const expense = await Expense.findByIdAndDelete(req.params.id);

        // Update Financial Summary (subtract deleted amount)
        if (expense) {
            const monthStr = format(expense.expenseDate, 'yyyy-MM');
            await FinancialSummary.updateExpenses(monthStr, -expense.amount);
        }

        res.redirect('/expenses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

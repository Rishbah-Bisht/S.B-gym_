const express = require('express');
const router = express.Router();
const MemberFee = require('../models/MemberFee');
const Admin = require('../models/Admin');
const FinancialSummary = require('../models/FinancialSummary');
const { startOfMonth, endOfMonth, format } = require('date-fns');

// Get all entries with filtering
router.get('/', async (req, res) => {
    try {
        let { month, search } = req.query;
        if (!month) {
            month = format(new Date(), 'yyyy-MM');
        }
        let query = {};

        if (month) {
            const date = new Date(month);
            query.visitStartDate = {
                $gte: startOfMonth(date),
                $lte: endOfMonth(date)
            };
        }

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        const entries = await MemberFee.find(query).sort({ visitStartDate: -1 }).limit(5);
        res.render('memberFees/index', { entries, month, search, title: 'Member Entry', error: req.query.error });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add new entry (unpaid by default, no payment info)
router.post('/', async (req, res) => {
    try {
        const { name, phone, feeAmount, visitStartDate } = req.body;
        const newEntry = new MemberFee({
            name,
            phone,
            feeAmount,
            visitStartDate: visitStartDate || new Date(),
            paymentStatus: 'Unpaid'
        });
        await newEntry.save();
        res.redirect('/member-fees');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Secure Payment Process
router.post('/pay/:id', async (req, res) => {
    try {
        const { paymentMode, adminPassword } = req.body;
        const adminId = req.session.adminId;

        // Verify Admin Password
        const admin = await Admin.findById(adminId);
        if (!admin || !(await admin.comparePassword(adminPassword))) {
            return res.redirect(`/member-fees?error=Invalid admin password authentication failed`);
        }

        // Update Member Entry
        const updatedEntry = await MemberFee.findByIdAndUpdate(req.params.id, {
            paymentStatus: 'Paid',
            paymentMode,
            paidAt: new Date()
        }, { new: true });

        // Update Financial Summary
        if (updatedEntry) {
            const monthStr = format(updatedEntry.visitStartDate, 'yyyy-MM');
            await FinancialSummary.updateRevenue(monthStr, updatedEntry.feeAmount);
        }

        res.redirect('/member-fees');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// NO DELETE for member entries as per requirements
// router.post('/delete/:id', ...) - Removed

module.exports = router;

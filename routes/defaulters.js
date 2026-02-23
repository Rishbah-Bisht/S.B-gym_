const express = require('express');
const router = express.Router();
const MemberFee = require('../models/MemberFee');
const { startOfMonth, endOfMonth, format, isBefore } = require('date-fns');

router.get('/', async (req, res) => {
    try {
        const { month } = req.query;
        const selectedMonth = month ? new Date(month) : new Date();
        const startOfSelected = startOfMonth(selectedMonth);
        const endOfSelected = endOfMonth(selectedMonth);

        // A member is a defaulter if:
        // 1. Entry exists
        // 2. Payment Status = Unpaid
        // 3. Visit month has passed (relative to current date) OR they are just unpaid this month

        // Let's find all Unpaid entries
        const unpaidEntries = await MemberFee.find({
            paymentStatus: 'Unpaid'
        });

        const defaulters = unpaidEntries.map(entry => {
            const visitDate = new Date(entry.visitStartDate);
            return {
                name: entry.name,
                visitDate: entry.visitStartDate,
                feeAmount: entry.feeAmount,
                monthMissing: format(visitDate, 'MMMM yyyy'),
                status: 'Defaulter'
            };
        });

        res.render('defaulters/index', {
            defaulters,
            month: format(selectedMonth, 'yyyy-MM'),
            title: 'Defaulter Management'
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

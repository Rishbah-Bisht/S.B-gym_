const express = require('express');
const router = express.Router();
const MemberFee = require('../models/MemberFee');
const Expense = require('../models/Expense');
const PDFDocument = require('pdfkit');
const { startOfMonth, endOfMonth, format } = require('date-fns');

// Download Monthly Fee Collection PDF
router.get('/fees/pdf', async (req, res) => {
    try {
        const { month } = req.query;
        let query = {};
        if (!month) {
            query.visitStartDate = {
                $gte: startOfMonth(new Date()),
                $lte: endOfMonth(new Date())
            };
        } else {
            const date = new Date(month);
            query.visitStartDate = {
                $gte: startOfMonth(date),
                $lte: endOfMonth(date)
            };
        }
        const entries = await MemberFee.find(query).sort({ visitStartDate: 1 });

        const doc = new PDFDocument({ margin: 50 });
        res.header('Content-Type', 'application/pdf');
        res.attachment(`fees_report_${month || format(new Date(), 'yyyy-MM')}.pdf`);
        doc.pipe(res);

        // Header Section
        doc.rect(0, 0, 612, 100).fill('#1e293b'); // Navy background
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DOBHAL S.B. HEALTH CLUB', 50, 35);
        doc.fontSize(12).font('Helvetica').text('Monthly Fee Collection Report', 50, 65);
        doc.fontSize(10).text(`Period: ${month ? format(new Date(month), 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}`, 50, 80);

        doc.moveDown(4);

        // Table Header
        const tableTop = 150;
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10);
        doc.text('No.', 50, tableTop);
        doc.text('Member Name', 100, tableTop);
        doc.text('Visit Date', 280, tableTop);
        doc.text('Mode', 380, tableTop);
        doc.text('Amount (₹)', 480, tableTop, { align: 'right', width: 70 });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e2e8f0').stroke();

        let rowY = tableTop + 25;
        let total = 0;

        entries.forEach((entry, index) => {
            if (index % 2 === 0) doc.rect(50, rowY - 5, 500, 20).fill('#f8fafc').fillColor('#334155');
            else doc.fillColor('#334155');

            doc.font('Helvetica').fontSize(9);
            doc.text(index + 1, 50, rowY);
            doc.text(entry.name, 100, rowY);
            doc.text(format(entry.visitStartDate, 'dd MMM yyyy'), 280, rowY);
            doc.text(entry.paymentMode || 'N/A', 380, rowY);
            doc.text(entry.feeAmount.toLocaleString('en-IN'), 480, rowY, { align: 'right', width: 70 });

            total += entry.feeAmount;
            rowY += 20;

            if (rowY > 700) { doc.addPage(); rowY = 50; }
        });

        // Summary Footer
        doc.moveDown(2);
        const footerY = Math.min(rowY + 20, 750);
        doc.rect(350, footerY, 200, 30).fill('#f1f5f9');
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(12);
        doc.text('Total Collected:', 360, footerY + 10);
        doc.text(`₹${total.toLocaleString('en-IN')}`, 480, footerY + 10, { align: 'right', width: 60 });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Download Monthly Expense Report PDF
router.get('/expenses/pdf', async (req, res) => {
    try {
        const { month } = req.query;
        let query = {};
        if (!month) {
            query.expenseDate = { $gte: startOfMonth(new Date()), $lte: endOfMonth(new Date()) };
        } else {
            const date = new Date(month);
            query.expenseDate = { $gte: startOfMonth(date), $lte: endOfMonth(date) };
        }
        const expenses = await Expense.find(query).sort({ expenseDate: 1 });

        const doc = new PDFDocument({ margin: 50 });
        res.header('Content-Type', 'application/pdf');
        res.attachment(`expenses_report_${month || format(new Date(), 'yyyy-MM')}.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#ef4444'); // Red Header for Expenses
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DOBHAL S.B. HEALTH CLUB', 50, 35);
        doc.fontSize(12).font('Helvetica').text('Monthly Expense Report', 50, 65);
        doc.fontSize(10).text(`Period: ${month ? format(new Date(month), 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}`, 50, 80);

        const tableTop = 150;
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10).text('No.', 50, tableTop);
        doc.text('Description', 100, tableTop);
        doc.text('Category', 280, tableTop);
        doc.text('Date', 380, tableTop);
        doc.text('Amount (₹)', 480, tableTop, { align: 'right', width: 70 });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e2e8f0').stroke();

        let rowY = tableTop + 25;
        let total = 0;

        expenses.forEach((exp, index) => {
            if (index % 2 === 0) doc.rect(50, rowY - 5, 500, 20).fill('#fff5f5').fillColor('#334155');
            else doc.fillColor('#334155');

            doc.font('Helvetica').fontSize(9);
            doc.text(index + 1, 50, rowY);
            doc.text(exp.title, 100, rowY);
            doc.text(exp.category, 280, rowY);
            doc.text(format(exp.expenseDate, 'dd MMM yyyy'), 380, rowY);
            doc.text(exp.amount.toLocaleString('en-IN'), 480, rowY, { align: 'right', width: 70 });

            total += exp.amount;
            rowY += 20;
            if (rowY > 700) { doc.addPage(); rowY = 50; }
        });

        const footerY = Math.min(rowY + 20, 750);
        doc.rect(350, footerY, 200, 30).fill('#fee2e2');
        doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(12);
        doc.text('Total Expense:', 360, footerY + 10);
        doc.text(`₹${total.toLocaleString('en-IN')}`, 480, footerY + 10, { align: 'right', width: 60 });
        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Download Defaulters PDF
router.get('/defaulters/pdf', async (req, res) => {
    try {
        const { month } = req.query;
        const unpaidEntries = await MemberFee.find({ paymentStatus: 'Unpaid' });

        const doc = new PDFDocument({ margin: 50 });
        res.header('Content-Type', 'application/pdf');
        res.attachment(`defaulters_report.pdf`);
        doc.pipe(res);

        doc.rect(0, 0, 612, 100).fill('#7c3aed'); // Purple Header for Defaulters
        doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('DOBHAL S.B. HEALTH CLUB', 50, 35);
        doc.fontSize(12).font('Helvetica').text('Active Defaulter List', 50, 65);
        doc.fontSize(10).text(`Generated: ${format(new Date(), 'dd MMMM yyyy HH:mm')}`, 50, 80);

        const tableTop = 150;
        doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10).text('No.', 50, tableTop);
        doc.text('Member Name', 100, tableTop);
        doc.text('Phone', 250, tableTop);
        doc.text('Due Date', 380, tableTop);
        doc.text('Amount (₹)', 480, tableTop, { align: 'right', width: 70 });

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).strokeColor('#e2e8f0').stroke();

        let rowY = tableTop + 25;
        let total = 0;

        unpaidEntries.forEach((entry, index) => {
            if (index % 2 === 0) doc.rect(50, rowY - 5, 500, 20).fill('#f5f3ff').fillColor('#334155');
            else doc.fillColor('#334155');

            doc.font('Helvetica').fontSize(9);
            doc.text(index + 1, 50, rowY);
            doc.text(entry.name, 100, rowY);
            doc.text(entry.phone || 'N/A', 250, rowY);
            doc.text(format(entry.visitStartDate, 'dd MMM yyyy'), 380, rowY);
            doc.text(entry.feeAmount.toLocaleString('en-IN'), 480, rowY, { align: 'right', width: 70 });

            total += entry.feeAmount;
            rowY += 20;
            if (rowY > 700) { doc.addPage(); rowY = 50; }
        });

        const footerY = Math.min(rowY + 20, 750);
        doc.rect(350, footerY, 200, 30).fill('#ede9fe');
        doc.fillColor('#5b21b6').font('Helvetica-Bold').fontSize(12);
        doc.text('Total Pending:', 360, footerY + 10);
        doc.text(`₹${total.toLocaleString('en-IN')}`, 480, footerY + 10, { align: 'right', width: 60 });
        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

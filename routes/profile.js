const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');

// Get Profile Page
router.get('/', async (req, res) => {
    try {
        const admin = await Admin.findById(req.session.adminId);
        res.render('profile', {
            title: 'Admin Profile',
            admin,
            success: req.query.success,
            error: req.query.error
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Update Profile
router.post('/update', async (req, res) => {
    try {
        const { name, phone, username, password } = req.body;
        const adminId = req.session.adminId;

        const updateData = { name, phone, username };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await Admin.findByIdAndUpdate(adminId, updateData);

        // Update session info
        req.session.username = username;
        req.session.adminName = name || username;

        res.redirect('/profile?success=Profile updated successfully');
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.redirect('/profile?error=Username or Phone already exists');
        }
        res.redirect('/profile?error=Failed to update profile');
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Login Page
router.get('/', (req, res) => {
    if (req.session.adminId) return res.redirect('/dashboard');
    res.render('login', { title: 'Admin Login', error: null, layout: false });
});

// Handle Login
router.post('/', async (req, res) => {
    try {
        const { phone, password } = req.body;
        // Search by phone OR username (to stay flexible but label is phone)
        const admin = await Admin.findOne({
            $or: [
                { phone: phone },
                { username: phone }
            ]
        });

        if (admin && await admin.comparePassword(password)) {
            req.session.adminId = admin._id;
            req.session.username = admin.username;
            req.session.adminName = admin.name || admin.username;
            return res.redirect('/dashboard');
        }

        res.render('login', {
            title: 'Admin Login',
            error: 'Invalid username or password',
            layout: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;

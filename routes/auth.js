const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');

// Login Page
router.get('/', async (req, res) => {
    if (req.session.adminId) return res.redirect('/dashboard');

    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        return res.redirect('/login/signup');
    }

    res.render('login', { title: 'Admin Login', error: null, layout: false });
});

// Signup Page
router.get('/signup', async (req, res) => {
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
        return res.redirect('/login');
    }
    res.render('signup', { title: 'Initial Admin Setup', error: null, layout: false });
});

// Handle Signup
router.post('/signup', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount > 0) {
            return res.redirect('/login');
        }

        const { name, username, phone, password } = req.body;

        const newAdmin = new Admin({
            name,
            username,
            phone,
            password
        });

        await newAdmin.save();
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.render('signup', {
            title: 'Initial Admin Setup',
            error: 'Failed to create admin. Username/Phone might already exist.',
            layout: false
        });
    }
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

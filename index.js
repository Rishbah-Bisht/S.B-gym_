require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const expressLayouts = require('express-ejs-layouts');

const session = require('express-session');
const MongoStore = require('connect-mongo');
const { ensureAuthenticated } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

if (IS_PROD) {
    app.set('trust proxy', 1); // Trust first proxy (e.g. Nginx, Heroku, etc)
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for EJS inline scripts if needed, or configure properly
}));

// Session configuration
if (!process.env.MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1);
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'gym_fallback_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        secure: IS_PROD, // Only send cookie over HTTPS in production
        httpOnly: true, // Prevent client-side JS from accessing the cookie
        sameSite: 'lax' // CSRF protection
    }
}));

// Global variables for templates
app.use((req, res, next) => {
    const adminId = req.session.adminId;
    res.locals.isAuthenticated = !!adminId;
    res.locals.adminUser = adminId ? {
        username: req.session.username || 'Admin',
        name: req.session.adminName || req.session.username || 'Admin'
    } : null;
    next();
});

// Set EJS as templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Routes
app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

// Auth Routes (Unprotected)
app.use('/login', require('./routes/auth'));

// Protected Routes
app.use('/dashboard', ensureAuthenticated, require('./routes/dashboard'));
app.use('/member-fees', ensureAuthenticated, require('./routes/memberFees'));
app.use('/expenses', ensureAuthenticated, require('./routes/expenses'));
app.use('/defaulters', ensureAuthenticated, require('./routes/defaulters'));
app.use('/reports', ensureAuthenticated, require('./routes/reports'));
app.use('/profile', ensureAuthenticated, require('./routes/profile'));


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

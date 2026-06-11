require('dotenv').config();
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const koffi = require('koffi');
const mysql = require('./db/mysql');
// const db = require('./database');

// Import routes
const dashboardRoutes = require('./routes/dashboard');
const staffRoutes = require('./routes/staff');
const guestRoutes = require('./routes/guests');
const reservationRoutes = require('./routes/reservations');
const roomRoutes = require('./routes/rooms');
const cardLogsRoutes = require('./routes/cardLogs');
const roomsLockRoutes = require('./routes/roomsLock');
const checkinRoutes = require('./routes/checkin');
const checkoutRoutes = require('./routes/checkout');
const extensionsRoutes = require('./routes/extensions');
const transactionsRoutes = require('./routes/transactions');
const profileRoutes = require('./routes/profile');
const logoutRoutes = require('./routes/logout');

const PORT = process.env.PORT || 3000;

const app = express();

// Sessions + flash messages
const session = require('express-session');
const flash = require('connect-flash');

app.use(session({
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

// expose flash messages and DB availability to all views
app.use((req, res, next) => {
    res.locals.flash = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    res.locals.dbAvailable = mysql.isDbAvailable();
    next();
});

// ========================
// VIEW ENGINE
// ========================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts);
app.set('layout', 'layout');

// ========================
// STATIC FILES
// ========================
app.use(express.static(path.join(__dirname, 'public')));

// ========================
// BODY PARSERS
// ========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========================
// ACTIVE MENU HELPER (FIXED)
// ========================
app.use((req, res, next) => {
    res.locals.isActive = (url) => {
        if (url === '/') {
            return req.path === '/' ? 'active' : '';
        }

        return req.path.startsWith(url) ? 'active' : '';
    };

    next();
});

// ========================
// ROUTES
// ========================
app.use('/', dashboardRoutes);
app.use('/staff', staffRoutes);
app.use('/guests', guestRoutes);
app.use('/reservations', reservationRoutes);
app.use('/rooms', roomRoutes);
app.use('/card-logs', cardLogsRoutes);
app.use('/rooms-lock', roomsLockRoutes);
app.use('/checkin', checkinRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/extends', extensionsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/profile', profileRoutes);
app.use('/logout', logoutRoutes);

// Legacy redirect for /guest to /guests
// app.get('/guest', (req, res) => {
//     res.redirect('/guests');
// });

// ========================
// 404 HANDLER (MUST BE LAST ROUTE)
// ========================
app.use((req, res) => {
    res.status(404).render('errors/404', { layout: false });
});

// ========================
// 500 ERROR HANDLER
// ========================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('errors/500', { layout: false });
});

// ========================
// START SERVER
// ========================
async function startServer() {
    try {
        await mysql.init();
        console.log('MySQL initialized successfully');
    } catch (err) {
        console.error('MySQL init failed:', err.message || err);
    }

    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
    });
}

startServer();

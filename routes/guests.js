const express = require('express');
const router = express.Router();
const mysql = require('../db/mysql');

// List all guests
router.get('/', async (req, res) => {
    let guests = [];
    if (mysql.isDbAvailable()) {
        try {
            guests = await mysql.getGuests();
        } catch (err) {
            console.error('Error loading guests:', err);
            req.flash('error', 'Unable to load guests from MySQL');
        }
    } else {
        req.flash('error', 'MySQL is not configured');
    }

    res.render('guest/index', {
        title: 'Guests',
        guests
    });
});

// Booking form after room selection
router.get('/book', (req, res) => {
    res.render('guest/form', {
        title: 'Book Room',
        guest: null,
        selectedRoom: null
    });
});

// Create guest form
router.get('/new', (req, res) => {
    res.render('guest/form', {
        title: 'New Guest',
        guest: null
    });
});

// Edit guest form
router.get('/:id/edit', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/guests');
    }

    const id = parseInt(req.params.id, 10);
    try {
        const guest = await mysql.getGuestById(id);
        if (!guest) {
            req.flash('error', 'Guest not found');
            return res.redirect('/guests');
        }

        res.render('guest/form', {
            title: 'Edit Guest',
            guest
        });
    } catch (err) {
        console.error('Error loading guest:', err);
        req.flash('error', 'Unable to load guest');
        res.redirect('/guests');
    }
});

// ========================
// API ENDPOINTS FOR VALIDATION
// ========================

// Check if email already exists
router.post('/api/check-email', async (req, res) => {
    const { email, guestId } = req.body;
    if (!email || !mysql.isDbAvailable()) {
        return res.json({ exists: false });
    }

    try {
        const exists = await mysql.emailExists(email, Number(guestId) || 0);
        res.json({ exists });
    } catch (err) {
        console.error('Email validation error:', err);
        res.json({ exists: false });
    }
});

// Check if mobile number already exists
router.post('/api/check-mobile', async (req, res) => {
    const { mobile, guestId } = req.body;
    if (!mobile || !mysql.isDbAvailable()) {
        return res.json({ exists: false });
    }

    try {
        const exists = await mysql.mobileExists(mobile, Number(guestId) || 0);
        res.json({ exists });
    } catch (err) {
        console.error('Mobile validation error:', err);
        res.json({ exists: false });
    }
});

// ========================
// FORM SUBMISSION
// ========================

// Create guest and booking (POST)
router.post('/', async (req, res) => {
    const {
        id,
        fullname,
        email,
        mobile,
        gender,
        address,
        bookingType,
        roomId,
        checkinDate,
        checkinTime,
        checkoutDate,
        checkoutTime,
        paymentMethod,
        totalAmount
    } = req.body;

    if (!fullname || !email || !mobile) {
        return res.status(400).render('guest/form', {
            title: id ? 'Edit Guest' : 'New Guest',
            guest: req.body,
            error: 'Full Name, Email, and Mobile are required'
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).render('guest/form', {
            title: id ? 'Edit Guest' : 'New Guest',
            guest: req.body,
            error: 'Invalid email format'
        });
    }

    const mobileRegex = /^[0-9\+\-\(\)\s]{10,}$/;
    if (!mobileRegex.test(mobile)) {
        return res.status(400).render('guest/form', {
            title: id ? 'Edit Guest' : 'New Guest',
            guest: req.body,
            error: 'Mobile must be at least 10 digits'
        });
    }

    if (checkoutDate && checkinDate) {
        const checkin = new Date(checkinDate);
        const checkout = new Date(checkoutDate);
        if (checkout <= checkin) {
            return res.status(400).render('guest/form', {
                title: id ? 'Edit Guest' : 'New Guest',
                guest: req.body,
                error: 'Checkout date must be after check-in date'
            });
        }
    }

    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/guests');
    }

    try {
        const currentId = id ? Number(id) : 0;
        const emailTaken = await mysql.emailExists(email, currentId);
        if (emailTaken) {
            return res.status(400).render('guest/form', {
                title: id ? 'Edit Guest' : 'New Guest',
                guest: req.body,
                error: 'Email is already in use'
            });
        }

        const mobileTaken = await mysql.mobileExists(mobile, currentId);
        if (mobileTaken) {
            return res.status(400).render('guest/form', {
                title: id ? 'Edit Guest' : 'New Guest',
                guest: req.body,
                error: 'Mobile number is already in use'
            });
        }

        let guestId = currentId;
        if (guestId) {
            await mysql.updateGuest(guestId, { fullname, email, mobile, gender, address });
        } else {
            guestId = await mysql.createGuest({ fullname, email, mobile, gender, address });
        }

        const reservationData = {
            guestId,
            roomId: Number(roomId) || null,
            bookingType: bookingType || 'reservation',
            checkinDate,
            checkinTime: checkinTime || null,
            checkoutDate,
            checkoutTime: checkoutTime || null,
            paymentMethod: paymentMethod || 'cash',
            totalAmount: Number(totalAmount) || 0,
            status: 'pending'
        };

        if (guestId) {
            const existingReservation = await mysql.getReservationByGuestId(guestId);
            if (existingReservation) {
                await mysql.updateReservation(existingReservation.id, reservationData);
            } else {
                await mysql.createReservation(reservationData);
            }
        }

        req.flash('success', 'Booking saved successfully');
        res.redirect('/reservations');
    } catch (err) {
        console.error('Error saving guest booking:', err);
        res.status(500).render('guest/form', {
            title: id ? 'Edit Guest' : 'New Guest',
            guest: req.body,
            error: 'Unable to save booking'
        });
    }
});

// Update guest (POST)
router.post('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        fullname,
        email,
        mobile,
        gender,
        address,
        bookingType,
        roomId,
        checkinDate,
        checkinTime,
        checkoutDate,
        checkoutTime,
        paymentMethod,
        totalAmount
    } = req.body;

    if (!fullname || !email || !mobile) {
        return res.status(400).render('guest/form', {
            title: 'Edit Guest',
            guest: req.body,
            error: 'Full Name, Email, and Mobile are required'
        });
    }

    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/guests');
    }

    try {
        const guestId = Number(id);
        const emailTaken = await mysql.emailExists(email, guestId);
        if (emailTaken) {
            return res.status(400).render('guest/form', {
                title: 'Edit Guest',
                guest: req.body,
                error: 'Email is already in use'
            });
        }

        const mobileTaken = await mysql.mobileExists(mobile, guestId);
        if (mobileTaken) {
            return res.status(400).render('guest/form', {
                title: 'Edit Guest',
                guest: req.body,
                error: 'Mobile number is already in use'
            });
        }

        await mysql.updateGuest(guestId, { fullname, email, mobile, gender, address });

        const reservationData = {
            guestId,
            roomId: Number(roomId) || null,
            bookingType: bookingType || 'reservation',
            checkinDate,
            checkinTime: checkinTime || null,
            checkoutDate,
            checkoutTime: checkoutTime || null,
            paymentMethod: paymentMethod || 'cash',
            totalAmount: Number(totalAmount) || 0,
            status: 'pending'
        };

        const existingReservation = await mysql.getReservationByGuestId(guestId);
        if (existingReservation) {
            await mysql.updateReservation(existingReservation.id, reservationData);
        } else {
            await mysql.createReservation(reservationData);
        }

        req.flash('success', 'Guest and booking updated successfully');
        res.redirect('/reservations');
    } catch (err) {
        console.error('Error updating guest booking:', err);
        res.status(500).render('guest/form', {
            title: 'Edit Guest',
            guest: req.body,
            error: 'Unable to update guest booking'
        });
    }
});

// Delete guest (POST)
router.post('/:id/delete', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/guests');
    }

    const id = Number(req.params.id);
    try {
        await mysql.deleteGuest(id);
        req.flash('success', 'Guest deleted successfully');
    } catch (err) {
        console.error('Error deleting guest:', err);
        req.flash('error', 'Unable to delete guest');
    }

    res.redirect('/guests');
});

module.exports = router;

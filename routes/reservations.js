const express = require('express');
const router = express.Router();
const mysql = require('../db/mysql');

// List all reservations
router.get('/', async (req, res) => {
    let reservations = [];
    if (mysql.isDbAvailable()) {
        try {
            reservations = await mysql.getReservations();
        } catch (err) {
            console.error('Error loading reservations:', err);
            req.flash('error', 'Unable to load reservations from MySQL');
        }
    } else {
        req.flash('error', 'MySQL is not configured');
    }

    res.render('reservations/index', {
        title: 'Reservations',
        reservations
    });
});

// Redirect create reservation to guest booking UI
router.get('/new', (req, res) => {
    res.redirect('/guests/new');
});

// Redirect edit reservation to guest edit if possible
router.get('/:id/edit', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/reservations');
    }

    const id = parseInt(req.params.id, 10);
    try {
        const reservation = await mysql.getReservationById(id);
        if (!reservation) {
            req.flash('error', 'Reservation not found');
            return res.redirect('/reservations');
        }
        res.redirect(`/guests/${reservation.guestId}/edit`);
    } catch (err) {
        console.error('Error fetching reservation:', err);
        req.flash('error', 'Unable to fetch reservation details');
        res.redirect('/reservations');
    }
});

// Create reservation (POST)
router.post('/', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/reservations');
    }

    const {
        guestId,
        roomId,
        bookingType,
        checkinDate,
        checkinTime,
        checkoutDate,
        checkoutTime,
        paymentMethod,
        totalAmount
    } = req.body;

    if (!guestId || !roomId) {
        req.flash('error', 'Guest and room selection are required');
        return res.redirect('/reservations');
    }

    try {
        await mysql.createReservation({
            guestId: Number(guestId),
            roomId: Number(roomId),
            bookingType: bookingType || 'reservation',
            checkinDate,
            checkinTime: checkinTime || null,
            checkoutDate,
            checkoutTime: checkoutTime || null,
            paymentMethod: paymentMethod || 'cash',
            totalAmount: Number(totalAmount) || 0,
            status: 'pending'
        });
        req.flash('success', 'Reservation saved successfully');
    } catch (err) {
        console.error('Error creating reservation:', err);
        req.flash('error', 'Unable to create reservation');
    }

    res.redirect('/reservations');
});

// Update reservation (POST)
router.post('/:id', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/reservations');
    }

    const id = parseInt(req.params.id, 10);
    const {
        roomId,
        bookingType,
        checkinDate,
        checkinTime,
        checkoutDate,
        checkoutTime,
        paymentMethod,
        totalAmount,
        status
    } = req.body;

    try {
        await mysql.updateReservation(id, {
            roomId: Number(roomId) || null,
            bookingType: bookingType || 'reservation',
            checkinDate,
            checkinTime: checkinTime || null,
            checkoutDate,
            checkoutTime: checkoutTime || null,
            paymentMethod: paymentMethod || 'cash',
            totalAmount: Number(totalAmount) || 0,
            status: status || 'pending'
        });
        req.flash('success', 'Reservation updated successfully');
    } catch (err) {
        console.error('Error updating reservation:', err);
        req.flash('error', 'Unable to update reservation');
    }

    res.redirect('/reservations');
});

// Delete reservation (POST)
router.post('/:id/delete', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/reservations');
    }

    const id = parseInt(req.params.id, 10);
    try {
        await mysql.deleteReservation(id);
        req.flash('success', 'Reservation deleted');
    } catch (err) {
        console.error('Error deleting reservation:', err);
        req.flash('error', 'Unable to delete reservation');
    }

    res.redirect('/reservations');
});

module.exports = router;

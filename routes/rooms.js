const express = require('express');
const router = express.Router();
const mysql = require('../db/mysql');

function validateRoomPayload(req) {
    const { roomNumber, roomName, price, discount } = req.body;
    const errors = {};
    if (!roomNumber || String(roomNumber).trim().length === 0) errors.roomNumber = 'Room number is required';
    if (!roomName || String(roomName).trim().length < 2) errors.roomName = 'Room name is required';
    const priceNum = Number(price || 0);
    if (isNaN(priceNum) || priceNum <= 0) errors.price = 'Price must be a positive number';
    const discountNum = Number(discount || 0);
    if (isNaN(discountNum) || discountNum < 0 || discountNum > 100) errors.discount = 'Discount must be between 0 and 100';
    return { errors, priceNum, discountNum };
}

// List all rooms
router.get('/', async (req, res) => {
    let rooms = [];
    const dbAvailable = mysql.isDbAvailable();
    if (dbAvailable) {
        try {
            rooms = await mysql.getRooms();
        } catch (err) {
            console.error('Error loading rooms:', err);
            req.flash('error', 'Unable to load rooms from MySQL');
        }
    } else {
        req.flash('error', 'MySQL is not configured');
    }
    res.render('rooms/index', { title: 'Rooms', rooms, dbAvailable });
});

// Create room form
router.get('/new', (req, res) => {
    res.render('rooms/form', { title: 'New Room', room: null, errors: null });
});

// Edit room form
router.get('/:id/edit', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/rooms');
    }
    const id = parseInt(req.params.id, 10);
    try {
        const room = await mysql.getRoomById(id);
        if (!room) return res.redirect('/rooms');
        res.render('rooms/form', { title: 'Edit Room', room, errors: null });
    } catch (err) {
        console.error('Error fetching room:', err);
        req.flash('error', 'Unable to fetch room details');
        res.redirect('/rooms');
    }
});

// Create room (POST)
router.post('/', async (req, res) => {
    const { errors, priceNum, discountNum } = validateRoomPayload(req);
    if (Object.keys(errors).length) {
        return res.render('rooms/form', { title: 'New Room', room: req.body, errors });
    }
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/rooms');
    }
    try {
        await mysql.createRoom({
            roomNumber: String(req.body.roomNumber).trim(),
            roomName: String(req.body.roomName).trim(),
            price: priceNum,
            discount: discountNum,
            amenities: String(req.body.amenities || '').trim()
        });
        req.flash('success', 'Room created successfully');
        res.redirect('/rooms');
    } catch (err) {
        console.error('Error creating room:', err);
        req.flash('error', 'Unable to create room');
        res.render('rooms/form', { title: 'New Room', room: req.body, errors: { general: 'Database error' } });
    }
});

// Update room (POST)
router.post('/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { errors, priceNum, discountNum } = validateRoomPayload(req);
    if (Object.keys(errors).length) {
        return res.render('rooms/form', { title: 'Edit Room', room: Object.assign({}, req.body, { id }), errors });
    }
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/rooms');
    }
    try {
        await mysql.updateRoom(id, {
            roomNumber: String(req.body.roomNumber).trim(),
            roomName: String(req.body.roomName).trim(),
            price: priceNum,
            discount: discountNum,
            amenities: String(req.body.amenities || '').trim()
        });
        req.flash('success', 'Room updated successfully');
        res.redirect('/rooms');
    } catch (err) {
        console.error('Error updating room:', err);
        req.flash('error', 'Unable to update room');
        res.render('rooms/form', { title: 'Edit Room', room: Object.assign({}, req.body, { id }), errors: { general: 'Database error' } });
    }
});

// Delete room (POST)
router.post('/:id/delete', async (req, res) => {
    if (!mysql.isDbAvailable()) {
        req.flash('error', 'MySQL is not configured');
        return res.redirect('/rooms');
    }
    const id = parseInt(req.params.id, 10);
    try {
        await mysql.deleteRoom(id);
        req.flash('success', 'Room deleted');
    } catch (err) {
        console.error('Error deleting room:', err);
        req.flash('error', 'Unable to delete room');
    }
    res.redirect('/rooms');
});

module.exports = router;

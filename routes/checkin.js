const express = require('express');
const router = express.Router();

// Check-in page
router.get('/', (req, res) => {
    res.render('checkin/index', {
        title: 'Check In',
        reservations: []
    });
});

// Check-in action (POST)
router.post('/', (req, res) => {
    // TODO: Add database update logic
    res.redirect('/checkin');
});

module.exports = router;

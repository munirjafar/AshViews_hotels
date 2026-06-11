const express = require('express');
const router = express.Router();

// Check-out page
router.get('/', (req, res) => {
    res.render('checkout/index', {
        title: 'Check Out',
        reservations: []
    });
});

// Check-out action (POST)
router.post('/', (req, res) => {
    // TODO: Add database update logic
    res.redirect('/checkout');
});

module.exports = router;

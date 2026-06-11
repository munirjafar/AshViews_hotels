const express = require('express');
const router = express.Router();

// User profile page
router.get('/', (req, res) => {
    res.render('profile/index', {
        title: 'Profile',
        user: null
    });
});

// Update profile (POST)
router.post('/', (req, res) => {
    // TODO: Add database update logic
    res.redirect('/profile');
});

module.exports = router;

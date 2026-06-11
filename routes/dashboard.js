const express = require('express');
const router = express.Router();

// Dashboard
router.get('/', (req, res) => {
    res.render('dashboard/dashboard', {
        title: 'Dashboard'
    });
});

module.exports = router;

const express = require('express');
const router = express.Router();

// List all card logs
router.get('/', (req, res) => {
    res.render('card-logs/index', {
        title: 'Card Logs',
        logs: []
    });
});

module.exports = router;

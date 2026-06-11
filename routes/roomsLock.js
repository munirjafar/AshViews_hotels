const express = require('express');
const router = express.Router();

// List room locks
router.get('/', (req, res) => {
    res.render('rooms-lock/index', {
        title: 'Room Locks',
        locks: []
    });
});

module.exports = router;

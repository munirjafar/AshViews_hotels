const express = require('express');
const router = express.Router();

// Logout action
router.get('/', (req, res) => {
    // TODO: Add session destroy logic
    res.redirect('/');
});

module.exports = router;

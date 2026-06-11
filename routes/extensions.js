const express = require('express');
const router = express.Router();

// Extensions page
router.get('/', (req, res) => {
    res.render('extensions/index', {
        title: 'Extensions',
        extensions: []
    });
});

module.exports = router;

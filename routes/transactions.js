const express = require('express');
const router = express.Router();

// Transactions page
router.get('/', (req, res) => {
    res.render('transactions/index', {
        title: 'Transactions',
        transactions: []
    });
});

module.exports = router;

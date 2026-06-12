const express = require('express');
const router = express.Router();

// Dashboard
router.get('/', (req, res) => {
    res.render('dashboard/index', {
        title: 'Dashboard'
        // stats: {
        //     totalGuests = [],
        //     totalStaffs = [],
        //     totalRooms = [],
        //     totalCards = [],
        //     totalReservations = [],
        //     totalTransactions = [],
        //     totalCheckins = [],
        //     totalCheckouts = [],
        //     occupiedRooms = [],
        //     vacantRooms = [],
        //     maintenanceRooms = [],
        //     reservedRooms = [],
        //     availableRooms = []
        // }
    });
});

module.exports = router;

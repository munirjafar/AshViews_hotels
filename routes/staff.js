const express = require('express');
const router = express.Router();

// List all staff members
router.get('/', (req, res) => {
    res.render('staff/index', {
        title: 'Staff',
        staff: []
    });
});

// Create staff form
router.get('/new', (req, res) => {
    const staffCount = 1; // replace with database count
    const generatedStaffId = 'STF' + String(staffCount + 1).padStart(4, '0');
    
    res.render('staff/form', {
        title: 'Create Staff Member',
        staff: null,
        staffId: generatedStaffId
    });
});

// Edit staff form
router.get('/:id/edit', (req, res) => {
    res.render('staff/form', {
        title: 'Edit Staff Member',
        staff: null,
        staffId: req.params.id
    });
});

// Create staff (POST)
router.post('/', (req, res) => {
    // TODO: Add database insert logic
    res.redirect('/staff');
});

// Update staff (POST)
router.post('/:id', (req, res) => {
    // TODO: Add database update logic
    res.redirect('/staff');
});

// Delete staff (POST)
router.post('/:id/delete', (req, res) => {
    // TODO: Add database delete logic
    res.redirect('/staff');
});

module.exports = router;

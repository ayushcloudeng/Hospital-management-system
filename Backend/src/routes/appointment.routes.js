const express = require('express');
const router = express.Router();
const {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
} = require('../controllers/appointment.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router
    .route('/')
    .get(protect, getAppointments)
    .post(protect, authorize('patient'), createAppointment);

router
    .route('/:id')
    .put(protect, authorize('admin', 'doctor'), updateAppointment)
    .delete(protect, authorize('admin'), deleteAppointment);

module.exports = router;

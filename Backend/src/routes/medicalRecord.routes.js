const express = require('express');
const router = express.Router();
const {
    getMedicalRecords,
    createMedicalRecord,
    getMedicalRecord,
} = require('../controllers/medicalRecord.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router
    .route('/')
    .get(protect, getMedicalRecords)
    .post(protect, authorize('doctor'), createMedicalRecord);

router.route('/:id').get(protect, getMedicalRecord);

module.exports = router;

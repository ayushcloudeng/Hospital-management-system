const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get medical records
// @route   GET /api/medical-records
// @access  Private
exports.getMedicalRecords = async (req, res) => {
    try {
        let query = {};

        // Filter by role
        if (req.user.role === 'patient') {
            query.patient = req.user.id;
        } else if (req.user.role === 'doctor') {
            query.doctor = req.user.id;
        }

        const records = await MedicalRecord.find(query)
            .populate('patient', 'name email age gender')
            .populate('doctor', 'name specialization')
            .sort('-visitDate');

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private (Doctor)
exports.createMedicalRecord = async (req, res) => {
    try {
        const { patient, diagnosis, prescription, notes } = req.body;

        const record = await MedicalRecord.create({
            patient,
            doctor: req.user.id,
            doctorName: req.user.name,
            diagnosis,
            prescription,
            notes,
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get medical record by ID
// @route   GET /api/medical-records/:id
// @access  Private
exports.getMedicalRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id)
            .populate('patient', 'name email age gender')
            .populate('doctor', 'name specialization');

        if (!record) {
            return res.status(404).json({ message: 'Medical record not found' });
        }

        res.json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

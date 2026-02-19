const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctorName: {
            type: String,
            required: true,
        },
        diagnosis: {
            type: String,
            required: [true, 'Please provide diagnosis'],
        },
        prescription: {
            type: String,
            required: [true, 'Please provide prescription'],
        },
        notes: {
            type: String,
        },
        visitDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);

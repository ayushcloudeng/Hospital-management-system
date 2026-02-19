const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        patientName: {
            type: String,
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        doctorName: {
            type: String,
        },
        date: {
            type: Date,
            required: [true, 'Please provide appointment date'],
        },
        time: {
            type: String,
            required: [true, 'Please provide appointment time'],
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Completed', 'Cancelled'],
            default: 'Pending',
        },
        reason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Appointment', appointmentSchema);

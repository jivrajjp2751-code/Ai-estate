const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    customer_name: { type: String, required: true },
    customer_phone: { type: String, required: true },
    appointment_date: { type: String },
    appointment_time: { type: String },
    property_location: { type: String },
    status: { type: String, default: 'pending' }, // pending, confirmed, cancelled
    notes: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

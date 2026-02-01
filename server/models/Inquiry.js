const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    message: { type: String },
    budget: { type: String },
    preferred_area: { type: String },
    preferred_time: { type: String },
    appointment_date: { type: String }, // Storing as string to match current frontend format or Date if strictly parsed
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inquiry', InquirySchema);

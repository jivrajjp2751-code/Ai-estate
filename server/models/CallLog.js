const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
    call_id: { type: String, required: true, unique: true },
    agent_id: { type: String, required: true },
    customer_name: { type: String },
    phone_number: { type: String, required: true },
    status: { type: String, default: 'queued' }, // queued, completed, no-answer, failed, busy
    duration: { type: Number, default: 0 }, // in seconds
    recording_url: { type: String },
    transcript: { type: String },
    summary: { type: String },
    started_at: { type: Date, default: Date.now },
    ended_at: { type: Date },
    language: { type: String, default: 'english' }
});

module.exports = mongoose.model('CallLog', CallLogSchema);

const mongoose = require('mongoose');

const PropertyImageSchema = new mongoose.Schema({
    property_id: { type: String, required: true }, // Using String to store ID for simplicity in matching
    image_url: { type: String, required: true },
    is_primary: { type: Boolean, default: false },
    display_order: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

PropertyImageSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('PropertyImage', PropertyImageSchema);

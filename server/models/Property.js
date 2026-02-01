const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
    title: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: String, required: true }, // Keeping as string to match existing "₹5 Cr" format or similar
    sqft: { type: String },
    beds: { type: Number },
    baths: { type: Number },
    description: { type: String },
    primary_image_url: { type: String },
    virtual_tour_url: { type: String },
    featured: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

PropertySchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('Property', PropertySchema);

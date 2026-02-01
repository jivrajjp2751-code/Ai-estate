const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Hashed
    role: { type: String, default: 'admin' },
    created_at: { type: Date, default: Date.now }
});

AdminUserSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        delete ret._id;
    }
});

module.exports = mongoose.model('AdminUser', AdminUserSchema);

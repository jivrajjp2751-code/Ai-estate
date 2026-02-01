const mongoose = require('mongoose');
const AdminUser = require('./models/AdminUser');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-estate-agent';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');

    const email = 'jiveshpatil0@gmail.com';
    const password = 'jivesh2751';

    // Delete existing if any to reset password
    await AdminUser.deleteMany({ email });

    const admin = new AdminUser({
        email,
        password,
        role: 'admin'
    });

    await admin.save();
    console.log(`Admin user created: ${email} / ${password}`);
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});

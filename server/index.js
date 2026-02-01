require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-estate-agent';
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// Models
const Property = require('./models/Property');
const Inquiry = require('./models/Inquiry');
const Appointment = require('./models/Appointment');
const AdminUser = require('./models/AdminUser');
const PropertyImage = require('./models/PropertyImage');

// --- Routes ---

// Properties
app.get('/api/properties', async (req, res) => {
    try {
        const properties = await Property.find();
        res.json({ data: properties, error: null }); // Wrapping to match Supabase response structure roughly
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.post('/api/properties', async (req, res) => {
    try {
        const newProperty = new Property(req.body);
        const saved = await newProperty.save();
        res.json({ data: saved, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.patch('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Property.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ data: updated, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.delete('/api/properties/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Property.findByIdAndDelete(id);
        res.json({ data: deleted, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Property Images
app.get('/api/property_images', async (req, res) => {
    try {
        const images = await PropertyImage.find().sort({ display_order: 1 });
        res.json({ data: images, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.post('/api/property_images', async (req, res) => {
    try {
        const newImage = new PropertyImage(req.body);
        const saved = await newImage.save();
        res.json({ data: saved, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.patch('/api/property_images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await PropertyImage.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ data: updated, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.delete('/api/property_images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await PropertyImage.findByIdAndDelete(id);
        res.json({ data: deleted, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Inquiries
app.post('/api/customer_inquiries', async (req, res) => {
    try {
        const newInquiry = new Inquiry(req.body);
        const saved = await newInquiry.save();
        res.json({ data: saved, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.get('/api/customer_inquiries', async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ created_at: -1 });
        res.json({ data: inquiries, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Appointments
app.get('/api/call_appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ created_at: -1 });
        res.json({ data: appointments, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// --- User Management (Profiles) ---

// Get all profiles
app.get('/api/profiles', async (req, res) => {
    try {
        const users = await AdminUser.find().select('-password'); // Exclude password
        const profiles = users.map(u => ({
            id: u._id.toString(),
            user_id: u._id.toString(),
            email: u.email,
            role: u.role,
            created_at: u.created_at
        }));
        res.json({ data: profiles, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});


// Create new profile (User)
// Create new profile (User) or Update existing role
app.post('/api/profiles', async (req, res) => {
    try {
        let { email, role, password } = req.body;
        if (email) email = email.toLowerCase();
        console.log(`Granting access to: ${email} with role: ${role}`);

        // Check if exists
        const existing = await AdminUser.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
        if (existing) {
            // If user exists, just update the role to grant access
            existing.role = role || existing.role;
            const updated = await existing.save();

            const profile = {
                id: updated._id.toString(),
                user_id: updated._id.toString(),
                email: updated.email,
                role: updated.role,
                created_at: updated.created_at
            };
            return res.json({ data: { profile, message: "User role updated" }, error: null });
        }

        // Create new if not exists
        const newUser = new AdminUser({
            email,
            password: password || '123456', // Default only for NEW users via Invite
            role: role || 'viewer'
        });

        const saved = await newUser.save();

        const profile = {
            id: saved._id.toString(),
            user_id: saved._id.toString(),
            email: saved.email,
            role: saved.role,
            created_at: saved.created_at
        };

        res.json({ data: { profile, message: "New user created" }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Update specific profile (e.g. role)
app.patch('/api/profiles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Block updating the primary admin if desired, or handle self-update blocking in frontend
        // For now, allow role updates
        const updatedUser = await AdminUser.findByIdAndUpdate(id, updates, { new: true }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ data: null, error: { message: "User not found" } });
        }

        const profile = {
            id: updatedUser._id.toString(),
            user_id: updatedUser._id.toString(),
            email: updatedUser.email,
            role: updatedUser.role,
            created_at: updatedUser.created_at
        };

        res.json({ data: profile, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Delete specific profile
app.delete('/api/profiles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await AdminUser.findByIdAndDelete(id);
        res.json({ data: { message: "User deleted" }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Bulk Delete
app.post('/api/profiles/bulk-delete', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ data: null, error: { message: "Invalid IDs provided" } });
        }
        await AdminUser.deleteMany({ _id: { $in: ids } });
        res.json({ data: { message: "Users deleted" }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// --- Auth ---

// Login
app.post('/api/auth/login', async (req, res) => {
    let { email, password } = req.body;
    if (email) email = email.toLowerCase();

    console.log(`Login attempt for: ${email} with password: ${password}`);

    // Special backdoor for the main demo admin if not in DB yet
    if (email === 'jiveshpatil0@gmail.com' && !await AdminUser.findOne({ email })) {
        // Create the main admin if missing
        const mainAdmin = new AdminUser({
            email: 'jiveshpatil0@gmail.com',
            password: 'admin', // In real app, hash this!
            role: 'admin'
        });
        await mainAdmin.save();
    }

    try {
        // Find user (Case Insensitive)
        const user = await AdminUser.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

        // Simple password check (In production use bcrypt!)
        if (user && user.password === password) {
            res.json({
                data: {
                    user: { id: user._id.toString(), email: user.email, role: user.role },
                    session: { access_token: 'mock-session-' + Date.now() }
                },
                error: null
            });
        } else {
            // Fallback for demo: if user accepts any password for dev convenience
            // or return invalid credentials
            if (user) {
                res.status(401).json({ data: null, error: { message: 'Invalid credentials' } });
            } else {
                res.status(404).json({ data: null, error: { message: 'User not found' } });
            }
        }
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Register / Create User (used for "Invite")
app.post('/api/auth/update-password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        const user = await AdminUser.findById(userId);
        if (!user) {
            return res.status(404).json({ data: null, error: { message: "User not found" } });
        }

        if (user.password !== currentPassword) {
            return res.status(400).json({ data: null, error: { message: "Incorrect current password" } });
        }

        user.password = newPassword;
        await user.save();

        res.json({ data: { message: "Password updated successfully" }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Register / Create User (used for "Invite")
app.post('/api/auth/signup', async (req, res) => {
    try {
        let { email, password, options } = req.body;
        if (email) email = email.toLowerCase();

        // "Invite" usually sends just email/role, but standard signup sends password.
        // If coming from "Invite" dialog, we might need a separate endpoint or flexible signup.

        const newUser = new AdminUser({
            email,
            password: password || '123456', // Default password if invited
            role: 'viewer' // Default role
        });

        const saved = await newUser.save();

        res.json({
            data: {
                user: { id: saved._id.toString(), email: saved.email, role: saved.role },
                session: null
            },
            error: null
        });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Purva Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ data: null, error: "Messages array required" });
        }

        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content.toLowerCase();

        // Fetch properties from DB
        const properties = await Property.find();

        let responseMessage = "";
        let matchedProperties = properties;

        // Simple Keyword Matching logic (Simulated AI)
        const budgetMatch = userQuery.match(/(\d+)\s*cr/);
        const locationMatch = userQuery.match(/(bandra|worli|andheri|powai|pune|nashik|nagpur|lonavala|alibaug|panchgani)/);

        if (locationMatch) {
            const location = locationMatch[0];
            matchedProperties = matchedProperties.filter(p => p.location.toLowerCase().includes(location));
        }

        if (budgetMatch) {
            // Rudimentary budget filter - logic can be improved
            // For now just mentioning we found budget specific ones
        }

        // Construct Response
        if (matchedProperties.length === 0) {
            responseMessage = "I couldn't find any properties matching that specific criteria right now. However, I have access to " + properties.length + " other premium listings. Would you like to see all available areas?";
        } else if (userQuery.includes("hi") || userQuery.includes("hello")) {
            responseMessage = "Hello! I'm Purva. I can help you find luxury properties. I see we have " + properties.length + " listings available today. Try asking 'Show me properties in Bandra' or 'What do you have in Pune?'";
        } else {
            // List matched properties
            const count = matchedProperties.length;
            responseMessage = `I found ${count} properties that might interest you:\n\n`;

            matchedProperties.slice(0, 3).forEach((p, i) => {
                responseMessage += `${i + 1}. **${p.title}**\n   • Location: ${p.location}\n   • Price: ${p.price}\n   • ${p.beds} Beds | ${p.baths} Baths\n\n`;
            });

            if (count > 3) {
                responseMessage += `...and ${count - 3} more.`;
            }

            responseMessage += "\nWould you like to schedule a visit for any of these?";
        }

        res.json({
            data: {
                message: responseMessage
            },
            error: null
        });

    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Default Route
app.get('/', (req, res) => {
    res.send('AI Estate Agent Backend Running');
});

// File Upload
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ data: null, error: { message: "No file uploaded" } });
        }
        // Return relative path or full URL
        const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        res.json({ data: { path: req.file.filename, publicUrl: fullUrl }, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

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
const CallLog = require('./models/CallLog');

// ... (existing code) ...

// Outbound Call (Bolna AI)
app.post('/api/outbound-call', async (req, res) => {
    try {
        const { inquiryId, phoneNumber, customerName, preferredArea, budget, language } = req.body;

        console.log("------------------------------------------");
        console.log("Received Outbound Call Request:");
        console.log("Phone:", phoneNumber);
        console.log("Customer:", customerName);
        console.log("Language:", language);
        console.log("------------------------------------------");



        // Format Phone Number (Ensure +91)
        let formattedPhone = phoneNumber.toString().trim();
        // Remove spaces and dashes
        formattedPhone = formattedPhone.replace(/[\s-]/g, '');

        if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('0')) {
                formattedPhone = formattedPhone.substring(1);
            }
            formattedPhone = '+91' + formattedPhone;
        }

        // --- FETCH MATCHING PROPERTIES FROM DB ---
        let propertyContext = "No specific properties found matching criteria.";
        try {
            let query = {};
            if (preferredArea) {
                // Case-insensitive regex match
                query.location = { $regex: preferredArea, $options: 'i' };
            }

            // Fetch top 3 matching properties
            const properties = await Property.find(query).limit(3);

            if (properties.length > 0) {
                propertyContext = properties.map((p, index) =>
                    `${index + 1}. ${p.title} in ${p.location}. Price: ${p.price}. ${p.beds} BHK. ${p.description || ''}`
                ).join("\n");
            } else {
                // Fallback: Fetch any 3 featured properties
                const featured = await Property.find({}).limit(3);
                if (featured.length > 0) {
                    propertyContext = "No direct matches, but here are some featured ones:\n" +
                        featured.map((p, index) => `${index + 1}. ${p.title} in ${p.location} (${p.price})`).join("\n");
                }
            }
        } catch (dbErr) {
            console.error("Error fetching properties for call context:", dbErr);
        }

        console.log(`Initiating Custom Python Agent call to ${formattedPhone}`);
        console.log("Context Injected:", propertyContext);

        // Call Python Agent Service
        const pythonServiceUrl = "http://localhost:8000/start-call";

        const response = await fetch(pythonServiceUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                phone: formattedPhone,
                name: customerName,
                property_context: propertyContext
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Python Agent Error:", result);
            return res.status(response.status).json({ data: null, error: result });
        }

        const activeCallId = result.call_id;

        // Save Call Log (Async, don't block response if it fails)
        try {
            if (activeCallId) {
                const newCallLog = new CallLog({
                    call_id: activeCallId,
                    agent_id: "CUSTOM_PYTHON_AGENT",
                    customer_name: customerName,
                    phone_number: formattedPhone,
                    language: language,
                    status: 'queued'
                });
                await newCallLog.save();
                console.log(`Call Log saved for ID: ${activeCallId}`);
            }
        } catch (dbError) {
            console.error("Failed to save call log:", dbError);
        }

        res.json({ data: { message: "Call initiated via Python Agent", callId: activeCallId }, error: null });

    } catch (err) {
        console.error("Outbound Call Error:", err);
        res.status(500).json({ data: null, error: err.message });
    }
});

// Call Logs
app.get('/api/call_logs', async (req, res) => {
    try {
        const logs = await CallLog.find().sort({ started_at: -1 });
        res.json({ data: logs, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

// Sync Call Status (Manual Poll)
// Sync Call Status (Placeholder for Local Agent)
app.post('/api/call_logs/:id/sync', async (req, res) => {
    try {
        const { id } = req.params;
        const log = await CallLog.findById(id);

        if (!log) {
            return res.status(404).json({ data: null, error: "Log not found" });
        }

        // Since we are using a custom local agent, status updates should happen via 
        // webhooks/callbacks from the Python agent, not by polling Bolna.
        // For now, we just return the current state to prevent UI errors.

        return res.json({ data: log, error: null });

    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).json({ data: null, error: err.message });
    }
});
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
// Appointments
app.get('/api/call_appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find().sort({ created_at: -1 });
        res.json({ data: appointments, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.patch('/api/call_appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Appointment.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ data: updated, error: null });
    } catch (err) {
        res.status(500).json({ data: null, error: err.message });
    }
});

app.delete('/api/call_appointments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Appointment.findByIdAndDelete(id);
        res.json({ data: deleted, error: null });
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

// Purva Chatbot Endpoint - Smart AI with MongoDB
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ data: null, error: "Messages array required" });
        }

        const lastMessage = messages[messages.length - 1];
        const userQuery = lastMessage.content.toLowerCase();

        // Fetch properties (Simple in-memory scan for this scale)
        const allProperties = await Property.find();

        let responseMessage = "";
        let suggestions = [];

        // --- Intent Recognition ---

        const bookingWords = ["schedule", "visit", "book", "appointment", "viewing", "see", "date"];
        const compareWords = ["compare", "difference", "vs"];
        const supportWords = ["help", "support", "contact", "call", "office"];

        const hasBooking = bookingWords.some(w => userQuery.includes(w));
        const hasCompare = compareWords.some(w => userQuery.includes(w));
        const hasSupport = supportWords.some(w => userQuery.includes(w));
        const hasPhone = userQuery.match(/(\d{10})/);

        // 1. Booking Logic (Priority)
        if (hasPhone || (hasBooking && (userQuery.includes("tomorrow") || userQuery.includes("today") || userQuery.match(/\d{1,2}(st|nd|rd|th)?/)))) {
            const phoneMatch = userQuery.match(/(\d{10})/);
            const phone = phoneMatch ? phoneMatch[0] : "Not provided";
            const dateMatch = userQuery.match(/(\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i) ||
                userQuery.match(/tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|today/i);
            const date = dateMatch ? dateMatch[0] : "Date TBD";

            // Find property context
            let targetProperty = allProperties.find(p => userQuery.includes(p.title.toLowerCase()));
            if (!targetProperty) {
                // Look back in history
                const historyText = messages.slice(-3).map(m => m.content.toLowerCase()).join(" ");
                targetProperty = allProperties.find(p => historyText.includes(p.title.toLowerCase()));
            }

            const propertyName = targetProperty ? targetProperty.title : "General Inquiry";

            if (phone !== "Not provided") {
                const newAppointment = new Appointment({
                    customer_name: "Valued Customer",
                    customer_phone: phone,
                    property_location: propertyName,
                    appointment_date: date,
                    notes: `Chat Booking: ${userQuery}`
                });
                await newAppointment.save();
                responseMessage = `✅ **Confirmed!** Visit for **${propertyName}** on **${date}** has been booked.\nWe will call ${phone} shortly.`;
                suggestions = ["Show more properties", "Back to menu"];
            } else {
                responseMessage = `I can book a visit for **${propertyName}**. Please provides your **10-digit Phone Number** and **Date**.`;
                suggestions = ["My number is...", "Cancel"];
            }
        }

        // 1.5. Booking Inquiry (No Date/Phone yet)
        else if (hasBooking) {
            const mentionedProp = allProperties.find(p => userQuery.includes(p.title.toLowerCase()));
            const propName = mentionedProp ? mentionedProp.title : "a property";

            responseMessage = `Great! I can help you schedule a visit for **${propName}**.\n\nPlease type your **Phone Number** and preferred **Date** (e.g., "9876543210 tomorrow") to confirm.`;
            suggestions = ["My number is...", "Tomorrow at 10 AM"];
        }

        // 2. Comparison
        else if (hasCompare) {
            const mentioned = allProperties.filter(p => userQuery.includes(p.title.toLowerCase()));
            if (mentioned.length >= 2) {
                const [p1, p2] = mentioned;
                responseMessage = `**Comparison**:\n• **${p1.title}**: ${p1.price}, ${p1.beds} BHK\n• **${p2.title}**: ${p2.price}, ${p2.beds} BHK\n\n${p1.location} vs ${p2.location}.`;
                suggestions = [`Visit ${p1.title}`, `Visit ${p2.title}`];
            } else {
                responseMessage = "To compare, please mention two property names.";
            }
        }

        // 3. Support
        else if (hasSupport) {
            responseMessage = "📞 Call us at **+91-9876543210** or email **support@aiestate.com**.";
            suggestions = ["Show listings", "Book visit"];
        }

        // 4. Search / Greeting
        else {
            if (userQuery.match(/^(hi|hello)/) && userQuery.length < 20) {
                responseMessage = "Hello! 👋 I'm your AI assistant. I can show you listings, compare prices, or book visits. What are you looking for?";
                suggestions = ["Show properties in Bandra", "Budget under 5 Cr", "3 BHK flats"];
            } else {
                // Search Logic
                let matches = allProperties;

                // Loc
                const foundLoc = ["bandra", "worli", "pune", "mumbai"].find(l => userQuery.includes(l));
                if (foundLoc) matches = matches.filter(p => p.location.toLowerCase().includes(foundLoc));

                // Beds
                const bedMatch = userQuery.match(/(\d+)\s*bhk/);
                if (bedMatch) matches = matches.filter(p => p.beds === parseInt(bedMatch[1]));

                // Price
                const budgetMatch = userQuery.match(/(\d+)\s*cr/);
                if (budgetMatch && userQuery.includes("under")) {
                    const limit = parseFloat(budgetMatch[1]);
                    matches = matches.filter(p => {
                        const val = parseFloat(p.price.replace(/[^0-9.]/g, ''));
                        return val <= limit;
                    });
                }

                if (matches.length > 0) {
                    responseMessage = matches.length === 1
                        ? `Found **${matches[0].title}** in ${matches[0].location}.\nPrice: ${matches[0].price}.`
                        : `I found ${matches.length} properties. Here are the top ones:\n` + matches.slice(0, 3).map(p => `• **${p.title}** (${p.price})`).join('\n');

                    suggestions = matches.slice(0, 2).map(p => `Details of ${p.title}`);
                    suggestions.push("Schedule visit");
                } else {
                    responseMessage = "I didn't find any exact matches. Try '3 BHK in Bandra' or 'Under 5 Cr'.";
                    suggestions = ["Show all properties"];
                }
            }
        }

        // Append Suggestions
        if (suggestions.length > 0) {
            responseMessage += `\n\n**Suggested:**\n${suggestions.map(s => `• ${s}`).join('\n')}`;
        }

        res.json({ data: { message: responseMessage }, error: null });

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

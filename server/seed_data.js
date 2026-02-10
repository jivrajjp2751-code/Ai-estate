const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-estate-agent';

const dummyProperties = [
    {
        title: "Sea Breeze Apartments",
        location: "Bandra West, Mumbai",
        price: "₹ 5 Cr",
        beds: 3,
        baths: 3,
        sqft: "1800",
        description: "Luxury sea-facing apartment with modern amenities, gym, and pool.",
        type: "Apartment",
        featured: true,
        images: ["/uploads/prop1.jpg"]
    },
    {
        title: "Green Valley Villa",
        location: "Lonavala",
        price: "₹ 3.5 Cr",
        beds: 4,
        baths: 4,
        sqft: "3500",
        description: "Spacious weekend villa surrounded by nature. Private garden and terrace.",
        type: "Villa",
        featured: true,
        images: ["/uploads/prop2.jpg"]
    },
    {
        title: "Urban Heights",
        location: "Andheri East, Mumbai",
        price: "₹ 2.2 Cr",
        beds: 2,
        baths: 2,
        sqft: "1100",
        description: "Modern high-rise apartment near metro station. Ideal for professionals.",
        type: "Apartment",
        featured: false,
        images: ["/uploads/prop3.jpg"]
    },
    {
        title: "Skyline Towers",
        location: "Worli, Mumbai",
        price: "₹ 12 Cr",
        beds: 4,
        baths: 5,
        sqft: "4500",
        description: "Ultra-luxury penthouse with 360-degree city view.",
        type: "Penthouse",
        featured: true,
        images: ["/uploads/prop4.jpg"]
    }
];

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');

        // Clear existing? No, maybe just add if empty, or add these unique ones.
        // For demo simplicity, let's just insert them.
        try {
            await Property.insertMany(dummyProperties);
            console.log('Dummy data inserted!');
        } catch (e) {
            console.log('Error inserting:', e.message);
        }

        mongoose.connection.close();
    })
    .catch(err => console.error(err));

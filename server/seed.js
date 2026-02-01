const mongoose = require('mongoose');
const Property = require('./models/Property');
require('dotenv').config();

const properties = [
    {
        title: "Luxury Sea View Apartment",
        location: "Worli, Mumbai",
        price: "₹12 Cr",
        sqft: "2500",
        beds: 3,
        baths: 3,
        description: "Stunning sea facing apartment features modern amenities and spacious interiors.",
        primary_image_url: "https://images.unsplash.com/photo-1600596542815-2a4d9f6fac90?w=800",
        featured: true
    },
    {
        title: "Premium Villa in Koregaon Park",
        location: "Koregaon Park, Pune",
        price: "₹8.5 Cr",
        sqft: "4000",
        beds: 4,
        baths: 4,
        description: "Exclusive villa in the heart of Pune with private garden.",
        primary_image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
        featured: true
    },
    {
        title: "Ultra-Modern Penthouse Bandra",
        location: "Bandra West, Mumbai",
        price: "₹18 Cr",
        sqft: "3500",
        beds: 4,
        baths: 5,
        description: "Celebrity-style penthouse with private terrace and panoramic city views.",
        primary_image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        featured: true
    },
    {
        title: "Beachfront Villa Alibaug",
        location: "Alibaug",
        price: "₹15 Cr",
        sqft: "5000",
        beds: 5,
        baths: 6,
        description: "Expansive beachfront property with direct access to the sea. Perfect weekend getaway.",
        primary_image_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
        featured: true
    },
    {
        title: "Commercial Office Powai",
        location: "Powai, Mumbai",
        price: "₹4.5 Cr",
        sqft: "1200",
        beds: 0,
        baths: 2,
        description: "Grade A office space in Hiranandani Business Park.",
        primary_image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        featured: false
    },
    {
        title: "Modern Flat in Nashik",
        location: "Gangapur Road, Nashik",
        price: "₹1.2 Cr",
        sqft: "1500",
        beds: 2,
        baths: 2,
        description: "Contemporary design with great connectivity.",
        primary_image_url: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
        featured: false
    },
    {
        title: "Hilltop Bungalow Lonavala",
        location: "Lonavala",
        price: "₹6.5 Cr",
        sqft: "3000",
        beds: 4,
        baths: 4,
        description: "Peaceful retreat surrounded by misty hills and waterfalls.",
        primary_image_url: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800",
        featured: true
    },
    {
        title: "Spacious Farmhouse Nagpur",
        location: "Nagpur",
        price: "₹3.5 Cr",
        sqft: "10000",
        beds: 5,
        baths: 5,
        description: "Huge farmhouse with swimming pool and organic garden.",
        primary_image_url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
        featured: false
    }
];

// Fix: Wait for connection properly
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-estate-agent', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB at:', process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-estate-agent');
    await Property.deleteMany({}); // Clear existing
    console.log('Cleared existing properties.');
    await Property.insertMany(properties);
    console.log(`Inserted ${properties.length} properties.`);
    console.log('Database seeded with properties!');
    process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});

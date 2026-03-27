require('dns').setServers(['8.8.8.8']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("FATAL ERROR: MONGO_URI is missing from .env");
      process.exit(1);
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error("FATAL ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in your .env file.");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    // Check if an admin with the same email already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log("Admin account with this email already exists!");
      process.exit(0);
    }

    // Securely hash the .env password before saving
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = new User({
      firstName: 'System',
      lastName: 'Administrator',
      email: adminEmail,
      phone: '0000000000',
      password: hashedPassword,
      role: 'admin' // Grants comprehensive platform access
    });

    await adminUser.save();
    console.log("Successfully created your secure Admin account!");

  } catch (err) {
    console.error("Error generating admin account:", err);
  } finally {
    mongoose.disconnect();
  }
};

seedAdmin();

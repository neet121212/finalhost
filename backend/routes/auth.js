const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const auth = require('../middleware/auth');

// 1. SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  try {
    const { 
      firstName, lastName, country, state, city, phoneCode, phone, whatsappCode, whatsapp, email, password, role,
      companyName, companyAddress, teamSize, priorExperience, designation, studentUniqueId 
    } = req.body;
    
    // Check for existing user by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ error: "Email already registered" });
    }
    
    // Scramble the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save to database
    const newUser = new User({ 
      firstName, lastName, country, state, city, phoneCode, phone, whatsappCode, whatsapp, email, 
      password: hashedPassword,
      role: role || 'student',
      companyName, companyAddress, teamSize, priorExperience, designation, studentUniqueId
    });
    await newUser.save();
    
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error saving data" });
  }
});

// 2. LOGIN ROUTE (Allows login via email OR phone)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // 'identifier' can be email or phone
    
    // Find user in database by email or phone
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phone: identifier }] 
    });
    
    if (!user) return res.status(400).json({ error: "User not found" });

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Give user a token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, message: "Logged in successfully", user: { email: user.email, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. GET CURRENT PROFILE
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 4. UPDATE PROFILE ROUTE
router.put('/update', auth, async (req, res) => {
  try {
    const { firstName, lastName, country, state, city, phone, whatsapp, companyName, companyAddress, teamSize, priorExperience, designation, studentUniqueId } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (country) user.country = country;
    if (state) user.state = state;
    if (city) user.city = city;
    if (phone) user.phone = phone;
    if (whatsapp !== undefined) user.whatsapp = whatsapp;
    if (companyName !== undefined) user.companyName = companyName;
    if (companyAddress !== undefined) user.companyAddress = companyAddress;
    if (teamSize !== undefined) user.teamSize = teamSize;
    if (priorExperience !== undefined) user.priorExperience = priorExperience;
    if (designation !== undefined) user.designation = designation;
    if (studentUniqueId !== undefined) user.studentUniqueId = studentUniqueId;

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Server error updating profile" });
  }
});

module.exports = router;
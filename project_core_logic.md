# CFLogin - Master Backend Core Logic
This document contains the essential project configuration, database models, authentication middleware, API routes, and mailer logic.

## 1. Environment Variables & Setup
### `backend/.env`
```dotenv
MONGO_URI=mongodb+srv://navneetnamdev100:Shadow%4012@neet.2iik7gg.mongodb.net/AntiGravity?appName=NEET
JWT_SECRET=make_up_a_random_secret_word
EMAIL_USER=navneetspy@gmail.com
EMAIL_PASS=wbeupbwipwpesssp
```

### `backend/server.js`
```javascript
require('dns').setServers(['8.8.8.8']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json()); // Allows server to read JSON data
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to database');
    try {
      await mongoose.connection.collection('users').dropIndex('username_1');
      console.log('Stale username index successfully dropped.');
    } catch(err) {
      // Ignore if index doesn't exist
    }
  })
  .catch((err) => console.log('Database connection error:', err));

// Route setup
app.use('/api/auth', require('./routes/auth'));
app.use('/api/erp', require('./routes/erp'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/send-student-docs', require('./routes/studentDocs'));

// Start server
app.listen(5000, () => console.log('Server running on port 5000'));
```

## 2. Database Models
### `backend/models/User.js`
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String, required: false },
  dob: { type: String },
  gender: { type: String },
  
  // Mailing Address
  mailingAddress1: { type: String },
  mailingAddress2: { type: String },
  mailingCountry: { type: String },
  mailingState: { type: String },
  mailingCity: { type: String },
  mailingPincode: { type: String },
  
  // Permanent Address
  isPermanentSameAsMailing: { type: Boolean, default: false },
  permanentAddress1: { type: String },
  permanentAddress2: { type: String },
  permanentCountry: { type: String },
  permanentState: { type: String },
  permanentCity: { type: String },
  permanentPincode: { type: String },
  
  // Passport Info
  passportNo: { type: String },
  issueDate: { type: String },
  expiryDate: { type: String },
  issueCountry: { type: String },
  issueState: { type: String },
  issueCity: { type: String },
  
  // Nationality
  nationality: { type: String },
  citizenship: { type: String },
  multiCitizen: { type: Boolean, default: false },
  livingInOtherCountry: { type: Boolean, default: false },
  otherNationality: { type: String },
  otherLivingCountry: { type: String },
  
  // Alternative Contact
  altContactName: { type: String },
  altContactPhone: { type: String },
  altContactEmail: { type: String },
  altContactRelation: { type: String },
  
  // NEW: Academic Qualifications
  countryOfEducation: { type: String, default: '' },
  highestLevelOfEducation: { type: String, default: '' },
  educationHistory: [{
    level: { type: String, default: '' }, // e.g. Masters, Bachelors, 12th or equivalent
    countryOfStudy: { type: String, default: '' },
    stateOfStudy: { type: String, default: '' },
    universityName: { type: String, default: '' },
    programName: { type: String, default: '' },
    gradingSystem: { type: String, default: '' }, // Out of 10, 7, 5, 4
    obtainedGrade: { type: String, default: '' },
    percentageObtained: { type: String, default: '' },
    primaryLanguage: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date }
  }],
  
  // NEW: Work Experience
  workExperience: [{
    organisationName: { type: String, default: '' },
    position: { type: String, default: '' },
    jobProfile: { type: String, default: '' },
    modeOfSalary: { type: String, default: '' }, // Cash, Cheque, Bank Transfer
    startDate: { type: Date },
    endDate: { type: Date },
    currentlyWorkingHere: { type: Boolean, default: false }
  }],
  
  country: { type: String, required: false },
  state: { type: String, required: false },
  city: { type: String, required: false },
  phoneCode: { type: String, default: '+91' },
  phone: { type: String, required: true },
  whatsappCode: { type: String, default: '+91' },
  whatsapp: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'partner'], default: 'student' },
  
  // Partner specific fields (Optional for students)
  companyName: { type: String },
  companyAddress: { type: String },
  teamSize: { type: String },
  priorExperience: { type: Boolean, default: false },
  designation: { type: String },
  studentUniqueId: { type: String },
  
  assignedCounselor: { type: mongoose.Schema.Types.ObjectId, ref: 'Counselor' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }],
  // New Field for Tracking
  offerStatus: { type: String, enum: ['Pending', 'Received', 'Active', 'Backoff'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
```

### `backend/models/Application.js`
```javascript
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  programName: { type: String, required: true },
  destinationCountry: { type: String, required: true },
  status: { type: String, enum: ['Under Review', 'Accepted', 'Rejected', 'Document Pending'], default: 'Under Review' },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
```

### `backend/models/Counselor.js`
```javascript
const mongoose = require('mongoose');

const CounselorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialty: { type: String, default: 'General Admissions' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Counselor', CounselorSchema);
```

## 3. Middleware
### `backend/middleware/auth.js`
```javascript
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

  // Check if not token
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // The payload has id: user._id
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};
```

## 4. API Routes
### `backend/routes/auth.js`
```javascript
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
```

### `backend/routes/erp.js`
```javascript
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Counselor = require('../models/Counselor');
const Application = require('../models/Application');

// =======================
// DASHBOARD STATS
// =======================
router.get('/stats', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    let studentQuery = { role: 'student' };
    
    if (currentUser && currentUser.role === 'partner') {
      studentQuery.registeredBy = currentUser._id;
    }

    const totalStudents = await User.countDocuments(studentQuery);
    const studentsReceived = await User.countDocuments({ ...studentQuery, offerStatus: 'Received' });
    const studentsActive = await User.countDocuments({ ...studentQuery, offerStatus: 'Active' });
    const studentsBackoff = await User.countDocuments({ ...studentQuery, offerStatus: 'Backoff' });

    let counselorQuery = {};
    if (currentUser && currentUser.role === 'partner') {
      counselorQuery.registeredBy = currentUser._id;
    }
    const totalCounselors = await Counselor.countDocuments(counselorQuery);
    const totalApplications = await Application.countDocuments();
    const pendingApps = await Application.countDocuments({ status: 'Under Review' });

    res.json({
      totalStudents,
      studentsReceived,
      studentsActive,
      studentsBackoff,
      totalCounselors,
      totalApplications,
      pendingApps
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load dashboard metrics" });
  }
});

// =======================
// COUNSELORS CRUD
// =======================
// Get all counselors
router.get('/counselors', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    let query = {};
    if (currentUser && currentUser.role === 'partner') {
      query.registeredBy = currentUser._id;
    }
    const counselors = await Counselor.find(query).sort({ createdAt: -1 });
    res.json(counselors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch counselors" });
  }
});

// Add new counselor
router.post('/counselors', auth, async (req, res) => {
  try {
    const { name, email, phone, specialty } = req.body;
    const existing = await Counselor.findOne({ email });
    if (existing) return res.status(400).json({ error: "Counselor email already exists" });

    const counselor = new Counselor({ name, email, phone, specialty, registeredBy: req.user.id });
    await counselor.save();
    res.status(201).json(counselor);
  } catch (err) {
    res.status(500).json({ error: "Failed to add counselor" });
  }
});

// Delete counselor
router.delete('/counselors/:id', auth, async (req, res) => {
  try {
    const counselor = await Counselor.findById(req.params.id);
    if (!counselor) return res.status(404).json({ error: "Counselor not found" });

    const currentUser = await User.findById(req.user.id);
    if (currentUser && currentUser.role === 'partner') {
      if (counselor.registeredBy && counselor.registeredBy.toString() !== currentUser._id.toString()) {
        return res.status(403).json({ error: "Unauthorized access to Counselor profile" });
      }
    }

    await Counselor.findByIdAndDelete(req.params.id);

    // Optional: Unassign this counselor from all students
    await User.updateMany({ assignedCounselor: req.params.id }, { $unset: { assignedCounselor: 1 } });

    res.json({ message: "Counselor removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete counselor" });
  }
});

// =======================
// STUDENTS MANAGEMENT
// =======================
// Get all students (with active filters via query param)
router.get('/students', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const { country, state, isAssigned } = req.query;
    
    let query = { role: 'student' };
    
    if (currentUser && currentUser.role === 'partner') {
      query.registeredBy = currentUser._id;
    }
    
    if (country) query.country = { $regex: new RegExp(country, 'i') };
    if (state) query.state = { $regex: new RegExp(state, 'i') };
    
    if (isAssigned === 'true') {
      query.assignedCounselor = { $exists: true, $ne: null };
    } else if (isAssigned === 'false') {
      query.assignedCounselor = { $exists: false }; // or null
    }

    const students = await User.find(query).populate('assignedCounselor', 'name email').sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Partner Register New Student Lead
router.post('/students', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, country, state, city, offerStatus, assignedCounselor } = req.body;
    
    // Debug log to trace phone saving
    console.log(`[ERP] Registering student: ${firstName} ${lastName}, Phone: ${phone}`);

    if (!phone || phone.trim() === '+91') {
       return res.status(400).json({ error: "Phone number is required." });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Student email already exists" });

    // Generate credentials
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('StudentPass123!', 10);

    const studentData = {
      firstName, lastName, email, phone, country, state, city,
      offerStatus: offerStatus || 'Pending',
      assignedCounselor: assignedCounselor || undefined,
      password: hashedPassword,
      role: 'student',
      registeredBy: req.user.id
    };

    const student = new User(studentData);
    await student.save();
    
    console.log(`[ERP] Student saved successfully with phone: ${student.phone}`);
    res.status(201).json({ message: 'Student registered successfully', student });
  } catch (err) {
    console.error("[ERP ERROR]", err);
    res.status(500).json({ error: "Failed to register student. " + (err.message || "") });
  }
});

// Edit Student
router.put('/students/:id', auth, async (req, res) => {
  try {
    const updates = req.body;
    const student = await User.findById(req.params.id);
    
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check email uniqueness if email is changed
    if (updates.email && updates.email !== student.email) {
      const existing = await User.findOne({ email: updates.email });
      if (existing) return res.status(400).json({ error: "Email already in use" });
    }

    const allowedFields = [
      'firstName', 'middleName', 'lastName', 'email', 'phone', 'dob', 'gender',
      'country', 'state', 'city', 'offerStatus',
      'mailingAddress1', 'mailingAddress2', 'mailingCountry', 'mailingState', 'mailingCity', 'mailingPincode',
      'isPermanentSameAsMailing', 'permanentAddress1', 'permanentAddress2', 'permanentCountry', 'permanentState', 'permanentCity', 'permanentPincode',
      'passportNo', 'issueDate', 'expiryDate', 'issueCountry', 'issueState', 'issueCity',
      'nationality', 'citizenship', 'multiCitizen', 'livingInOtherCountry', 'otherNationality', 'otherLivingCountry',
      'altContactName', 'altContactPhone', 'altContactEmail', 'altContactRelation',
      'countryOfEducation', 'highestLevelOfEducation', 'educationHistory', 'workExperience'
    ];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        student[field] = updates[field];
      }
    });

    await student.save();
    res.json({ message: "Student updated successfully", student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update student" });
  }
});

// Delete Student
router.delete('/students/:id', auth, async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });
    if (!student) return res.status(404).json({ error: "Student not found" });

    // Assuming we should also delete from Application (if applicable later)
    await Application.deleteMany({ _id: { $in: student.applications }});

    res.json({ message: "Student removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

// Assign Counselor to Student
router.put('/students/:id/assign', auth, async (req, res) => {
  try {
    const { counselorId } = req.body;
    // Check if counselor exists
    if (counselorId) {
      const counselor = await Counselor.findById(counselorId);
      if (!counselor) return res.status(404).json({ error: "Counselor not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { assignedCounselor: counselorId || null }, // null clears assignment
      { new: true }
    ).populate('assignedCounselor', 'name email');

    if (!user) return res.status(404).json({ error: "Student not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to assign counselor" });
  }
});

module.exports = router;
```

### `backend/routes/upload.js`
```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');

// Set up Multer for memory storage (no files saved to disk)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/email-zip', upload.single('zipFile'), async (req, res) => {
    try {
        const { email, candidateName, summaryData } = req.body;
        const zipFile = req.file;

        if (!zipFile) {
            return res.status(400).json({ error: 'No ZIP file uploaded' });
        }

        if (!email || email === 'undefined') {
            return res.status(400).json({ error: 'Receiver email is missing. Are you logged in?' });
        }

        // Check if user has updated .env
        if (!process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your-email')) {
            return res.status(500).json({ error: 'System Email not configured. Please update the backend .env file with your Gmail and App Password.' });
        }

        // Parse summary data if available to format the email body
        let emailHtml = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">`;
        emailHtml += `<h2 style="color: #0284c7; border-bottom: 2px solid #e0f2fe; padding-bottom: 10px;">Application Summary for ${candidateName || 'Candidate'}</h2>`;
        
        if (summaryData) {
            try {
                const data = JSON.parse(summaryData);
                
                // Personal Profile
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Personal Profile</h3>`;
                emailHtml += `<table style="width: 100%; border-collapse: collapse;">`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Full Name:</strong></td><td style="font-weight: 500;">${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td><td style="font-weight: 500;">${data.email || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Phone:</strong></td><td style="font-weight: 500;">${data.phone || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>DOB:</strong></td><td style="font-weight: 500;">${data.dob ? new Date(data.dob).toLocaleDateString() : 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Gender:</strong></td><td style="font-weight: 500;">${data.gender || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Passport No:</strong></td><td style="font-weight: 500;">${data.passportNo || 'N/A'}</td></tr>`;
                emailHtml += `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Address:</strong></td><td style="font-weight: 500;">${data.address || 'N/A'}</td></tr>`;
                emailHtml += `</table></div>`;

                // Academic Information
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Academic Qualification</h3>`;
                emailHtml += `<p style="margin: 0 0 15px 0;"><strong>Highest Level:</strong> ${data.highestLevelOfEducation || 'N/A'}</p>`;
                
                if (data.educationHistory && data.educationHistory.length > 0) {
                    data.educationHistory.forEach(edu => {
                        emailHtml += `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 10px;">`;
                        emailHtml += `<div style="font-weight: bold; color: #334155;">${edu.level || 'Unknown Level'}</div>`;
                        emailHtml += `<div style="color: #475569;">${edu.programName || 'N/A'}</div>`;
                        emailHtml += `<div style="color: #64748b; font-size: 14px;">${edu.universityName || 'N/A'}</div>`;
                        emailHtml += `</div>`;
                    });
                } else {
                    emailHtml += `<p style="color: #64748b; font-style: italic;">No academic history provided.</p>`;
                }
                emailHtml += `</div>`;

                // Work Experience
                emailHtml += `<div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">`;
                emailHtml += `<h3 style="color: #0f172a; margin-top: 0;">Work Experience</h3>`;
                if (data.workExperience && data.workExperience.length > 0) {
                    data.workExperience.forEach(work => {
                        emailHtml += `<div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 10px;">`;
                        emailHtml += `<div style="font-weight: bold; color: #334155;">${work.position || 'Role'}</div>`;
                        emailHtml += `<div style="color: #475569;">${work.organisationName || 'N/A'}</div>`;
                        emailHtml += `</div>`;
                    });
                } else {
                    emailHtml += `<p style="color: #64748b; font-style: italic;">No work experience provided.</p>`;
                }
                emailHtml += `</div>`;

            } catch (jsonErr) {
                console.error("Failed to parse summaryData", jsonErr);
                emailHtml += `<p>Error parsing advanced candidate data.</p>`;
            }
        } else {
            emailHtml += `<p>Attached are the verified documents for Candidate: <strong>${candidateName || 'Unknown'}</strong>.</p>`;
        }
        
        emailHtml += `<div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; border-radius: 4px; color: #064e3b; margin-top: 20px;">`;
        emailHtml += `<strong>Document Bundle Attached:</strong> The verified files have been zipped and are securely attached to this email.`;
        emailHtml += `</div>`;

        emailHtml += `<p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px;">This is an automated administrative email from the Partner Portal. Do not reply.</p>`;
        emailHtml += `</div>`;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email, 
            subject: `documents of ${candidateName || 'Candidate'}`,
            html: emailHtml,
            attachments: [
                {
                    filename: zipFile.originalname || 'documents.zip',
                    content: zipFile.buffer
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
        res.status(200).json({ message: 'Email sent successfully with ZIP attachment!' });

    } catch (err) {
        console.error('Detailed Email sending error:', err);
        res.status(500).json({ error: `Failed to send email: ${err.message}` });
    }
});

module.exports = router;
```

### `backend/routes/studentDocs.js`
```javascript
const express = require('express');
const router = express.Router();
const multer = require('multer');
const archiver = require('archiver');
const nodemailer = require('nodemailer');

// Set up Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.array('files'), async (req, res) => {
    try {
        const { studentName, studentId, studentEmail } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        if (!studentName || !studentId || !studentEmail) {
            return res.status(400).json({ error: 'Missing required student details' });
        }

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(500).json({ error: 'System email not configured in .env' });
        }

        // Create an archiver instance
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level
        });

        // Collect the ZIP data in memory
        const chunks = [];
        archive.on('data', chunk => chunks.push(chunk));
        
        // Wait for compression to finish
        const zipFinished = new Promise((resolve, reject) => {
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', err => reject(err));
        });

        // Add files to the archive
        files.forEach(file => {
            // we use originalname, you could add logic to rename or append student ID
            archive.append(file.buffer, { name: file.originalname });
        });

        // Finalize the archive
        archive.finalize();

        // Get the final ZIP buffer
        const zipBuffer = await zipFinished;

        // Configure Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Setup email data precisely as requested
        const mailOptions = {
            from: `"${studentName} (ID: ${studentId})" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to yourself
            replyTo: studentEmail,
            subject: `[STUDENT_UPLOAD] ${studentName} - ID: ${studentId}`,
            text: `Please find the attached ZIP file containing ${files.length} document(s) for ${studentName} (ID: ${studentId}).\n\nContact: ${studentEmail}`,
            attachments: [
                {
                    filename: `${studentId}_Documents.zip`,
                    content: zipBuffer
                }
            ]
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        
        console.log(`Successfully zipped and emailed documents for student: ${studentName}`);
        res.status(200).json({ message: 'Documents successfully zipped and sent!' });

    } catch (err) {
        console.error('Error processing student documents:', err);
        res.status(500).json({ error: 'Failed to process and send documents: ' + err.message });
    }
});

module.exports = router;
```

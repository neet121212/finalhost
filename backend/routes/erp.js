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
      'countryOfEducation', 'highestLevelOfEducation', 'educationHistory', 'workExperience', 'appliedUniversities'
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

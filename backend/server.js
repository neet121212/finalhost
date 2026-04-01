require('dns').setServers(['8.8.8.8']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const app = express();

// CORS Configuration (Must be first to avoid CORS errors on crashes)
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-protected', 'x-auth-token']
}));

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for React runtime
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"], // Common image hosts
      connectSrc: [
        "'self'", 
        process.env.FRONTEND_URL || 'http://localhost:5173', 
        'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176',
        "https://script.google.com" // Needs to hit the proxy
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(express.json()); // Allows server to read JSON data

// Custom CSRF Protection Middleware (OWASP Recommendation for APIs)
app.use((req, res, next) => {
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (mutatingMethods.includes(req.method)) {
    // We enforce that the frontend explicitly attaches this header.
    // Malicious third-party sites cannot fake this due to browser restrictions.
    if (req.headers['x-csrf-protected'] !== '1') {
      return res.status(403).json({ error: 'CSRF Violation: Protected header missing' });
    }
  }
  next();
});

// Custom NoSQL Injection Prevention Middleware
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj instanceof Object) {
      for (let key in obj) {
        if (/^\$/.test(key)) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.headers) sanitize(req.headers);
  next();
});

app.use(cookieParser());

// Rate Limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests
  message: { error: 'Too many requests from this IP, please try again later' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/partner-request', authLimiter);


// Connect to MongoDB
if (!process.env.MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is completely undefined. The database cannot connect.");
}

mongoose.connect(process.env.MONGO_URI || '', { serverSelectionTimeoutMS: 5000 })
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
app.use('/api/admin', require('./routes/admin'));
app.use('/api/sheets', require('./routes/sheets'));


// Serve static React Frontend builds
app.use(express.static(path.join(__dirname, '../React/dist')));

// SPA Catch-all: Route all non-API requests to the React index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../React/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
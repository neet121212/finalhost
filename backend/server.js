require('dns').setServers(['8.8.8.8']);
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json()); // Allows server to read JSON data
app.use(cors());

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

// Serve static React Frontend builds
app.use(express.static(path.join(__dirname, '../React/dist')));

// SPA Catch-all: Route all non-API requests to the React index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../React/dist/index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
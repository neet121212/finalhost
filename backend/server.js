require('dns').setServers(['8.8.8.8']);
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
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

// Serve static React Frontend builds
app.use(express.static(path.join(__dirname, '../React/dist')));

// SPA Catch-all: Route all non-API requests to the React index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../React/dist/index.html'));
});

// Start server
app.listen(5000, () => console.log('Server running on port 5000'));
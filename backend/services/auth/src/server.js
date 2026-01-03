const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Auth Service is running', timestamp: new Date() });
});


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { dbName: 'authentication' }) // Connect and specify DB name
  .then(() => console.log('Auth Service: MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
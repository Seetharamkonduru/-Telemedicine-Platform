// server.js

// Load environment variables FIRST
require('dotenv').config({ path: './config/config.env' });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const User = require('./models/User'); // MongoDB model
const connectDB = require('./config/db'); // MongoDB connection file
const { auth, authorizeRoles } = require('./middleware/auth'); // Auth middleware

// Init Express App
const app = express();

// Connect to MongoDB Atlas
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files (like uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route Files
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medical-history', require('./routes/medicalHistory'));
app.use('/api/auth', require('./routes/auth')); // Optional, if you modularized auth

// ✅ Register Route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Please enter all fields' });

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Please enter all fields' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Logged in successfully', token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ✅ Protected Routes
app.get('/api/protected/patient', auth, authorizeRoles('patient'), (req, res) => {
  res.json({ message: `Welcome patient with ID: ${req.user.id}, you are authorized!` });
});

app.get('/api/protected/doctor', auth, authorizeRoles('doctor'), (req, res) => {
  res.json({ message: `Welcome doctor with ID: ${req.user.id}, you are authorized!` });
});

app.get('/api/protected', auth, (req, res) => {
  res.json({ msg: `Welcome user with ID: ${req.user.id}, you are authorized!` });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

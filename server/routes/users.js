const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Correct import for the User model

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = {
    user: {
      id: user.id,
      role: user.role, // Include role in the token payload
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// @route   POST /api/users/register/patient
// @desc    Register a new patient
// @access  Public
router.post('/register/patient', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      role: 'patient',
      patientProfile: {
        name: name,
      },
    });

    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      message: 'Patient registered successfully',
      token,
      role: user.role,
      userId: user._id,
      userName: user.patientProfile.name
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/register/doctor
// @desc    Register a new doctor
// @access  Public
router.post('/register/doctor', async (req, res) => {
  const { email, password, name, specialty, hospital, rating, reviews, price } = req.body; // NEW: Added price

  if (!email || !password || !name || !specialty || !hospital || price === undefined || price === null) { // NEW: Validate price
    return res.status(400).json({ message: 'Please enter all required doctor fields, including price.' });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      role: 'doctor',
      doctorProfile: {
        name,
        specialty,
        hospital,
        rating: rating || 0,
        reviews: reviews || 0,
        price: price, // NEW: Save price
      },
    });

    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      message: 'Doctor registered successfully',
      token,
      role: user.role,
      userId: user._id,
      userName: user.doctorProfile.name,
      userSpecialty: user.doctorProfile.specialty,
      userHospital: user.doctorProfile.hospital,
      userPrice: user.doctorProfile.price // NEW: Return price
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/users/login
// @desc    Login user (patient or doctor)
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: 'Please enter all fields including role' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    if (user.role !== role) {
      return res.status(400).json({ message: 'Invalid role for this user' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }

    const token = generateToken(user);
    const userName = user.role === 'patient' ? user.patientProfile.name : user.doctorProfile.name;
    const userSpecialty = user.role === 'doctor' ? user.doctorProfile.specialty : undefined;
    const userHospital = user.role === 'doctor' ? user.doctorProfile.hospital : undefined;
    const userPrice = user.role === 'doctor' ? user.doctorProfile.price : undefined; // NEW: Get price for login response


    res.json({
      message: 'Logged in successfully',
      token,
      role: user.role,
      userId: user._id,
      userName: userName,
      userSpecialty: userSpecialty,
      userHospital: userHospital,
      userPrice: userPrice // NEW: Return price on login
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

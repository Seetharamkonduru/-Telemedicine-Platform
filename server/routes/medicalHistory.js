const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/auth');
const MedicalHistory = require('../models/MedicalHistory'); // Note: This is for text-based history, not file uploads
const User = require('../models/User'); // Correct import

// @route   POST /api/medical-history/:patientId
// @desc    Add a new medical history record for a patient (text-based)
// @access  Private (Doctor only)
router.post('/:patientId', auth, authorizeRoles('doctor'), async (req, res) => {
  const patientId = req.params.patientId;
  const doctorId = req.user.id; // Doctor ID from authenticated token
  const { diagnosis, treatment, notes } = req.body;

  if (!diagnosis || !treatment) {
    return res.status(400).json({ message: 'Please provide diagnosis and treatment' });
  }

  try {
    // Verify patient exists
    const patient = await User.findOne({ _id: patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const newRecord = new MedicalHistory({
      patient: patientId,
      doctor: doctorId,
      diagnosis,
      treatment,
      notes,
    });

    await newRecord.save();
    res.status(201).json({ message: 'Medical history record added successfully', record: newRecord });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/medical-history/:patientId
// @desc    Get medical history for a specific patient (text-based)
// @access  Private (Patient or Doctor who recorded it)
router.get('/:patientId', auth, async (req, res) => {
  const patientId = req.params.patientId;
  const userId = req.user.id; // Current user's ID
  const userRole = req.user.role; // Current user's role

  try {
    if (userRole === 'patient' && patientId !== userId) {
      return res.status(403).json({ message: 'Access denied: You can only view your own medical history.' });
    }

    // Note: This fetches from the MedicalHistory model which now also stores file metadata.
    // If you had separate text-based history, you'd need another model.
    const medicalHistory = await MedicalHistory.find({ patient: patientId })
      .populate('doctor', 'email doctorProfile.name'); // Populate doctor who recorded it

    res.json(medicalHistory);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

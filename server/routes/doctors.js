const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MedicalHistory = require('../models/MedicalHistory');
const { auth, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/doctors/patients
// @desc    Get all patients (for a doctor to view their list)
// @access  Private (Doctor only)
router.get('/patients', auth, authorizeRoles('doctor'), async (req, res) => {
  try {
    // Fetch all users with the 'patient' role
    const patients = await User.find({ role: 'patient' }).select('-password -doctorProfile'); // Exclude password and doctorProfile

    if (!patients || patients.length === 0) {
      return res.status(200).json({ msg: 'No patients found.', patients: [] }); // Return empty array instead of 404
    }
    res.json(patients);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/doctors/patient/:patientId
// @desc    Get details for a specific patient, including their medical history
// @access  Private (Doctor only)
router.get('/patient/:patientId', auth, authorizeRoles('doctor'), async (req, res) => {
  try {
    const patientId = req.params.patientId;

    // Fetch patient's profile
    const patient = await User.findById(patientId).select('-password -doctorProfile'); // Exclude password and doctorProfile
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ msg: 'Patient not found.' });
    }

    // Fetch patient's medical history documents from the MedicalHistory collection
    const medicalHistory = await MedicalHistory.find({ patient: patientId }).sort({ uploadedAt: -1 });

    res.json({
      patient: {
        id: patient._id,
        name: patient.patientProfile.name,
        email: patient.email,
        // Add other patient profile details you want to show
      },
      medicalHistory: medicalHistory,
    });

  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ msg: 'Invalid patient ID.' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;

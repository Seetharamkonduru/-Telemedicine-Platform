const express = require('express');
const router = express.Router();
const { auth, authorizeRoles } = require('../middleware/auth');
const Appointment = require('../models/Appointment');
const User = require('../models/User'); // Correct import

// @route   POST /api/appointments/book
// @desc    Book a new appointment
// @access  Private (Patient only)
router.post('/book', auth, authorizeRoles('patient'), async (req, res) => {
  const { doctorId, date, time } = req.body;
  const patientId = req.user.id; // Patient ID from the authenticated token

  if (!doctorId || !date || !time) {
    return res.status(400).json({ message: 'Please provide doctor, date, and time' });
  }

  try {
    // Verify doctor exists and is actually a doctor
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found or invalid doctor ID' });
    }

    // Check for existing appointments at the same time for this doctor
    const existingAppointment = await Appointment.findOne({ doctor: doctorId, date, time });
    if (existingAppointment) {
      return res.status(400).json({ message: 'This slot is already booked for this doctor.' });
    }

    const newAppointment = new Appointment({
      patient: patientId,
      doctor: doctorId,
      date,
      time,
      status: 'confirmed', // Or 'pending' if you want a confirmation step
    });

    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment: newAppointment });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/appointments/doctor/:doctorId
// @desc    Get all appointments for a specific doctor
// @access  Private (Doctor only)
router.get('/doctor/:doctorId', auth, authorizeRoles('doctor'), async (req, res) => {
  const requestedDoctorId = req.params.doctorId;
  const loggedInDoctorId = req.user.id; // Doctor ID from the authenticated token

  // Ensure the logged-in doctor is requesting their own appointments
  if (requestedDoctorId !== loggedInDoctorId) {
    return res.status(403).json({ message: 'Access denied: You can only view your own appointments.' });
  }

  try {
    // Populate patient details (email and patientProfile.name)
    const appointments = await Appointment.find({ doctor: requestedDoctorId })
      .populate('patient', 'email patientProfile.name'); // Populate patient's email and name

    res.json(appointments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/appointments/patient/:patientId
// @desc    Get all appointments for a specific patient
// @access  Private (Patient only)
router.get('/patient/:patientId', auth, authorizeRoles('patient'), async (req, res) => {
  const requestedPatientId = req.params.patientId;
  const loggedInPatientId = req.user.id; // Patient ID from the authenticated token

  // Ensure the logged-in patient is requesting their own appointments
  if (requestedPatientId !== loggedInPatientId) {
    return res.status(403).json({ message: 'Access denied: You can only view your own appointments.' });
  }

  try {
    // Populate doctor details (email and doctorProfile.name)
    const appointments = await Appointment.find({ patient: requestedPatientId })
      .populate('doctor', 'email doctorProfile.name doctorProfile.specialty doctorProfile.hospital'); // Populate doctor's email, name, specialty, hospital

    res.json(appointments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});


// @route   GET /api/doctors
// @desc    Get all doctors (for FDoctors page)
// @access  Public
router.get('/doctors', async (req, res) => {
  try {
    // This is where User.find() is called.
    const doctors = await User.find({ role: 'doctor' }).select('-password -role -date -patientProfile'); // Exclude sensitive fields and patientProfile
    res.json(doctors.map(doctor => ({
        _id: doctor._id,
        name: doctor.doctorProfile.name,
        specialty: doctor.doctorProfile.specialty,
        hospital: doctor.doctorProfile.hospital,
        rating: doctor.doctorProfile.rating,
        reviews: doctor.doctorProfile.reviews,
        price: doctor.doctorProfile.price,
        email: doctor.email // Include email for contact in dashboard
    })));
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});


module.exports = router;

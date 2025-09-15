const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model (patient)
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // References the User model (doctor)
    required: true,
  },
  date: {
    type: String, // Stored as 'YYYY-MM-DD'
    required: true,
  },
  time: {
    type: String, // Stored as 'HH:MM AM/PM'
    required: true,
  },
  status: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled', 'completed'],
    default: 'confirmed',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: { // Added role field: 'patient' or 'doctor'
    type: String,
    enum: ['patient', 'doctor'], // Restrict values to 'patient' or 'doctor'
    default: 'patient', // Default role for new registrations
  },
  patientProfile: { // New: Optional sub-document for patient-specific details
    name: {
      type: String, // Corrected: Directly use String type
      required: function() { return this.role === 'patient'; } // Required only if role is 'patient'
    },
    // medicalHistoryFiles field removed from here, as it's now in MedicalHistory model
  },
  doctorProfile: { // Optional sub-document for doctor-specific details
    name: {
      type: String, // Corrected: Directly use String type
      required: function() { return this.role === 'doctor'; } // Required only if role is 'doctor'
    },
    specialty: {
      type: String, // Corrected: Directly use String type
      required: function() { return this.role === 'doctor'; }
    },
    hospital: {
      type: String, // Corrected: Directly use String type
      required: function() { return this.role === 'doctor'; }
    },
    rating: {
      type: Number,
      default: 0
    },
    reviews: {
      type: Number,
      default: 0
    },
    price: { // NEW FIELD: Doctor's price
      type: Number,
      default: 0,
      required: function() { return this.role === 'doctor'; } // Make price required for doctors
    }
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

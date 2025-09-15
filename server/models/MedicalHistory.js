const mongoose = require('mongoose');

const MedicalHistorySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model (patient's ID)
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  filePath: { // Path to the file on the server's file system
    type: String,
    required: true,
  },
  fileMimeType: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  description: { // Optional: A brief description of the document
    type: String,
  },
});

module.exports = mongoose.model('MedicalHistory', MedicalHistorySchema);

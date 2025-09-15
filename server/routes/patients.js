const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../models/User'); // Still need User model for patient profile data
const MedicalHistory = require('../models/MedicalHistory'); // NEW: Import MedicalHistory model
const { auth, authorizeRoles } = require('../middleware/auth');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads', 'medical_history');
    require('fs').mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Filter for file types
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images, PDFs, and Documents Only!')); // Pass error as an Error object
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: fileFilter
}).single('medicalHistoryFile'); // 'medicalHistoryFile' is the name of the input field in your HTML form

// @route   POST /api/patients/uploadMedicalHistory
// @desc    Upload a medical history file for a patient
// @access  Private (Patient only)
router.post('/uploadMedicalHistory', auth, authorizeRoles('patient'), (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error(err);
      // Check if it's a Multer error or other error
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ msg: `Multer Error: ${err.message}` });
      } else if (err.message) {
        return res.status(400).json({ msg: err.message }); // Custom fileFilter error
      } else {
        return res.status(500).json({ msg: 'An unknown error occurred during file upload.' });
      }
    }
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded.' });
    }

    try {
      // NEW: Create a new MedicalHistory document instead of pushing to User model
      const medicalDoc = new MedicalHistory({
        patient: req.user.id, // The patient's ID from the authenticated token
        fileName: req.file.originalname,
        filePath: `/uploads/medical_history/${req.file.filename}`, // Store relative URL for client access
        fileMimeType: req.file.mimetype,
        // description: req.body.description, // If you add a description field in the frontend
      });

      await medicalDoc.save();
      res.status(201).json({
        msg: 'Medical history file uploaded successfully',
        file: {
          id: medicalDoc._id, // Return the ID of the new document
          fileName: medicalDoc.fileName,
          filePath: medicalDoc.filePath,
          fileMimeType: medicalDoc.fileMimeType,
          uploadedAt: medicalDoc.uploadedAt,
        }
      });

    } catch (dbError) {
      console.error(dbError.message);
      res.status(500).send('Server Error during database update.');
    }
  });
});

// @route   GET /api/patients/medicalHistoryFiles
// @desc    Get all medical history files for the logged-in patient
// @access  Private (Patient only)
router.get('/medicalHistoryFiles', auth, authorizeRoles('patient'), async (req, res) => {
  try {
    // NEW: Fetch from MedicalHistory model directly
    const files = await MedicalHistory.find({ patient: req.user.id }).sort({ uploadedAt: -1 });
    if (!files || files.length === 0) {
      return res.status(200).json({ msg: 'No medical history files found for this patient.', files: [] }); // Return empty array instead of 404
    }
    res.json(files);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer to store images in a specific directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'images/checklist/';

    // Ensure the 'images/checklist' directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory and its parent directories if they don't exist
    }

    // Save the file in the 'images/checklist/' directory
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename using the timestamp and the original file extension
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// Initialize multer with the storage configuration
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      const fileTypes = /jpeg|jpg|png|gif/;
      const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = fileTypes.test(file.mimetype);
  
      if (extname && mimetype) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'), false);
      }
    }
  });


// Create the API route to handle image upload
router.post('/upload-image',(req, res) => {

  console.log(req.file)
  if (!req.file) {
    return res.status(400).json({ error: 'Testing' });
  }

  // Construct the image URL based on the server's IP and port
  const imageUrl = `http://192.168.1.54:/images/checklist/${req.file.filename}`;

  // Send back the image URL to the client
  res.json({ imageUrl });
});

module.exports = router;

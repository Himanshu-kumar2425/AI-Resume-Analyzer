const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { uploadResume: uploadMiddleware } = require('../middleware/uploadMiddleware');
const {
  uploadResume,
  getHistory,
  getResumeById,
} = require('../controllers/resumeController');

const router = express.Router();

// All resume routes require authentication
router.use(protect);

router.post('/upload', uploadMiddleware, uploadResume);
router.get('/history', getHistory);
router.get('/:id', getResumeById);

module.exports = router;

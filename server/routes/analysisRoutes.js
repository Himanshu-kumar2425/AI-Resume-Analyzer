const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { generateAnalysis, getAnalysis } = require('../controllers/analysisController');

const router = express.Router();

router.use(protect);

router.post('/generate', generateAnalysis);
router.get('/:id', getAnalysis);

module.exports = router;

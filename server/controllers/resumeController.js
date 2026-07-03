const Resume   = require('../models/Resume');
const Analysis = require('../models/Analysis');
const { extractText, ParseError } = require('../services/parserService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * POST /api/resume/upload
 * Expects multipart/form-data with field 'resume' (applied via uploadMiddleware).
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'No file uploaded.', 400);
    }

    let extractedText;
    try {
      extractedText = await extractText(req.file.buffer, req.file.mimetype);
    } catch (err) {
      if (err instanceof ParseError) {
        return sendError(res, err.message, 422);
      }
      throw err;
    }

    const resume = await Resume.create({
      userId:        req.user.id,
      fileName:      req.file.originalname,
      fileSize:      req.file.size,
      mimeType:      req.file.mimetype,
      extractedText,
    });

    return sendSuccess(
      res,
      {
        resumeId:   resume._id,
        fileName:   resume.fileName,
        uploadDate: resume.uploadDate,
      },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/resume/history?page=1&limit=10
 */
const getHistory = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume.find({ userId: req.user.id })
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit)
        .select('-extractedText'), // exclude large text from list view
      Resume.countDocuments({ userId: req.user.id }),
    ]);

    // Attach the most recent analysisId for each resume (for direct linking)
    const resumeIds = resumes.map((r) => r._id);
    const analyses  = await Analysis.find({
      resumeId: { $in: resumeIds },
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select('resumeId resumeScore atsScore createdAt');

    // Map: resumeId → latest analysis
    const analysisMap = {};
    for (const a of analyses) {
      const key = a.resumeId.toString();
      if (!analysisMap[key]) analysisMap[key] = a; // already sorted desc, first = latest
    }

    const enriched = resumes.map((r) => ({
      ...r.toJSON(),
      latestAnalysis: analysisMap[r._id.toString()] || null,
    }));

    return sendSuccess(res, {
      resumes: enriched,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/resume/:id
 */
const getResumeById = async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id).select('-extractedText');

    if (!resume) {
      return sendError(res, 'Resume not found.', 404);
    }

    // Ownership check
    if (resume.userId.toString() !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, resume);
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadResume, getHistory, getResumeById };

const mongoose = require('mongoose');
const Resume   = require('../models/Resume');
const Analysis = require('../models/Analysis');
const {
  parseResume,
  analyzeResume,
  matchJobRole,
  generateInterviewQuestions,
  generateImprovements,
  AiServiceError,
} = require('../services/aiService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const ALLOWED_ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Software Engineer',
  'Data Analyst',
];

/**
 * POST /api/analysis/generate
 * Body: { resumeId, targetRole }
 *
 * Fires all 5 AI calls in parallel (Promise.all) since none depends on another.
 */
const generateAnalysis = async (req, res, next) => {
  try {
    const { resumeId, targetRole } = req.body;

    // ── Input validation ────────────────────────────────────────────────────
    if (!resumeId || !mongoose.Types.ObjectId.isValid(resumeId)) {
      return sendError(res, 'A valid resumeId is required.', 400);
    }
    if (!targetRole || !ALLOWED_ROLES.includes(targetRole)) {
      return sendError(
        res,
        `targetRole must be one of: ${ALLOWED_ROLES.join(', ')}.`,
        400
      );
    }

    // ── Load resume + ownership check ───────────────────────────────────────
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return sendError(res, 'Resume not found.', 404);
    }
    if (resume.userId.toString() !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    const { extractedText } = resume;

    // ── Fire all AI calls in parallel ───────────────────────────────────────
    let parsed, analysis, roleMatch, questions, improvements;
    try {
      [parsed, analysis, roleMatch, questions, improvements] = await Promise.all([
        parseResume(extractedText),
        analyzeResume(extractedText),
        matchJobRole(extractedText, targetRole),
        generateInterviewQuestions(extractedText, targetRole),
        generateImprovements(extractedText),
      ]);
    } catch (err) {
      if (err instanceof AiServiceError) {
        return sendError(res, err.message, 502);
      }
      throw err;
    }

    // ── Assemble and persist Analysis document ──────────────────────────────
    const doc = await Analysis.create({
      resumeId: resume._id,
      userId:   req.user.id,

      resumeScore:           analysis.resumeScore,
      atsScore:              analysis.atsScore,
      strengths:             analysis.strengths             || [],
      weaknesses:            analysis.weaknesses            || [],
      missingSkills:         analysis.missingSkills         || [],
      grammarSuggestions:    analysis.grammarSuggestions    || [],
      formattingSuggestions: analysis.formattingSuggestions || [],

      jobRoleMatch: {
        role:            roleMatch.role,
        matchPercent:    roleMatch.matchPercent,
        missingTech:     roleMatch.missingTech     || [],
        recommendations: roleMatch.recommendations || [],
      },

      interviewQuestions: Array.isArray(questions) ? questions : [],

      improvements: {
        projectDescriptions: improvements.projectDescriptions || {},
        skillsSection:       improvements.skillsSection       || {},
        summarySection:      improvements.summarySection       || {},
      },
    });

    return sendSuccess(res, doc, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analysis/:id
 */
const getAnalysis = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendError(res, 'Invalid analysis ID.', 400);
    }

    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return sendError(res, 'Analysis not found.', 404);
    }

    if (analysis.userId.toString() !== req.user.id) {
      return sendError(res, 'Access denied.', 403);
    }

    return sendSuccess(res, analysis);
  } catch (err) {
    next(err);
  }
};

module.exports = { generateAnalysis, getAnalysis };

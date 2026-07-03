const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['Technical', 'HR', 'Project-Based'],
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
    },
    question: String,
  },
  { _id: false }
);

const improvementSectionSchema = new mongoose.Schema(
  {
    original: String,
    rewritten: String,
  },
  { _id: false }
);

const analysisSchema = new mongoose.Schema(
  {
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Core scores
    resumeScore: { type: Number, min: 0, max: 100 },
    atsScore:    { type: Number, min: 0, max: 100 },

    // Qualitative feedback
    strengths:             [String],
    weaknesses:            [String],
    missingSkills:         [String],
    grammarSuggestions:    [String],
    formattingSuggestions: [String],

    // Job role matching
    jobRoleMatch: {
      role:            String,
      matchPercent:    { type: Number, min: 0, max: 100 },
      missingTech:     [String],
      recommendations: [String],
    },

    // Interview questions
    interviewQuestions: [interviewQuestionSchema],

    // Resume improvement suggestions
    improvements: {
      projectDescriptions: improvementSectionSchema,
      skillsSection:       improvementSectionSchema,
      summarySection:      improvementSectionSchema,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Analysis', analysisSchema);

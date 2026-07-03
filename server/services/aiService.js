const Groq = require('groq-sdk');

// ── Client initialization ──────────────────────────────────────────────────────
// API key read exclusively from environment — never a string literal
const getClient = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

// ── Custom error ───────────────────────────────────────────────────────────────
class AiServiceError extends Error {
  constructor(message = 'AI analysis service is temporarily unavailable. Please try again.') {
    super(message);
    this.name = 'AiServiceError';
    this.statusCode = 502;
    this.isOperational = true;
  }
}

// ── Utility: clamp a value to [0, 100] ────────────────────────────────────────
const clampScore = (value) => {
  const n = Number(value);
  if (isNaN(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
};

// ── Core retry wrapper ─────────────────────────────────────────────────────────
/**
 * Calls the Groq API up to 2 times.
 * Expects the model to return ONLY a JSON object (no markdown fences).
 * Throws AiServiceError if both attempts fail to produce valid JSON.
 */
const callGeminiWithRetry = async (prompt) => {
  const client = getClient();

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      const rawText = response.choices[0].message.content.trim();

      // Strip accidental markdown code fences if the model adds them
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '');

      return JSON.parse(cleaned);
    } catch (err) {
      console.error('AI ERROR:', err.message || err);
      if (attempt === 2) {
        throw new AiServiceError();
      }
      // Small delay before retry
      await new Promise((r) => setTimeout(r, 500));
    }
  }
};

// ── Prompt templates ───────────────────────────────────────────────────────────
// All prompts are defined as constants here for easy iteration (REQ from design doc).

const PARSE_RESUME_PROMPT = (text) => `
You are a professional resume parser. Extract structured information from the resume text below.
Respond ONLY with a valid JSON object matching this exact schema — no markdown, no explanation:

{
  "name": "<string>",
  "email": "<string>",
  "phone": "<string>",
  "skills": ["<string>"],
  "education": [{ "institution": "<string>", "degree": "<string>", "year": "<string>" }],
  "experience": [{ "company": "<string>", "role": "<string>", "duration": "<string>", "description": "<string>" }],
  "projects": [{ "name": "<string>", "description": "<string>", "technologies": ["<string>"] }],
  "certifications": ["<string>"]
}

Resume text:
"""
${text}
"""
`.trim();

const ANALYZE_RESUME_PROMPT = (text) => `
You are an expert resume coach and ATS specialist. Analyze the resume text below.
Respond ONLY with a valid JSON object matching this exact schema — no markdown, no explanation:

{
  "resumeScore": <integer 0-100>,
  "atsScore": <integer 0-100>,
  "strengths": ["<string>"],
  "weaknesses": ["<string>"],
  "missingSkills": ["<string>"],
  "grammarSuggestions": ["<string>"],
  "formattingSuggestions": ["<string>"]
}

Scoring guide:
- resumeScore: overall quality (content, clarity, impact, structure)
- atsScore: likelihood an ATS parses it correctly (keywords, formatting, no tables/images)

Resume text:
"""
${text}
"""
`.trim();

const MATCH_JOB_ROLE_PROMPT = (text, role) => `
You are a technical hiring specialist. Compare the resume below against the target role: "${role}".
Respond ONLY with a valid JSON object matching this exact schema — no markdown, no explanation:

{
  "role": "${role}",
  "matchPercent": <integer 0-100>,
  "missingTech": ["<string>"],
  "recommendations": ["<string>"]
}

Resume text:
"""
${text}
"""
`.trim();

const INTERVIEW_QUESTIONS_PROMPT = (text, role) => `
You are a senior technical interviewer. Generate interview questions for a candidate applying for: "${role}".
Base the questions on their actual resume content. Cover all three categories and all three difficulties.
Respond ONLY with a valid JSON array matching this exact schema — no markdown, no explanation:

[
  { "category": "Technical",     "difficulty": "Easy",   "question": "<string>" },
  { "category": "Technical",     "difficulty": "Medium", "question": "<string>" },
  { "category": "Technical",     "difficulty": "Hard",   "question": "<string>" },
  { "category": "HR",            "difficulty": "Easy",   "question": "<string>" },
  { "category": "HR",            "difficulty": "Medium", "question": "<string>" },
  { "category": "HR",            "difficulty": "Hard",   "question": "<string>" },
  { "category": "Project-Based", "difficulty": "Easy",   "question": "<string>" },
  { "category": "Project-Based", "difficulty": "Medium", "question": "<string>" },
  { "category": "Project-Based", "difficulty": "Hard",   "question": "<string>" }
]

Resume text:
"""
${text}
"""
`.trim();

const IMPROVEMENTS_PROMPT = (text) => `
You are a professional resume writer. Rewrite the three sections below to be more impactful, concise, and ATS-friendly.
Respond ONLY with a valid JSON object matching this exact schema — no markdown, no explanation:

{
  "projectDescriptions": {
    "original": "<extracted project descriptions from the resume>",
    "rewritten": "<improved version>"
  },
  "skillsSection": {
    "original": "<extracted skills section from the resume>",
    "rewritten": "<improved version>"
  },
  "summarySection": {
    "original": "<extracted summary/objective from the resume, or empty string if absent>",
    "rewritten": "<improved professional summary>"
  }
}

Resume text:
"""
${text}
"""
`.trim();

// ── Exported AI functions ──────────────────────────────────────────────────────

const parseResume = (text) =>
  callGeminiWithRetry(PARSE_RESUME_PROMPT(text));

const analyzeResume = async (text) => {
  const result = await callGeminiWithRetry(ANALYZE_RESUME_PROMPT(text));
  // Clamp scores defensively (REQ-ANALYSIS-02)
  result.resumeScore = clampScore(result.resumeScore);
  result.atsScore    = clampScore(result.atsScore);
  return result;
};

const matchJobRole = async (text, role) => {
  const result = await callGeminiWithRetry(MATCH_JOB_ROLE_PROMPT(text, role));
  result.matchPercent = clampScore(result.matchPercent);
  return result;
};

const generateInterviewQuestions = (text, role) =>
  callGeminiWithRetry(INTERVIEW_QUESTIONS_PROMPT(text, role));

const generateImprovements = (text) =>
  callGeminiWithRetry(IMPROVEMENTS_PROMPT(text));

module.exports = {
  parseResume,
  analyzeResume,
  matchJobRole,
  generateInterviewQuestions,
  generateImprovements,
  AiServiceError,
};

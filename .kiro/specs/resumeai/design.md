# ResumeAI — System Design Document
**Version:** 1.0  
**Date:** 2026-07-02  
**Status:** Awaiting Approval

---

## 1. System Overview

ResumeAI is a full-stack MERN application with a clear client/server boundary. The frontend is a single-page React application; the backend is a RESTful Express API. All AI work is delegated to the Google Gemini API through a centralized service layer. File processing happens entirely on the backend — the frontend never touches raw file bytes after upload.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                   │
│  Pages: Home · Login · Register · Dashboard · Upload        │
│         Analysis Result · History · Profile · Admin         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS (Axios)
┌──────────────────────▼──────────────────────────────────────┐
│                  Express API  (Node.js)                      │
│  routes/ → middleware/ → controllers/ → services/           │
│                         ↓                                   │
│              MongoDB Atlas (Mongoose)                        │
│                         ↓                                   │
│              Google Gemini API  (@google/genai)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Repository Layout

```
resumeai/
├── client/                         # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                    # Axios instance + per-resource modules
│   │   │   ├── axiosInstance.js
│   │   │   ├── authApi.js
│   │   │   ├── resumeApi.js
│   │   │   └── analysisApi.js
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ScoreBadge.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── Toast.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # JWT + user state
│   │   ├── hooks/
│   │   │   └── useToast.js
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UploadResume.jsx
│   │   │   ├── AnalysisResult.jsx
│   │   │   ├── History.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                         # Express backend
│   ├── config/
│   │   └── db.js                   # Mongoose connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── resumeController.js
│   │   ├── analysisController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   ├── adminMiddleware.js      # Role check
│   │   ├── uploadMiddleware.js     # Multer config
│   │   └── errorMiddleware.js      # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Resume.js
│   │   └── Analysis.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── resumeRoutes.js
│   │   ├── analysisRoutes.js
│   │   └── adminRoutes.js
│   ├── services/
│   │   ├── aiService.js            # All Gemini calls + prompt templates
│   │   ├── parserService.js        # pdf-parse + mammoth wrappers
│   │   └── validationService.js    # Input validators
│   ├── utils/
│   │   └── responseHelper.js       # Standard success/error shapers
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js                   # Express app entry point
│
└── README.md
```

---

## 3. Data Models

### 3.1 User

```js
// models/User.js
{
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },          // bcrypt hash
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
}
```

Indexes: unique index on `email`.  
The `password` field is excluded from all `.find()` / `.findById()` responses via a schema `transform` or by explicit `-password` projection.

---

### 3.2 Resume

```js
// models/Resume.js
{
  userId:        { type: ObjectId, ref: 'User', required: true, index: true },
  fileName:      { type: String, required: true },
  fileSize:      { type: Number },                      // bytes
  mimeType:      { type: String },
  extractedText: { type: String, required: true },
  uploadDate:    { type: Date, default: Date.now }
}
```

Indexes: `userId` for fast per-user history lookups.

---

### 3.3 Analysis

```js
// models/Analysis.js
{
  resumeId:   { type: ObjectId, ref: 'Resume', required: true, index: true },
  userId:     { type: ObjectId, ref: 'User',   required: true, index: true },

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
    role:           String,
    matchPercent:   { type: Number, min: 0, max: 100 },
    missingTech:    [String],
    recommendations:[String]
  },

  // Interview questions
  interviewQuestions: [{
    category:   { type: String, enum: ['Technical', 'HR', 'Project-Based'] },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    question:   String
  }],

  // Resume improvement
  improvements: {
    projectDescriptions: { original: String, rewritten: String },
    skillsSection:       { original: String, rewritten: String },
    summarySection:      { original: String, rewritten: String }
  },

  createdAt: { type: Date, default: Date.now }
}
```

Indexes: `resumeId`, `userId`.

---

## 4. API Design

All responses follow this envelope:

```json
// Success
{ "data": <payload> }

// Error
{ "error": "<human-readable message>" }
```

HTTP status codes are used semantically: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 502 Bad Gateway, 500 Internal Server Error.

---

### 4.1 Auth Routes — `/api/auth`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/register` | None | `{ name, email, password }` | 201 `{ data: { token, user: { id, name, email, role } } }` |
| POST | `/login` | None | `{ email, password }` | 200 `{ data: { token, user: { id, name, email, role } } }` |

Validation rules:
- `name`: required, 2–80 chars
- `email`: required, valid email format
- `password`: required, minimum 8 chars

---

### 4.2 Resume Routes — `/api/resume`

All routes require `Authorization: Bearer <token>`.

| Method | Path | Body / Params | Response |
|--------|------|---------------|----------|
| POST | `/upload` | `multipart/form-data` with field `resume` | 201 `{ data: { resumeId, fileName, uploadDate } }` |
| GET | `/history` | Query: `?page=1&limit=10` | 200 `{ data: { resumes: [...], total, page, pages } }` |
| GET | `/:id` | Path param `id` | 200 `{ data: <Resume document> }` |

Upload flow (server-side):
1. Multer validates MIME type and size before touching the file buffer.
2. `parserService` extracts text based on MIME type.
3. Resume document is saved; `resumeId` returned to client.
4. Raw file buffer is discarded — only extracted text is persisted.

---

### 4.3 Analysis Routes — `/api/analysis`

All routes require `Authorization: Bearer <token>`.

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/generate` | `{ resumeId, targetRole }` | 201 `{ data: <Analysis document> }` |
| GET | `/:id` | — | 200 `{ data: <Analysis document> }` |

`POST /generate` orchestration (all steps in a single request):
1. Load Resume by `resumeId`; verify it belongs to the requesting user.
2. Call `aiService.parseResume(extractedText)` → structured fields.
3. Call `aiService.analyzeResume(extractedText)` → scores + feedback.
4. Call `aiService.matchJobRole(extractedText, targetRole)` → role match.
5. Call `aiService.generateInterviewQuestions(extractedText, targetRole)` → questions.
6. Call `aiService.generateImprovements(extractedText)` → before/after sections.
7. Assemble and persist one Analysis document; return it.

Each AI call uses the retry-once pattern described in the requirements.

---

### 4.4 Admin Routes — `/api/admin`

Requires `Authorization: Bearer <token>` + admin role.

| Method | Path | Response |
|--------|------|----------|
| GET | `/stats` | 200 `{ data: { totalUsers, totalResumes, topSkills: [{ skill, count }] } }` |

`topSkills` is computed via a MongoDB aggregation pipeline that unwinds `missingSkills` across all Analysis documents and groups by value.

---

## 5. Middleware Stack

```
Request
  │
  ├─ express.json()              – parse JSON body
  ├─ cors()                      – allow frontend origin
  ├─ uploadMiddleware (Multer)   – on upload routes only
  ├─ authMiddleware              – verify JWT, attach req.user
  ├─ adminMiddleware             – check req.user.role === 'admin'
  │
  ├─ Route Handler (controller)
  │
  └─ errorMiddleware             – catch-all; format { error } shape
```

`authMiddleware` shape:
```js
// Attaches to req.user: { id, name, email, role }
// Returns 401 if token missing, expired, or malformed
```

`uploadMiddleware` (Multer in-memory storage):
```js
// fileFilter: reject if mimetype not in ['application/pdf',
//   'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
// limits: { fileSize: 5 * 1024 * 1024 }
```

---

## 6. AI Service Design (`services/aiService.js`)

All Gemini interactions are isolated here. No controller or route imports `@google/genai` directly.

### 6.1 Prompt Strategy

Each function builds a prompt that instructs Gemini to respond **only** with a JSON object matching a specific schema. Example pattern:

```
You are a professional resume analyst. Analyze the following resume text and respond ONLY with a valid JSON object matching this exact schema — no markdown, no explanation:

{
  "resumeScore": <integer 0-100>,
  "atsScore": <integer 0-100>,
  ...
}

Resume text:
"""
<extractedText>
"""
```

All prompt templates are defined as named constants at the top of `aiService.js` so they are easy to iterate on without touching logic.

### 6.2 Retry Logic

```js
async function callGeminiWithRetry(prompt) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const raw = await geminiClient.generateContent(prompt);
      const json = JSON.parse(raw.text());         // throws if malformed
      return json;
    } catch (err) {
      if (attempt === 2) throw new AiServiceError('AI returned invalid response');
    }
  }
}
```

### 6.3 Exported Functions

| Function | Input | Output |
|---|---|---|
| `parseResume(text)` | raw text | `{ name, email, phone, skills[], education[], experience[], projects[], certifications[] }` |
| `analyzeResume(text)` | raw text | `{ resumeScore, atsScore, strengths[], weaknesses[], missingSkills[], grammarSuggestions[], formattingSuggestions[] }` |
| `matchJobRole(text, role)` | raw text + role string | `{ role, matchPercent, missingTech[], recommendations[] }` |
| `generateInterviewQuestions(text, role)` | raw text + role | `[{ category, difficulty, question }]` |
| `generateImprovements(text)` | raw text | `{ projectDescriptions, skillsSection, summarySection }` each with `{ original, rewritten }` |

---

## 7. Parser Service Design (`services/parserService.js`)

```js
// Detects file type and delegates to the correct library
async function extractText(buffer, mimetype) {
  if (mimetype === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (mimetype === 'application/vnd.openxmlformats...') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  throw new Error('Unsupported file type');
}
```

Returns empty-string check: if `text.trim().length === 0`, throw a `ParseError` so the controller can return 422.

---

## 8. Frontend Architecture

### 8.1 Routing

```jsx
// App.jsx — React Router DOM v6
<Routes>
  <Route path="/"              element={<Home />} />
  <Route path="/login"         element={<Login />} />
  <Route path="/register"      element={<Register />} />
  <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/upload"        element={<ProtectedRoute><UploadResume /></ProtectedRoute>} />
  <Route path="/analysis/:id"  element={<ProtectedRoute><AnalysisResult /></ProtectedRoute>} />
  <Route path="/history"       element={<ProtectedRoute><History /></ProtectedRoute>} />
  <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  <Route path="/admin"         element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
</Routes>
```

### 8.2 Auth Context

```js
// context/AuthContext.jsx
// State: { user: { id, name, email, role } | null, token: string | null }
// Actions: login(token, user), logout()
// Persistence: token stored in localStorage; user decoded on mount
// Axios instance attaches token via request interceptor
```

### 8.3 Axios Instance

```js
// api/axiosInstance.js
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) { /* clear auth, redirect to /login */ }
    return Promise.reject(err);
  }
);
```

### 8.4 Dark Mode

Implemented via Tailwind's `class` strategy. A `darkMode` toggle in `AuthContext` (or a separate `ThemeContext`) adds/removes the `dark` class on `<html>`. Preference persisted in `localStorage`.

### 8.5 Loading & Toast Pattern

- Every page that triggers an AI call holds a `loading` boolean state.
- A shared `<LoadingSpinner message="..." />` component renders over the triggering section.
- `useToast()` hook wraps a lightweight toast library (e.g., `react-hot-toast`) and is called on every async action's `.then()` and `.catch()`.

---

## 9. Environment Variables

### Backend (`server/.env`)

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/resumeai
JWT_SECRET=<random 64-char string>
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=<your key>
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)

```
VITE_API_URL=http://localhost:5000/api
```

Both `.env` files are covered by `.gitignore`. `.env.example` files (with placeholder values, no secrets) are committed for onboarding.

---

## 10. Security Considerations

| Concern | Mitigation |
|---|---|
| Password storage | bcrypt with salt rounds = 12 |
| JWT exposure | Stored in `localStorage`; short-lived (7d); never logged |
| File upload abuse | MIME + extension double-check in Multer filter; 5 MB hard cap |
| AI prompt injection | Resume text is passed inside triple-quoted delimiters; Gemini instructed to ignore out-of-schema content |
| MongoDB injection | Mongoose ODM parameterizes all queries by default |
| Secrets in code | All via `process.env`; `.gitignore` enforced from commit 1 |
| CORS | Backend CORS configured to allow only `CLIENT_URL` origin |
| Admin escalation | Role stored in DB; middleware re-fetches role on every request (not just from JWT payload) |

---

## 11. Deployment Architecture

```
Vercel (client/)                Render (server/)            MongoDB Atlas
  └─ npm run build          →     └─ node server.js     →   └─ resumeai cluster
     vite + React SPA                Express REST API            Users, Resumes,
     served as static files          MONGO_URI env var           Analyses
     VITE_API_URL=<render url>       GEMINI_API_KEY env var
```

CORS on the backend must whitelist the Vercel production domain in addition to `localhost` for development.

---

## 12. Key Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| All AI in one service file | Single place to iterate prompts; controllers stay thin |
| In-memory Multer (no disk write) | Simpler on Render (ephemeral filesystem); buffer passed directly to parser |
| One POST `/analysis/generate` does all 5 AI calls | Simplifies client flow; avoids partial analysis state |
| Analysis stores improvement suggestions | Avoids re-calling AI on history page loads; saves cost and latency |
| Strict MVC layout | Keeps concerns separated; easier to test controllers independently |
| Retry-once on AI failures | Balances resilience vs. latency; two attempts cover transient failures without long waits |

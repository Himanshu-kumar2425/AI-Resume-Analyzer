# ResumeAI — Implementation Task Breakdown
**Version:** 1.0  
**Date:** 2026-07-02  
**Status:** Awaiting Approval

---

## How to Read This Document

- Tasks are grouped into phases that must be completed in order.
- Within a phase, tasks marked **[parallel]** can be worked simultaneously.
- Each task has a clear **Done When** checklist — these are the acceptance criteria.
- Admin Dashboard tasks are in Phase 9 and are explicitly lowest priority.

---

## Phase 1 — Project Scaffolding & Config

### TASK-01 · Initialize monorepo structure
**What:** Create the top-level folder layout, initialize both `client/` and `server/` packages, and wire up essential config files.

**Steps:**
1. Create root folder `resumeai/` with subfolders `client/` and `server/`.
2. In `server/`: run `npm init -y`, install production deps:
   `express mongoose dotenv cors bcryptjs jsonwebtoken multer pdf-parse mammoth @google/genai`
   and dev deps: `nodemon`.
3. In `client/`: scaffold with `npm create vite@latest . -- --template react`, then install:
   `tailwindcss @tailwindcss/vite axios react-router-dom react-hot-toast`.
4. Configure Tailwind (`tailwind.config.js`, `index.css`) with `darkMode: 'class'`.
5. Create `server/.env.example` and `client/.env.example` with placeholder keys (no real secrets).
6. Create `server/.gitignore` and root `.gitignore` covering `.env`, `node_modules/`, `dist/`.
7. Create `server/server.js` with a minimal Express app (health check route `GET /api/health` → `{ status: 'ok' }`).
8. Create `server/config/db.js` with Mongoose connection logic using `MONGO_URI` env var.
9. Add `dev` script in `server/package.json` using nodemon.

**Done When:**
- [ ] `GET /api/health` returns `{ "status": "ok" }` with HTTP 200.
- [ ] `npm run dev` in `server/` starts without errors.
- [ ] `npm run dev` in `client/` serves the Vite default page.
- [ ] `.env` files are listed in `.gitignore` and do not appear in `git status`.
- [ ] MongoDB connection logs "MongoDB connected" on server start (with a real `MONGO_URI` in `.env`).

---

### TASK-02 · Backend folder skeleton & middleware setup
**What:** Create the full MVC directory structure and wire up global middleware.

**Steps:**
1. Create folders: `controllers/`, `routes/`, `models/`, `middleware/`, `services/`, `utils/`.
2. Create `utils/responseHelper.js` exporting `sendSuccess(res, data, status)` and `sendError(res, message, status)`.
3. Create `middleware/errorMiddleware.js` — a 4-argument Express error handler that returns `{ error: message }`.
4. Create `middleware/authMiddleware.js` — verifies `Authorization: Bearer <token>`, attaches `req.user`, returns 401 on failure.
5. Create `middleware/adminMiddleware.js` — checks `req.user.role === 'admin'`, returns 403 otherwise.
6. Create `middleware/uploadMiddleware.js` — Multer in-memory storage, `fileFilter` for PDF/DOCX MIME types, 5 MB size limit.
7. Mount `cors`, `express.json()`, and `errorMiddleware` in `server.js`.

**Done When:**
- [ ] A request to a protected route without a token returns `{ "error": "..." }` with HTTP 401.
- [ ] `uploadMiddleware` rejects a `.txt` file with HTTP 400.
- [ ] `uploadMiddleware` rejects a file > 5 MB with HTTP 400.
- [ ] All middleware files exist in the correct paths with no import errors on server start.

---

## Phase 2 — Data Models

### TASK-03 · Mongoose models [parallel]
**What:** Implement all three Mongoose schemas per the design document.

**Steps:**
1. Create `models/User.js`:
   - Fields: `name`, `email` (unique, lowercase), `password`, `role` (enum `user|admin`, default `user`), `createdAt`.
   - Add a `toJSON` transform that deletes `password` and `__v` from output.
2. Create `models/Resume.js`:
   - Fields: `userId` (ObjectId ref User), `fileName`, `fileSize`, `mimeType`, `extractedText`, `uploadDate`.
   - Index on `userId`.
3. Create `models/Analysis.js`:
   - Fields per design doc: scores, strengths/weaknesses arrays, `jobRoleMatch` sub-doc, `interviewQuestions` array, `improvements` sub-doc.
   - Indexes on `resumeId` and `userId`.
   - Score fields use `min: 0, max: 100`.

**Done When:**
- [ ] All three models import without errors.
- [ ] A User document saved without a password field is rejected by Mongoose validation.
- [ ] The `toJSON` transform on User removes `password` from serialized output.
- [ ] An Analysis document can be saved and retrieved with all nested sub-documents intact.

---

## Phase 3 — Authentication

### TASK-04 · Auth controller & routes
**What:** Implement register and login endpoints.

**Steps:**
1. Create `controllers/authController.js` with `register` and `login` functions.
2. `register`:
   - Validate: `name` (2–80 chars), `email` (valid format), `password` (min 8 chars). Return 400 on failure.
   - Check for duplicate email; return 409 if found.
   - Hash password with `bcryptjs` (salt rounds = 12).
   - Save User; sign JWT (`{ id, role }`, expires `JWT_EXPIRES_IN`).
   - Return 201 `{ data: { token, user: { id, name, email, role } } }`.
3. `login`:
   - Validate email + password presence.
   - Find user by email; return 401 if not found.
   - Compare password with `bcryptjs.compare`; return 401 if mismatch (same message for both: "Invalid email or password").
   - Sign JWT; return 200 `{ data: { token, user } }`.
4. Create `routes/authRoutes.js` and mount at `/api/auth` in `server.js`.

**Done When:**
- [ ] `POST /api/auth/register` with valid body returns 201 with a JWT and user object (no password field).
- [ ] `POST /api/auth/register` with a duplicate email returns 409.
- [ ] `POST /api/auth/register` with a short password returns 400.
- [ ] `POST /api/auth/login` with correct credentials returns 200 with JWT.
- [ ] `POST /api/auth/login` with wrong password returns 401 with "Invalid email or password".
- [ ] JWT payload does not contain the password hash.

---

## Phase 4 — Resume Upload & Parsing

### TASK-05 · Parser service
**What:** Build `services/parserService.js` that converts a file buffer to plain text.

**Steps:**
1. Export `extractText(buffer, mimetype)`:
   - PDF: use `pdf-parse(buffer)` → return `result.text`.
   - DOCX: use `mammoth.extractRawText({ buffer })` → return `result.value`.
   - Unknown type: throw a typed `ParseError`.
2. After extraction, if `text.trim().length === 0`, throw a `ParseError` with message "Could not extract text from the uploaded file."
3. Export the `ParseError` class for use in error middleware.

**Done When:**
- [ ] Passing a real PDF buffer returns non-empty text.
- [ ] Passing a real DOCX buffer returns non-empty text.
- [ ] Passing an empty PDF (image-only scan simulation with empty text) throws `ParseError`.

---

### TASK-06 · Resume controller & routes
**What:** Implement upload, history, and get-by-id endpoints.

**Steps:**
1. Create `controllers/resumeController.js`.
2. `uploadResume` (POST `/api/resume/upload`):
   - Attach `uploadMiddleware` on this route.
   - Call `parserService.extractText(req.file.buffer, req.file.mimetype)`.
   - On `ParseError`, return 422 with message.
   - Save a `Resume` document (`userId = req.user.id`).
   - Return 201 `{ data: { resumeId, fileName, uploadDate } }`.
3. `getHistory` (GET `/api/resume/history`):
   - Query Resumes by `userId = req.user.id`.
   - Support `?page` and `?limit` (default limit 10).
   - Return `{ data: { resumes, total, page, pages } }`.
4. `getResumeById` (GET `/api/resume/:id`):
   - Find by `_id`; verify `userId` matches `req.user.id` (return 403 if not).
   - Return 200 with the Resume document (exclude `extractedText` to keep response small; include it only if the frontend needs it).
5. Create `routes/resumeRoutes.js`, apply `authMiddleware` to all routes, mount at `/api/resume`.

**Done When:**
- [ ] Uploading a valid PDF returns 201 with a `resumeId`.
- [ ] Uploading a `.txt` file returns 400.
- [ ] Uploading a file > 5 MB returns 400.
- [ ] `GET /api/resume/history` returns paginated results for the logged-in user only.
- [ ] `GET /api/resume/:id` with another user's ID returns 403.
- [ ] Extracted text is persisted in the database and retrievable.

---

## Phase 5 — AI Service

### TASK-07 · AI service (`services/aiService.js`)
**What:** Implement all five Gemini-backed functions with retry logic and prompt templates.

**Steps:**
1. Initialize the Gemini client using `GEMINI_API_KEY` from env. Export nothing that exposes the key.
2. Implement `callGeminiWithRetry(prompt)`:
   - Attempt up to 2 times.
   - Parse response as JSON on each attempt.
   - On second failure, throw `AiServiceError`.
3. Define prompt template constants (at top of file, named clearly):
   - `PARSE_RESUME_PROMPT`
   - `ANALYZE_RESUME_PROMPT`
   - `MATCH_JOB_ROLE_PROMPT`
   - `INTERVIEW_QUESTIONS_PROMPT`
   - `IMPROVEMENTS_PROMPT`
   Each prompt instructs Gemini to return **only** valid JSON matching the schema from the design doc, with resume text injected inside triple-quoted delimiters.
4. Export the five functions: `parseResume`, `analyzeResume`, `matchJobRole`, `generateInterviewQuestions`, `generateImprovements`.
5. In `analyzeResume` and `matchJobRole`, clamp scores to [0, 100] after parsing.

**Done When:**
- [ ] Each function returns the expected object shape when given real resume text.
- [ ] When Gemini is given a prompt that produces invalid JSON (simulate with a broken mock), `callGeminiWithRetry` retries once and then throws `AiServiceError`.
- [ ] No function throws an unhandled promise rejection; all errors propagate as `AiServiceError`.
- [ ] `GEMINI_API_KEY` is read only from `process.env`; it does not appear as a string literal anywhere in the file.

---

## Phase 6 — Analysis

### TASK-08 · Analysis controller & routes
**What:** Implement the `POST /api/analysis/generate` and `GET /api/analysis/:id` endpoints.

**Steps:**
1. Create `controllers/analysisController.js`.
2. `generateAnalysis` (POST `/api/analysis/generate`):
   - Validate body: `resumeId` (required, valid ObjectId), `targetRole` (required, one of the 5 allowed values).
   - Load Resume by `resumeId`; verify ownership (403 if mismatch).
   - Call all five `aiService` functions in sequence (or `Promise.all` for the ones that don't depend on each other — see note below).
   - On `AiServiceError`, return 502 with "AI analysis service is temporarily unavailable. Please try again."
   - Assemble and save one Analysis document.
   - Return 201 with the full Analysis document.
3. `getAnalysis` (GET `/api/analysis/:id`):
   - Find by `_id`; verify `userId` matches `req.user.id` (403 if not).
   - Return 200 with the Analysis document.
4. Create `routes/analysisRoutes.js`, apply `authMiddleware`, mount at `/api/analysis`.

> **Parallelization note:** `parseResume`, `analyzeResume`, `matchJobRole`, `generateInterviewQuestions`, and `generateImprovements` all take only `extractedText` (and `targetRole` for some). They can all be fired with `Promise.all` since none depends on the output of another.

**Done When:**
- [ ] `POST /api/analysis/generate` with a valid `resumeId` and `targetRole` returns 201 with all analysis fields populated.
- [ ] The Analysis document is persisted in MongoDB and retrievable via `GET /api/analysis/:id`.
- [ ] Passing an invalid `targetRole` returns 400.
- [ ] Passing another user's `resumeId` returns 403.
- [ ] When the AI service throws, the endpoint returns 502 (not 500).
- [ ] `GET /api/analysis/:id` for another user's analysis returns 403.

---

## Phase 7 — Frontend Foundation

### TASK-09 · Auth context, Axios instance, and routing shell [parallel with TASK-10]
**What:** Set up the frontend's auth layer, HTTP client, and routing skeleton.

**Steps:**
1. Create `src/context/AuthContext.jsx`:
   - State: `{ user, token }`.
   - On mount, read token from `localStorage`, decode it (or store user object separately), and rehydrate state.
   - Provide `login(token, user)` and `logout()` functions.
   - `logout` clears `localStorage` and resets state.
2. Create `src/api/axiosInstance.js`:
   - Base URL from `import.meta.env.VITE_API_URL`.
   - Request interceptor: attach `Authorization: Bearer <token>` from `localStorage`.
   - Response interceptor: on 401, call `logout()` and redirect to `/login`.
3. Create `src/api/authApi.js`, `resumeApi.js`, `analysisApi.js` — thin wrappers over `axiosInstance`.
4. Set up `React Router DOM v6` in `App.jsx` with all 9 routes from the design doc.
5. Create a `ProtectedRoute` component that redirects unauthenticated users to `/login`.
6. Create a stub component for each page (just renders the page name as `<h1>`) so routing works end-to-end.

**Done When:**
- [ ] Navigating to `/dashboard` without a token redirects to `/login`.
- [ ] After calling `login()` with a token, navigating to `/dashboard` succeeds.
- [ ] `logout()` clears the token and redirects to `/`.
- [ ] All 9 routes render their stub page without console errors.

---

### TASK-10 · Shared UI components & dark mode [parallel with TASK-09]
**What:** Build the reusable UI primitives used across all pages.

**Steps:**
1. Configure Tailwind `darkMode: 'class'` in `tailwind.config.js`.
2. Create a `ThemeContext` (or extend `AuthContext`) with `isDark` toggle; persist to `localStorage`; apply `dark` class to `<html>`.
3. Create `components/Navbar.jsx` — logo/brand, nav links (conditional on auth state), dark mode toggle button, logout button.
4. Create `components/LoadingSpinner.jsx` — accepts a `message` prop; renders centered spinner + message text.
5. Create `components/ScoreBadge.jsx` — accepts `score` (0–100) and `label`; renders a circular progress indicator with color coding (red < 40, amber 40–69, green ≥ 70).
6. Create `components/ProtectedRoute.jsx` — supports `adminOnly` prop; redirects non-admins to `/dashboard`.
7. Install and configure `react-hot-toast`; create `src/hooks/useToast.js` exporting `toastSuccess(msg)` and `toastError(msg)`.

**Done When:**
- [ ] Toggling dark mode switches the `dark` class on `<html>` and persists across page refresh.
- [ ] `ScoreBadge` renders green for score 80, amber for 55, red for 30.
- [ ] `LoadingSpinner` renders with a custom message prop.
- [ ] `toastSuccess` and `toastError` display visible toast notifications.
- [ ] Navbar shows login/register links when unauthenticated, and dashboard/logout when authenticated.

---

## Phase 8 — Frontend Pages

### TASK-11 · Home, Login, Register pages
**What:** Implement the three public-facing pages.

**Steps:**
1. `Home.jsx` — hero section with product description, CTA buttons (Get Started → `/register`, Learn More). Fully responsive, dark mode aware.
2. `Login.jsx`:
   - Form: email, password, submit button.
   - On submit: call `authApi.login()`; on success call `login(token, user)` and navigate to `/dashboard`.
   - Show `LoadingSpinner` while request is in flight; disable form.
   - Show `toastError` on failure with the server's error message.
   - Link to `/register`.
3. `Register.jsx`:
   - Form: name, email, password, confirm password.
   - Client-side: confirm password match validation before sending request.
   - On success: auto-login and navigate to `/dashboard`.
   - Same loading/toast pattern as Login.

**Done When:**
- [ ] Login with valid credentials navigates to `/dashboard` and shows a success toast.
- [ ] Login with wrong password shows error toast with server message.
- [ ] Register with mismatched passwords shows a client-side error before making any API call.
- [ ] Register with an existing email shows the server error in a toast.
- [ ] Both forms disable submit button and show spinner during the request.

---

### TASK-12 · Dashboard page
**What:** Implement the main authenticated landing page.

**Steps:**
1. On mount, fetch `GET /api/resume/history?limit=5` for recent analyses summary.
2. Display: user's name, total uploads, best score, most recent analysis date.
3. Display a list of the 5 most recent analyses (filename, date, score badge).
4. Each list item links to `/analysis/:id`.
5. Prominent "Upload New Resume" button navigates to `/upload`.
6. Show empty state if no analyses exist.
7. Loading skeleton while data is fetching.

**Done When:**
- [ ] Dashboard shows the correct username from auth context.
- [ ] Summary stats reflect the actual database values.
- [ ] Clicking a history item navigates to the correct Analysis Result page.
- [ ] Empty state renders when there are no uploads.
- [ ] "Upload New Resume" button is visible and navigates correctly.

---

### TASK-13 · Upload Resume page
**What:** Implement the file upload form and trigger analysis generation.

**Steps:**
1. File input (drag-and-drop or click-to-browse) accepting `.pdf` and `.docx` only.
2. Client-side validation: file type and size (< 5 MB) before sending. Show inline error if invalid.
3. Target role selector: dropdown with the 5 allowed roles.
4. On submit:
   a. Call `resumeApi.upload(file)` → get `resumeId`.
   b. Call `analysisApi.generate({ resumeId, targetRole })` → get analysis.
   c. Navigate to `/analysis/<analysisId>`.
5. Show `LoadingSpinner` with message "Analyzing your resume…" during step (b) (AI call takes several seconds).
6. Disable all form controls during submission.
7. Show `toastError` on any step failure.

**Done When:**
- [ ] Selecting a non-PDF/DOCX file shows a client-side error and does not call the API.
- [ ] Selecting a file > 5 MB shows a client-side error and does not call the API.
- [ ] A valid upload + analysis flow navigates to `/analysis/:id` with full data.
- [ ] "Analyzing your resume…" spinner is visible for the duration of the AI call.
- [ ] Network error shows a toast with the server error message.

---

### TASK-14 · Analysis Result page
**What:** Implement the full analysis display — the most content-rich page in the app.

**Steps:**
1. On mount, fetch `GET /api/analysis/:id` using the route param.
2. Layout sections (each collapsible or tabbed):
   - **Scores** — `ScoreBadge` for Resume Score and ATS Score side by side.
   - **Strengths & Weaknesses** — two-column list with icons.
   - **Missing Skills** — tag-style chips.
   - **Grammar & Formatting Suggestions** — bullet list.
   - **Job Role Match** — match percentage bar, missing tech chips, recommendations list.
   - **Interview Questions** — tabbed by category (Technical / HR / Project-Based); within each tab, grouped by difficulty with a label.
   - **Resume Improvements** — before/after panels for Projects, Skills, and Summary sections.
3. Loading skeleton while fetching.
4. "Back to Dashboard" and "View History" navigation links.

**Done When:**
- [ ] All seven sections render with real data from a completed analysis.
- [ ] Score badges use correct colors (red/amber/green).
- [ ] Interview questions are correctly grouped by category and difficulty.
- [ ] Before/after improvement panels show original and rewritten text.
- [ ] Page is readable on mobile (single column, stacked sections).

---

### TASK-15 · History page
**What:** Implement the paginated analysis history list.

**Steps:**
1. Fetch `GET /api/resume/history?page=1&limit=10` on mount.
2. Display a table or card list: filename, upload date, resume score badge, ATS score badge, "View Analysis" link.
3. Pagination controls (Previous / Next or page numbers).
4. Empty state when no history.
5. Loading skeleton while fetching.

**Done When:**
- [ ] History list shows all past analyses for the current user.
- [ ] Pagination works correctly (next/prev changes the displayed page).
- [ ] "View Analysis" link navigates to the correct `/analysis/:id`.
- [ ] Empty state renders when there are no uploads.

---

### TASK-16 · Profile page
**What:** Display user profile information.

**Steps:**
1. Show: name, email, role, account creation date, total upload count.
2. (Static display only for now — no edit functionality required in v1.)
3. Logout button on this page as well.

**Done When:**
- [ ] Profile page displays the correct user data from auth context + history count.
- [ ] Logout button works and redirects to home.

---

## Phase 9 — Admin Dashboard (Lowest Priority)

### TASK-17 · Admin stats endpoint
**What:** Implement `GET /api/admin/stats`.

**Steps:**
1. Create `controllers/adminController.js`.
2. `getStats`:
   - Count total Users.
   - Count total Resumes.
   - Run aggregation on Analysis collection: unwind `missingSkills`, group by value, sort by count desc, limit 10.
   - Return `{ data: { totalUsers, totalResumes, topSkills } }`.
3. Create `routes/adminRoutes.js`, apply `authMiddleware` + `adminMiddleware`, mount at `/api/admin`.

**Done When:**
- [ ] `GET /api/admin/stats` with an admin JWT returns correct counts and top skills.
- [ ] `GET /api/admin/stats` with a regular user JWT returns 403.
- [ ] `GET /api/admin/stats` without a token returns 401.

---

### TASK-18 · Admin Dashboard page
**What:** Implement the admin-only frontend page.

**Steps:**
1. Fetch `GET /api/admin/stats` on mount.
2. Display: total users count, total resumes count, top 10 skills as a ranked list or bar chart.
3. `ProtectedRoute` with `adminOnly` prop guards this route.
4. Non-admin users who reach `/admin` see a redirect to `/dashboard` + "Access denied" toast.

**Done When:**
- [ ] Admin user sees correct stats.
- [ ] Non-admin user is redirected with a toast.
- [ ] Top skills list renders with rank and count.

---

## Phase 10 — Polish & Documentation

### TASK-19 · README and API documentation
**What:** Write `README.md` at the project root and an API reference doc.

**Steps:**
1. `README.md`:
   - Project description and feature list.
   - Tech stack table.
   - Local setup instructions (clone → install → configure `.env` → run).
   - Screenshots placeholder section.
   - Deployment notes (Vercel + Render + Atlas).
2. `docs/api.md` (or inline in README):
   - Every endpoint: method, path, auth required, request body/params, response shape, example.
3. `.env.example` files already created in TASK-01 — verify they are complete and accurate.

**Done When:**
- [ ] A developer can follow README instructions to run the project locally from scratch.
- [ ] Every API endpoint is documented with request/response examples.
- [ ] `.env.example` files match all variables actually used in the code.

---

### TASK-20 · Final integration pass & deployment config
**What:** End-to-end smoke test and deploy configuration.

**Steps:**
1. Test the complete user journey: Register → Upload → Analysis → History → Logout → Login → History.
2. Verify dark mode persists across refresh.
3. Verify all toast notifications fire on success and error paths.
4. Add `vercel.json` to `client/` if needed for SPA routing (rewrite all paths to `index.html`).
5. Confirm `server/` has a `start` script (`node server.js`) for Render.
6. Confirm CORS on the backend accepts both `localhost` and the production Vercel domain.
7. Confirm all environment variable names in code match `.env.example`.

**Done When:**
- [ ] Full user journey works end-to-end without console errors.
- [ ] `client/vercel.json` rewrites unknown paths to `index.html` (prevents 404 on direct URL access).
- [ ] `npm start` in `server/` runs the production server.
- [ ] CORS allows the production frontend origin.
- [ ] No hardcoded secrets anywhere in the codebase (`git grep` check).

---

## Task Summary Table

| Task | Phase | Description | Priority |
|------|-------|-------------|----------|
| TASK-01 | Scaffolding | Initialize monorepo, deps, config | High |
| TASK-02 | Scaffolding | Backend folder skeleton & middleware | High |
| TASK-03 | Models | Mongoose User, Resume, Analysis models | High |
| TASK-04 | Auth | Register + login endpoints | High |
| TASK-05 | Upload | Parser service (pdf-parse + mammoth) | High |
| TASK-06 | Upload | Resume upload, history, get endpoints | High |
| TASK-07 | AI | aiService with all 5 Gemini functions | High |
| TASK-08 | Analysis | Analysis generate + get endpoints | High |
| TASK-09 | Frontend | Auth context, Axios, routing shell | High |
| TASK-10 | Frontend | Shared UI components + dark mode | High |
| TASK-11 | Frontend | Home, Login, Register pages | High |
| TASK-12 | Frontend | Dashboard page | High |
| TASK-13 | Frontend | Upload Resume page | High |
| TASK-14 | Frontend | Analysis Result page | High |
| TASK-15 | Frontend | History page | High |
| TASK-16 | Frontend | Profile page | High |
| TASK-17 | Admin | Admin stats endpoint | Low |
| TASK-18 | Admin | Admin Dashboard page | Low |
| TASK-19 | Polish | README + API docs | Medium |
| TASK-20 | Polish | Integration pass + deploy config | Medium |

---

## Dependency Order

```
TASK-01 → TASK-02 → TASK-03 → TASK-04
                              ↓
                         TASK-05 → TASK-06
                              ↓
                         TASK-07 → TASK-08
                              ↓
              TASK-09 ──────────────────────→ TASK-11
              TASK-10 ──────────────────────→ TASK-12
                                              TASK-13
                                              TASK-14
                                              TASK-15
                                              TASK-16
                                                ↓
                                          TASK-17 → TASK-18
                                                ↓
                                          TASK-19 → TASK-20
```

TASK-09 and TASK-10 can run in parallel (both are pure frontend, no backend dependency once TASK-08 is done).

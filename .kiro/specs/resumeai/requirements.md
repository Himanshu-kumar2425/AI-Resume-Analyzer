# ResumeAI — Requirements Specification
**Format:** EARS (Easy Approach to Requirements Syntax)  
**Version:** 1.0  
**Date:** 2026-07-02  
**Status:** Awaiting Approval

---

## Glossary

| Term | Definition |
|---|---|
| ATS | Applicant Tracking System — automated software employers use to filter resumes |
| Analysis | The full AI-generated result for one resume upload |
| Target Role | The job role a user selects to compare their resume against |
| Extracted Text | Raw text content parsed from a PDF or DOCX file |
| JWT | JSON Web Token used for stateless authentication |

---

## 1. Authentication

**REQ-AUTH-01**  
WHEN a new visitor submits the registration form with a unique email, valid password, and name, THE SYSTEM SHALL create a user account, hash the password with bcrypt, and return a signed JWT.

**REQ-AUTH-02**  
WHEN a registration attempt is made with an email that already exists in the database, THE SYSTEM SHALL reject the request with HTTP 409 and the error message "Email already registered."

**REQ-AUTH-03**  
WHEN a user submits valid credentials on the login form, THE SYSTEM SHALL verify the password against the stored hash and return a signed JWT valid for 7 days.

**REQ-AUTH-04**  
WHEN a user submits invalid credentials on the login form, THE SYSTEM SHALL return HTTP 401 and the error message "Invalid email or password" without revealing which field is incorrect.

**REQ-AUTH-05**  
WHILE a user is authenticated, THE SYSTEM SHALL attach the decoded user identity to every protected API request via a JWT middleware and reject missing or expired tokens with HTTP 401.

**REQ-AUTH-06**  
WHEN a user logs out, THE SYSTEM SHALL clear the JWT from client-side storage and redirect to the home page.

**REQ-AUTH-07**  
THE SYSTEM SHALL never log, store in plaintext, or expose JWT tokens or password hashes in API responses, server logs, or error messages.

---

## 2. Dashboard

**REQ-DASH-01**  
WHEN an authenticated user navigates to the dashboard, THE SYSTEM SHALL display their name, total number of resume uploads, average resume score across all analyses, and a list of their most recent analyses.

**REQ-DASH-02**  
WHEN an authenticated user has no prior analyses, THE SYSTEM SHALL display an empty state with a prompt to upload their first resume.

**REQ-DASH-03**  
THE SYSTEM SHALL provide a clearly visible entry point on the dashboard to initiate a new resume upload.

**REQ-DASH-04**  
THE SYSTEM SHALL display summary statistics on the dashboard including: total uploads, best resume score achieved, and most recent analysis date.

---

## 3. Resume Upload

**REQ-UPLOAD-01**  
WHEN a user submits a resume file, THE SYSTEM SHALL accept only PDF and DOCX file formats and reject all other types with HTTP 400 and the message "Only PDF and DOCX files are accepted."

**REQ-UPLOAD-02**  
WHEN a user submits a resume file larger than 5 MB, THE SYSTEM SHALL reject it with HTTP 400 and the message "File size must not exceed 5 MB."

**REQ-UPLOAD-03**  
WHEN a valid resume file is uploaded, THE SYSTEM SHALL extract its raw text content using pdf-parse (for PDF) or mammoth (for DOCX) and store the extracted text in the database alongside file metadata (original filename, upload date, user ID).

**REQ-UPLOAD-04**  
WHEN text extraction fails or returns empty content, THE SYSTEM SHALL return HTTP 422 and the message "Could not extract text from the uploaded file. Please ensure the file is not scanned or image-based."

**REQ-UPLOAD-05**  
THE SYSTEM SHALL validate file type by inspecting both the MIME type and file extension; a mismatch SHALL result in rejection.

**REQ-UPLOAD-06**  
WHILE a file is uploading, THE FRONTEND SHALL display a loading indicator and disable the submit button to prevent duplicate submissions.

---

## 4. Resume Parsing

**REQ-PARSE-01**  
WHEN extracted text is available, THE SYSTEM SHALL send it to the Gemini API with a structured prompt requesting the following fields: full name, email address, phone number, skills list, education history, work experience, projects, and certifications.

**REQ-PARSE-02**  
THE SYSTEM SHALL parse the Gemini API response as JSON; if the response is malformed or missing required fields, THE SYSTEM SHALL retry the request once with the same prompt before returning an error.

**REQ-PARSE-03**  
WHEN the retry also fails to produce valid JSON, THE SYSTEM SHALL return HTTP 502 and the message "AI parsing service is temporarily unavailable. Please try again."

**REQ-PARSE-04**  
THE SYSTEM SHALL store all structured parsed fields as part of the Analysis record associated with the resume.

---

## 5. AI Resume Analysis

**REQ-ANALYSIS-01**  
WHEN a user requests analysis of an uploaded resume, THE SYSTEM SHALL send the extracted text to the Gemini API and receive a structured response containing: overall resume score (integer 0–100), ATS compatibility score (integer 0–100), a list of strengths, a list of weaknesses, a list of missing skills, grammar suggestions, and formatting suggestions.

**REQ-ANALYSIS-02**  
THE SYSTEM SHALL validate that the scores returned by the AI are integers within the range 0–100; if out of range or non-numeric, THE SYSTEM SHALL clamp or default the value and log a warning (without exposing this to the user).

**REQ-ANALYSIS-03**  
WHEN the Gemini API returns a malformed response, THE SYSTEM SHALL retry once; if the retry fails, THE SYSTEM SHALL return HTTP 502 and a user-facing error message.

**REQ-ANALYSIS-04**  
WHILE the AI analysis is in progress, THE FRONTEND SHALL display a loading state with a message such as "Analyzing your resume…" and prevent the user from navigating away without a confirmation prompt.

**REQ-ANALYSIS-05**  
WHEN analysis completes successfully, THE SYSTEM SHALL persist the Analysis record to MongoDB and redirect the frontend to the Analysis Result page.

**REQ-ANALYSIS-06**  
THE SYSTEM SHALL display the ATS score and resume score as visual indicators (e.g., circular progress or color-coded badges) on the Analysis Result page.

---

## 6. Job Role Matching

**REQ-ROLE-01**  
THE SYSTEM SHALL allow a user to select a target role from the following options: Frontend Developer, Backend Developer, Full Stack Developer, Software Engineer, Data Analyst.

**REQ-ROLE-02**  
WHEN a user selects a target role and triggers matching, THE SYSTEM SHALL send the resume's extracted text and the selected role to the Gemini API and receive: a match percentage (0–100), a list of missing technologies, and a list of learning recommendations.

**REQ-ROLE-03**  
THE SYSTEM SHALL validate that the match percentage is a number in 0–100; out-of-range values SHALL be clamped.

**REQ-ROLE-04**  
THE SYSTEM SHALL store job role match results inside the Analysis record under a `jobRoleMatch` sub-document including: role name, match percentage, missing technologies, and recommendations.

**REQ-ROLE-05**  
WHEN the Gemini API returns a malformed job role response, THE SYSTEM SHALL follow the same retry-once-then-error pattern defined in REQ-PARSE-02 and REQ-PARSE-03.

---

## 7. Interview Question Generator

**REQ-IQ-01**  
WHEN a user requests interview questions, THE SYSTEM SHALL require both a resume (extracted text) and a selected target role as inputs.

**REQ-IQ-02**  
THE SYSTEM SHALL send the extracted text and target role to the Gemini API requesting a set of interview questions categorized as: Technical, HR, and Project-Based, each at three difficulty levels: Easy, Medium, and Hard.

**REQ-IQ-03**  
THE SYSTEM SHALL store the returned interview questions array inside the associated Analysis record.

**REQ-IQ-04**  
THE FRONTEND SHALL display interview questions in a tabbed or accordion UI grouped by category (Technical / HR / Project-Based) with difficulty labels.

**REQ-IQ-05**  
WHEN the Gemini API returns a malformed interview question response, THE SYSTEM SHALL follow the retry-once-then-error pattern.

---

## 8. Resume Improvement Assistant

**REQ-IMPROVE-01**  
WHEN a user requests resume improvement suggestions, THE SYSTEM SHALL send the extracted text to the Gemini API requesting rewritten versions of: project descriptions, the skills section, and the professional summary section.

**REQ-IMPROVE-02**  
THE FRONTEND SHALL display improvement suggestions as before/after panels, showing the original extracted content alongside the AI-rewritten version for each section.

**REQ-IMPROVE-03**  
THE SYSTEM SHALL store improvement suggestions inside the Analysis record so the user can revisit them without re-calling the AI.

**REQ-IMPROVE-04**  
WHEN the Gemini API returns a malformed improvement response, THE SYSTEM SHALL follow the retry-once-then-error pattern.

---

## 9. Analysis History

**REQ-HIST-01**  
WHEN an authenticated user navigates to the History page, THE SYSTEM SHALL display a paginated list of all their past analyses, each showing: original filename, upload date, resume score, ATS score, and a link to the full Analysis Result page.

**REQ-HIST-02**  
THE SYSTEM SHALL sort the history list by upload date in descending order (most recent first) by default.

**REQ-HIST-03**  
WHEN a user clicks on a history entry, THE SYSTEM SHALL load the full Analysis Result from the stored record without re-calling the AI.

**REQ-HIST-04**  
WHEN a user has no prior analyses, THE SYSTEM SHALL display an empty state message with a call-to-action to upload a resume.

---

## 10. Admin Dashboard (Lower Priority)

**REQ-ADMIN-01**  
WHEN a user with role "admin" accesses the admin dashboard, THE SYSTEM SHALL display: total registered users, total resume uploads, and the top 10 most frequently occurring skills across all analyses.

**REQ-ADMIN-02**  
THE SYSTEM SHALL protect the admin stats endpoint (`GET /api/admin/stats`) with both JWT authentication middleware and a role-authorization middleware that rejects non-admin users with HTTP 403.

**REQ-ADMIN-03**  
WHEN a non-admin authenticated user attempts to access the admin dashboard URL, THE FRONTEND SHALL redirect them to their own dashboard with a toast notification "Access denied."

---

## 11. Cross-Cutting Requirements

### 11.1 Security

**REQ-SEC-01**  
THE SYSTEM SHALL store all secrets (database URI, JWT secret, Gemini API key) exclusively in environment variables and never hardcode them in source files.

**REQ-SEC-02**  
THE SYSTEM SHALL include a `.gitignore` that excludes `.env` files and `node_modules/` from version control from the first commit.

**REQ-SEC-03**  
THE SYSTEM SHALL sanitize all user-supplied input on every POST and PUT route before processing or persisting it.

### 11.2 Error Handling

**REQ-ERR-01**  
THE SYSTEM SHALL wrap every async route handler in a try/catch block and return errors in the consistent shape `{ "error": "<message>" }`.

**REQ-ERR-02**  
THE SYSTEM SHALL never expose internal stack traces, database error details, or file system paths in API error responses.

### 11.3 Frontend UX

**REQ-UX-01**  
THE FRONTEND SHALL support dark mode, toggled by user preference, with the setting persisted in local storage.

**REQ-UX-02**  
THE FRONTEND SHALL be fully responsive and usable on mobile, tablet, and desktop viewports.

**REQ-UX-03**  
THE FRONTEND SHALL display toast notifications for all async action outcomes (success and failure).

**REQ-UX-04**  
WHILE any AI-powered operation is in progress, THE FRONTEND SHALL display a loading state and disable the triggering UI element to prevent duplicate requests.

**REQ-UX-05**  
THE SYSTEM SHALL display meaningful loading messages during AI calls (e.g., "Analyzing your resume…", "Generating interview questions…") rather than generic spinners.

### 11.4 Deployment

**REQ-DEPLOY-01**  
THE FRONTEND SHALL be deployable to Vercel with no manual server configuration required beyond environment variable setup.

**REQ-DEPLOY-02**  
THE BACKEND SHALL be deployable to Render as a Node.js web service.

**REQ-DEPLOY-03**  
THE DATABASE SHALL use MongoDB Atlas as the hosted cluster; the backend SHALL connect via a Mongoose connection string stored in an environment variable.

---

## Requirements Traceability Matrix

| Req ID | Feature Area | Priority |
|---|---|---|
| REQ-AUTH-01 – 07 | Authentication | High |
| REQ-DASH-01 – 04 | Dashboard | High |
| REQ-UPLOAD-01 – 06 | Resume Upload | High |
| REQ-PARSE-01 – 04 | Resume Parsing | High |
| REQ-ANALYSIS-01 – 06 | AI Resume Analysis | High |
| REQ-ROLE-01 – 05 | Job Role Matching | High |
| REQ-IQ-01 – 05 | Interview Question Generator | High |
| REQ-IMPROVE-01 – 04 | Resume Improvement Assistant | High |
| REQ-HIST-01 – 04 | Analysis History | High |
| REQ-ADMIN-01 – 03 | Admin Dashboard | Low |
| REQ-SEC-01 – 03 | Security | High |
| REQ-ERR-01 – 02 | Error Handling | High |
| REQ-UX-01 – 05 | Frontend UX | High |
| REQ-DEPLOY-01 – 03 | Deployment | Medium |

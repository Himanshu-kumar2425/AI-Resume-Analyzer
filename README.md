# ResumeAI — AI-Powered Resume Analyzer

A full-stack MERN application that uses AI to analyze resumes, score ATS compatibility, match job roles, generate interview questions, and suggest improvements.

🔗 **Live Demo:** [ai-resume-analyzer-thala1.vercel.app](https://ai-resume-analyzer-thala1.vercel.app)

---

## Screenshots

| Home | Dashboard |
|---|---|
| ![Home](client/screenshots/home.png) | ![Dashboard](client/screenshots/dashboard.png) |

| Upload | Analysis Results |
|---|---|
| ![Upload](client/screenshots/upload.png) | ![Analysis](client/screenshots/analysis.png) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router v6 |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB Atlas |
| AI | Groq API (Llama 3.3 70B) |
| Auth | JWT + bcryptjs |
| File parsing | pdf-parse, mammoth |
| Deploy | Vercel (frontend), Render (backend) |

---

## Features

1. JWT authentication (register, login, logout)
2. Resume upload — PDF/DOCX, max 5 MB
3. AI resume parsing (structured fields via Gemini)
4. AI analysis — resume score, ATS score, strengths, weaknesses, missing skills
5. Job role matching — match %, missing tech, recommendations
6. Interview question generator — Technical / HR / Project-Based × Easy / Medium / Hard
7. Resume improvement assistant — before/after rewrites for projects, skills, summary
8. Analysis history with pagination
9. Admin dashboard — user/upload stats, top missing skills
10. Dark mode, responsive design, toast notifications

---

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (free tier works)
- Google Gemini API key

### 1. Clone

```bash
git clone <your-repo-url>
cd resumeai
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, GEMINI_API_KEY, CLIENT_URL in .env
npm run dev
# Server starts on http://localhost:5000
```

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api
npm run dev
# App starts on http://localhost:5173
```

---

## Environment Variables

### `server/.env`

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random 64-character secret |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `GROQ_API_KEY` | Groq API key (console.groq.com) |
| `CLIENT_URL` | Frontend origin for CORS |

### `client/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in, get JWT |

### Resume

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/resume/upload` | Yes | Upload PDF/DOCX |
| GET | `/api/resume/history` | Yes | Paginated upload list |
| GET | `/api/resume/:id` | Yes | Single resume metadata |

### Analysis

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/analysis/generate` | Yes | Run full AI analysis |
| GET | `/api/analysis/:id` | Yes | Fetch stored analysis |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Platform stats |

All error responses use the shape `{ "error": "<message>" }`.  
All success responses use the shape `{ "data": <payload> }`.

---

## Deployment

### Frontend → Vercel

1. Import the `client/` folder in Vercel.
2. Set `VITE_API_URL` to your Render backend URL.
3. Vercel auto-detects Vite; `vercel.json` handles SPA routing.

### Backend → Render

1. Create a new **Web Service** pointing to the `server/` folder.
2. Build command: `npm install`
3. Start command: `npm start`
4. Add all environment variables from `server/.env`.
5. Update `CLIENT_URL` to your Vercel frontend URL.

---

## Project Structure

```
resumeai/
├── client/          # React + Vite SPA
│   ├── src/
│   │   ├── api/         # Axios wrappers
│   │   ├── components/  # Navbar, ScoreBadge, LoadingSpinner, etc.
│   │   ├── context/     # AuthContext (auth + dark mode)
│   │   ├── hooks/       # useToast
│   │   └── pages/       # All 9 pages
│   └── vercel.json
└── server/          # Express REST API
    ├── config/          # DB connection
    ├── controllers/     # Route handlers
    ├── middleware/      # auth, admin, upload, error
    ├── models/          # User, Resume, Analysis
    ├── routes/          # Express routers
    ├── services/        # aiService, parserService
    └── utils/           # responseHelper
```
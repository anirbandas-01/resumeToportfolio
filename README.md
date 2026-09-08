# Resume → Portfolio

Turn a resume into a live, shareable portfolio website in minutes. Upload a PDF or DOCX, let AI extract your details, review and edit everything, pick a theme, and publish at a public link — 

**Live demo:** https://resume-toportfolio.vercel.app/

---

## Features

- **AI-powered resume parsing** — upload a PDF/DOCX and Google Gemini extracts your name, contact info, summary, skills, experience, education, projects, and certifications automatically
- **Full review & edit flow** — every extracted field is editable before anything goes live; if AI parsing fails, you get an empty form instead of a dead end
- **Profile photo upload** — stored and served via Cloudinary
- **Theme picker** — three preset portfolio themes (Default, Minimal, Bold)
- **One-click publish/unpublish** — toggle your portfolio's visibility anytime, with a shareable public link
- **Smart dashboard** — see your resume's status (draft/published), theme, and stats at a glance instead of re-uploading every visit
- **Replace-resume flow** — upload a new resume to replace your existing one, with a clear confirmation step
- **Account settings** — change your public username or password, toggle portfolio visibility
- **Views & likes** — track how many people viewed your portfolio, and let logged-in visitors like it
- **Community discovery feed** — browse other users' published portfolios from your dashboard and like the ones you find interesting
- **JWT authentication** — 7-day sessions, auto-logout on token expiry

---

## Tech Stack

**Backend**
- Node.js + Express (CommonJS)
- MongoDB Atlas + Mongoose
- JWT auth + bcryptjs password hashing
- Google Gemini API (`gemini-2.0-flash`) via `@google/genai` for resume parsing
- `pdf-parse` (PDF) and `mammoth` (DOCX) for text extraction
- Cloudinary for image storage (profile photos, auto-cropped 500×500 face-centered)

**Frontend**
- React + Vite
- React Router
- Tailwind CSS v4
- Axios

---

## Project Structure

```
resume-portfolio/
├── backend/
│   └── src/
│       ├── routes/          # auth, resumes, portfolio
│       ├── controllers/     # request handlers
│       ├── models/          # User, Resume (Mongoose schemas)
│       ├── middleware/      # requireAuth, optionalAuth, multer upload configs
│       ├── config/          # db connection, cloudinary config
│       └── server.js
├── frontend/
│   └── src/
│       ├── api/             # shared axios instance with auth interceptor
│       ├── context/         # AuthContext (session state)
│       ├── components/      # ProtectedRoute
│       ├── pages/           # Signup, Login, Dashboard, ReviewEdit,
│       │                    # ThemePicker, Publish, Settings, PublicPortfolio
│       └── App.jsx
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)
- A Cloudinary account (free tier is fine)
- A Google Gemini API key

### 1. Clone and install

```bash
git clone https://github.com/your-username/resume-portfolio.git
cd resume-portfolio

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

**`backend/.env`**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret_string
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000/api
```

> Never commit `.env` files. Both are already covered by `.gitignore` — double check before your first push.

### 3. Run locally

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.

---

## API Overview

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Create an account |
| POST | `/auth/login` | No | Log in |
| GET | `/auth/me` | Yes | Get current user |
| PUT | `/auth/username` | Yes | Set/change public username |
| PUT | `/auth/password` | Yes | Change password |
| POST | `/resumes/upload` | Yes | Upload resume (multipart, field `resume`) |
| GET | `/resumes/mine` | Yes | Get the current user's resume, if any |
| POST | `/resumes/:id/parse` | Yes | Trigger AI parsing |
| GET | `/resumes/:id` | Yes | Get a resume by ID |
| PUT | `/resumes/:id` | Yes | Update `parsedData` and/or `theme` |
| PATCH | `/resumes/:id/publish` | Yes | Toggle published status |
| POST | `/resumes/:id/image` | Yes | Upload profile photo (multipart, field `image`) |
| GET | `/portfolio` | Optional | Discovery feed of published portfolios |
| GET | `/portfolio/:username` | Optional | Public portfolio data |
| POST | `/portfolio/:username/like` | Yes | Toggle a like on someone else's portfolio |

---

## Deployment

Deployed with **Render** (backend) and **Vercel** (frontend).

**Backend (Render)**
- Root directory: `backend`
- Build command: `npm install`
- Start command: `node src/server.js`
- Add all backend env vars above in Render's dashboard (omit `PORT` — Render sets it automatically)
- MongoDB Atlas → Network Access → allow `0.0.0.0/0` (Render's outbound IPs aren't static on the free tier)

**Frontend (Vercel)**
- Root directory: `frontend`
- Framework preset: Vite (auto-detected)
- Env var: `VITE_API_URL=https://your-backend.onrender.com/api`
- Add a `vercel.json` with a SPA rewrite so client-side routes (e.g. `/u/:username`) don't 404 on refresh:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

After both are live, set `FRONTEND_URL` on Render to your Vercel URL so CORS only allows your real frontend.

---

## Known Limitations

- View counts are a simple per-request increment, not deduplicated per visitor
- One resume per user — uploading a new resume replaces the existing one (data, theme, photo, and publish status all reset)
- Discovery feed currently loads only the first page; pagination exists on the backend (`?page=`) but isn't wired to a "load more" control yet

---

## License

_Add a license here (e.g. MIT) if you plan to open-source this._

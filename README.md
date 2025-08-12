## AI Chatbot — Network Science Assignment

**Live Deployment:** [chatbotnetworkscience.onrender.com](https://chatbotnetworkscience.onrender.com/)

### Overview
This is a full‑stack AI chatbot built for the Network Science assignment. It provides a clean chat experience with support for PDF‑aware Q&A, session history, basic authentication, and voice input. The backend is implemented with Flask and SQLite, and the frontend is a modern React (Vite) app. The built frontend is served by the backend for a single, simple deployable service.

### Features
- **Chat with AI**: Conversational interface backed by Gemini.
- **Document analysis (PDF/CSV/XLSX/PPT/PPTX)**: Upload a document and ask questions “based on the document.”
- **Session history**: Create, list, load, and delete chat sessions.
- **Authentication**: Sign up, log in, and maintain a session token.
- **Voice input**: Dictate your prompt using the Web Speech API.
- **Single-service deploy**: Frontend is prebuilt and served from the backend’s `static` folder.

### Tech Stack
- **Frontend**: React, Vite, Tailwind, shadcn/ui
- **Backend**: Python, Flask, Flask‑CORS, SQLAlchemy, Gunicorn
- **DB**: SQLite (file stored under `chatbot-backend/src/database/app.db`)
- **AI Model**: Gemini (via `google-generativeai`)
- **Hosting**: Render Web Service

---

### Quick Start (Local)
Prereqs: Node + pnpm, Python 3.10+

1) Backend
```bash
cd chatbot-backend
python -m venv .venv && .\.venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Create .env in chatbot-backend with:
# GEMINI_API_KEY=your_key_here
# FLASK_SECRET_KEY=some_secret

python src/main.py  # http://localhost:5000
```

2) Frontend (build and copy to backend)
```bash
cd chatbot-frontend
pnpm install
pnpm build

# Copy the built dist to backend static
# Windows example:
robocopy dist ..\chatbot-backend\src\static /MIR
```

Open `http://localhost:5000`.

Note: Whenever you change the frontend, rebuild and copy `dist` into `chatbot-backend/src/static`, then restart the backend so the UI updates are served.

---

### Environment Variables (Backend)
- `GEMINI_API_KEY` — required
- `FLASK_SECRET_KEY` — required

---

### REST Endpoints (Brief)
- `GET /api/health` — health check
- `POST /api/chat` — send a chat message; returns model response and `session_id`
- `GET /api/chat/sessions` — list chat sessions (scoped by user if authenticated)
- `GET /api/chat/sessions/:session_id` — fetch a session and its messages
- `DELETE /api/chat/sessions/:session_id` — delete a session
- `POST /api/chat/new-session` — create a new session
- `POST /api/upload-file` — upload a document (PDF/CSV/XLSX/PPT/PPTX) for the current session
- `POST /api/clear-file` — clear document context
- Legacy compatibility: `/api/upload-pdf` and `/api/clear-pdf` still work
- `POST /api/auth/signup` — create account
- `POST /api/auth/login` — login and receive `session_token`
- `POST /api/auth/logout` — logout
- `GET /api/auth/check-session` — boolean auth status

---

### Deploying to Render (Web Service)
- Root Directory: `chatbot-backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `gunicorn -w ${WEB_CONCURRENCY:-2} -b 0.0.0.0:$PORT src.main:app`
- Health Check Path: `/api/health`
- Environment Variables: `GEMINI_API_KEY`, `FLASK_SECRET_KEY`
- SQLite Persistence: Add a Render Disk and mount it to `/opt/render/project/src/chatbot-backend/src/database`

Tip: After frontend changes, run `pnpm build` in `chatbot-frontend` and copy `dist` into `chatbot-backend/src/static` before pushing so Render serves the latest UI.

---

### Project Structure
```
Chatbot/
├─ chatbot-backend/
│  ├─ src/
│  │  ├─ main.py                # Flask app entry
│  │  ├─ routes/                # auth, chat, user endpoints
│  │  ├─ models/                # SQLAlchemy models
│  │  ├─ static/                # built frontend (served by Flask)
│  │  └─ database/              # SQLite file (gitignored)
│  └─ requirements.txt
└─ chatbot-frontend/
   ├─ src/                      # React app
   ├─ public/
   └─ dist/                     # build output (copied to backend/static)
```

---

### Notes
- On free tiers, cold starts can cause slower first requests.
- For PDF context across multiple workers or restarts, persist the extracted text in the DB rather than in memory.



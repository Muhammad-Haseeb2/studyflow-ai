<div align="center">

<br/>

```
░█████╗░██╗  ░██████╗████████╗██╗░░░██╗██████╗░██╗░░░██╗
██╔══██╗██║  ██╔════╝╚══██╔══╝██║░░░██║██╔══██╗╚██╗░██╔╝
███████║██║  ╚█████╗░░░░██║░░░██║░░░██║██║░░██║░╚████╔╝░
██╔══██║██║  ░╚═══██╗░░░██║░░░██║░░░██║██║░░██║░░╚██╔╝░░
██║░░██║██║  ██████╔╝░░░██║░░░╚██████╔╝██████╔╝░░░██║░░░
╚═╝░░╚═╝╚═╝  ╚═════╝░░░╚═╝░░░░╚═════╝░╚═════╝░░░░╚═╝░░░

    ██╗░░██╗███████╗██╗░░░░░██████╗░███████╗██████╗░
    ██║░░██║██╔════╝██║░░░░░██╔══██╗██╔════╝██╔══██╗
    ███████║█████╗░░██║░░░░░██████╔╝█████╗░░██████╔╝
    ██╔══██║██╔══╝░░██║░░░░░██╔═══╝░██╔══╝░░██╔══██╗
    ██║░░██║███████╗███████╗██║░░░░░███████╗██║░░██║
    ╚═╝░░╚═╝╚══════╝╚══════╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝
```

### *Your AI-Powered Personal Learning Companion*

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red.svg?style=flat-square)](#)
[![OpenAI](https://img.shields.io/badge/Powered%20by-OpenAI%20%7C%20Anthropic%20%7C%20Gemini-412991?style=flat-square)](https://openai.com)

<br/>

> **Transform the way you learn.** AI Study Helper is a full-stack, production-grade intelligent learning platform that combines the power of GPT-4o, Claude, and Gemini with a beautiful, fast, and deeply personal study experience — complete with voice interaction, real-time collaboration, spaced repetition, and adaptive AI coaching.

<br/>

[🚀 Live Demo](#) · [📖 Documentation](#documentation) · [🐛 Report Bug](issues) · [✨ Request Feature](issues)

<br/>

---

</div>

<br/>

## 📸 Screenshots

<div align="center">

| AI Chat Coach | Quiz Generator | Mind Map | Dashboard |
|:---:|:---:|:---:|:---:|
| ![Chat](./assets/chat.png) | ![Quiz](./assets/quiz.png) | ![Mindmap](./assets/mindmap.png) | ![Dashboard](./assets/dashboard.png) |
| *Multi-mode AI explanations* | *Adaptive difficulty + weak area detection* | *D3.js hierarchical maps* | *Streak tracking & analytics* |

</div>

<br/>

---

## ✨ Why AI Study Helper?

<table>
<tr>
<td width="50%">

### The Problem
Students today are overwhelmed. Static textbooks, passive YouTube videos, disconnected apps, and zero personalization. Hours of study with no feedback loop. No one to ask questions at 2am. No way to know if you actually *learned* anything.

</td>
<td width="50%">

### The Solution
An AI tutor that **knows you** — your learning pace, your weak areas, your goals. It explains concepts 5 different ways until one clicks. It quizzes you intelligently. It remembers what you struggled with last Tuesday. It's available 24/7, speaks your language, and actually makes studying feel like a conversation.

</td>
</tr>
</table>

<br/>

---

## 🧠 Feature Showcase

<details open>
<summary><strong>🤖 Core AI Modules</strong></summary>

<br/>

| Feature | Description | Tech Stack |
|---------|-------------|------------|
| **AI Chat Coach** | Multi-mode explanations (simple, technical, analogy, Socratic, visual). Remembers context across sessions. Detects confusion and adapts. | GPT-4o · SSE Streaming · PostgreSQL |
| **AI Notes Generator** | Paste a topic, a URL, or upload a PDF — get beautifully structured Markdown notes with headings, key points, examples, and a summary. Export to DOCX/PDF. | Claude 3.5 · Async Celery · S3 |
| **AI Quiz Generator** | Adaptive MCQ, true/false, and open-ended quizzes. Automatic weak area detection after each attempt. Gets harder where you're weak, easier where you're strong. | GPT-4o JSON schema · SM-2 algorithm |
| **Flashcard System** | Auto-generated from notes or quizzes. Full SM-2 spaced repetition algorithm. Flip animations. Daily review queue. | PostgreSQL · SM-2 · React Spring |
| **Mind Map Generator** | Enter any topic → AI returns hierarchical JSON → D3.js renders an interactive, draggable, zoomable mind map. Export as SVG/PNG. | GPT-4o structured output · D3.js |
| **Voice Interaction** | Full voice pipeline: speak your question → Whisper STT → AI answers → ElevenLabs/Azure TTS reads the answer aloud. Multi-language including Urdu. | Whisper · ElevenLabs · MediaRecorder |
| **Essay Writer** | Outline → Draft → Refine workflow with citation awareness. Adjustable tone, length, and academic level. Export ready. | Claude 3.5 Sonnet · Async pipeline |
| **Translator** | Deep contextual translation with register detection. First-class Urdu RTL support. 50+ languages. | GPT-4o · RTL CSS · i18n |

</details>

<details>
<summary><strong>📊 Productivity Modules</strong></summary>

<br/>

| Feature | Description |
|---------|-------------|
| **Smart Dashboard** | Real-time study analytics: daily/weekly heatmaps, streak counter, subject time distribution, goal progress, achievement showcase. WebSocket live updates. |
| **Goal Management** | Create learning goals with deadlines and milestones. AI suggests sub-goals. Progress tracked automatically from sessions and quiz results. |
| **Study Timer** | Pomodoro and custom timers. Synced via WebSocket — pause on any device, resume on another. Session logging with automatic subject detection. |
| **Smart Calendar** | Full event calendar with reminder system. Sound alerts. Color-coded by subject. Celery Beat scheduler fires reminders at the right time, always. |

</details>

<br/>

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│   React 18 (Vite) │ Redux Toolkit │ React Query │ Service Worker    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY                                    │
│            Nginx (SSL, rate-limit) │ AWS ALB (load balance)         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                   FASTAPI BACKEND (Modular Monolith)                │
│  Auth │ AI Orchestration │ Study │ Voice │ Productivity │ WS Mgr    │
└──────────┬────────────────────────────────────────┬─────────────────┘
           │                                        │
┌──────────▼──────────┐              ┌──────────────▼────────────────┐
│   CELERY WORKERS    │              │         AI SERVICES           │
│  Redis Queue │ Tasks│              │  OpenAI │ Anthropic │ Gemini  │
└──────────┬──────────┘              └──────────────────────────────-┘
           │
┌──────────▼──────────────────────────────────────────────────────────┐
│                        STORAGE LAYER                                │
│   PostgreSQL (RDS) │ MongoDB │ Redis (ElastiCache) │ Vector DB      │
└─────────────────────────────────────────────────────────────────────┘
```


<br/>

---

## ⚡ Quick Start

### Prerequisites

```bash
# Required
node >= 18.0.0
python >= 3.11
redis-server
postgresql >= 15
```


**That's it.** Open https://studyflow-ai-tqrf.vercel.app/ 🎉

---

### 🛠️ Manual Setup

<details>
<summary><strong>Backend (FastAPI)</strong></summary>

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# 5. Run database migrations
alembic upgrade head

# 6. Start the development server
uvicorn app.main:app --reload --port 8000

# 7. In a separate terminal, start Celery workers
celery -A app.workers.celery worker --loglevel=info

# 8. Start Celery Beat (scheduler for reminders)
celery -A app.workers.celery beat --loglevel=info
```

API docs available at: `http://localhost:8000/docs`

</details>

<details>
<summary><strong>Frontend (React)</strong></summary>

```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8000

# 4. Start development server
npm run dev
```

App available at: `https://studyflow-ai-tqrf.vercel.app/`

</details>

<br/>

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# ── APPLICATION ─────────────────────────────────────────────
APP_NAME="AI Study Helper"
APP_ENV=development                    # development | production
SECRET_KEY=your-super-secret-key-here
DEBUG=true

# ── DATABASE ─────────────────────────────────────────────────
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/study_helper
MONGODB_URL=mongodb://localhost:27017/study_helper
REDIS_URL=redis://localhost:6379/0

# ── AI PROVIDERS ─────────────────────────────────────────────
OPENAI_API_KEY=sk-...                  # Required: Chat, Quiz, Notes, Translate
ANTHROPIC_API_KEY=sk-ant-...          # Optional: Essay, long-form tasks
GOOGLE_AI_API_KEY=...                  # Optional: Gemini integration

# ── VOICE SERVICES ───────────────────────────────────────────
ELEVENLABS_API_KEY=...                 # Text-to-speech
AZURE_SPEECH_KEY=...                   # Alternative STT/TTS
AZURE_SPEECH_REGION=eastus

# ── STORAGE ──────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=study-helper-assets
AWS_REGION=us-east-1

# ── AUTH ─────────────────────────────────────────────────────
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
GOOGLE_CLIENT_ID=...                   # For Google OAuth
GOOGLE_CLIENT_SECRET=...

# ── RATE LIMITING ─────────────────────────────────────────────
RATE_LIMIT_PER_MINUTE=100
AI_CALLS_PER_HOUR=20

# ── CELERY ───────────────────────────────────────────────────
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

<br/>

---

## 📁 Project Structure

```
ai-study-helper/
│
├── 📂 backend/
│   ├── app/
│   │   ├── modules/
│   │   │   ├── auth/          # JWT, OAuth2, session management
│   │   │   ├── ai/            # Prompt pipeline, model router, formatter
│   │   │   ├── study/         # Notes, quiz, flashcards, essay, translator
│   │   │   ├── voice/         # STT + TTS pipelines
│   │   │   ├── calendar/      # Events, reminders, Celery Beat
│   │   │   ├── goals/         # Goals, streaks, achievements
│   │   │   └── dashboard/     # Analytics, heatmaps, stats
│   │   ├── core/
│   │   │   ├── config.py      # Pydantic settings
│   │   │   ├── database.py    # Async SQLAlchemy engine
│   │   │   ├── security.py    # JWT utilities
│   │   │   └── middleware.py  # Rate limiting, logging, CORS
│   │   ├── workers/
│   │   │   ├── celery.py      # Celery app instance
│   │   │   └── tasks/         # AI task definitions
│   │   └── main.py            # FastAPI app factory
│   ├── alembic/               # Database migrations
│   ├── tests/                 # pytest test suite
│   └── requirements.txt
│
├── 📂 frontend/
│   ├── src/
│   │   ├── features/          # Feature-based modules
│   │   │   ├── chat/          # AI Chat Coach
│   │   │   ├── notes/         # Notes Generator
│   │   │   ├── quiz/          # Quiz + weak area detection
│   │   │   ├── flashcards/    # SM-2 spaced repetition
│   │   │   ├── mindmap/       # D3.js mind maps
│   │   │   ├── voice/         # MediaRecorder + audio player
│   │   │   ├── essay/         # Essay writer workflow
│   │   │   ├── translator/    # Multi-language + RTL
│   │   │   ├── dashboard/     # Analytics & charts
│   │   │   ├── goals/         # Goal tracking
│   │   │   ├── timer/         # Pomodoro + WS sync
│   │   │   └── calendar/      # Events + reminders
│   │   ├── components/ui/     # Shared design system
│   │   ├── services/
│   │   │   ├── api.ts         # Axios instance + interceptors
│   │   │   └── ws.ts          # WebSocket client manager
│   │   ├── app/
│   │   │   ├── store.ts       # Redux Toolkit store
│   │   │   └── routes.tsx     # React Router v6 (lazy loaded)
│   │   └── hooks/             # Custom React hooks
│   └── package.json
│
├── 📂 docs/
│   ├── architecture.pdf       # System architecture diagram
│   ├── api-reference.md       # Full API documentation
│   └── deployment.md          # Production deployment guide
│
├── 📂 infrastructure/
│   ├── docker-compose.yml     # Local development stack
│   ├── docker-compose.prod.yml
│   ├── k8s/                   
│   │   ├── api-deployment.yaml
│   │   ├── worker-deployment.yaml
│   │   └── ingress.yaml
│   └── nginx/
│       └── nginx.conf
│
└── 📂 .github/
    ├── workflows/
    │   ├── ci.yml             # Tests + lint on PR
    │   └── deploy.yml         # Deploy to production on merge
    └── PULL_REQUEST_TEMPLATE.md
```

<br/>

---

## 🔌 API Reference


All endpoints require `Authorization: Bearer <token>` unless marked `[public]`.

<details>
<summary><strong>Authentication</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | `[public]` Create new account |
| `POST` | `/auth/login` | `[public]` Returns JWT pair |
| `POST` | `/auth/refresh` | Rotate refresh token |
| `POST` | `/auth/google` | `[public]` OAuth2 Google |
| `GET`  | `/auth/me` | Current user profile |

</details>

<details>
<summary><strong>AI Features</strong></summary>

| Method | Endpoint | Type | Description |
|--------|----------|------|-------------|
| `POST` | `/ai/chat/message` | **SSE Stream** | Send message, receive streamed response |
| `POST` | `/ai/notes/generate` | **Async** → `task_id` | Generate structured notes |
| `POST` | `/quiz/generate` | **Async** → `task_id` | Generate adaptive quiz |
| `POST` | `/quiz/{id}/attempt` | Sync | Submit answers, get weak areas |
| `POST` | `/flashcards/generate` | **Async** → `task_id` | Generate flashcard deck |
| `GET`  | `/flashcards/due` | Sync | SM-2 due cards for today |
| `POST` | `/mindmap/generate` | **Async** → `task_id` | Generate mind map JSON |
| `POST` | `/essay/outline` | **Async** → `task_id` | Generate essay outline |
| `POST` | `/voice/stt` | Sync | Audio file → transcript |
| `POST` | `/voice/tts` | **Stream** | Text → MP3 audio stream |
| `POST` | `/translate` | Sync | Translate text (50+ languages) |

</details>

<details>
<summary><strong>Async Task Polling</strong></summary>

```bash
# 1. Start an async job
POST /ai/quiz/generate
→ { "task_id": "qz_abc123", "status": "pending" }

# 2. Poll for result (or wait for WebSocket notification)
GET /tasks/qz_abc123
→ { "status": "completed", "result": { ...quiz data... } }

# 3. Or listen on WebSocket (preferred)
WS /ws/study
← { "type": "task.done", "task_id": "qz_abc123" }
```

</details>

<details>
<summary><strong>WebSocket Events</strong></summary>

Connect to `wss://api.yourdomain.com/ws/study` with JWT in the query string.

```jsonc
// Inbound (client → server)
{ "type": "timer.start", "payload": { "duration": 1500, "mode": "pomodoro" } }
{ "type": "timer.pause" }
{ "type": "dashboard.subscribe" }

// Outbound (server → client)
{ "type": "timer.tick",      "payload": { "remaining": 1340 } }
{ "type": "timer.done",      "payload": { "session_id": "sess_xyz" } }
{ "type": "reminder.fire",   "payload": { "title": "Study Math", "sound": true } }
{ "type": "task.done",       "payload": { "task_id": "qz_abc123", "module": "quiz" } }
{ "type": "dashboard.update","payload": { "streak": 7, "today_minutes": 90 } }
```

</details>

<br/>


---

## 🧪 Testing

```bash
# Backend — full test suite
cd backend
pytest tests/ -v --cov=app --cov-report=html

# Run specific module tests
pytest tests/test_quiz.py -v
pytest tests/test_ai_service.py -v

# Frontend — unit + integration
cd frontend
npm run test              # Vitest
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright E2E tests
```

<br/>

---

## 📊 Performance Targets

| Metric | Target | How |
|--------|--------|-----|
| API p95 latency (non-AI) | < 200ms | Redis cache + read replicas |
| AI first token | < 3s | Streaming SSE + model routing |
| Page load (LCP) | < 1.5s | Vite code splitting + CDN |
| WebSocket delivery | < 50ms | Direct push via WS manager |
| Uptime | 99.9% | Multi-AZ RDS + K8s self-healing |
| Concurrent users | 10,000+ | Stateless pods + HPA |

<br/>

---

## 🛡️ Security

- 🔐 **JWT Auth** — 15-min access tokens + 7-day httpOnly refresh cookies
- 🔄 **Token Rotation** — Refresh tokens stored in Redis, revocable instantly
- 🛡️ **Rate Limiting** — 100 req/min per user, 20 AI calls/hour
- 🔒 **Input Sanitization** — Pydantic validation on all inputs + prompt injection filtering
- 🌐 **HTTPS Everywhere** — HSTS headers, TLS 1.3 only
- 🔑 **Secrets** — All keys in environment variables, never in code
- 📦 **Dependencies** — Dependabot automated security updates

<br/>

---

## 🗺️ Roadmap

- [x] AI Chat Coach with streaming
- [x] Quiz generator with weak area detection
- [x] Spaced repetition flashcards (SM-2)
- [x] Voice interaction (STT + TTS)
- [x] Pomodoro timer with WebSocket sync
- [x] Smart calendar with reminders
- [ ] **v1.1** — Collaborative study rooms (multi-user sessions)
- [ ] **v1.2** — AI personalization engine (learns your style over time)
- [ ] **v1.3** — Recommendation engine (suggests topics based on weak areas)
- [ ] **v1.4** — Offline mode (Service Worker + IndexedDB sync)
- [ ] **v2.0** — React Native mobile app (iOS + Android)
- [ ] **v2.1** — Teacher/parent dashboard
- [ ] **v2.2** — Fine-tuned model on anonymized learning patterns

<br/>

---

## 🤝 Contributing

Contributions are what make the open source community amazing. Any contribution you make is **greatly appreciated**.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<br/>

---

## 👥 Team & Acknowledgements

Built with the following incredible open-source projects:

- [FastAPI](https://fastapi.tiangolo.com) — The fastest Python web framework
- [React](https://reactjs.org) — The library for web and native UIs
- [Celery](https://docs.celeryq.dev) — Distributed task queue
- [SQLAlchemy](https://sqlalchemy.org) — Python SQL toolkit
- [D3.js](https://d3js.org) — Data visualization
- [Redux Toolkit](https://redux-toolkit.js.org) — State management
- [React Query](https://tanstack.com/query) — Server state management

<br/>

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<br/>

---

<div align="center">

**Built for students, by builders who care about education.**

If this project helped you, please consider giving it a ⭐ — it means the world to us.

<br/>

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin)](https://www.linkedin.com/in/muhammad-haseeb-hsb)

<br/>

*"The beautiful thing about learning is that no one can take it away from you."* — B.B. King

<br/>

---

Made with ❤️ and ☕ · [Muhammad-Haseeb2](https://github.com/Muhammad-Haseeb2) · 2026

</div>

# 🌟 AURA — AI-Powered Investor Self-Service Platform

> An intelligent conversational platform for ABC Mutual Fund that enables investors to independently manage routine servicing requests through AI-powered conversations while seamlessly escalating complex cases to human advisors.

---

## 👥 Team & Submission Information

* **Team Name**: AURA
* **Team Members**: 
  1. **Kartik Rana**
  2. **Amit Thakor**
* **College Name**: Sardar Patel College of Engineering and Technology
* **Submission Deadline**: Friday, 03-Jul-2026, 12:00hrs IST

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Investor    │  │   Advisor    │  │    Admin     │     │
│  │   Portal      │  │   Portal     │  │   Portal     │     │
│  │  (Next.js)    │  │  (Next.js)   │  │  (Next.js)   │     │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘     │
│         │                  │                 │              │
│         └──────────────────┼─────────────────┘              │
│                            │ REST API (JSON)                │
│ └──────────────────────────┼────────────────────────────────┘
│                            │
│ ┌──────────────────────────┼────────────────────────────────┐
│ │                    APPLICATION LAYER                         │
│ │                            │                                │
│ │  ┌─────────────────────────┴──────────────────────────┐    │
│ │  │              FastAPI Application                    │    │
│ │  └─────────────────────────┬──────────────────────────┘    │
│ │                            │                                │
│ │             ┌──────────────┴──────────────┐                 │
│ │             ▼                             ▼                 │
│ │      ┌──────────────┐              ┌──────────────┐         │
│ │      │ AI (Gemini)  │              │ SQL Database │         │
│ │      │ Orchestrator │              │ (SQLAlchemy) │         │
│ │      └──────────────┘              └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **Backend** | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| **Database** | PostgreSQL (Production) / SQLite (Development) |
| **AI Agent** | Google Gemini 2.5 Flash (via Function Calling / Tool Executions) |
| **Containers**| Docker, Docker Compose |

---

## 📦 Project Structure

```
AI-Investor-Self-Service-Platform/
├── frontend/          # Next.js investor/advisor portal code
├── backend/           # FastAPI backend server code
├── docs/              # Detailed design & requirements documents
├── docker-compose.yml # Docker Compose orchestration configurations
└── README.md
```

---

## ⚡ Quick Start with Docker (Recommended)

To run the complete platform (frontend + backend + PostgreSQL database + auto seeding) in a single command, ensure you have Docker installed and run:

```bash
# Build and run containers
docker-compose up --build
```
The script will automatically set up the Postgres database, run all schema creation scripts, seed the database with test accounts, and spin up the services:
- **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🏃 Local Manual Setup (Alternative)

### 1. Backend Setup
1. Navigate to `backend` folder and create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   ```
2. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy environment configuration and edit your Google Gemini API key:
   ```bash
   cp .env.example .env
   ```
4. Run the seed script to create database tables and insert sample records:
   ```bash
   python seed_data.py
   ```
5. Start the backend server:
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```

### 2. Frontend Setup
1. Navigate to `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Next.js development server:
   ```bash
   npm run dev
   ```

---

## 🌐 Cloud Deployment Setup (Production)

The platform is configured for instant cloud deployment:

### 1. Database (Neon or Supabase)
- Set up a serverless PostgreSQL instance.
- Append `?ssl=require` to your PostgreSQL connection string for secure connection configurations.

### 2. Backend (Render Web Service)
- Set **Root Directory** to `backend`.
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port 8000`
- Set the following environment variables:
  * `APP_DATABASE_URL`: `postgresql+asyncpg://...` (your PostgreSQL connection string)
  * `APP_GEMINI_API_KEY`: Your Google AI Studio API key
  * `APP_SECRET_KEY`: A secure session hash string
  * `APP_ENVIRONMENT`: `production`

*(Note: On boot, the backend automatically runs migrations and seeds the database with realistic investor data if no records exist.)*

### 3. Frontend (Vercel)
- Set **Root Directory** to `frontend`.
- Set the following environment variable:
  * `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com/api/v1` (URL of your deployed Render backend API)

---

## 🔑 Demo Credentials

Use the following credentials to evaluate the platform:

| Role | Username / Identity | Mock Verification / Password |
|------|---------------------|-----------------------------|
| **Investor** | Phone: `9876543210` (Rajesh Sharma) | OTP: `123456` |
| **Investor** | Phone: `9876543211` (Priya Mehta) | OTP: `123456` |
| **Advisor** | Email: `sneha@abcmf.com` | Password: `advisor123` |
| **Admin** | Email: `vikram@abcmf.com` | Password: `admin123` |

---

## 📋 Key Assumptions & Design Decisions

1. **Human-in-the-Loop Fallback**: AI handles 100% of routine queries, but escalates mandate modification & document verification issues to advisors.
2. **Mock OTP Authentication**: OTP verification is simulated using the standard code `123456` to allow frictionless evaluation by judges.
3. **Database Migration Agility**: Designed with SQLAlchemy 2.0 and repository abstraction, allowing instant swap from SQLite (local) to PostgreSQL (production) with zero code modifications.
4. **Statement Generation**: Generates mock transactional CAS statements and capital gains PDFs saved on-the-fly.

---

## 🛠️ AI Tools Disclosure

As permitted by the hackathon rules, the following AI tools were utilized to accelerate development:
* **Antigravity AI Agent Coding Assistant**: Code generation, repository design pattern compilation, database integration, and UI styling polish.
* **Google Gemini 2.5 Flash**: Orchestrates natural language understanding, function calling tool triggers, and conversation summary generations.

---

## 🚀 Known Limitations & Future Roadmap

* **OTP SMS Gateway**: In production, integrate an SMS gateway provider (e.g. Twilio or Gupshup) for real OTP delivery.
* **Real Payment Gateway**: Integrate UPI/NetBanking APIs (Razorpay/BillDesk) for live transaction processing.
* **Vector Search (RAG)**: Add a vector database (e.g. PGVector) to index mutual fund scheme document PDFs for automated fund recommendations.

---

## 📚 Detailed Documentation

Click the links below to view detailed design artifacts:
- [Product Requirements Document (PRD)](docs/PRD.md) — Feature scopes and target journeys
- [System Architecture](docs/Architecture.md) — Integrations, decisions, and flow charts
- [API Reference Manual](docs/API.md) — Route endpoints, JSON request bodies
- [Database & ER Design](docs/Database.md) — Table fields and keys mapping
- [AI Workflow & Tool Execution](docs/AI-Workflow.md) — Gemini function calling mechanics
- [PostgreSQL Migration Guide](docs/Postgres_Migration.md) — Switching database engine
- [Cloud Deployment Checklist](docs/Deployment_Checklist.md) — Step-by-step Render/Vercel guide
- [Hackathon Demo Pitch Script](docs/Demo-Script.md) — 5-minute pitch demo scenarios

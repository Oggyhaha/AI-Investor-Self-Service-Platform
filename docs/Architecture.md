# Architecture Document — AURA Platform

## System Architecture Overview

AURA follows a **layered, modular architecture** designed for maintainability, scalability, and clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Investor    │  │   Advisor    │  │    Admin     │     │
│  │   Portal      │  │   Portal    │  │   Portal     │     │
│  │  (Next.js)    │  │  (Next.js)  │  │  (Next.js)   │     │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────┘     │
│         │                  │                 │              │
│         └──────────────────┼─────────────────┘              │
│                            │ REST API (JSON)                │
└────────────────────────────┼────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                            │                                │
│  ┌─────────────────────────┴──────────────────────────┐    │
│  │              FastAPI Application                    │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │    │
│  │  │   Auth   │  │ Investor │  │  Portfolio    │     │    │
│  │  │  Module  │  │  Module  │  │   Module      │     │    │
│  │  └──────────┘  └──────────┘  └──────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │    │
│  │  │   SIP    │  │   KYC    │  │   Nominee    │     │    │
│  │  │  Module  │  │  Module  │  │   Module      │     │    │
│  │  └──────────┘  └──────────┘  └──────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐     │    │
│  │  │Statement │  │  Ticket  │  │ Conversation  │     │    │
│  │  │  Module  │  │  Module  │  │   Module      │     │    │
│  │  └──────────┘  └──────────┘  └──────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐      │    │
│  │  │         AI Orchestration Layer            │      │    │
│  │  │  Intent Router → Tool Executor → Gemini  │      │    │
│  │  └──────────────────────────────────────────┘      │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────┬───────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────┐
│                     DATA LAYER                               │
│                             │                                │
│  ┌──────────────────────────┴─────────────────────────┐     │
│  │              SQLite / PostgreSQL                     │     │
│  │                                                     │     │
│  │  investors │ funds │ portfolio_holdings │ sips       │     │
│  │  mandates │ kyc │ nominees │ transactions            │     │
│  │  statements │ conversations │ conversation_messages  │     │
│  │  service_requests │ notifications │ advisors         │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Module Architecture Pattern

Every business module follows a consistent 4-layer pattern:

```
HTTP Request
    │
    ▼
┌──────────┐     Thin layer: parse input, validate, return response
│  Router   │     No business logic
└────┬─────┘
     │
     ▼
┌──────────┐     All business logic lives here
│  Service  │     Orchestrates repositories, applies rules
└────┬─────┘
     │
     ▼
┌──────────┐     Pure data access
│Repository│     SELECT, INSERT, UPDATE, DELETE
└────┬─────┘
     │
     ▼
┌──────────┐
│ Database  │     SQLAlchemy async session
└──────────┘
```

## AI Conversation Flow

```
User Message → Save to DB → Load History → Gemini API
                                              │
                                    ┌─────────┴─────────┐
                                    │                     │
                              Text Response         Function Call
                                    │                     │
                                    │              Execute Tool
                                    │              (calls service)
                                    │                     │
                                    │              Send result
                                    │              back to Gemini
                                    │                     │
                                    ├─────────────────────┘
                                    │
                              Check Escalation
                                    │
                              ┌─────┴─────┐
                              │           │
                           Normal    Escalate
                              │           │
                         Return to   Create Ticket
                           user      Notify Advisor
```

## Authentication Flow

```
Investor Login:
  Phone Number → Mock OTP (123456) → JWT Access + Refresh Token

Advisor/Admin Login:
  Email + Password → JWT Access + Refresh Token

Token Refresh:
  Refresh Token → New Access Token

All API calls:
  Authorization: Bearer <access_token>
```

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Framework | Next.js 15 | SSR capability, file-based routing, fastest dev velocity |
| Backend Framework | FastAPI | Async-native, auto OpenAPI docs, Python AI ecosystem |
| Database | SQLite → PostgreSQL | SQLite for rapid MVP, PostgreSQL for production |
| ORM | SQLAlchemy 2.0 async | Type-safe, modern async patterns |
| Auth | JWT + Mock OTP | Stateless, easy to implement |
| LLM | Google Gemini 2.5 Flash | Free tier, excellent function calling |
| AI Pattern | Function Calling | LLM orchestrates, business logic stays in services |

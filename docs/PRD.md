# Product Requirements Document (PRD) — AURA Platform

## 1. Project Background
ABC Mutual Fund wants to reduce repetitive customer support tickets by building an intelligent self-service portal. Routine investor requests—such as checking SIP mandate failures, generating account statements, verifying KYC status, and registering nominees—take up excessive advisor bandwidth. AURA resolves this by automating routine tasks via conversational AI while seamlessly routing complex tasks to human advisors.

---

## 2. Target Journeys & Automation Scope

### A. SIP Mandate Failures (Automated + Escalation)
* **Goal**: Provide transparent explanations for failed auto-debits and resolve bank mandate limits.
* **Self-Service**: The AI detects failing cycles, links them to bank responses (e.g. *Insufficient Balance*, *Aadhaar link missing*), and guides users.
* **Escalation**: If a bank account change is required, the AI creates a ticket and routes the user to a human advisor.

### B. Statement Compilation (100% Automated)
* **Goal**: Instantly deliver official tax and Cas document ledgers.
* **Self-Service**: Users ask for statements in chat (e.g., *"download capital gains statement"*). The AI compiles and returns a downloadable link.

### C. KYC Updates (Self-Service + Operations Escalation)
* **Goal**: Maintain regulatory compliance updates.
* **Self-Service**: Checks e-KYC status checklist (PAN/Aadhaar/Address linkages).
* **Escalation**: Triggers re-verification request tickets for manual verification if discrepancies occur.

### D. Nominee Registrations (Self-Service + Validation)
* **Goal**: Enable nominee additions or allocation adjustments.
* **Self-Service**: View nominees in tabular dashboards and file allocation request updates.

---

## 3. User Roles & Personas

### I. Investor
* **Needs**: Instant chat solutions, quick statement access, clear explanations of failures, ability to invest/add money.
* **Auth**: Log in via registered phone number and a mock validation OTP (`123456`).

### II. Support Advisor
* **Needs**: Consolidated queue feed of escalated tickets, full conversation logs, ability to write internal team notes, ticket resolution tools.
* **Auth**: Predefined email and passwords.

### III. System Admin
* **Needs**: Platform usage charts, total conversation volume, AI success rates, user management.
* **Auth**: Predefined credentials.

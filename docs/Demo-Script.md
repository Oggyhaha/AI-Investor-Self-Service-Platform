# Technical Demonstration Script — AURA Platform

This demo script outlines a 5-minute end-to-end technical demonstration flow for the hackathon committee.

---

## 🎬 Act I: Investor Sign-In & Dashboard (1.5 Minutes)

1. **Sign-up & Login**:
   - Navigate to `http://localhost:3000/login`.
   - Show the elegant registration tabs.
   - Switch to **Sign In**, input the demo phone `9876543210`, click **Get OTP**, type `123456`, and verify.
2. **Dashboard Overview**:
   - Highlight the premium **light-theme card grids** showing Total Invested, Current Value, and Yields.
   - Point out that the layout spans the **full width of desktop screens** for high-information density.
3. **Invest Money Workflow**:
   - Click **Add Money / Invest** on the top right.
   - Choose a fund, type an amount (e.g. `50000`), input bank name, enter the OTP `123456`, and submit.
   - Show the total holdings value immediately updates!

---

## 🎬 Act II: Self-Service Conversational Assistant (1.5 Minutes)

1. **AURA Chat**:
   - Click **Chat Assistant** in the top navigation.
   - Ask: *"show my holdings"*. The assistant fetches live records.
   - Ask: *"why did my last SIP transaction fail?"*.
   - AURA triggers a database tool lookup, returns that the HDFC SIP failed on May 15th, and explains the reason: **Insufficient balance in bank account**.
2. **Document Compiler**:
   - Click the **Download statement** quick-action chip.
   - AURA compiles the Cas account statement and replies with a download link.

---

## 🎬 Act III: Escalation and Advisor resolution (2 Minutes)

1. **Chat Escalation**:
   - In chat, say: *"I need to change my bank account or talk to an advisor"*.
   - AURA detects the request, creates a high-priority ticket `TKT-90001`, and locks the chat as **Escalated**.
2. **Advisor Dashboard**:
   - Log out, switch to the **Advisor tab**, and sign in with `sneha@abcmf.com` / `advisor123`.
   - Show the high-contrast dashboard showing **Support Escalation Queue** metrics.
   - Point out the ticket reference `TKT-90001` in the feed under **Rajesh Kumar Sharma**.
3. **Ticket Resolution**:
   - Click **Resolve** next to the ticket.
   - Review the **AI-generated Conversation Summary** detailing the user's issue.
   - Post an internal note: *"Coordinating with bank limits team."*
   - Enter resolution details: *"Bank mandate limit updated."*, change status to **Resolved**, and click **Save**.
   - Show that the ticket changes state and clears from the open queue!

# AI Conversation Workflow — AURA Agent

AURA conversational engine integrates with **Google Gemini 2.5 Flash** using dynamic **Function Calling (Tool Calling)**. The AI agent acts as a controller, automatically selecting backend tools based on user messages and executing transactions or escalations.

---

## ⚙️ Function Calling Mechanism

The backend configures the Gemini API client with a set of Python functions declared in [backend/src/ai/tools.py](file:///c:/AI-Investor-Self-Service-Platform/backend/src/ai/tools.py). 

When a user submits a chat message:
1. The backend loads the chat history.
2. The user's query is sent to Gemini alongside the declared tools.
3. Gemini processes the query.
   - If Gemini needs data, it returns a **Tool Call request** (e.g. `check_portfolio_holdings(investor_id)`).
   - The backend runs the local python tool function, queries the database, and returns the result (e.g. JSON list of holdings) to Gemini.
   - Gemini formats the final answer in natural language.
   - If the request is complex or has failed checks, Gemini calls `escalate_to_advisor()`.

---

## 🛠️ List of Exposed AI Tools

| Function Name | Parameters | Description |
|---|---|---|
| `get_portfolio_summary` | `None` | Fetches total invested amount, current value, and absolute returns. |
| `list_portfolio_holdings` | `None` | List detailed mutual fund holdings in the investor's account. |
| `get_sip_status` | `None` | Retrieves active, paused, or failed SIP schedules. |
| `get_failed_sips_reason` | `None` | Lists failing SIPs, bank partners, and return error codes. |
| `get_kyc_status` | `None` | Checks if PAN/Aadhaar/Address linkages are verified. |
| `get_nominees_details` | `None` | Lists family nominee names and allocation percentages. |
| `generate_account_statement` | `type` (CAS/gains/ledger) | Automatically compiles PDF/TXT ledger files and registers them for download. |
| `escalate_to_advisor` | `category`, `subject`, `details` | Triggers a ticket creation, locks chat in escalated status, and alerts advisors. |

---

## ⚠️ Advisor Escalation Protocol

AURA uses a strict deterministic threshold to pass conversations to human support agents:

1. **Mandate Rejections**: If a user is confused by bank errors, the assistant explains the error and calls `escalate_to_advisor()` to schedule a bank limit resolution call.
2. **KYC Discrepancies**: If documents fail PAN or Aadhaar verification, AURA escalates to operations.
3. **Explicit Request**: If the user says *"talk to a human"*, *"connect to support"*, or *"raise a ticket"*, the assistant initiates escalation immediately.
4. **Resolution Notes**: The system creates a record in the `service_requests` table, generates an **AI Summary** of the chat context, and changes the conversation status to `escalated`.
5. **System Handshake**: The chat interface disables direct AI replies, displaying a banner indicating that a support advisor has taken over.

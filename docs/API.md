# AURA Platform — REST API Reference Documentation

AURA exposes a secure, stateless REST API built using **FastAPI**. By default, when running the backend server locally, interactive API documentation is automatically generated and accessible at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Redoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔒 Authentication & Headers

All secure endpoints (except public auth routes) require a JWT access token sent in the HTTP Request Header:
```http
Authorization: Bearer <access_token>
```

---

## 🔑 Authentication Endpoints (`/auth`)

### 1. Initiate OTP Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Description**: Mock initiates OTP login for investors by checking phone numbers.
- **Request Body**:
  ```json
  { "phone": "9876543210" }
  ```
- **Response**:
  ```json
  { "success": true, "message": "OTP sent successfully (mock OTP is 123456)" }
  ```

### 2. Verify OTP Login
- **Endpoint**: `POST /api/v1/auth/verify-otp`
- **Description**: Verifies mock OTP `123456` and returns JWT tokens.
- **Request Body**:
  ```json
  { "phone": "9876543210", "otp": "123456" }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "role": "investor",
    "user_id": "INV-10001"
  }
  ```

### 3. Advisor/Admin Login
- **Endpoint**: `POST /api/v1/auth/advisor/login`
- **Description**: Authenticates advisors/admins using email/password.
- **Request Body**:
  ```json
  { "email": "sneha@abcmf.com", "password": "advisor123" }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "role": "advisor",
    "user_id": "ADV-001"
  }
  ```

### 4. Register New Investor
- **Endpoint**: `POST /api/v1/auth/signup`
- **Description**: Registers a new investor and seeds a pending e-KYC record.
- **Request Body**:
  ```json
  {
    "full_name": "Rohan Das",
    "email": "rohan@example.com",
    "phone": "9876543220",
    "pan": "ABCDS9012D",
    "date_of_birth": "1994-06-12"
  }
  ```

---

## 📈 Investor Portal Endpoints

### 1. Dashboard Metrics
- **Endpoint**: `GET /api/v1/investors/dashboard`
- **Description**: Retrieves aggregate portfolio values, absolute returns, active SIPs, and recent transaction list.
- **Headers**: `Authorization: Bearer <token>`

### 2. Portfolio Summary
- **Endpoint**: `GET /api/v1/portfolio/summary`
- **Description**: Retrieves detailed portfolio summary list including sub-funds holdings.

### 3. SIP Schedules
- **Endpoint**: `GET /api/v1/sips`
- **Description**: List all active, paused, or failed SIP investments.

### 4. Transactions List
- **Endpoint**: `GET /api/v1/transactions`
- **Description**: Retrieves transaction logs, optionally filtered by `transaction_type` or `limit`.

### 5. Invest (Add Money)
- **Endpoint**: `POST /api/v1/transactions/invest`
- **Description**: Executes simulated money transfer, updates holding units, and triggers alerts.
- **Request Body**:
  ```json
  {
    "fund_id": 1,
    "amount": 25000.0,
    "bank_name": "HDFC Bank",
    "account_number": "XXXX-4567"
  }
  ```

---

## 💬 Conversations & AI Chat (`/conversations`)

### 1. List Sessions
- **Endpoint**: `GET /api/v1/conversations`
- **Description**: Fetch investor's past chat sessions.

### 2. Create Chat Session
- **Endpoint**: `POST /api/v1/conversations`
- **Description**: Initialize a new chat session with AURA assistant.

### 3. Get Session Details
- **Endpoint**: `GET /api/v1/conversations/{conversation_id}`
- **Description**: Fetches chat message threads, timestamps, and escalation state.

### 4. Send Message (Gemini Orchestrator)
- **Endpoint**: `POST /api/v1/conversations/{conversation_id}/messages`
- **Description**: Submits message to the LLM agent, executes async tool calls, and returns AI reply.
- **Request Body**:
  ```json
  { "content": "Why did my last HDFC SIP transaction fail?" }
  ```

---

## 🎫 Service Request Tickets (`/tickets`)

### 1. Get Support Queue (Advisor Only)
- **Endpoint**: `GET /api/v1/tickets/queue`
- **Description**: Fetches escalated tickets sorted by priority.

### 2. Fetch Ticket Details
- **Endpoint**: `GET /api/v1/tickets/{ticket_id}`
- **Description**: Retrieves ticket fields, linked chat conversation logs, and manual notes.

### 3. Resolve Ticket (Advisor Only)
- **Endpoint**: `PUT /api/v1/tickets/{ticket_id}`
- **Description**: Resolves a ticket by updating status, priority, and saving resolution notes.
- **Request Body**:
  ```json
  {
    "status": "resolved",
    "priority": "high",
    "resolution": "Coordinated with HDFC bank; user updated bank mandate limits. Mandate status reset to Active."
  }
  ```

### 4. Add Internal Note (Advisor Only)
- **Endpoint**: `POST /api/v1/tickets/{ticket_id}/notes`
- **Description**: Adds advisor manual notes to the ticket timeline.

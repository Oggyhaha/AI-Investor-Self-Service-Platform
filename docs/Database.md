# Database Design & Schema — AURA Platform

AURA utilizes an SQL database architecture mapped using **SQLAlchemy 2.0 ORM** registries. Below is the Entity Relationship (ER) design and descriptions for all schema models.

---

## 📊 Entity Relationship Diagram

```mermaid
erDiagram
    INVESTORS ||--o{ HOLDINGS : holds
    INVESTORS ||--o{ SIPS : establishes
    INVESTORS ||--o{ TRANSACTIONS : executes
    INVESTORS ||--o{ TICKETS : submits
    INVESTORS ||--o{ CONVERSATIONS : starts
    INVESTORS ||--o{ STATEMENTS : requests
    INVESTORS ||--o{ NOTIFICATIONS : receives
    INVESTORS ||--o| KYC : has
    INVESTORS ||--o{ NOMINEES : registers

    FUNDS ||--o{ HOLDINGS : contains
    FUNDS ||--o{ SIPS : targeted_by
    FUNDS ||--o{ TRANSACTIONS : targeted_by

    SIPS ||--o| MANDATES : requires
    
    TICKETS ||--o{ TICKET_NOTES : records
    TICKETS }o--|| ADVISORS : assigned_to
    TICKETS }o--|| CONVERSATIONS : logs

    CONVERSATIONS ||--o{ MESSAGES : contains

    INVESTORS {
        int id PK
        string investor_id UK
        string full_name
        string email UK
        string phone UK
        string pan UK
        date date_of_birth
        string risk_profile
        boolean is_active
        string hashed_password
    }

    FUNDS {
        int id PK
        string fund_name
        string category
        string sub_category
        float nav
    }

    HOLDINGS {
        int id PK
        int investor_id FK
        int fund_id FK
        float units
        float invested_amount
        float current_value
        float returns_pct
        date purchase_date
    }

    SIPS {
        int id PK
        string sip_id UK
        int investor_id FK
        int fund_id FK
        float amount
        string frequency
        int sip_date
        int total_installments
        int completed_installments
        string status
        date next_due_date
    }

    MANDATES {
        int id PK
        int sip_id FK
        string mandate_ref UK
        string bank_name
        string account_number
        string status
        string failure_reason
    }

    KYC {
        int id PK
        int investor_id FK
        string kyc_status
        string kyc_type
        boolean pan_verified
        boolean aadhaar_verified
        boolean address_verified
        boolean photo_verified
        string remarks
    }

    NOMINEES {
        int id PK
        int investor_id FK
        string nominee_name
        string relationship
        date date_of_birth
        float allocation_pct
        string guardian_name
    }

    TRANSACTIONS {
        int id PK
        int investor_id FK
        int fund_id FK
        float amount
        float units
        float nav
        string transaction_type
        string status
        date transaction_date
    }

    CONVERSATIONS {
        int id PK
        string conversation_id UK
        int investor_id FK
        string status
        string summary
        string primary_intent
    }

    MESSAGES {
        int id PK
        int conversation_id FK
        string role
        string content
        string intent
        timestamp created_at
    }

    TICKETS {
        int id PK
        string ticket_id UK
        int investor_id FK
        int advisor_id FK
        int conversation_id FK
        string category
        string subject
        string description
        string status
        string priority
        string ai_summary
        string resolution
    }

    TICKET_NOTES {
        int id PK
        int request_id FK
        string author_type
        int author_id FK
        string content
        timestamp created_at
    }

    ADVISORS {
        int id PK
        string advisor_id UK
        string full_name
        string email UK
        string role
        string department
        boolean is_available
    }
```

---

## 🗄️ Model Descriptions

### 1. `investors`
Stores primary profile details and login passwords for mutual fund clients.

### 2. `funds`
Catalog of supported mutual funds and their Net Asset Values (NAV).

### 3. `portfolio_holdings`
Represents client hold balances, purchase dates, unit details, and active yields.

### 4. `sips`
Defines recurring monthly plans withCycle Dates and installment details.

### 5. `mandates`
Maintains bank link authorization profiles and standard transaction rejection logs.

### 6. `kyc`
Tracks Pan/Aadhaar/Address linkages and audit markers.

### 7. `nominees`
Maintains family allocations and minor guardian mappings.

### 8. `conversations` & `conversation_messages`
Logs self-service session chat messages.

### 9. `service_requests` & `service_request_notes`
Handles escalations, internal advisor annotations, and tickets timeline.

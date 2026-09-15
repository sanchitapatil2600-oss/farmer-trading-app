# Farmer Trading App — Security Architecture & Guidelines

## 1. Overview & Security Principles

This document establishes the security architecture and mandatory rules for the Farmer Trading App MVP. It consolidates the security policies defined across `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, and `VIBE_CODING_RULES.md`.

Core Security Principles:
- **Server-Side Enforcement**: The backend server is the sole trust boundary. Frontend checks exist solely for user experience and are never treated as security barriers.
- **Least Privilege**: Users and roles possess access only to operations and data strictly necessary for their marketplace functions.
- **Zero Raw Payment Credentials**: Sensitive financial credentials remain entirely with the external payment gateway.
- **Strict Privacy**: Private personal details, specifically exact home/farm addresses, are never exposed publicly.
- **Traceability Without Exposure**: System actions are recorded in an append-only audit log, with strict sanitization of all sensitive parameters.

---

## 2. Authentication & Session Security

- **Authentication Mechanism**: All protected endpoints require a verified user session or cryptographically signed token.
- **Password Storage**: Passwords must never be stored in plain text. Passwords must be hashed using industry-standard salted hashing algorithms (e.g., Argon2 or bcrypt with appropriate work factors).
- **Session Lifecycle**:
  - Secure session termination via `POST /api/auth/logout`.
  - Sessions/tokens must be invalidated upon critical credential changes.
- **Suspended Users**: The authentication middleware must verify user status (`ACTIVE`, `SUSPENDED`, `DELETED`). Suspended accounts must be rejected from performing any marketplace or trading actions.

---

## 3. Role-Based Access Control (RBAC) & Ownership

The system strictly enforces three distinct roles:
1. **`FARMER`**: Can manage their own profile, create/update/deactivate their own listings, view offers on their listings, accept/reject offers, view their own deals, and manage delivery pickup details.
2. **`BUYER`**: Can manage their own profile, browse/search listings, create/withdraw their own offers, view their own deals, and initiate payments.
3. **`ADMIN`**: Operational oversight, audit log review, and dispute/escalation monitoring.

### Ownership & Authorization Rules:
- **Listing Ownership**: A farmer can modify or delete only produce listings where `produce_listings.farmer_id === req.user.id`.
- **Offer Ownership**: A buyer can view or withdraw only their own active offers (`offers.buyer_id === req.user.id`).
- **Private Offer Information**: Only the listing's owner (farmer) and the submitting buyer can view specific offer details.
- **Deal Privacy**: Access to deal details (`GET /api/deals/:id`) is strictly restricted to the participating farmer, buyer, and administrators.
- **Administrative Access**: Admin endpoints (such as `GET /api/audit-logs`) must return `403 Forbidden` for non-admin roles.

---

## 4. Secrets & Credentials Management

- **Zero Secret Commits**: Secrets, API keys, database credentials, and private keys must never be committed to Git.
- **Environment Isolation**: All configuration secrets must reside in server-side environment variables (`.env` in local development; secure environment stores in production).
- **Frontend Hygiene**: Never include server-side API keys, payment provider secrets, or database URLs in frontend code or client bundles.
- **Secret Rotation**: In the event of an accidental secret exposure, keys must be revoked and rotated immediately.

---

## 5. User Privacy & Location Masking

- **Address Protection**: Exact private addresses, street names, door numbers, or GPS coordinates of farmers or buyers must **never** be stored for public display or returned by marketplace discovery endpoints.
- **General Location Only**: Public produce listings and profiles show only general geographic identifiers:
  - Village / Locality
  - District
  - State
- Exact delivery fulfillment addresses are disclosed only to confirmed deal participants and authorized delivery handlers.

---

## 6. Payment Gateway Security

- **External Gateway Processing**: All online payments are handled via a certified external payment gateway.
- **No Card/UPI Storage**: The application database must **never** collect, transmit, or store:
  - Credit or debit card numbers (PANs)
  - Card CVVs / CVCs
  - UPI PINs or banking credentials
- **Server Verification**:
  - Payment orders must be generated server-side linked to confirmed deals.
  - Deals are **never** marked as `PAID` based on client-side callbacks or redirect parameters.
  - Payment success is established solely via server-to-server gateway verification and verified webhooks.
- **Webhook Protection**:
  - Webhook endpoints (`POST /api/payments/webhook`) must verify provider cryptographic signatures using the configured webhook secret.
  - Webhook handlers must be idempotent to prevent duplicate deal state updates or double processing.

---

## 7. Data Validation, SQL Injection & Integrity

- **Input Validation**: All incoming requests (payloads, URL parameters, query strings) must be validated server-side against strict schema constraints (types, lengths, positive amounts, valid status transitions).
- **SQL Injection Prevention**: All database interactions must use parameterized queries or trusted ORM/query-builder mechanisms. Raw concatenated SQL queries are forbidden.
- **Database Transactions (ACID)**: Critical multi-entity operations—such as accepting an offer, deducting listing quantity, expiring competing offers, and creating a deal—must be executed within a database transaction with complete rollback on any error.
- **Concurrency & Double-Commit Controls**: Enforce database constraints and atomic row updates to ensure listing quantities cannot be oversold.

---

## 8. Rate Limiting & Anti-Abuse Controls

Rate limiting and abuse controls must be enforced on sensitive endpoints:
- `POST /api/auth/login` (brute-force defense)
- `POST /api/auth/register` (registration spam defense)
- `POST /api/listings/:id/offers` (bidding abuse and offer spam prevention)
- `POST /api/price-recommendations` (AI service abuse and resource exhaustion defense)
- `POST /api/payments/create` (order generation throttling)

---

## 9. File Upload & Storage Security

- **Produce & Profile Images**:
  - Image files uploaded to object storage must be strictly validated for MIME type (e.g., `image/jpeg`, `image/png`, `image/webp`).
  - Maximum upload size limits must be enforced on the backend.
  - Disallow executable file extensions, scripts, or unverified binary payloads.
  - Direct public uploads without server authorization are prohibited.

---

## 10. Audit Logging & Non-Exposure of Sensitive Data

- **Append-Only Audit Logs**: Critical actions (listing lifecycle, offer submission/acceptance/expiration, deal creation, payment status transitions, delivery milestones) must write an immutable record to `audit_logs`.
- **Log Scrubbing**: Log metadata must never store:
  - Passwords or password hashes
  - Authentication tokens or session IDs
  - Payment gateway API secrets or webhook keys
  - Bank account or personal payment details
- **Restricted Access**: Audit logs can be queried only by administrators via `GET /api/audit-logs`. Internal database errors and stack traces must be caught and masked from end-user API responses.

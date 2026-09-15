FARMER TRADING APP

System Architecture Document

MVP Version 1.0 | Aligned with the Product Requirements Document

1. Architecture Overview

The Farmer Trading App follows a modular full-stack architecture. The frontend provides the user interface, the backend acts as the trusted application and business-logic layer, PostgreSQL stores transactional data, object storage stores produce images, and external services provide AI price recommendations and online payments. Basic delivery tracking is handled by the application in the MVP.

The architecture is intentionally modular so that optional services can fail without creating false marketplace states.

2. Architecture Goals

Keep the marketplace simple and reliable for the MVP.

Keep sensitive business logic on the server.

Separate core marketplace functionality from optional external integrations.

Maintain clear data ownership and role-based authorization.

Prevent fake success states for payments, deals, delivery, and AI recommendations.

Make the codebase easy to maintain with GitHub and AI-assisted development.

Allow future expansion without rewriting the core marketplace.

3. Recommended Technology Stack

Layer

Technology

Purpose

Frontend

React + TypeScript

Responsive marketplace UI

Backend

Node.js API server

Business logic, authorization, integrations

Database

PostgreSQL

Users, listings, offers, deals, payments, delivery

Authentication

Secure managed/auth solution

Login, sessions, roles

Storage

Object storage

Produce listing images

AI

External AI + verified market data service

Advisory price recommendation

Payments

External payment gateway

Online payment processing

Logistics

Application delivery module

Basic delivery status in MVP

Version Control

GitHub

Source control and project documentation

Deployment

Suitable cloud hosting

Production hosting

4. High-Level System Architecture

The following logical architecture describes how the major components interact:

                         ┌──────────────────────────────┐

                         │          USERS               │

                         │ Farmer / Buyer / Admin       │

                         └──────────────┬───────────────┘

                                        │ HTTPS

                                        ▼

                         ┌──────────────────────────────┐

                         │       REACT FRONTEND         │

                         │ UI • Forms • Search • Dash   │

                         └──────────────┬───────────────┘

                                        │ REST/HTTPS API

                                        ▼

                    ┌─────────────────────────────────────────┐

                    │              NODE.JS BACKEND             │

                    │ Auth • Listings • Offers • Deals         │

                    │ Payments • Delivery • AI • Audit        │

                    └───────┬───────────┬───────────┬─────────┘

                            │           │           │

                            ▼           ▼           ▼

                    ┌────────────┐ ┌──────────┐ ┌───────────────┐

                    │ PostgreSQL │ │  Object  │ │   External    │

                    │  Database  │ │ Storage  │ │ Integrations │

                    └────────────┘ └──────────┘ └──────┬────────┘

                                                        │

                                      ┌─────────────────┼─────────────┐

                                      ▼                 ▼             ▼

                                 AI/Market          Payment       Logistics

                                  Service           Gateway       (future API)

5. Frontend Architecture

5.1 Responsibilities

Display farmer and buyer dashboards.

Provide listing creation and management screens.

Provide marketplace search/filter screens.

Display offers and bidding information.

Display deal, payment, and delivery status.

Request AI price recommendations.

Display clear loading, error, unavailable, and success states.

5.2 Frontend Rules

Frontend must not contain private API keys or payment secrets.

Frontend validation improves user experience but is not a security boundary.

The UI must use server responses as the authority for permissions and transaction states.

The UI must never display a payment as successful solely because a button was clicked.

AI recommendations must be visibly labeled as advisory.

6. Backend Architecture

6.1 Responsibilities

Authenticate users and enforce roles.

Validate and authorize all important operations.

Manage listings, offers, deals, payments, and delivery states.

Connect securely to AI, market-data, payment, and storage services.

Maintain audit logs.

Apply business rules and prevent invalid state transitions.

Return structured errors instead of silently failing.

6.2 Suggested Backend Modules

auth

users/profiles

listings

marketplace/search

offers/bidding

deals

payments

deliveries

price-recommendation

notifications

audit

7. Database Architecture

PostgreSQL is the recommended primary database because the application contains strongly related transactional entities and requires consistency for offers, deals, payments, and delivery state.

users — authentication identity and role

farmer_profiles — farmer profile

buyer_profiles — buyer profile

produce_listings — produce offered for sale

offers — direct offers and bids

deals — accepted transactions

payments — payment records and gateway states

deliveries — delivery records and status

price_recommendations — AI recommendation records and source metadata

notifications — user notifications

audit_logs — traceability

Critical state changes such as accepting an offer and creating a deal should use database transactions and appropriate constraints to avoid conflicting states.

8. Authentication and Authorization Architecture

Every protected API request must be associated with an authenticated user/session.

Roles include at minimum Farmer and Buyer; an Admin role may be added for operational oversight.

Authorization must be checked on the server for every protected resource.

A farmer can modify only their own listings.

A buyer can manage only their own offers.

Users cannot directly alter another user's deals, payment records, or delivery records.

Administrative capabilities must be explicitly restricted.

9. Produce Listing Flow

Farmer submits listing data through the frontend.

Backend authenticates the farmer and validates the data.

Optional image is uploaded to approved object storage.

Backend creates the listing in PostgreSQL.

Listing becomes visible according to its status and business rules.

Buyers can search and view the listing.

10. Offer and Bidding Architecture

Offers and bids are stored as server-side records. The backend determines whether an offer is valid, active, withdrawable, accepted, rejected, or expired.

Validate listing status before accepting an offer/bid.

Validate price and quantity values on the server. Buyers may submit offers for partial listing quantity (0 < offer.quantity <= listing.quantity).

Prevent unauthorized offer manipulation.

Record timestamps and user IDs for traceability.

Use a controlled state machine for offer status.

When a farmer accepts an offer, execute an atomic database transaction:
1. Verify farmer ownership and that listing and offer are both ACTIVE.
2. Verify offer.quantity <= remaining listing.quantity.
3. Deduct accepted quantity from remaining listing.quantity.
4. If remaining quantity reaches 0, update listing status to SOLD_OUT; if remaining quantity > 0, listing remains ACTIVE.
5. Invalidate competing active offers whose requested quantity exceeds remaining listing quantity by transitioning them to EXPIRED with the reason "Insufficient remaining quantity". These offers never create deals.
6. Create the deal record with initial status CONFIRMED.

Prevent multiple conflicting accepted deals for the same listing/quantity.

11. Deal Architecture

A deal is the trusted record of an accepted transaction.

References the listing, farmer, and buyer.

Stores the confirmed quantity and agreed price.

The deal is created directly with status CONFIRMED immediately after the farmer accepts a valid offer.

Has an exact controlled lifecycle:
CONFIRMED → PAYMENT_PENDING → PAID → DELIVERY → COMPLETED, with CANCELLED state where permitted.

Once confirmed, important commercial values should be protected from unauthorized changes.

Deal creation, inventory deduction, and related offer updates must be transactionally consistent.

12. AI Price Recommendation Architecture

The AI service is an optional advisory component and must not become the source of truth for the marketplace.

User requests a price recommendation.

Backend validates the request and gathers allowed input data.

Backend sends the request to the approved AI/market-data service.

The service returns a recommendation only when sufficient data is available.

Backend stores the recommendation and relevant source/data metadata where appropriate.

Frontend displays the recommendation as advisory.

If reliable data is unavailable, the system returns an explicit unavailable/insufficient-data response.

The AI layer must never fabricate a market price, official rate, certification, or guarantee.

13. Payment Architecture

The payment gateway is an external financial service. Sensitive payment credentials must remain with the payment provider.

Buyer reaches the payment step for a confirmed deal.

Backend creates a payment request/order with the external gateway.

Frontend opens or redirects to the gateway's supported payment interface.

Gateway processes the payment.

Gateway returns payment result information and/or sends a webhook.

Backend verifies the payment using the gateway's trusted server-side mechanism.

Only after successful verification does the backend mark the payment as successful.

Payment status is linked to the corresponding deal.

Never trust a frontend-only success response.

Never store raw card numbers or UPI credentials.

Verify webhook authenticity according to the gateway documentation.

Handle pending, failed, cancelled, and successful states explicitly.

14. Delivery and Logistics Architecture

The MVP uses an internal delivery-status module instead of implementing a complete logistics/fleet platform.

A delivery record is automatically initialized with status PENDING when the corresponding deal transitions to PAID following server-verified payment.

Use controlled statuses: PENDING, PICKUP_SCHEDULED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED.

Record timestamps and the actor responsible for status changes. Scheduling pickup details and status updates are managed through authorized API endpoints.

Manual status updates are acceptable for MVP.

External logistics-provider APIs can be integrated later via adapter boundaries without changing the core deal model.

15. Notification Architecture

Notifications are triggered by actual application events.

Examples: offer received, offer accepted/rejected, payment status changed, pickup scheduled, delivery status changed.

Notifications should be stored with recipient, event type, message, and timestamp.

Failure to send a notification must not roll back an otherwise valid core transaction unless explicitly required.

16. Audit and Observability

Audit important actions such as listing changes, offer actions, deal confirmation, payment status changes, and delivery status changes.

Include actor, action, target entity, timestamp, and relevant metadata where appropriate.

Application errors should be logged without exposing secrets.

Sensitive values should not be written into logs.

Audit logs should be append-oriented and protected from normal user modification.

17. Error and Failure Handling

External services must be treated as unreliable dependencies.

Failure

Required Behavior

Must Not Happen

AI unavailable

Show unavailable/error state; marketplace continues

Invent a price

Payment pending

Keep deal/payment pending until verified

Mark as paid

Payment failure

Record failed status and allow defined retry/cancel flow

Create false success

Logistics API unavailable

Use manual delivery status if supported

Claim delivery occurred

Database error

Return safe error and preserve consistency

Partially commit critical transaction

Image upload failure

Allow retry or publish without image if permitted

Store broken/invalid URL

18. Security Architecture

Use HTTPS in production.

Store secrets only in environment/server-side secret storage.

Never commit .env files or secrets to GitHub.

Use server-side authorization and ownership checks.

Validate all user-controlled input on the server.

Rate-limit login, offer, and other abuse-sensitive endpoints.

Validate image type, size, and storage permissions.

Use parameterized queries/ORM protections against SQL injection.

Protect payment webhooks.

Use database transactions for critical marketplace state changes.

Avoid logging credentials, tokens, payment credentials, or other secrets.

19. GitHub Project Architecture

GitHub is the source of truth for application code and project documentation.

farmer-trading-app/

├── README.md

├── .gitignore

├── .env.example

├── docs/

│   ├── PRD.md

│   ├── ARCHITECTURE.md

│   ├── DATABASE.md

│   ├── API.md

│   ├── SECURITY.md

│   └── VIBE_CODING_RULES.md

├── frontend/

├── backend/

├── database/

├── ai/

├── integrations/

│   ├── payments/

│   └── logistics/

├── tests/

└── assets/

20. Environment, Secrets, and Integration Adapters

Development and production secrets must be separated from source code.

Use .env locally for development secrets.

Commit only .env.example with placeholder variable names.

Use the deployment platform's secret/environment-variable mechanism in production.

Never paste payment secrets or private API keys into frontend source files.

Rotate compromised secrets immediately.

20.1 Integration Adapter Pattern

All external integrations (payment gateways, AI/market-data services, object storage, and future logistics providers) must sit behind strict interface adapter boundaries:

• Abstract Service Interfaces: Core application logic interacts only with unified interfaces (e.g., PaymentService, AIService, StorageService, LogisticsService).
• Isolation: Provider-specific SDKs, API requests, response mappings, and raw payloads remain isolated within their respective integration modules (integrations/payments/, integrations/storage/, integrations/logistics/, and ai/).
• Provider Independence: Switching or updating an external provider (such as choosing a specific payment gateway or S3-compatible storage vendor) requires no changes to core business models, controllers, or database schemas.
• Failure Containment: Adapters safely catch timeouts and provider errors, returning standardized internal failure states so external disruptions never crash the application or forge false success states.

21. API Design Principles

Use authenticated, role-aware endpoints.

Validate request body, query parameters, and path parameters.

Return consistent HTTP status codes and structured error responses.

Do not expose unnecessary internal database fields.

Use pagination for marketplace lists.

Apply server-side filtering and sorting.

Document important endpoints in API.md.

Keep integration-specific code isolated from core business logic.

22. Deployment Architecture

A production deployment should separate the frontend, backend/API, database, storage, and external integrations according to the capabilities of the selected hosting providers.

Frontend deployed over HTTPS.

Backend deployed as a secure server-side service.

PostgreSQL hosted using a managed database where practical.

Object storage used for images.

Production secrets configured through secure environment variables.

Monitoring and error logging enabled.

Database backups enabled where supported.

External payment webhook endpoint deployed securely.

23. Development Workflow

Update or review the PRD.

Confirm architecture impact before adding major features.

Create a Git branch for the feature.

Implement the feature in small steps.

Run relevant tests and manually verify important flows.

Review security and authorization behavior.

Update documentation when architecture changes.

Commit with a clear message.

Push to GitHub.

Merge to main only after review/testing.

24. Recommended Build Sequence

Repository and project setup

Frontend/backend scaffolding

Authentication and roles

PostgreSQL schema and migrations

Farmer/buyer profiles

Produce listings

Marketplace search and filters

Offers/bidding

Deal confirmation

Audit logs and notifications

Payment gateway integration

Basic delivery workflow

AI price recommendation

End-to-end testing

Security testing

Deployment

25. Architecture Boundaries — Explicitly Out of MVP

No AI crop-quality detection/certification.

No AI disease diagnosis/treatment.

No automatic crop grading.

No automatic government-scheme recommendation engine.

No wallet, lending, loans, or credit scoring.

No live GPS vehicle tracking.

No advanced route optimization.

No fleet management.

No automatic transporter allocation.

No complex dispute-resolution system.

No public exact-address display.

No AI chatbot that makes binding commercial commitments.

No unverified claims of official quality, certification, or guaranteed prices.

26. Architecture Principles for AI-Assisted Development

Treat the PRD and this architecture document as the project's source of truth.

Do not invent APIs, credentials, database relationships, or external service behavior.

Do not create fake core functionality merely for UI completeness.

Do not change the database schema casually; review relationships and migrations first.

Never expose secrets.

Never trust frontend-only validation.

Never mark financial transactions successful without server verification.

Never fabricate AI price data.

Do not add features outside the approved MVP without explicit approval.

Run tests after significant changes and verify critical user flows manually.

27. Architecture Decision Summary

Decision

Choice

Reason

Frontend

React + TypeScript

Modern, maintainable component-based UI

Backend

Node.js API

Clear server-side business logic and integrations

Database

PostgreSQL

Strong relational consistency for marketplace transactions

Images

Object storage

Separate media from transactional database

AI

External service

Keeps AI optional and replaceable

Payments

External gateway

Avoid handling sensitive payment credentials

Logistics

Internal status module

Keeps MVP manageable

Source control

GitHub

Versioning, collaboration, documentation

Development

AI-assisted, staged

Faster development while preserving verification

28. Final Architecture Principle

Core marketplace actions must be real, verifiable, and recoverable.

The system should prefer a smaller reliable feature set over a larger collection of simulated or unverified features. Optional AI and external services must never compromise the correctness of listings, offers, deals, payments, or delivery records.


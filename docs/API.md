# API Design

## 1. Overview

This document defines the API structure for the Farmer Trading Marketplace.

The API connects the frontend with the backend and database.

All important business logic must be handled on the server.

---

## 2. API Principles

- Use REST-style APIs.
- Validate all inputs on the server.
- Require authentication for protected operations.
- Enforce role-based authorization.
- Never trust frontend-provided payment or deal status.
- Return consistent success and error responses.
- Do not expose secrets or sensitive information.
- Use database transactions for critical operations.
- Keep external integrations isolated.

---

## 3. Base API

Development:

```text
/api
Production:

/api

The actual production domain will be configured during deployment.

4. Authentication
POST /api/auth/register

Create a new user account.

Request includes:

name
email or phone
password
role

Allowed roles:

farmer
buyer

Server must validate all fields.

POST /api/auth/login

Authenticate an existing user.

The server returns an authenticated session/token according to the selected authentication system.

POST /api/auth/logout

End the current authenticated session.

GET /api/auth/me

Return the currently authenticated user's basic account information.

5. Farmer Profile
GET /api/farmers/me

Return the authenticated farmer's profile.

PUT /api/farmers/me

Create or update the authenticated farmer's profile.

Possible fields:

name
phone
general location
district
state
optional profile information

Do not expose a farmer's exact private address publicly.

6. Buyer Profile
GET /api/buyers/me

Return the authenticated buyer's profile.

PUT /api/buyers/me

Create or update the authenticated buyer's profile.

Possible fields:

name
phone
organization/business name
buyer type
general location
7. Produce Listings
POST /api/listings

Create a new produce listing.

Farmer only.

Possible fields:

crop/product name
quantity
unit
starting price
expected price
availability date
village/general location
district
optional image

Server must validate quantity, price, dates, ownership, and required fields.

GET /api/listings

Return marketplace listings.

Supported filters may include:

crop/product
district
price range
availability
listing status (DRAFT, ACTIVE, SOLD_OUT, CLOSED, CANCELLED)

Support pagination.

GET /api/listings/:id

Return details of a specific listing.

PUT /api/listings/:id

Update a listing.

Only the owner of the listing can update it.

Listings with a completed deal should not be modified in ways that affect the completed transaction.

DELETE /api/listings/:id

Remove or deactivate a farmer's own listing.

Use soft deletion/deactivation where appropriate.

8. Offers / Bidding
POST /api/listings/:id/offers

Submit an offer for a listing.

Buyer only.

Request includes:

offered price
quantity
optional message

The server must validate:

buyer authentication
listing availability
quantity
price
offer status
buyer permissions
GET /api/listings/:id/offers

Return offers for a listing.

Only the relevant farmer and authorized users may access private offer information.

GET /api/offers/my

Return offers created by the authenticated buyer.

PATCH /api/offers/:id

Update an eligible offer.

A buyer can withdraw their own active offer where permitted.

POST /api/offers/:id/accept

Accept an offer.

Farmer only.

The server must:

1. Verify listing ownership and that listing and offer are both ACTIVE.
2. Verify offer quantity <= remaining listing quantity.
3. Atomically deduct accepted quantity from listing available quantity.
4. If remaining quantity == 0, update listing status to SOLD_OUT; if remaining quantity > 0, listing remains ACTIVE.
5. Invalidate competing active offers whose requested quantity exceeds remaining listing quantity by transitioning them to EXPIRED with reason "Insufficient remaining quantity". Expired offers never generate deals.
6. Accept the selected offer and create the deal record with initial status CONFIRMED in a database transaction.
7. Record the action in the audit log.

POST /api/offers/:id/reject

Reject an offer.

Farmer only.

9. Deals
GET /api/deals

Return deals accessible to the authenticated user.

GET /api/deals/:id

Return details of a specific deal.

Only authorized users involved in the deal may access private details.

GET /api/deals/:id/status

Return the current deal status.

Exact statuses:

CONFIRMED
PAYMENT_PENDING
PAID
DELIVERY
COMPLETED
CANCELLED

The exact state transitions must be controlled by the backend.

10. Payments
POST /api/payments/create

Create a payment request for an eligible deal.

The backend communicates with the selected payment provider.

The frontend must never provide proof of payment by itself.

POST /api/payments/webhook

Receive payment-provider webhook events.

The backend must:

Verify the webhook signature.
Validate the event.
Prevent duplicate processing.
Update payment status safely.
Record relevant audit information.
GET /api/payments/:id/status

Return the payment status for an authorized user.

Possible statuses:

created
pending
paid
failed
refunded
cancelled

Payment status must come from verified provider information.

11. Delivery / Logistics

The MVP uses an internal delivery-status module.

A delivery record is automatically created with status PENDING when the corresponding deal transitions to PAID following server-verified payment.

POST /api/deals/:id/delivery

Schedule delivery/pickup details for a paid deal (e.g., pickup_date, notes), transitioning delivery status to PICKUP_SCHEDULED.

GET /api/deals/:id/delivery

Return delivery status.

Statuses:

PENDING
PICKUP_SCHEDULED
PICKED_UP
IN_TRANSIT
DELIVERED
CANCELLED

PATCH /api/deliveries/:id/status

Update delivery status.

Only authorized users or administrators may perform permitted status updates.

The MVP does not require:

live GPS tracking
fleet management
advanced route optimization
automatic transporter allocation

12. AI Price Recommendation
POST /api/price-recommendations

Generate an advisory price recommendation for a produce listing.

Input may include:

crop/product
quantity
unit
general location
relevant verified market-data information

The AI recommendation must be clearly labeled as an estimate/advisory value.

The system must not invent market data.

GET /api/price-recommendations/:id

Return a previously generated recommendation.

Store:

input information
recommendation
data source information
timestamp
model/service information where appropriate

13. Notifications
GET /api/notifications

Return notifications for the authenticated user.

PATCH /api/notifications/:id/read

Mark a notification as read.

Users can update only their own notifications.

14. Audit Logs

Important actions must be recorded in an append-only audit trail.

Examples:
- listing created/updated
- offer submitted/withdrawn
- offer accepted/rejected/expired
- deal created
- payment status changed
- delivery status changed
- suspicious activity detected

GET /api/audit-logs

Retrieve paginated audit logs.

Admin only (returns 403 Forbidden for non-admin users).

Query parameters:
- page (integer, default 1)
- limit (integer, default 20, max 100)
- entity_type (optional filter: produce_listing, offer, deal, payment, delivery, user)
- actor_user_id (optional UUID filter)

Audit logs must never expose passwords, tokens, or payment secrets.

15. Standard Success Response

Example:

{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
16. Standard Error Response

Example:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data"
  }
}

Do not expose internal database errors, secrets, stack traces, or sensitive system information to users.

17. Authorization Rules
Operation	Farmer	Buyer	Admin
Create listing	Yes	No	Yes
Edit own listing	Yes	No	Yes
Browse listings	Yes	Yes	Yes
Submit offer	No	Yes	Yes
Accept offer	Yes	No	Yes
View own deals	Yes	Yes	Yes
Create payment	According to deal	According to deal	Yes
Update delivery	Limited	Limited	Yes
View audit logs	No	No	Yes

Authorization must always be enforced on the backend.

18. Pagination

List endpoints should support pagination.

Example:

?page=1&limit=20

The backend should enforce a maximum page size.

19. Validation

Validate:

required fields
data types
price values
quantities
dates
IDs
status transitions
ownership
user permissions

Never rely only on frontend validation.

20. Rate Limiting

Rate limiting should be applied to sensitive endpoints such as:

login
registration
offer submission
price recommendation
payment creation

This helps reduce abuse and accidental excessive requests.

21. Idempotency

Critical operations should prevent duplicate processing.

This is especially important for:

payment creation
payment webhooks
deal creation
offer acceptance

Repeated requests must not accidentally create duplicate payments or deals.

22. External Service Failures

If an external service fails:

AI unavailable

Listings and trading functionality should continue working.

Payment pending

The deal should remain safely in a pending state.

Payment provider unavailable

Do not mark the payment as successful.

Market data unavailable

Do not generate fabricated market prices.

Logistics service unavailable

Basic manual delivery status may continue where appropriate.

23. API Security Rules
Use HTTPS in production.
Keep secrets in environment variables.
Never expose API keys to the frontend.
Validate authentication tokens/sessions.
Enforce authorization server-side.
Validate uploaded files.
Sanitize appropriate user-generated content.
Use secure database access.
Log important security events.
Never return passwords or payment credentials.
24. MVP API Boundary

The API must NOT implement the following without explicit approval:

AI crop-quality detection
AI disease diagnosis
automatic crop grading
government-scheme recommendations
wallet/lending systems
credit scoring
live GPS tracking
advanced route optimization
fleet management
automatic transporter allocation
complex dispute resolution
public exact addresses
binding AI negotiation
25. API Development Principle

The API should expose only functionality that actually exists in the backend.

Never create an endpoint that returns fake or hard-coded success merely to make the frontend appear complete.

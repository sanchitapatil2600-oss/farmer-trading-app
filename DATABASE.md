# Farmer Trading App — Database Design

## 1. Database Overview

The Farmer Trading App uses PostgreSQL as the primary relational database.

The database stores users, profiles, agricultural produce listings, offers/bids, confirmed deals, payments, deliveries, AI price recommendations, notifications, and audit records.

The database must maintain data consistency, ownership, authorization, and transaction integrity.

---

## 2. Database Design Principles

The database should follow these principles:

- Use relational tables for core application data.
- Use primary keys for every major entity.
- Use foreign keys to maintain relationships.
- Use appropriate indexes for frequently searched fields.
- Use timestamps for important records and state changes.
- Use database constraints where appropriate.
- Do not store sensitive payment credentials.
- Do not store API keys or application secrets.
- Critical financial and deal operations should use database transactions.
- Users must only access records they are authorized to access.

---

# 3. Core Entities

The MVP contains the following main entities:

1. users
2. farmer_profiles
3. buyer_profiles
4. produce_listings
5. offers
6. deals
7. payments
8. deliveries
9. price_recommendations
10. notifications
11. audit_logs

---

# 4. Entity Relationship Overview

```text
                         ┌───────────────┐
                         │     users     │
                         └───────┬───────┘
                                 │
                  ┌──────────────┴──────────────┐
                  │                             │
                  ▼                             ▼
        ┌──────────────────┐          ┌──────────────────┐
        │ farmer_profiles   │          │  buyer_profiles  │
        └────────┬─────────┘          └─────────┬────────┘
                 │                              │
                 ▼                              │
        ┌──────────────────┐                    │
        │produce_listings  │◄───────────────────┘
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │     offers       │
        └────────┬─────────┘
                 │
                 ▼
        ┌──────────────────┐
        │      deals       │
        └──────┬─────┬─────┘
               │     │
          ┌────▼─┐ ┌─▼──────────┐
          │payment│ │ deliveries │
          └───────┘ └────────────┘

Other supporting entities:

users ─────────────► notifications
users ─────────────► audit_logs
produce_listings ──► price_recommendations
5. users

The users table stores the basic identity and role of every registered user.

Main fields
Field	Type	Description
id	UUID	Primary key
email	VARCHAR	User email
phone	VARCHAR	User phone number if required
password_hash	TEXT	Secure password hash if using password authentication
role	ENUM	FARMER / BUYER / ADMIN
status	ENUM	ACTIVE / SUSPENDED / DELETED
created_at	TIMESTAMP	Account creation time
updated_at	TIMESTAMP	Last update time
Rules
Email/phone uniqueness should be enforced where applicable.
Passwords must never be stored as plain text.
Authentication secrets must not be stored in source code.
Role must be validated server-side.
Suspended users must not perform normal marketplace actions.
6. farmer_profiles

Stores farmer-specific information.

Main fields
Field	Type	Description
id	UUID	Primary key
user_id	UUID	Foreign key to users
name	VARCHAR	Farmer name
village	VARCHAR	Village/locality
district	VARCHAR	District
state	VARCHAR	State
profile_image_url	TEXT	Optional profile image
created_at	TIMESTAMP	Creation time
updated_at	TIMESTAMP	Last update time
Relationship
users (1) ───────── (1) farmer_profiles

A farmer profile belongs to one user.

7. buyer_profiles

Stores buyer-specific information.

Main fields
Field	Type	Description
id	UUID	Primary key
user_id	UUID	Foreign key to users
name	VARCHAR	Buyer name/business name
buyer_type	VARCHAR	Consumer / Retailer / Wholesaler / etc.
city	VARCHAR	City
district	VARCHAR	District
state	VARCHAR	State
created_at	TIMESTAMP	Creation time
updated_at	TIMESTAMP	Last update time
Relationship
users (1) ───────── (1) buyer_profiles
8. produce_listings

Stores agricultural produce listed by farmers.

Main fields
Field	Type	Description
id	UUID	Primary key
farmer_id	UUID	Foreign key to users
product_name	VARCHAR	Crop/product name
description	TEXT	Optional description
quantity	DECIMAL	Available quantity
unit	VARCHAR	kg / quintal / tonne / etc.
starting_price	DECIMAL	Starting or expected price
currency	VARCHAR	Currency code
availability_date	DATE	Produce availability date
village	VARCHAR	General location
district	VARCHAR	District
state	VARCHAR	State
image_url	TEXT	Optional produce image
status	ENUM	DRAFT / ACTIVE / SOLD / CLOSED / CANCELLED
created_at	TIMESTAMP	Creation time
updated_at	TIMESTAMP	Last update time
Rules
farmer_id must reference a valid farmer user.
Quantity must be greater than zero.
Price must not be negative.
Only the owner can modify the listing.
Exact private addresses must not be stored for public display.
An inactive/closed listing must not accept new offers.
Relationship
farmer_profiles (1) ──────── (many) produce_listings
9. offers

Stores direct offers and auction/bidding activity.

Main fields
Field	Type	Description
id	UUID	Primary key
listing_id	UUID	Foreign key to produce_listings
buyer_id	UUID	Foreign key to users
offer_type	ENUM	DIRECT / BID
offered_price	DECIMAL	Price offered
quantity	DECIMAL	Quantity requested
status	ENUM	ACTIVE / WITHDRAWN / ACCEPTED / REJECTED / EXPIRED
created_at	TIMESTAMP	Offer creation time
updated_at	TIMESTAMP	Last update time
Rules
Buyer must be authenticated.
Buyer must have BUYER role.
Listing must be active.
Price must be greater than zero.
Quantity must be valid.
Buyer can manage only their own offers.
Farmer can accept/reject offers for their own listing.
An accepted offer must not create conflicting deals.
Offer status transitions must be controlled by the backend.
Relationship
produce_listings (1) ──────── (many) offers
users/buyers     (1) ──────── (many) offers
10. deals

Stores confirmed transactions.

A deal is created when a farmer accepts an offer/bid.

Main fields
Field	Type	Description
id	UUID	Primary key
listing_id	UUID	Foreign key to produce_listings
farmer_id	UUID	Foreign key to users
buyer_id	UUID	Foreign key to users
accepted_offer_id	UUID	Foreign key to offers
quantity	DECIMAL	Confirmed quantity
agreed_price	DECIMAL	Final agreed price
currency	VARCHAR	Currency code
status	ENUM	CONFIRMED / PAYMENT_PENDING / PAID / DELIVERY / COMPLETED / CANCELLED
created_at	TIMESTAMP	Deal creation time
updated_at	TIMESTAMP	Last update time
Rules
Deal must reference a valid accepted offer.
Farmer and buyer must match the listing/offer.
Agreed price must come from the accepted offer.
Critical deal creation should use a database transaction.
Important commercial values should not be changed without an authorized business flow.
Conflicting deals for the same listing/quantity must be prevented.
Relationship
offers (1) ───────── (0 or 1) deals

produce_listings (1) ──────── (many) deals
users/farmer     (1) ──────── (many) deals
users/buyer      (1) ──────── (many) deals
11. payments

Stores payment transaction records.

The application must NOT store raw card details, UPI credentials, PINs, or other sensitive payment credentials.

Main fields
Field	Type	Description
id	UUID	Primary key
deal_id	UUID	Foreign key to deals
gateway	VARCHAR	Payment provider
gateway_order_id	VARCHAR	Provider order/reference
gateway_payment_id	VARCHAR	Provider payment ID if available
amount	DECIMAL	Payment amount
currency	VARCHAR	Currency code
status	ENUM	CREATED / PENDING / SUCCESS / FAILED / CANCELLED
paid_at	TIMESTAMP	Successful payment time
created_at	TIMESTAMP	Creation time
updated_at	TIMESTAMP	Last update time
Rules
Payment must belong to a valid deal.
Payment status must be verified server-side.
Frontend success messages must never be treated as payment confirmation.
Payment webhooks must be verified.
Duplicate payment callbacks must be handled safely.
Payment credentials must remain with the payment provider.
Relationship
deals (1) ───────── (many) payments
12. deliveries

Stores basic delivery and logistics status for confirmed deals.

Main fields
Field	Type	Description
id	UUID	Primary key
deal_id	UUID	Foreign key to deals
status	ENUM	PENDING / PICKUP_SCHEDULED / PICKED_UP / IN_TRANSIT / DELIVERED / CANCELLED
pickup_date	TIMESTAMP	Pickup time if scheduled
delivered_at	TIMESTAMP	Delivery completion time
notes	TEXT	Optional delivery notes
created_at	TIMESTAMP	Creation time
updated_at	TIMESTAMP	Last update time
Rules
Delivery must belong to a valid deal.
Status transitions must be controlled.
Delivery cannot be marked as delivered without an authorized action.
Important status changes should be recorded in audit logs.
Relationship
deals (1) ───────── (1) deliveries
13. price_recommendations

Stores AI-generated price recommendations.

This table does NOT represent an official market price.

Main fields
Field	Type	Description
id	UUID	Primary key
listing_id	UUID	Foreign key to produce_listings
requested_by	UUID	User who requested recommendation
recommended_min	DECIMAL	Suggested lower range
recommended_max	DECIMAL	Suggested upper range
currency	VARCHAR	Currency code
data_source	TEXT	Market-data/source description
model_info	TEXT	AI model/service information
status	ENUM	SUCCESS / INSUFFICIENT_DATA / FAILED
created_at	TIMESTAMP	Recommendation time
Rules
AI recommendations are advisory only.
The system must not fabricate market data.
If reliable data is unavailable, use INSUFFICIENT_DATA or FAILED.
The recommendation must not automatically change the farmer's final price.
The source/data basis should be recorded where available.
Relationship
produce_listings (1) ──────── (many) price_recommendations
users            (1) ──────── (many) price_recommendations
14. notifications

Stores user notifications generated by real application events.

Main fields
Field	Type	Description
id	UUID	Primary key
user_id	UUID	Foreign key to users
type	VARCHAR	Notification type
title	VARCHAR	Notification title
message	TEXT	Notification message
is_read	BOOLEAN	Read/unread state
created_at	TIMESTAMP	Creation time
Examples
New offer received
Offer accepted
Offer rejected
Payment successful
Payment failed
Pickup scheduled
Delivery completed
Rule

Notifications must correspond to actual application events.

15. audit_logs

Stores important system actions for traceability.

Main fields
Field	Type	Description
id	UUID	Primary key
actor_user_id	UUID	User who performed action
action	VARCHAR	Action performed
entity_type	VARCHAR	Entity affected
entity_id	UUID	Affected record
metadata	JSONB	Relevant non-sensitive information
created_at	TIMESTAMP	Action time
Examples
LISTING_CREATED
LISTING_UPDATED
OFFER_CREATED
OFFER_WITHDRAWN
OFFER_ACCEPTED
OFFER_REJECTED
DEAL_CREATED
PAYMENT_CREATED
PAYMENT_STATUS_UPDATED
DELIVERY_STATUS_UPDATED
Rules
Normal users must not edit audit records.
Do not store passwords, payment credentials, or secrets in audit metadata.
Audit logs should be append-oriented.
16. Important Relationships
users
 │
 ├── farmer_profiles
 │       │
 │       └── produce_listings
 │                │
 │                ├── offers ◄──── buyer
 │                │     │
 │                │     └── deals
 │                │          ├── payments
 │                │          └── deliveries
 │                │
 │                └── price_recommendations
 │
 ├── buyer_profiles
 │
 ├── notifications
 │
 └── audit_logs
17. Indexing Strategy

Indexes should be added to fields frequently used for searching, filtering, joining, or authorization.

Recommended indexes include:

users.email
users.role

farmer_profiles.user_id
buyer_profiles.user_id

produce_listings.farmer_id
produce_listings.product_name
produce_listings.status
produce_listings.district
produce_listings.availability_date

offers.listing_id
offers.buyer_id
offers.status

deals.listing_id
deals.farmer_id
deals.buyer_id
deals.status

payments.deal_id
payments.gateway_order_id
payments.status

deliveries.deal_id
deliveries.status

notifications.user_id
notifications.is_read

audit_logs.actor_user_id
audit_logs.entity_type
audit_logs.entity_id

Indexes should be reviewed after real usage patterns are known.

18. Data Validation Rules

The backend must validate:

User data
Valid email/phone format where applicable.
Valid role.
Required profile fields.
Listing data
Valid product name.
Quantity greater than zero.
Valid unit.
Non-negative price.
Valid availability date.
Valid location fields.
Offer data
Valid listing.
Active listing.
Valid buyer.
Positive offer price.
Valid quantity.
Valid offer status transition.
Deal data
Valid accepted offer.
Correct farmer and buyer.
Valid quantity.
Valid agreed price.
Valid deal state transition.
Payment data
Valid deal.
Valid gateway reference.
Valid amount.
Verified gateway status.
Delivery data
Valid deal.
Valid delivery status transition.
19. Transaction Integrity

The following operations should be treated as critical transactions:

Accepting an offer
1. Verify farmer authorization.
2. Verify listing is active.
3. Verify offer is active.
4. Verify quantity availability.
5. Accept the selected offer.
6. Create the deal.
7. Update listing/offer states as required.
8. Record audit event.
9. Commit transaction.

If a critical step fails, the transaction should be rolled back.

20. Data Security

The database must never store:

Plain-text passwords
API keys
Payment gateway secret keys
Card numbers
UPI PINs
Authentication tokens unnecessarily
Other sensitive credentials

Sensitive secrets must be stored using secure environment/secret-management mechanisms.

21. Soft Delete and Data Retention

Where appropriate, records that should not be physically deleted immediately may use a status such as:

DELETED
CANCELLED
CLOSED

Financial and audit records should not be casually deleted because they may be required for transaction traceability.

Actual retention requirements should be defined before production deployment.

22. Database Migration Rules

Database schema changes must use migrations.

Do not directly modify production tables without a migration process.

Before a schema change:

Review existing relationships.
Review affected APIs.
Review existing application code.
Create a migration.
Test the migration.
Test rollback/recovery where applicable.
Update this document if the architecture changes.
23. MVP Database Boundaries

The following are intentionally NOT included in the MVP database:

Crop-quality AI detection data
Disease diagnosis data
Automatic crop grading
Wallet balances
Loan records
Lending records
Credit scores
Live GPS tracking
Fleet-management data
Advanced route optimization data
Automatic transporter allocation data
Complex dispute-resolution records

These may be designed separately if approved for a future version.

24. Database Source of Truth

The database is the source of truth for:

User accounts and roles
Produce listings
Valid offers/bids
Confirmed deals
Payment status after server verification
Delivery status recorded by the application
Audit events

AI-generated recommendations are NOT authoritative database facts.

25. Final Database Principle

The database must prioritize:

Correctness
Consistency
Security
Traceability
Authorization
Recoverability

The system should store real application state rather than simulated data.

Core financial and marketplace records must always be verifiable from database records and trusted external integrations.


---

## Step 7 — Commit it

At the bottom of GitHub, select:

**Commit directly to the `main` branch**

Commit message:

```text
docs: add database design

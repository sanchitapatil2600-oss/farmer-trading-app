-- ============================================================================
-- Migration 003: Offers and Deals
-- Aligned with docs/DATABASE.md, docs/PRD.md, docs/ARCHITECTURE.md, and docs/SECURITY.md
-- ============================================================================

-- Enum: Offer Lifecycle Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_status') THEN
        CREATE TYPE offer_status AS ENUM (
            'ACTIVE',
            'WITHDRAWN',
            'ACCEPTED',
            'REJECTED',
            'EXPIRED'
        );
    END IF;
END$$;

-- Enum: Deal Lifecycle Status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_status') THEN
        CREATE TYPE deal_status AS ENUM (
            'CONFIRMED',
            'PAYMENT_PENDING',
            'PAID',
            'DELIVERY',
            'COMPLETED',
            'CANCELLED'
        );
    END IF;
END$$;

-- Table: offers
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID NOT NULL
        REFERENCES produce_listings(id)
        ON DELETE RESTRICT,

    buyer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    offered_price NUMERIC(12,2) NOT NULL
        CHECK (offered_price > 0),

    quantity NUMERIC(12,2) NOT NULL
        CHECK (quantity > 0),

    message TEXT,

    status offer_status NOT NULL DEFAULT 'ACTIVE',

    expiration_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_listing_id
    ON offers(listing_id);

CREATE INDEX IF NOT EXISTS idx_offers_buyer_id
    ON offers(buyer_id);

CREATE INDEX IF NOT EXISTS idx_offers_status
    ON offers(status);

CREATE INDEX IF NOT EXISTS idx_offers_listing_status
    ON offers(listing_id, status);

CREATE INDEX IF NOT EXISTS idx_offers_created_at
    ON offers(created_at DESC);

-- Table: deals
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID NOT NULL
        REFERENCES produce_listings(id)
        ON DELETE RESTRICT,

    farmer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    buyer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    accepted_offer_id UUID NOT NULL UNIQUE
        REFERENCES offers(id)
        ON DELETE RESTRICT,

    quantity NUMERIC(12,2) NOT NULL
        CHECK (quantity > 0),

    agreed_price NUMERIC(12,2) NOT NULL
        CHECK (agreed_price > 0),

    total_amount NUMERIC(14,2) NOT NULL
        CHECK (total_amount > 0),

    currency VARCHAR(10) NOT NULL DEFAULT 'INR'
        CHECK (currency = 'INR'),

    status deal_status NOT NULL DEFAULT 'CONFIRMED',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_listing_id
    ON deals(listing_id);

CREATE INDEX IF NOT EXISTS idx_deals_farmer_id
    ON deals(farmer_id);

CREATE INDEX IF NOT EXISTS idx_deals_buyer_id
    ON deals(buyer_id);

CREATE INDEX IF NOT EXISTS idx_deals_status
    ON deals(status);

CREATE INDEX IF NOT EXISTS idx_deals_accepted_offer_id
    ON deals(accepted_offer_id);

CREATE INDEX IF NOT EXISTS idx_deals_created_at
    ON deals(created_at DESC);

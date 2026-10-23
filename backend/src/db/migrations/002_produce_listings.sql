CREATE TABLE produce_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    farmer_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    crop_name VARCHAR(100) NOT NULL,

    description TEXT,

    quantity NUMERIC(12,2) NOT NULL
        CHECK (quantity > 0),

    unit VARCHAR(20) NOT NULL
        CHECK (unit IN ('KG', 'QUINTAL', 'TON', 'DOZEN', 'BAG', 'OTHER')),

    expected_price_per_unit NUMERIC(12,2) NOT NULL
        CHECK (expected_price_per_unit > 0),

    availability_date DATE NOT NULL,

    village VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,

    image_url TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'SOLD_OUT')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT crop_name_not_empty
        CHECK (length(trim(crop_name)) > 0),

    CONSTRAINT district_not_empty
        CHECK (length(trim(district)) > 0),

    CONSTRAINT state_not_empty
        CHECK (length(trim(state)) > 0)
);

CREATE INDEX idx_produce_listings_farmer_id
    ON produce_listings(farmer_id);

CREATE INDEX idx_produce_listings_status
    ON produce_listings(status);

CREATE INDEX idx_produce_listings_crop_name
    ON produce_listings(crop_name);

CREATE INDEX idx_produce_listings_district
    ON produce_listings(district);

CREATE INDEX idx_produce_listings_availability_date
    ON produce_listings(availability_date);

CREATE INDEX idx_produce_listings_active_marketplace
    ON produce_listings(status, created_at DESC);
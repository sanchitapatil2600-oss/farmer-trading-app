-- ============================================================================
-- Migration 004: Allow produce_listings quantity to be 0 when SOLD_OUT
-- When a listing is fully allocated/sold out, remaining quantity reaches 0.
-- Aligned with docs/DATABASE.md rule: "When available quantity reaches zero, status transitions to SOLD_OUT."
-- ============================================================================

ALTER TABLE produce_listings DROP CONSTRAINT IF EXISTS produce_listings_quantity_check;
ALTER TABLE produce_listings ADD CONSTRAINT produce_listings_quantity_check CHECK (quantity >= 0);

-- Add server-calculated shipping cost to existing databases.
-- Safe to run multiple times on PostgreSQL.
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00;

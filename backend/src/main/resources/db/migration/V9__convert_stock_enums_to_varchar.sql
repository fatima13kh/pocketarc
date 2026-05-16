-- Convert transaction_type enum to VARCHAR
ALTER TABLE investment_transactions ALTER COLUMN transaction_type TYPE VARCHAR(20);

-- Drop the enum type
DROP TYPE IF EXISTS transaction_type CASCADE;
-- Add created_at column to stocks table
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;

-- Set default value for existing rows
UPDATE stocks SET created_at = NOW() WHERE created_at IS NULL;

-- Make it not nullable after setting values
ALTER TABLE stocks ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE stocks ALTER COLUMN created_at SET DEFAULT NOW();
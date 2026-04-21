-- Add unique constraint to phone_number
ALTER TABLE users ADD CONSTRAINT uq_users_phone_number UNIQUE (phone_number);

-- Change default cash_balance from 0 to 500
ALTER TABLE users ALTER COLUMN cash_balance SET DEFAULT 500.00;

-- Add index for OTP cleanup
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON otp_codes(expires_at);
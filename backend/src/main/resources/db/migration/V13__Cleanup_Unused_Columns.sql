-- =====================================================
-- MIGRATION: Clean up unused columns
-- Date: 2026-05-19
-- Description: Remove columns that are never used
-- =====================================================

-- 1. Remove unused columns from stocks table
ALTER TABLE stocks DROP COLUMN IF EXISTS day_high_bhd;
ALTER TABLE stocks DROP COLUMN IF EXISTS day_low_bhd;
ALTER TABLE stocks DROP COLUMN IF EXISTS volume;

-- 2. Remove unused columns from stock_price_history table
ALTER TABLE stock_price_history DROP COLUMN IF EXISTS open_price_bhd;
ALTER TABLE stock_price_history DROP COLUMN IF EXISTS high_price_bhd;
ALTER TABLE stock_price_history DROP COLUMN IF EXISTS low_price_bhd;
ALTER TABLE stock_price_history DROP COLUMN IF EXISTS volume;

-- 3. Remove is_verified from users table (OTP removed)
ALTER TABLE users DROP COLUMN IF EXISTS is_verified;
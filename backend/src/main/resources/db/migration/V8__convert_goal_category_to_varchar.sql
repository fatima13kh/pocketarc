-- Convert goal_category column to VARCHAR to fix Hibernate compatibility issues

-- First, drop the default value if any
ALTER TABLE savings_goals ALTER COLUMN category DROP DEFAULT;

-- Convert column to VARCHAR
ALTER TABLE savings_goals ALTER COLUMN category TYPE VARCHAR(50);

-- Note: Do NOT drop the goal_category enum type yet as it might be used elsewhere
-- If you want to drop it later, you can, but it's not necessary
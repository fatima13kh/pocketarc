-- Convert enum columns to VARCHAR to fix Hibernate compatibility issues

-- First, drop the default values if any
ALTER TABLE stories ALTER COLUMN author_type DROP DEFAULT;
ALTER TABLE stories ALTER COLUMN difficulty DROP DEFAULT;
ALTER TABLE stories ALTER COLUMN category DROP DEFAULT;
ALTER TABLE stories ALTER COLUMN status DROP DEFAULT;

-- Convert columns to VARCHAR
ALTER TABLE stories ALTER COLUMN author_type TYPE VARCHAR(50);
ALTER TABLE stories ALTER COLUMN difficulty TYPE VARCHAR(20);
ALTER TABLE stories ALTER COLUMN category TYPE VARCHAR(30);
ALTER TABLE stories ALTER COLUMN status TYPE VARCHAR(20);

-- Drop the enum types since they are no longer needed
DROP TYPE IF EXISTS author_type CASCADE;
DROP TYPE IF EXISTS difficulty_level CASCADE;
DROP TYPE IF EXISTS story_category CASCADE;
DROP TYPE IF EXISTS story_status CASCADE;
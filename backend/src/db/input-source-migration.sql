-- Add input_source and target_role columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS input_source VARCHAR(20) DEFAULT 'linkedin'
  CHECK (input_source IN ('resume', 'linkedin', 'questionnaire'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS target_role TEXT;

-- Add input_source to teaser_attempts for analytics
ALTER TABLE teaser_attempts ADD COLUMN IF NOT EXISTS input_source VARCHAR(20) DEFAULT 'linkedin';
ALTER TABLE teaser_attempts ADD COLUMN IF NOT EXISTS target_role TEXT;

-- Index for filtering by input_source
CREATE INDEX IF NOT EXISTS idx_orders_input_source ON orders (input_source);

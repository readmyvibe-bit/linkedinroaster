CREATE TABLE IF NOT EXISTS company_preps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  prep_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_preps_order ON company_preps(order_id);

-- Referral Codes (one-time influencer trial codes)
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  product TEXT NOT NULL, -- 'roast' or 'build'
  plan TEXT NOT NULL, -- 'standard', 'pro', 'starter', 'plus'
  status TEXT DEFAULT 'active', -- 'active', 'redeemed', 'deactivated'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by_email TEXT,
  order_id TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_status ON referral_codes(status);

-- Influencers table
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  commission_standard INT DEFAULT 50,
  commission_pro INT DEFAULT 100,
  commission_build_starter INT DEFAULT 25,
  commission_build_plus INT DEFAULT 50,
  commission_build_pro INT DEFAULT 100,
  total_referrals INT DEFAULT 0,
  total_earnings INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_influencers_slug ON influencers(slug);

-- Add influencer_slug to orders tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_slug TEXT;
ALTER TABLE build_orders ADD COLUMN IF NOT EXISTS influencer_slug TEXT;

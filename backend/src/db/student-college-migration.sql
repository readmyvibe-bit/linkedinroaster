-- Add college tracking columns to referral_codes
ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS college_name TEXT;
ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS student_email TEXT;
ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS batch_id TEXT;
CREATE INDEX IF NOT EXISTS idx_referral_codes_college ON referral_codes(college_name);
CREATE INDEX IF NOT EXISTS idx_referral_codes_batch ON referral_codes(batch_id);

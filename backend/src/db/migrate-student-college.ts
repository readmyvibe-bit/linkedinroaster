import { query } from './index';

async function migrate() {
  await query(`ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS college_name TEXT`);
  await query(`ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS student_email TEXT`);
  await query(`ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS batch_id TEXT`);
  await query(`CREATE INDEX IF NOT EXISTS idx_referral_codes_college ON referral_codes(college_name)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_referral_codes_batch ON referral_codes(batch_id)`);
  console.log('Student/college columns added to referral_codes');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });

import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './index';

async function migrate() {
  const sql = readFileSync(join(__dirname, 'referral-influencer-migration.sql'), 'utf-8');

  try {
    console.log('Running referral codes + influencer migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
    console.log('Tables created: referral_codes, influencers');
    console.log('Columns added: orders.influencer_slug, build_orders.influencer_slug');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('Tables already exist — migration skipped.');
    } else {
      console.error('Migration failed:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

migrate();

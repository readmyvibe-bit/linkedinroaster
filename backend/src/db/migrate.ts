import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './index';

async function migrate() {
  const sql = readFileSync(join(__dirname, 'migration.sql'), 'utf-8');

  try {
    console.log('Running migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
    console.log('Tables created: orders, teaser_attempts, referrals, events');
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

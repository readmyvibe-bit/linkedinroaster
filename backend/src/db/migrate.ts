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
  }

  // Run input_source migration (additive — safe to re-run)
  try {
    const inputSourceSql = readFileSync(join(__dirname, 'input-source-migration.sql'), 'utf-8');
    await pool.query(inputSourceSql);
    console.log('Input source migration completed.');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('Input source columns already exist — skipped.');
    } else {
      console.error('Input source migration warning:', error.message);
    }
  }

  await pool.end();
}

migrate();

import { query } from './index';

async function migrate() {
  await query(`CREATE TABLE IF NOT EXISTS company_preps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    prep_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query('CREATE INDEX IF NOT EXISTS idx_company_preps_order ON company_preps(order_id)');
  await query('ALTER TABLE build_orders DROP CONSTRAINT IF EXISTS build_orders_plan_check');
  await query("ALTER TABLE build_orders ADD CONSTRAINT build_orders_plan_check CHECK (plan IN ('student','student_pro','starter','standard','plus','pro'))");
  console.log('company_preps table created');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });

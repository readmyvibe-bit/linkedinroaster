-- Pricing V2 Migration
-- Allow 'standard' plan for build_orders
ALTER TABLE build_orders DROP CONSTRAINT IF EXISTS build_orders_plan_check;
ALTER TABLE build_orders ADD CONSTRAINT build_orders_plan_check
  CHECK (plan IN ('starter','plus','pro','standard'));

-- Add upgrade columns to build_orders (if not exist)
DO $$ BEGIN
  ALTER TABLE build_orders ADD COLUMN upgraded_to_pro BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE build_orders ADD COLUMN upgrade_order_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

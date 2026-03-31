-- BUILD ORDERS TABLE (separate from roast orders)
CREATE TABLE build_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(255) NOT NULL,
  plan                  VARCHAR(20) NOT NULL CHECK (plan IN ('starter','plus','pro')),
  amount_paise          INTEGER NOT NULL,
  razorpay_order_id     VARCHAR(50) UNIQUE,
  razorpay_payment_id   VARCHAR(50),
  payment_status        VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  paid_at               TIMESTAMPTZ,
  processing_status     VARCHAR(20) DEFAULT 'pending'
    CHECK (processing_status IN ('pending','queued','generating','checking','done','failed')),
  processing_started_at TIMESTAMPTZ,
  processing_done_at    TIMESTAMPTZ,
  processing_error      TEXT,
  retry_count           INTEGER DEFAULT 0,
  form_input            JSONB NOT NULL,
  uploaded_resume_text  TEXT,
  generated_profile     JSONB,
  quality_check         JSONB,
  email_sent            BOOLEAN DEFAULT FALSE,
  email_sent_at         TIMESTAMPTZ,
  user_rating           SMALLINT CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback         TEXT,
  feedback_at           TIMESTAMPTZ,
  ip_address            INET,
  utm_source            VARCHAR(100),
  utm_medium            VARCHAR(100),
  utm_campaign          VARCHAR(100),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_build_orders_email      ON build_orders(email);
CREATE INDEX idx_build_orders_payment    ON build_orders(payment_status);
CREATE INDEX idx_build_orders_processing ON build_orders(processing_status);
CREATE INDEX idx_build_orders_created    ON build_orders(created_at DESC);

CREATE TRIGGER t_build_orders_updated BEFORE UPDATE ON build_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

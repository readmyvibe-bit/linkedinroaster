-- ORDERS TABLE
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               VARCHAR(255) NOT NULL,
  plan                VARCHAR(10) NOT NULL CHECK (plan IN ('standard','pro')),
  amount_paise        INTEGER NOT NULL,
  job_description     TEXT,
  teaser_id           UUID,
  razorpay_order_id   VARCHAR(50) UNIQUE,
  razorpay_payment_id VARCHAR(50),
  razorpay_signature  VARCHAR(255),
  payment_status      VARCHAR(20) DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  paid_at             TIMESTAMPTZ,
  processing_status   VARCHAR(20) DEFAULT 'queued'
    CHECK (processing_status IN ('queued','parsing','analyzing',
      'roasting','rewriting','checking','done','failed')),
  processing_started_at TIMESTAMPTZ,
  processing_done_at    TIMESTAMPTZ,
  processing_error      TEXT,
  retry_count           INTEGER DEFAULT 0,
  profile_input         JSONB NOT NULL,
  parsed_profile        JSONB,
  analysis              JSONB,
  roast                 JSONB,
  rewrite               JSONB,
  quality_check         JSONB,
  before_score          JSONB,
  after_score           JSONB,
  card_image_url        TEXT,
  email_sent            BOOLEAN DEFAULT FALSE,
  email_sent_at         TIMESTAMPTZ,
  user_rating           SMALLINT CHECK (user_rating BETWEEN 1 AND 5),
  user_feedback         TEXT,
  feedback_at           TIMESTAMPTZ,
  ip_address            INET,
  profile_hash          CHAR(64),
  utm_source            VARCHAR(100),
  utm_medium            VARCHAR(100),
  utm_campaign          VARCHAR(100),
  referral_code         VARCHAR(50),
  upgraded_to_pro       BOOLEAN DEFAULT FALSE,
  upgrade_order_id      UUID,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- TEASER ATTEMPTS TABLE (saves every free teaser submission)
CREATE TABLE teaser_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline_text   TEXT NOT NULL,
  score           INTEGER,
  issues_found    JSONB,
  ip_address      INET,
  user_agent      TEXT,
  email           VARCHAR(255),
  converted       BOOLEAN DEFAULT FALSE,
  converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  follow_up_sent  BOOLEAN DEFAULT FALSE,
  utm_source      VARCHAR(100),
  utm_medium      VARCHAR(100),
  utm_campaign    VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- REFERRALS TABLE
CREATE TABLE referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_email  VARCHAR(255) NOT NULL,
  referral_code   VARCHAR(50) UNIQUE NOT NULL,
  uses_count      INTEGER DEFAULT 0,
  earnings_paise  INTEGER DEFAULT 0,
  payout_history  JSONB DEFAULT '[]',
  last_payout_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTS TABLE (analytics)
CREATE TABLE events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  event_type VARCHAR(60) NOT NULL,
  metadata   JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ALL INDEXES
CREATE INDEX idx_orders_email      ON orders(email);
CREATE INDEX idx_orders_payment    ON orders(payment_status);
CREATE INDEX idx_orders_processing ON orders(processing_status);
CREATE INDEX idx_orders_hash       ON orders(profile_hash);
CREATE INDEX idx_orders_created    ON orders(created_at DESC);
CREATE INDEX idx_orders_teaser     ON orders(teaser_id);
CREATE INDEX idx_teaser_created    ON teaser_attempts(created_at DESC);
CREATE INDEX idx_teaser_converted  ON teaser_attempts(converted);
CREATE INDEX idx_teaser_email      ON teaser_attempts(email) WHERE email IS NOT NULL;
CREATE INDEX idx_teaser_followup   ON teaser_attempts(follow_up_sent)
  WHERE email IS NOT NULL AND converted=FALSE;
CREATE INDEX idx_events_order      ON events(order_id);

-- AUTO-UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at=NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER t_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

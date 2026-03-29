export type Plan = 'standard' | 'pro';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ProcessingStatus =
  | 'queued'
  | 'parsing'
  | 'analyzing'
  | 'roasting'
  | 'rewriting'
  | 'checking'
  | 'done'
  | 'failed';

export interface Order {
  id: string;
  email: string;
  plan: Plan;
  amount_paise: number;
  job_description?: string;
  teaser_id?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  payment_status: PaymentStatus;
  paid_at?: string;
  processing_status: ProcessingStatus;
  processing_started_at?: string;
  processing_done_at?: string;
  processing_error?: string;
  retry_count: number;
  profile_input: Record<string, any>;
  parsed_profile?: Record<string, any>;
  analysis?: Record<string, any>;
  roast?: Record<string, any>;
  rewrite?: Record<string, any>;
  quality_check?: Record<string, any>;
  before_score?: Record<string, any>;
  after_score?: Record<string, any>;
  card_image_url?: string;
  email_sent: boolean;
  email_sent_at?: string;
  user_rating?: number;
  user_feedback?: string;
  feedback_at?: string;
  ip_address?: string;
  profile_hash?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  referral_code?: string;
  upgraded_to_pro: boolean;
  upgrade_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TeaserAttempt {
  id: string;
  headline_text: string;
  score?: number;
  issues_found?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  email?: string;
  converted: boolean;
  converted_order_id?: string;
  follow_up_sent: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_email: string;
  referral_code: string;
  uses_count: number;
  earnings_paise: number;
  payout_history: any[];
  last_payout_at?: string;
  created_at: string;
}

export interface Event {
  id: string;
  order_id?: string;
  event_type: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  db: 'connected' | 'disconnected';
  version: string;
}

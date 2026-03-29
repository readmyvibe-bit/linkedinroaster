import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import Razorpay from 'razorpay';
import * as Sentry from '@sentry/node';
import { checkConnection, query } from './db';
import { validateProfileInput, validateEmail } from './lib/validation';
import { teaserAnalysis } from './ai/teaser';
import { trackPaymentInitiated, trackPaymentCompleted, trackUpgradeCompleted } from './services/analytics';
import { startAllCrons } from './cron';
import adminRouter from './routes/admin';
import { generateAndUploadRoastSheet } from './services/card-generator';
dotenv.config();

// --- Sentry ---
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

import { profileQueue, upgradeQueue } from './queue';

const app = express();
const PORT = process.env.PORT || 4000;

// --- Redis ---
const redis = new Redis(process.env.UPSTASH_REDIS_URL!);

// --- Razorpay ---
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// PostHog via services/analytics module

// BullMQ queues imported from ./queue

// --- Security: Helmet ---
app.use(helmet());

// --- CORS ---
const ALLOWED_ORIGINS = [
  'https://profileroaster.in',
  'https://www.profileroaster.in',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[];

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/webhooks/razorpay') return next();
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })(req, res, next);
});

// JSON parser for all routes except webhook
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/webhooks/razorpay') return next();
  express.json({ limit: '50kb' })(req, res, next);
});

// Raw body for webhook (required for HMAC signature verification)
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }));

// --- Rate limiter ---
function rateLimiter(key: string, limit: number, windowSecs: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const k = `${key}:${req.ip}`;
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSecs);
    if (count > limit) {
      const ttl = await redis.ttl(k);
      return res.status(429).json({
        error: 'rate_limit_exceeded',
        retry_after_seconds: ttl,
        message: `${limit} requests per ${windowSecs / 3600} hour(s). Try the full roast for ₹299.`,
      });
    }
    next();
  };
}

// --- Input sanitization ---
function stripHtml(text: string | undefined): string | undefined {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

// --- Admin routes ---
app.use('/api/admin', adminRouter);

// ==================== ROUTES ====================

// POST /api/webhooks/razorpay — Webhook handler with HMAC verification
app.post('/api/webhooks/razorpay', async (req: Request, res: Response) => {
  try {
    const sig = req.headers['x-razorpay-signature'] as string;
    if (!sig || !process.env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'invalid_signature' });
    }
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body).digest('hex');
    if (sig !== expected)
      return res.status(400).json({ error: 'invalid_signature' });

    const body = JSON.parse(req.body.toString());

    if (body.event === 'payment.captured') {
      const payment = body.payload.payment.entity;
      const paymentType = payment.notes?.type;

      // ── UPGRADE PAYMENT ──
      if (paymentType === 'upgrade') {
        const originalOrderId = payment.notes?.original_order_id;
        if (!originalOrderId)
          return res.status(400).json({ error: 'missing_order_id' });

        const check = await query(
          'SELECT upgraded_to_pro FROM orders WHERE id=$1', [originalOrderId]);
        if (check.rows[0]?.upgraded_to_pro)
          return res.json({ status: 'already_upgraded' });

        await query(
          `UPDATE orders SET plan=$1, upgraded_to_pro=TRUE,
           razorpay_payment_id=COALESCE(razorpay_payment_id, $2) WHERE id=$3`,
          ['pro', payment.id, originalOrderId]);

        await upgradeQueue.add('job', { order_id: originalOrderId });
        trackUpgradeCompleted(payment.notes?.email || 'unknown', originalOrderId);
        return res.json({ status: 'upgrade_queued' });
      }

      // ── NEW ORDER PAYMENT ──
      const orderCheck = await query(
        'SELECT payment_status, teaser_id, email FROM orders WHERE razorpay_order_id=$1',
        [payment.order_id]);
      if (orderCheck.rows[0]?.payment_status === 'paid')
        return res.json({ status: 'already_processed' });

      await query(
        `UPDATE orders SET payment_status='paid', razorpay_payment_id=$1,
         paid_at=NOW(), processing_status='queued' WHERE razorpay_order_id=$2`,
        [payment.id, payment.order_id]);

      await profileQueue.add('job', { razorpay_order_id: payment.order_id });

      // Mark teaser as converted
      const order = orderCheck.rows[0];
      if (order?.teaser_id) {
        await query(
          `UPDATE teaser_attempts SET converted=TRUE,
           converted_order_id=(SELECT id FROM orders WHERE razorpay_order_id=$1)
           WHERE id=$2`,
          [payment.order_id, order.teaser_id]);
      } else if (order?.email) {
        await query(
          `UPDATE teaser_attempts SET converted=TRUE,
           converted_order_id=(SELECT id FROM orders WHERE razorpay_order_id=$1)
           WHERE email=$2 AND converted=FALSE`,
          [payment.order_id, order.email]);
      }

      // Credit referral
      const fullOrder = await query(
        'SELECT referral_code, email, plan FROM orders WHERE razorpay_order_id=$1',
        [payment.order_id]);
      if (fullOrder.rows[0]?.referral_code) {
        await query(
          `UPDATE referrals SET uses_count=uses_count+1,
           earnings_paise=earnings_paise+5000 WHERE referral_code=$1`,
          [fullOrder.rows[0].referral_code]);
      }

      trackPaymentCompleted(
        order?.email || 'unknown',
        fullOrder.rows[0]?.plan || 'standard',
        payment.amount,
      );
    }

    if (body.event === 'payment.failed') {
      await query(
        'UPDATE orders SET payment_status=$1 WHERE razorpay_order_id=$2',
        ['failed', body.payload.payment.entity.order_id]);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'webhook_processing_failed' });
  }
});

// GET /api/health
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbConnected = await checkConnection();
    if (dbConnected) {
      res.json({ status: 'ok', db: 'connected', version: '8.0' });
    } else {
      res.status(500).json({ status: 'error', db: 'disconnected', version: '8.0' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', db: 'disconnected', version: '8.0' });
  }
});

// GET /api/cors-test
app.get('/api/cors-test', (_req: Request, res: Response) => {
  res.json({ cors: 'ok' });
});

// POST /api/orders — with email rate limit + input sanitization
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const { email, plan, profile_data, job_description, teaser_id } = req.body;

    if (!validateEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });

    // Email rate limit: 10 orders per email per 24 hours
    const emailCount = await query(
      `SELECT COUNT(*)::int AS cnt FROM orders WHERE email=$1
       AND created_at > NOW()-INTERVAL '24 hours'`,
      [email],
    );
    if (emailCount.rows[0].cnt >= 10)
      return res.status(429).json({ error: 'Too many orders. Try again in 24 hours.' });

    // Sanitize input — strip HTML tags
    if (profile_data) {
      profile_data.headline = stripHtml(profile_data.headline);
      profile_data.about = stripHtml(profile_data.about);
      profile_data.experience = stripHtml(profile_data.experience);
      profile_data.raw_paste = stripHtml(profile_data.raw_paste);
    }

    const validation = validateProfileInput(profile_data);
    if (!validation.valid)
      return res.status(400).json({ errors: validation.errors });

    if (!['standard', 'pro'].includes(plan))
      return res.status(400).json({ error: 'Invalid plan' });

    const hash = crypto.createHash('sha256')
      .update(JSON.stringify(profile_data)).digest('hex');

    const existing = await query(
      `SELECT id FROM orders WHERE profile_hash=$1 AND email=$2
       AND created_at > NOW()-INTERVAL '7 days'
       AND payment_status='paid' LIMIT 1`,
      [hash, email],
    );
    if (existing.rows.length)
      return res.json({ cached: true, order_id: existing.rows[0].id });

    if (req.query.ref) {
      const refCheck = await query(
        'SELECT id FROM referrals WHERE referral_code=$1',
        [req.query.ref],
      );
      if (!refCheck.rows.length)
        return res.status(400).json({ error: 'Invalid referral code' });
    }

    const amounts: Record<string, number> = { standard: 29900, pro: 59900 };
    const rzpOrder = await razorpay.orders.create({
      amount: amounts[plan],
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { email, plan, type: 'new_order' },
    });

    const result = await query(
      `INSERT INTO orders (email,plan,amount_paise,razorpay_order_id,
       profile_input,job_description,teaser_id,profile_hash,ip_address,
       utm_source,utm_medium,utm_campaign,referral_code)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        email, plan, amounts[plan], rzpOrder.id,
        JSON.stringify(profile_data), job_description || null,
        teaser_id || null, hash, req.ip,
        req.query.utm_source || null, req.query.utm_medium || null,
        req.query.utm_campaign || null, req.query.ref || null,
      ],
    );

    trackPaymentInitiated(email, plan, amounts[plan]);

    res.json({
      order_id: result.rows[0].id,
      razorpay_order_id: rzpOrder.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      amount: amounts[plan],
      currency: 'INR',
      warnings: validation.warnings,
    });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

// POST /api/teaser — rate limited (5/IP/hour), headline cached, AI-powered
app.post('/api/teaser', rateLimiter('teaser', 5, 3600), async (req: Request, res: Response) => {
  try {
    const { headline } = req.body;

    if (!headline || headline.trim().length < 10)
      return res.status(400).json({ errors: ['Please paste your LinkedIn headline (at least 10 characters).'] });

    // Check headline cache first
    const headlineHash = crypto
      .createHash('sha256')
      .update(headline.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' '))
      .digest('hex');
    const cacheKey = `teaser:hash:${headlineHash}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const cachedResult = JSON.parse(cached);
      // Still save the attempt for analytics
      const saved = await query(
        `INSERT INTO teaser_attempts (headline_text, score, issues_found,
         ip_address, user_agent, utm_source, utm_medium, utm_campaign)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [headline, cachedResult.score, JSON.stringify(cachedResult.issues),
         req.ip, req.headers['user-agent'] || null,
         (req.query.utm_source as string) || null, (req.query.utm_medium as string) || null,
         (req.query.utm_campaign as string) || null],
      );
      return res.json({ ...cachedResult, teaser_id: saved.rows[0].id, cached: true });
    }

    // Run AI teaser analysis
    const result = await teaserAnalysis(stripHtml(headline) || headline);

    // Cache for 24 hours
    await redis.setex(cacheKey, 86400, JSON.stringify(result));

    // Save to teaser_attempts
    const saved = await query(
      `INSERT INTO teaser_attempts (headline_text, score, issues_found,
       ip_address, user_agent, utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        headline,
        result.score,
        JSON.stringify(result.issues),
        req.ip,
        req.headers['user-agent'] || null,
        (req.query.utm_source as string) || null,
        (req.query.utm_medium as string) || null,
        (req.query.utm_campaign as string) || null,
      ],
    );

    res.json({
      ...result,
      teaser_id: saved.rows[0].id,
    });
  } catch (err) {
    console.error('POST /api/teaser error:', err);
    res.status(500).json({ error: 'Teaser generation failed' });
  }
});

// POST /api/teaser/:id/email
app.post('/api/teaser/:id/email', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!validateEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });

    await query(
      'UPDATE teaser_attempts SET email=$1 WHERE id=$2',
      [email, req.params.id],
    );
    res.json({ saved: true });
  } catch (err) {
    console.error('POST /api/teaser/:id/email error:', err);
    res.status(500).json({ error: 'Failed to save email' });
  }
});

// POST /api/orders/:id/upgrade
app.post('/api/orders/:id/upgrade', async (req: Request, res: Response) => {
  try {
    const orderResult = await query(
      'SELECT * FROM orders WHERE id=$1 AND payment_status=$2',
      [req.params.id, 'paid']);
    if (!orderResult.rows[0])
      return res.status(404).json({ error: 'Order not found' });
    if (orderResult.rows[0].plan === 'pro')
      return res.status(400).json({ error: 'Already Pro' });

    const rzpOrder = await razorpay.orders.create({
      amount: 30000,
      currency: 'INR',
      receipt: `upg_${req.params.id.slice(0, 32)}`,
      notes: { original_order_id: req.params.id, type: 'upgrade' } as any,
    }) as any;

    res.json({
      razorpay_order_id: rzpOrder.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      amount: 30000,
      currency: 'INR',
    });
  } catch (err) {
    console.error('POST /api/orders/:id/upgrade error:', err);
    res.status(500).json({ error: 'Failed to create upgrade order' });
  }
});

// GET /api/orders/:id — complete results response
app.get('/api/orders/:id', rateLimiter('poll', 60, 60), async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length)
      return res.status(404).json({ error: 'Not found' });

    const o = result.rows[0];

    if (o.processing_status !== 'done') {
      const stages = ['queued', 'parsing', 'analyzing', 'roasting', 'rewriting', 'checking'];
      const stageIndex = stages.indexOf(o.processing_status);
      const pct = stageIndex >= 0 ? Math.round((stageIndex / stages.length) * 100) : 0;
      return res.json({
        status: o.processing_status,
        progress_pct: pct,
        estimated_seconds: Math.max(0, (stages.length - stageIndex) * 15),
      });
    }

    const refCode = 'ROAST' + o.id.replace(/-/g, '').slice(0, 6).toUpperCase();
    await query(
      `INSERT INTO referrals (referrer_email, referral_code)
       VALUES ($1, $2) ON CONFLICT (referral_code) DO NOTHING`,
      [o.email, refCode]);

    res.json({
      order_id: o.id,
      status: 'done',
      plan: o.plan,
      results: {
        scores: { before: o.before_score, after: o.after_score },
        roast: o.roast,
        rewrite: o.rewrite,
        analysis: o.analysis,
        card_image_url: o.card_image_url,
      },
      referral_code: refCode,
      referral_url: `https://profileroaster.in/?ref=${refCode}`,
    });
  } catch (err) {
    console.error('GET /api/orders/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders/:id/feedback
app.post('/api/orders/:id/feedback', async (req: Request, res: Response) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });

    await query(
      'UPDATE orders SET user_rating=$1, user_feedback=$2, feedback_at=NOW() WHERE id=$3',
      [rating, feedback || null, req.params.id],
    );
    res.json({ saved: true });
  } catch (err) {
    console.error('POST /api/orders/:id/feedback error:', err);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// GET /api/stats
app.get('/api/stats', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      "SELECT COUNT(*)::int AS total FROM orders WHERE payment_status='paid'",
    );
    res.json({ total: result.rows[0].total });
  } catch (err) {
    console.error('GET /api/stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// POST /api/generate-roast-sheet — generate combined roast report PNG
app.post('/api/generate-roast-sheet', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const result = await query('SELECT * FROM orders WHERE id=$1', [orderId]);
    const o = result.rows[0];
    if (!o || o.processing_status !== 'done')
      return res.status(404).json({ error: 'Order not found or not done' });

    const url = await generateAndUploadRoastSheet({
      orderId: o.id,
      beforeScore: o.before_score?.overall || 0,
      afterScore: o.after_score?.overall || 0,
      headlineScore: o.before_score?.headline || 0,
      aboutScore: o.before_score?.about || 0,
      experienceScore: o.before_score?.experience || 0,
      roastPoints: (o.roast?.roast_points || []).map((p: any) => ({
        section_targeted: p.section_targeted || 'overall',
        roast: p.roast || '',
        underlying_issue: p.underlying_issue || '',
      })),
    });

    if (!url) return res.status(500).json({ error: 'Sheet generation failed' });
    res.json({ url });
  } catch (err) {
    console.error('POST /api/generate-roast-sheet error:', err);
    res.status(500).json({ error: 'Failed to generate roast sheet' });
  }
});

// ==================== RECOVERY ====================

// POST /api/recover/send-otp
app.post('/api/recover/send-otp', rateLimiter('recover-otp', 5, 3600), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });

    // Check orders and result_lookups
    const orders = await query(
      `SELECT id FROM orders WHERE email=$1 AND processing_status='done'
       AND created_at > NOW() - INTERVAL '30 days'
       UNION
       SELECT order_id as id FROM result_lookups WHERE email=$1
       AND created_at > NOW() - INTERVAL '30 days'`,
      [email],
    );

    if (!orders.rows.length)
      return res.json({ found: false });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`otp:${email}`, 600, otp);

    // Send OTP email via Resend
    const { Resend } = require('resend');
    const resendClient = new Resend(process.env.RESEND_API_KEY);
    await resendClient.emails.send({
      from: `Profile Roaster <${process.env.FROM_EMAIL || 'support@profileroaster.in'}>`,
      to: email,
      subject: 'Your Recovery Code — Profile Roaster',
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#004182;margin-bottom:16px">Your Recovery Code</h2>
        <p style="color:#333;font-size:15px">Use this code to access your LinkedIn roast results:</p>
        <div style="background:#F3F2EF;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
          <span style="font-size:32px;font-weight:700;letter-spacing:6px;color:#004182">${otp}</span>
        </div>
        <p style="color:#666;font-size:13px">This code expires in 10 minutes.</p>
        <p style="color:#666;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
    });

    res.json({ found: true });
  } catch (err) {
    console.error('POST /api/recover/send-otp error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/recover/verify-otp
app.post('/api/recover/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ error: 'Missing email or OTP' });

    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp)
      return res.status(401).json({ error: 'Invalid or expired OTP' });

    await redis.del(`otp:${email}`);

    // Find all completed orders for this email
    const orders = await query(
      `SELECT id, roast->'roast_title' as roast_title,
              before_score->'overall' as before_score,
              after_score->'overall' as after_score,
              created_at
       FROM orders WHERE email=$1 AND processing_status='done'
       AND created_at > NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC`,
      [email],
    );

    res.json({
      orders: orders.rows.map((o: any) => ({
        orderId: o.id,
        roastTitle: o.roast_title,
        beforeScore: o.before_score,
        afterScore: o.after_score,
        createdAt: o.created_at,
      })),
    });
  } catch (err) {
    console.error('POST /api/recover/verify-otp error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/recover/delete
app.post('/api/recover/delete', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    // Require valid OTP session — re-verify or use a token
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp)
      return res.status(401).json({ error: 'Please verify your email first' });

    await redis.del(`otp:${email}`);

    // Delete order data (keep payment record but clear personal data)
    await query(
      `UPDATE orders SET profile_input=NULL, parsed_profile=NULL, analysis=NULL,
       roast=NULL, rewrite=NULL, quality_check=NULL, card_image_url=NULL
       WHERE email=$1`, [email],
    );
    await query('DELETE FROM result_lookups WHERE email=$1', [email]);

    res.json({ deleted: true });
  } catch (err) {
    console.error('POST /api/recover/delete error:', err);
    res.status(500).json({ error: 'Deletion failed' });
  }
});

// ==================== START ====================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startAllCrons();
});

export default app;

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
import resumeRouter from './routes/resume';
import buildRouter from './routes/build';
import dashboardRouter from './routes/dashboard';
import interviewPrepRouter from './routes/interview-prep';

dotenv.config();

// --- Sentry ---
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
}

import { profileQueue, upgradeQueue } from './queue';
import { buildQueue } from './queue/build-queue';

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
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
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
        message: `${limit} requests per ${windowSecs / 3600} hour(s). Try the full rewrite for ₹499.`,
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
app.use('/api/resume', resumeRouter);
app.use('/api/build', buildRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/interview-prep', interviewPrepRouter);

// ==================== LINKEDIN PDF PARSE ====================
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
const linkedinPdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const linkedinGenAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// POST /api/linkedin-pdf/parse — Upload LinkedIn "Save to PDF" file, extract structured profile data
app.post('/api/linkedin-pdf/parse', rateLimiter('linkedin-pdf', 10, 3600),
  linkedinPdfUpload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    if (req.file.mimetype !== 'application/pdf')
      return res.status(400).json({ error: 'Only PDF files are supported. Please upload your LinkedIn PDF.' });

    // Check cache by PDF content hash
    const pdfHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const cacheKey = `pdf-parse:v2:${pdfHash}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      const cachedResult = JSON.parse(cached);
      return res.json({ ...cachedResult, cached: true });
    }

    // Step 1: Extract raw text from PDF using Gemini with inline data
    const base64 = req.file.buffer.toString('base64');
    const model = linkedinGenAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const extractResult = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'application/pdf', data: base64 } },
          { text: `Extract ALL text content from this LinkedIn "Save to PDF" profile document.
Return the raw text exactly as it appears, preserving sections like:
- Name, Headline, Location
- About/Summary
- Experience (company, role, dates, descriptions)
- Education (institution, degree, dates)
- Skills
- Certifications, Licenses
- Volunteer Experience
- Languages

Return ONLY the extracted text, no commentary. Preserve line breaks between sections.` },
        ],
      }],
      generationConfig: { temperature: 0.0, maxOutputTokens: 16000 },
    });

    const rawText = extractResult.response.text().trim();
    if (!rawText || rawText.length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from this PDF. Is this a LinkedIn "Save to PDF" file?' });
    }

    // Step 2: Parse extracted text into structured profile data using Gemini
    const parseResult = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `Parse this LinkedIn profile text into structured JSON.

TEXT:
${rawText.slice(0, 25000)}

Return ONLY valid JSON (no markdown, no \`\`\`, no commentary) with this exact structure:
{
  "full_name": "string",
  "headline": "string (the professional headline/tagline)",
  "location": "string or null",
  "about": "string or null (the About/Summary section)",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string or null (e.g. 'Jan 2020 - Present')",
      "description": "string or null"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string or null",
      "field": "string or null",
      "year": "string or null"
    }
  ],
  "skills": ["string array of skills"],
  "certifications": ["string array"],
  "languages": ["string array"],
  "honors_awards": ["string array"],
  "raw_text_length": number
}

CRITICAL RULES:
- Extract EVERY experience entry — the profile may have 5-10+ roles. Output ONE object per role.
- If the same company has multiple titles (e.g. promoted from Account Manager to Team Lead to Sales Manager), output each as a SEPARATE experience entry with its own title, duration, and description.
- Do NOT merge multiple roles into one entry. Do NOT stop after the first company.
- Extract ALL skills, certifications, languages, and honors/awards listed anywhere in the document.
- Extract ALL education entries (there may be 2-4).
- Keep full dates (e.g. "July 2025 - Present", NOT "July 202"). If a date looks truncated, infer the full year from context.
- Keep experience descriptions as-is, don't summarize.
- For headline, extract the professional tagline (usually right below the name).
- If a section is missing, use null or empty array.
- raw_text_length should be the approximate character count of the full profile.` }],
      }],
      generationConfig: { temperature: 0.0, maxOutputTokens: 12000 },
    });

    let parseText = parseResult.response.text().trim();
    // Strip markdown code fences if present
    parseText = parseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let parsed;
    try {
      parsed = JSON.parse(parseText);
    } catch {
      try {
        const { jsonrepair: jr } = require('jsonrepair');
        parsed = JSON.parse(jr(parseText));
      } catch {
        return res.status(500).json({ error: 'Failed to parse profile structure. Please try pasting your profile text instead.' });
      }
    }

    // Build raw_paste from structured data (for order creation compatibility)
    const sections: string[] = [];
    if (parsed.full_name) sections.push(parsed.full_name);
    if (parsed.headline) sections.push(parsed.headline);
    if (parsed.location) sections.push(parsed.location);
    if (parsed.about) sections.push(`About:\n${parsed.about}`);
    if (parsed.experience?.length) {
      sections.push('Experience:');
      for (const exp of parsed.experience) {
        sections.push(`${exp.title} at ${exp.company}${exp.duration ? ` (${exp.duration})` : ''}`);
        if (exp.description) sections.push(exp.description);
      }
    }
    if (parsed.education?.length) {
      sections.push('Education:');
      for (const edu of parsed.education) {
        sections.push(`${edu.degree || ''} ${edu.field || ''} - ${edu.institution}${edu.year ? ` (${edu.year})` : ''}`);
      }
    }
    if (parsed.skills?.length) sections.push(`Skills: ${parsed.skills.join(', ')}`);
    if (parsed.certifications?.length) sections.push(`Certifications: ${parsed.certifications.join(', ')}`);

    const rawPaste = sections.join('\n');

    const responseData = {
      parsed,
      headline: parsed.headline || parsed.full_name || '',
      raw_paste: rawPaste,
      raw_text: rawText.slice(0, 15000),
      raw_text_length: rawText.length,
    };

    // Cache for 7 days
    await redis.setex(cacheKey, 604800, JSON.stringify(responseData));

    res.json(responseData);
  } catch (err: any) {
    console.error('LinkedIn PDF parse error:', err.message, err.stack?.slice(0, 300));
    res.status(500).json({ error: `Failed to parse LinkedIn PDF: ${err.message?.slice(0, 100)}` });
  }
});

// ==================== REDEEM CODE ====================

// POST /api/redeem-code — Redeem a one-time referral code
app.post('/api/redeem-code', async (req: Request, res: Response) => {
  try {
    const { code, email, headline, form_input, profile_data, input_source } = req.body;
    const validInputSources = ['resume', 'linkedin', 'questionnaire'];
    const safeInputSource = validInputSources.includes(input_source) ? input_source : 'linkedin';
    if (!code || !email)
      return res.status(400).json({ error: 'code and email are required' });
    if (!validateEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });

    // Look up code
    const codeResult = await query(
      "SELECT * FROM referral_codes WHERE code=$1 AND status='active'",
      [code.trim().toUpperCase()],
    );
    if (!codeResult.rows.length)
      return res.status(400).json({ error: 'Invalid or already redeemed code' });

    const rc = codeResult.rows[0];

    if (rc.product === 'rewrite') {
      // Accept headline from either field or profile_data
      const profileText = headline || profile_data?.raw_paste || '';
      if (!profileText || profileText.trim().length < 10)
        return res.status(400).json({ error: 'Please upload your LinkedIn PDF or paste your profile text' });

      const hash = crypto.createHash('sha256')
        .update(JSON.stringify({ raw_paste: profileText.trim() })).digest('hex');

      const amounts: Record<string, number> = { standard: 49900, pro: 99900 };
      const result = await query(
        `INSERT INTO orders (email, plan, amount_paise, payment_status, payment_type,
         profile_input, profile_hash, ip_address, processing_status, input_source)
         VALUES ($1, $2, $3, 'paid', 'referral_code', $4, $5, $6, 'queued', $7) RETURNING id`,
        [
          email, rc.plan, amounts[rc.plan] || 29900,
          JSON.stringify({ raw_paste: profileText.trim() }), hash, req.ip, safeInputSource,
        ],
      );
      const orderId = result.rows[0].id;

      // Mark code as redeemed
      await query(
        "UPDATE referral_codes SET status='redeemed', redeemed_at=NOW(), redeemed_by_email=$1, order_id=$2 WHERE code=$3",
        [email, orderId, rc.code],
      );

      // Enqueue for processing
      await profileQueue.add('job', { order_id: orderId });

      return res.json({ order_id: orderId, redirect_url: `/results/${orderId}` });
    }

    if (rc.product === 'build') {
      // Create a build order — form_input defaults to empty object (NOT NULL constraint)
      const amounts: Record<string, number> = { standard: 49900, pro: 99900, starter: 19900, plus: 39900 };
      const formData = form_input ? JSON.stringify(form_input) : JSON.stringify({});
      const result = await query(
        `INSERT INTO build_orders (email, plan, amount_paise, payment_status, payment_type,
         form_input, ip_address, processing_status)
         VALUES ($1, $2, $3, 'paid', 'referral_code', $4, $5, 'pending') RETURNING id`,
        [email, rc.plan, amounts[rc.plan] || 19900, formData, req.ip],
      );
      const orderId = result.rows[0].id;

      // Mark code as redeemed
      await query(
        "UPDATE referral_codes SET status='redeemed', redeemed_at=NOW(), redeemed_by_email=$1, order_id=$2 WHERE code=$3",
        [email, orderId, rc.code],
      );

      // Redirect to form — user fills details, then processing starts
      return res.json({ order_id: orderId, redirect_url: `/build/form?plan=${rc.plan}&orderId=${orderId}` });
    }

    return res.status(400).json({ error: 'Invalid product type on code' });
  } catch (err) {
    console.error('POST /api/redeem-code error:', err);
    res.status(500).json({ error: 'Failed to redeem code' });
  }
});

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

      // ── BUILD UPGRADE PAYMENT ──
      if (paymentType === 'build_upgrade') {
        const originalOrderId = payment.notes?.original_order_id;
        if (!originalOrderId)
          return res.status(400).json({ error: 'missing_order_id' });

        const check = await query(
          'SELECT upgraded_to_pro FROM build_orders WHERE id=$1', [originalOrderId]);
        if (check.rows[0]?.upgraded_to_pro)
          return res.json({ status: 'already_upgraded' });

        await query(
          `UPDATE build_orders SET plan='pro', upgraded_to_pro=TRUE,
           upgrade_order_id=$1 WHERE id=$2`,
          [payment.order_id, originalOrderId]);

        return res.json({ status: 'build_upgrade_done' });
      }

      // ── BUILD ORDER PAYMENT ──
      if (paymentType === 'build') {
        const buildCheck = await query(
          'SELECT payment_status FROM build_orders WHERE razorpay_order_id=$1',
          [payment.order_id]);
        if (buildCheck.rows[0]?.payment_status === 'paid')
          return res.json({ status: 'already_processed' });

        await query(
          `UPDATE build_orders SET payment_status='paid', razorpay_payment_id=$1,
           paid_at=NOW(), processing_status='queued' WHERE razorpay_order_id=$2`,
          [payment.id, payment.order_id]);

        await buildQueue.add('job', { razorpay_order_id: payment.order_id });

        // Credit influencer for build orders
        const buildOrder = await query(
          'SELECT influencer_slug, plan FROM build_orders WHERE razorpay_order_id=$1',
          [payment.order_id],
        );
        if (buildOrder.rows[0]?.influencer_slug) {
          const slug = buildOrder.rows[0].influencer_slug;
          const bPlan = buildOrder.rows[0].plan || 'starter';
          const commFieldMap: Record<string, string> = {
            student: 'commission_build_starter',
            starter: 'commission_build_starter',
            plus: 'commission_build_plus',
            standard: 'commission_build_plus',
            pro: 'commission_build_pro',
          };
          const commField = commFieldMap[bPlan] || 'commission_build_starter';
          const inf = await query(
            `SELECT email, ${commField} as commission FROM influencers WHERE slug=$1`,
            [slug],
          );
          if (inf.rows.length) {
            const commission = inf.rows[0].commission || 0;
            await query(
              `UPDATE influencers SET total_referrals=total_referrals+1,
               total_earnings=total_earnings+$1 WHERE slug=$2`,
              [commission, slug],
            );
            if (inf.rows[0].email) {
              try {
                const { Resend } = require('resend');
                const resendClient = new Resend(process.env.RESEND_API_KEY);
                await resendClient.emails.send({
                  from: `Profile Roaster <${process.env.FROM_EMAIL || 'support@profileroaster.in'}>`,
                  to: inf.rows[0].email,
                  subject: `New referral! You earned Rs ${commission} from ProfileRoaster`,
                  html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
                    <h2 style="color:#057642;margin-bottom:16px">New Referral Conversion!</h2>
                    <p style="color:#333;font-size:15px">Someone purchased the <strong>${bPlan}</strong> Build plan using your referral link.</p>
                    <p style="color:#333;font-size:15px">Commission: <strong>Rs ${commission}</strong></p>
                  </div>`,
                });
              } catch (emailErr) {
                console.error('Failed to send influencer email:', emailErr);
              }
            }
          }
        }

        return res.json({ status: 'build_queued' });
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
        'SELECT referral_code, email, plan, influencer_slug FROM orders WHERE razorpay_order_id=$1',
        [payment.order_id]);
      if (fullOrder.rows[0]?.referral_code) {
        await query(
          `UPDATE referrals SET uses_count=uses_count+1,
           earnings_paise=earnings_paise+5000 WHERE referral_code=$1`,
          [fullOrder.rows[0].referral_code]);
      }

      // Credit influencer
      if (fullOrder.rows[0]?.influencer_slug) {
        const slug = fullOrder.rows[0].influencer_slug;
        const orderPlan = fullOrder.rows[0].plan || 'standard';
        const commField = orderPlan === 'pro' ? 'commission_pro' : 'commission_standard';
        const inf = await query(
          `SELECT email, ${commField} as commission FROM influencers WHERE slug=$1`,
          [slug],
        );
        if (inf.rows.length) {
          const commission = inf.rows[0].commission || 0;
          await query(
            `UPDATE influencers SET total_referrals=total_referrals+1,
             total_earnings=total_earnings+$1 WHERE slug=$2`,
            [commission, slug],
          );
          // Email influencer about the conversion
          if (inf.rows[0].email) {
            try {
              const { Resend } = require('resend');
              const resendClient = new Resend(process.env.RESEND_API_KEY);
              const updatedInf = await query('SELECT total_earnings FROM influencers WHERE slug=$1', [slug]);
              await resendClient.emails.send({
                from: `Profile Roaster <${process.env.FROM_EMAIL || 'support@profileroaster.in'}>`,
                to: inf.rows[0].email,
                subject: `New referral! You earned Rs ${commission} from ProfileRoaster`,
                html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
                  <h2 style="color:#057642;margin-bottom:16px">New Referral Conversion!</h2>
                  <p style="color:#333;font-size:15px">Someone purchased the <strong>${orderPlan}</strong> plan using your referral link.</p>
                  <p style="color:#333;font-size:15px">Commission: <strong>Rs ${commission}</strong></p>
                  <p style="color:#333;font-size:15px">Total earnings: <strong>Rs ${updatedInf.rows[0]?.total_earnings || commission}</strong></p>
                  <p style="color:#666;font-size:13px;margin-top:20px">Keep sharing your link to earn more!</p>
                </div>`,
              });
            } catch (emailErr) {
              console.error('Failed to send influencer email:', emailErr);
            }
          }
        }
      }

      trackPaymentCompleted(
        order?.email || 'unknown',
        fullOrder.rows[0]?.plan || 'standard',
        payment.amount,
      );
    }

    if (body.event === 'payment.failed') {
      const failedOrderId = body.payload.payment.entity.order_id;
      await query('UPDATE orders SET payment_status=$1 WHERE razorpay_order_id=$2', ['failed', failedOrderId]);
      await query('UPDATE build_orders SET payment_status=$1 WHERE razorpay_order_id=$2', ['failed', failedOrderId]);
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
    const { email, plan, profile_data, job_description, teaser_id, input_source, target_role } = req.body;
    const validInputSources = ['resume', 'linkedin', 'questionnaire'];
    const safeInputSource = validInputSources.includes(input_source) ? input_source : 'linkedin';

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

    // Validate referral code or influencer slug
    let influencerSlug: string | null = null;
    if (req.query.ref) {
      // Check if it's an influencer slug first
      const infCheck = await query(
        "SELECT slug FROM influencers WHERE slug=$1 AND status='active'",
        [req.query.ref],
      );
      if (infCheck.rows.length) {
        influencerSlug = infCheck.rows[0].slug;
      } else {
        const refCheck = await query(
          'SELECT id FROM referrals WHERE referral_code=$1',
          [req.query.ref],
        );
        if (!refCheck.rows.length)
          return res.status(400).json({ error: 'Invalid referral code' });
      }
    }

    const amounts: Record<string, number> = { standard: 49900, pro: 99900 };
    const rzpOrder = await razorpay.orders.create({
      amount: amounts[plan],
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { email, plan, type: 'new_order' },
    });

    const result = await query(
      `INSERT INTO orders (email,plan,amount_paise,razorpay_order_id,
       profile_input,job_description,teaser_id,profile_hash,ip_address,
       utm_source,utm_medium,utm_campaign,referral_code,influencer_slug,
       input_source,target_role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [
        email, plan, amounts[plan], rzpOrder.id,
        JSON.stringify(profile_data), job_description || null,
        teaser_id || null, hash, req.ip,
        req.query.utm_source || null, req.query.utm_medium || null,
        req.query.utm_campaign || null, req.query.ref || null,
        influencerSlug, safeInputSource, target_role || null,
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
    const { headline, input_source, target_role } = req.body;

    if (!headline || headline.trim().length < 10)
      return res.status(400).json({ errors: ['Please paste your LinkedIn headline (at least 10 characters).'] });

    if (headline.trim().length > 500)
      return res.status(400).json({ error: 'invalid_input', message: 'Headline is too long. Please paste only your LinkedIn headline, not your full profile.' });

    if (!/[a-zA-Z\u0900-\u097F]/.test(headline))
      return res.status(400).json({ error: 'invalid_input', message: 'Please paste your actual LinkedIn headline.' });

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
         ip_address, user_agent, utm_source, utm_medium, utm_campaign,
         input_source, target_role)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
        [headline, cachedResult.score, JSON.stringify(cachedResult.issues),
         req.ip, req.headers['user-agent'] || null,
         (req.query.utm_source as string) || null, (req.query.utm_medium as string) || null,
         (req.query.utm_campaign as string) || null,
         input_source || 'linkedin', target_role || null],
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
       ip_address, user_agent, utm_source, utm_medium, utm_campaign,
       input_source, target_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        headline,
        result.score,
        JSON.stringify(result.issues),
        req.ip,
        req.headers['user-agent'] || null,
        (req.query.utm_source as string) || null,
        (req.query.utm_medium as string) || null,
        (req.query.utm_campaign as string) || null,
        input_source || 'linkedin',
        target_role || null,
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
      amount: 50000,
      currency: 'INR',
      receipt: `upg_${req.params.id.slice(0, 32)}`,
      notes: { original_order_id: req.params.id, type: 'upgrade' } as any,
    }) as any;

    res.json({
      razorpay_order_id: rzpOrder.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      amount: 50000,
      currency: 'INR',
    });
  } catch (err) {
    console.error('POST /api/orders/:id/upgrade error:', err);
    res.status(500).json({ error: 'Failed to create upgrade order' });
  }
});

// POST /api/build/:id/upgrade — Upgrade a build order to Pro
app.post('/api/build/:id/upgrade', async (req: Request, res: Response) => {
  try {
    const orderResult = await query(
      'SELECT * FROM build_orders WHERE id=$1 AND payment_status=$2',
      [req.params.id, 'paid']);
    if (!orderResult.rows[0])
      return res.status(404).json({ error: 'Order not found' });
    if (orderResult.rows[0].plan === 'pro')
      return res.status(400).json({ error: 'Already Pro' });
    if (orderResult.rows[0].upgraded_to_pro)
      return res.status(400).json({ error: 'Already upgraded' });

    const rzpOrder = await razorpay.orders.create({
      amount: 50000,
      currency: 'INR',
      receipt: `bupg_${req.params.id.slice(0, 32)}`,
      notes: { original_order_id: req.params.id, type: 'build_upgrade' } as any,
    }) as any;

    res.json({
      razorpay_order_id: rzpOrder.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      amount: 50000,
      currency: 'INR',
    });
  } catch (err) {
    console.error('POST /api/build/:id/upgrade error:', err);
    res.status(500).json({ error: 'Failed to create build upgrade order' });
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

    const refCode = 'PR' + o.id.replace(/-/g, '').slice(0, 8).toUpperCase();
    await query(
      `INSERT INTO referrals (referrer_email, referral_code)
       VALUES ($1, $2) ON CONFLICT (referral_code) DO NOTHING`,
      [o.email, refCode]);

    res.json({
      order_id: o.id,
      status: 'done',
      plan: o.plan,
      input_source: o.input_source || 'linkedin',
      results: {
        scores: { before: o.before_score, after: o.after_score },
        rewrite: o.rewrite,
        analysis: o.analysis,
        card_image_url: o.card_image_url,
      },
      referral_code: refCode,
      referral_url: `https://profileroaster.in/?ref=${refCode}`,
      parsed_profile: o.parsed_profile ? {
        ...o.parsed_profile,
        name: o.parsed_profile.full_name || o.parsed_profile.name || o.parsed_profile.headline?.split('|')[0]?.trim(),
      } : undefined,
      profile_input: o.profile_input, // raw input for extracting phone/linkedin/etc
      email: o.email,
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


// ==================== RECOVERY ====================

// POST /api/recover/send-otp
app.post('/api/recover/send-otp', rateLimiter('recover-otp', 5, 3600), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });

    // Check orders, result_lookups, and build_orders
    const orders = await query(
      `SELECT id FROM orders WHERE email=$1 AND processing_status='done'
       AND created_at > NOW() - INTERVAL '30 days'
       UNION
       SELECT order_id as id FROM result_lookups WHERE email=$1
       AND created_at > NOW() - INTERVAL '30 days'
       UNION
       SELECT id FROM build_orders WHERE email=$1 AND processing_status='done'
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
        <p style="color:#333;font-size:15px">Use this code to access your LinkedIn profile results:</p>
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
      `SELECT id, before_score->'overall' as before_score,
              after_score->'overall' as after_score,
              created_at
       FROM orders WHERE email=$1 AND processing_status='done'
       AND created_at > NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC`,
      [email],
    );

    // Find all completed build orders for this email
    const buildOrders = await query(
      `SELECT id, plan, generated_profile->'headline_variations'->0->>'text' as headline,
              created_at
       FROM build_orders WHERE email=$1 AND processing_status='done'
       AND created_at > NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC`,
      [email],
    );

    res.json({
      orders: orders.rows.map((o: any) => ({
        orderId: o.id,
        type: 'rewrite',
        beforeScore: o.before_score,
        afterScore: o.after_score,
        createdAt: o.created_at,
      })),
      buildOrders: buildOrders.rows.map((o: any) => ({
        orderId: o.id,
        type: 'build',
        headline: o.headline,
        plan: o.plan,
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

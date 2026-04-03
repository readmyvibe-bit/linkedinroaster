import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Redis from 'ioredis';
import { Resend } from 'resend';
import { query } from '../db';
import { validateEmail } from '../lib/validation';

const router = Router();
const redis = new Redis(process.env.UPSTASH_REDIS_URL!);
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
const FROM = `Profile Roaster <${process.env.FROM_EMAIL || 'support@profileroaster.in'}>`;

const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// Auth middleware — sessions stored in Redis for persistence across deploys
async function dashAuth(req: Request, res: Response, next: Function) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    const sessionData = await redis.get(`dash-session:${token}`);
    if (!sessionData) return res.status(401).json({ error: 'Session expired' });
    const session = JSON.parse(sessionData);
    (req as any).userEmail = session.email;
    (req as any).userId = session.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired' });
  }
}

// POST /api/dashboard/send-otp
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email))
      return res.status(400).json({ error: 'Invalid email' });

    // Check if user has any orders
    const hasOrders = await query(
      `SELECT EXISTS(
        SELECT 1 FROM orders WHERE email=$1 AND payment_status='paid'
        UNION
        SELECT 1 FROM build_orders WHERE email=$1 AND payment_status='paid'
      ) as found`,
      [email],
    );
    if (!hasOrders.rows[0].found)
      return res.json({ found: false });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await redis.setex(`dash-otp:${email}`, 600, otp); // 10 min

    // Send OTP email
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Your login code: ${otp}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto;padding:20px;text-align:center">
          <h2 style="color:#191919;margin-bottom:8px">Dashboard Login</h2>
          <p style="color:#666;font-size:14px;margin-bottom:20px">Your verification code is:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:6px;color:#004182;margin-bottom:20px">${otp}</div>
          <p style="color:#999;font-size:12px">Code expires in 10 minutes. Do not share this code.</p>
        </div>
      `,
    });

    res.json({ found: true });
  } catch (err: any) {
    console.error('Dashboard send-otp error:', err.message);
    res.status(500).json({ error: 'Failed to send code' });
  }
});

// POST /api/dashboard/verify-otp
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Missing email or code' });

    const stored = await redis.get(`dash-otp:${email}`);
    if (!stored || stored !== otp)
      return res.status(401).json({ error: 'Invalid or expired code' });

    await redis.del(`dash-otp:${email}`);

    // Upsert user
    const result = await query(
      `INSERT INTO users (email, last_login) VALUES ($1, NOW())
       ON CONFLICT (email) DO UPDATE SET last_login=NOW()
       RETURNING id`,
      [email],
    );
    const userId = result.rows[0].id;

    // Create session in Redis
    const token = crypto.randomBytes(32).toString('hex');
    await redis.setex(`dash-session:${token}`, SESSION_TTL, JSON.stringify({ email, userId }));

    res.json({ token, email, userId });
  } catch (err: any) {
    console.error('Dashboard verify-otp error:', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /api/dashboard/me — check session
router.get('/me', dashAuth, (req: Request, res: Response) => {
  res.json({ email: (req as any).userEmail, userId: (req as any).userId });
});

// GET /api/dashboard/data — all user data
router.get('/data', dashAuth, async (req: Request, res: Response) => {
  try {
    const email = (req as any).userEmail;

    // Roast orders
    const roastOrders = await query(
      `SELECT id, plan, payment_status, processing_status,
              before_score->'overall' as before_score,
              after_score->'overall' as after_score,
              roast->'roast_title' as roast_title,
              card_image_url, user_rating, created_at, processing_done_at
       FROM orders WHERE email=$1 AND payment_status='paid'
       ORDER BY created_at DESC`,
      [email],
    );

    // Build orders
    const buildOrders = await query(
      `SELECT id, plan, payment_status, processing_status,
              generated_profile->'headline_variations'->0->>'text' as headline,
              user_rating, created_at, processing_done_at
       FROM build_orders WHERE email=$1 AND payment_status='paid'
       ORDER BY created_at DESC`,
      [email],
    );

    // Resumes — from both roast and build orders
    const resumes = await query(
      `SELECT r.id, r.order_id, r.target_role, r.target_company, r.template_id,
              r.ats_score, r.job_description, r.cover_letter IS NOT NULL as has_cover_letter,
              r.created_at
       FROM resumes r
       WHERE r.order_id IN (
         SELECT id FROM orders WHERE email=$1
         UNION
         SELECT id FROM build_orders WHERE email=$1
       )
       ORDER BY r.created_at DESC`,
      [email],
    );

    // Interview preps — joined via resumes
    const interviewPreps = await query(
      `SELECT ip.id, ip.target_role, ip.target_company, ip.status, ip.created_at
       FROM interview_preps ip
       JOIN resumes r ON r.id = ip.resume_id
       WHERE r.order_id IN (
         SELECT id FROM orders WHERE email=$1
         UNION
         SELECT id FROM build_orders WHERE email=$1
       )
       ORDER BY ip.created_at DESC`,
      [email],
    );

    // Per-order usage stats
    const allOrderIds = [
      ...roastOrders.rows.map((o: any) => o.id),
      ...buildOrders.rows.map((o: any) => o.id),
    ];

    let resumeCountMap: Record<string, number> = {};
    let interviewPrepCountMap: Record<string, number> = {};

    if (allOrderIds.length > 0) {
      const resumeCounts = await query(
        `SELECT order_id, COUNT(*)::int as count FROM resumes WHERE order_id = ANY($1) GROUP BY order_id`,
        [allOrderIds],
      );
      for (const row of resumeCounts.rows) {
        resumeCountMap[row.order_id] = row.count;
      }

      const interviewPrepCounts = await query(
        `SELECT r.order_id, COUNT(ip.id)::int as count FROM interview_preps ip JOIN resumes r ON r.id = ip.resume_id WHERE r.order_id = ANY($1) GROUP BY r.order_id`,
        [allOrderIds],
      );
      for (const row of interviewPrepCounts.rows) {
        interviewPrepCountMap[row.order_id] = row.count;
      }
    }

    // Quota helper
    const getMaxResumes = (plan: string, source: 'roast' | 'build') => {
      if (source === 'build') {
        return plan === 'pro' ? 10 : plan === 'standard' ? 5 : plan === 'plus' ? 5 : 0;
      }
      return plan === 'pro' ? 10 : 5;
    };

    res.json({
      roastOrders: roastOrders.rows.map((o: any) => ({
        id: o.id, plan: o.plan, status: o.processing_status,
        beforeScore: o.before_score, afterScore: o.after_score,
        roastTitle: o.roast_title, cardImageUrl: o.card_image_url,
        rating: o.user_rating, createdAt: o.created_at, completedAt: o.processing_done_at,
        resumesUsed: resumeCountMap[o.id] || 0,
        interviewPrepsUsed: interviewPrepCountMap[o.id] || 0,
        maxResumes: getMaxResumes(o.plan, 'roast'),
      })),
      buildOrders: buildOrders.rows.map((o: any) => ({
        id: o.id, plan: o.plan, status: o.processing_status,
        headline: o.headline, rating: o.user_rating,
        createdAt: o.created_at, completedAt: o.processing_done_at,
        resumesUsed: resumeCountMap[o.id] || 0,
        interviewPrepsUsed: interviewPrepCountMap[o.id] || 0,
        maxResumes: getMaxResumes(o.plan, 'build'),
      })),
      resumes: resumes.rows.map((r: any) => ({
        id: r.id, orderId: r.order_id, targetRole: r.target_role,
        targetCompany: r.target_company, templateId: r.template_id,
        atsScore: r.ats_score, hasCoverLetter: r.has_cover_letter,
        jobDescription: r.job_description?.slice(0, 200) || '',
        createdAt: r.created_at,
      })),
      interviewPreps: interviewPreps.rows.map((ip: any) => ({
        id: ip.id, targetRole: ip.target_role, targetCompany: ip.target_company,
        status: ip.status, createdAt: ip.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Dashboard data error:', err.message);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

export default router;

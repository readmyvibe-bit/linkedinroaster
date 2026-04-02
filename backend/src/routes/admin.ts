import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { sendResultsEmail } from '../services/email';
import { profileQueue } from '../queue';
import { buildQueue } from '../queue/build-queue';

const router = Router();

// ═══════════════════════════════════════════
// Secure Admin Auth with session tokens
// ═══════════════════════════════════════════
const ADMIN_EMAIL = 'support@profileroaster.in';
const activeSessions = new Map<string, { email: string; createdAt: number }>();
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

// POST /api/admin/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  if (email !== ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, { email, createdAt: Date.now() });

  // Clean expired sessions
  for (const [k, v] of activeSessions) {
    if (Date.now() - v.createdAt > SESSION_TTL) activeSessions.delete(k);
  }

  res.json({ token, email });
});

// Auth middleware — accepts session token OR legacy password
function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });

  const token = auth.replace('Bearer ', '');

  // Check session token first
  const session = activeSessions.get(token);
  if (session && Date.now() - session.createdAt < SESSION_TTL) return next();

  // Fallback: legacy password
  if (token === process.env.ADMIN_PASSWORD) return next();

  return res.status(401).json({ error: 'Unauthorized' });
}

router.use('/overview', adminAuth);
router.use('/orders', adminAuth);
router.use('/teasers', adminAuth);
router.use('/revenue', adminAuth);
router.use('/referrals', adminAuth);
router.use('/send-email', adminAuth);
router.use('/approve-order', adminAuth);
router.use('/reprocess-order', adminAuth);
router.use('/reprocess-build-order', adminAuth);

// GET /api/admin/overview
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const today = await query(`
      SELECT
        COUNT(*) FILTER (WHERE payment_status='paid')::int AS orders,
        COALESCE(SUM(amount_paise) FILTER (WHERE payment_status='paid'), 0)::int AS revenue_paise
      FROM (
        SELECT payment_status, amount_paise, created_at FROM orders WHERE created_at >= CURRENT_DATE
        UNION ALL
        SELECT payment_status, amount_paise, created_at FROM build_orders WHERE created_at >= CURRENT_DATE
      ) combined
    `);
    const teasersToday = await query(
      `SELECT COUNT(*)::int AS cnt FROM teaser_attempts WHERE created_at >= CURRENT_DATE`,
    );
    const convToday = await query(`
      SELECT COUNT(*)::int AS cnt FROM teaser_attempts
      WHERE created_at >= CURRENT_DATE AND converted = TRUE
    `);

    const week = await query(`
      SELECT COUNT(*) FILTER (WHERE payment_status='paid')::int AS orders,
        COALESCE(SUM(amount_paise) FILTER (WHERE payment_status='paid'), 0)::int AS revenue_paise
      FROM (
        SELECT payment_status, amount_paise, created_at FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        UNION ALL
        SELECT payment_status, amount_paise, created_at FROM build_orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      ) combined
    `);
    const month = await query(`
      SELECT COUNT(*) FILTER (WHERE payment_status='paid')::int AS orders,
        COALESCE(SUM(amount_paise) FILTER (WHERE payment_status='paid'), 0)::int AS revenue_paise
      FROM (
        SELECT payment_status, amount_paise, created_at FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        UNION ALL
        SELECT payment_status, amount_paise, created_at FROM build_orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      ) combined
    `);

    const activeJobs = await query(
      `SELECT COUNT(*)::int AS cnt FROM orders WHERE processing_status NOT IN ('done','failed','queued') AND payment_status='paid'`,
    );
    const refunds = await query(`
      SELECT
        COUNT(*) FILTER (WHERE payment_status='refunded')::int AS refunded,
        COUNT(*) FILTER (WHERE payment_status='paid')::int AS paid
      FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    const totalPaid = refunds.rows[0].paid + refunds.rows[0].refunded;
    const refundRate = totalPaid > 0 ? (refunds.rows[0].refunded / totalPaid) * 100 : 0;

    const tTotal = teasersToday.rows[0].cnt;
    const tConverted = convToday.rows[0].cnt;

    // Pipeline stage breakdown
    const stages = await query(`
      SELECT processing_status, COUNT(*)::int AS cnt
      FROM orders WHERE payment_status='paid' AND processing_status NOT IN ('done','failed')
      GROUP BY processing_status
    `);

    // Average processing time (completed orders today)
    const avgTime = await query(`
      SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (processing_done_at - paid_at))), 0)::int AS avg_seconds
      FROM orders WHERE processing_status='done' AND paid_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // Conversion funnel
    const funnel = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM teaser_attempts WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS teasers,
        (SELECT COUNT(*)::int FROM teaser_attempts WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND email IS NOT NULL) AS emails_captured,
        (SELECT COUNT(*)::int FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS payments_initiated,
        (SELECT COUNT(*)::int FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND payment_status='paid') AS payments_completed,
        (SELECT COUNT(*)::int FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND processing_status='done') AS results_delivered
    `);

    // Emails sent today
    const emailsSent = await query(`
      SELECT COUNT(*)::int AS cnt FROM orders
      WHERE email_sent=TRUE AND processing_done_at >= CURRENT_DATE
    `);

    // Auto-cancelled today
    const autoCancelled = await query(`
      SELECT COUNT(*)::int AS cnt FROM orders
      WHERE processing_error='timeout_auto_cancelled' AND processing_done_at >= CURRENT_DATE
    `);

    res.json({
      today: {
        orders: today.rows[0].orders,
        revenue_paise: today.rows[0].revenue_paise,
        teasers: tTotal,
        conversion_pct: tTotal > 0 ? Math.round((tConverted / tTotal) * 100) : 0,
        emails_sent: emailsSent.rows[0].cnt,
        auto_cancelled: autoCancelled.rows[0].cnt,
      },
      week: week.rows[0],
      month: month.rows[0],
      active_jobs: activeJobs.rows[0].cnt,
      refund_rate: Math.round(refundRate * 100) / 100,
      total_teasers_today: tTotal,
      avg_processing_seconds: avgTime.rows[0].avg_seconds,
      pipeline_stages: stages.rows,
      funnel: funnel.rows[0],
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /api/admin/orders — now with FULL email visible
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (req.query.status) {
      where += ` AND payment_status=$${paramIdx++}`;
      params.push(req.query.status);
    }
    if (req.query.from) {
      where += ` AND created_at >= $${paramIdx++}`;
      params.push(req.query.from);
    }
    if (req.query.to) {
      where += ` AND created_at <= $${paramIdx++}`;
      params.push(req.query.to);
    }

    const countResult = await query(`SELECT COUNT(*)::int AS total FROM orders ${where}`, params);
    const result = await query(
      `SELECT id, email, plan, payment_status, processing_status, before_score, after_score,
              user_rating, user_feedback, created_at, paid_at, processing_done_at
       FROM orders ${where} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset],
    );

    res.json({
      orders: result.rows.map(o => ({
        ...o,
        before_score: o.before_score?.overall,
        after_score: o.after_score?.overall,
      })),
      total: countResult.rows[0].total,
      page,
      limit,
    });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/admin/orders/:id — full unmasked details
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/admin/send-email/:id — resend results email
router.post('/send-email/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = result.rows[0];
    if (order.processing_status !== 'done')
      return res.status(400).json({ error: 'Order not completed yet' });

    await sendResultsEmail(order);
    res.json({ sent: true, email: order.email });
  } catch (err) {
    console.error('Admin send-email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// GET /api/admin/resumes/:orderId — list all resumes for an order
router.get('/resumes/:orderId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, target_role, target_company, ats_score, template_id, cover_letter, status, created_at FROM resumes WHERE order_id=$1 ORDER BY created_at DESC',
      [req.params.orderId],
    );
    res.json({ resumes: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// POST /api/admin/send-resume-email/:resumeId — send resume + cover letter via email
router.post('/send-resume-email/:resumeId', async (req: Request, res: Response) => {
  try {
    // Check both orders and build_orders for the email
    let result = await query('SELECT r.*, o.email as order_email FROM resumes r JOIN orders o ON r.order_id = o.id WHERE r.id=$1', [req.params.resumeId]);
    if (!result.rows.length) {
      result = await query('SELECT r.*, b.email as order_email FROM resumes r JOIN build_orders b ON r.order_id = b.id WHERE r.id=$1', [req.params.resumeId]);
    }
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });

    const resume = result.rows[0];
    const contact = resume.resume_data?.contact || {};
    const targetEmail = req.body.email || resume.order_email;
    const targetRole = resume.target_role || 'your target role';
    const targetCompany = resume.target_company || '';

    const { Resend } = require('resend');
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    await resendClient.emails.send({
      from: `Profile Roaster <${process.env.FROM_EMAIL || 'support@profileroaster.in'}>`,
      to: targetEmail,
      subject: `Your ATS Resume is Ready — ${targetRole}${targetCompany ? ' at ' + targetCompany : ''}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#004182;padding:20px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:20px">Your ATS Resume is Ready</h1>
          <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">ProfileRoaster Resume Builder</p>
        </div>
        <div style="background:white;padding:24px;border:1px solid #E0E0E0;border-top:none;border-radius:0 0 8px 8px">
          <p style="color:#333;font-size:15px;line-height:1.6">Hi ${contact.name || 'there'},</p>
          <p style="color:#333;font-size:14px;line-height:1.6">Your ATS-optimized resume for <strong>${targetRole}</strong>${targetCompany ? ' at <strong>' + targetCompany + '</strong>' : ''} is ready!</p>
          <div style="background:#F0F7FF;border:1px solid #BFDBFE;border-radius:8px;padding:16px;margin:16px 0">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-size:13px;font-weight:700;color:#1E40AF">ATS Score</span>
              <span style="font-size:20px;font-weight:700;color:${resume.ats_score >= 80 ? '#057642' : '#0A66C2'}">${resume.ats_score}%</span>
            </div>
            <p style="font-size:12px;color:#666;margin:0">Keywords matched: ${(resume.keywords_matched || []).length} | Template: ${resume.template_id || 'classic'}</p>
          </div>
          <a href="https://profileroaster.in/resume/${resume.id}" style="display:inline-block;background:#0A66C2;color:white;padding:12px 28px;border-radius:50px;font-size:15px;font-weight:700;text-decoration:none;margin:16px 0">View & Download Resume</a>
          ${resume.cover_letter ? `
            <div style="margin-top:20px;border-top:1px solid #E0E0E0;padding-top:16px">
              <h3 style="font-size:14px;color:#374151;margin-bottom:8px">Your Cover Letter</h3>
              <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:6px;padding:14px;font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap">${resume.cover_letter}</div>
            </div>
          ` : ''}
          <p style="margin-top:20px;font-size:12px;color:#999">Generated by <a href="https://profileroaster.in" style="color:#0A66C2">profileroaster.in</a></p>
        </div>
      </div>`,
    });

    res.json({ sent: true, email: targetEmail });
  } catch (err: any) {
    console.error('Admin send-resume-email error:', err.message);
    res.status(500).json({ error: 'Failed to send resume email' });
  }
});

// DELETE /api/admin/resumes/:resumeId — delete a resume
router.delete('/resumes/:resumeId', async (req: Request, res: Response) => {
  try {
    const result = await query('DELETE FROM resumes WHERE id=$1 RETURNING id', [req.params.resumeId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// POST /api/admin/approve-order/:id — manually approve and process order
router.post('/approve-order/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = result.rows[0];

    if (order.payment_status === 'paid' && order.processing_status === 'done')
      return res.status(400).json({ error: 'Order already completed' });

    await query(
      "UPDATE orders SET payment_status='paid', paid_at=NOW(), processing_status='queued' WHERE id=$1",
      [req.params.id],
    );

    await profileQueue.add('job', { order_id: order.id, razorpay_order_id: order.razorpay_order_id });

    res.json({ approved: true, orderId: order.id, email: order.email });
  } catch (err) {
    console.error('Admin approve-order error:', err);
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

// POST /api/admin/reprocess-order/:id — re-enqueue a stuck/queued order
router.post('/reprocess-order/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = result.rows[0];
    if (order.processing_status === 'done') return res.status(400).json({ error: 'Already completed' });
    await query("UPDATE orders SET processing_status='queued' WHERE id=$1", [req.params.id]);
    await profileQueue.add('job', { order_id: order.id });
    res.json({ reprocessed: true, orderId: order.id });
  } catch (err) {
    console.error('Admin reprocess error:', err);
    res.status(500).json({ error: 'Failed to reprocess' });
  }
});

// POST /api/admin/reprocess-build-order/:id
router.post('/reprocess-build-order/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM build_orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Build order not found' });
    const order = result.rows[0];
    if (order.processing_status === 'done') return res.status(400).json({ error: 'Already completed' });
    await query("UPDATE build_orders SET processing_status='queued' WHERE id=$1", [req.params.id]);
    await buildQueue.add('job', { order_id: order.id });
    res.json({ reprocessed: true, orderId: order.id });
  } catch (err) {
    console.error('Admin reprocess build error:', err);
    res.status(500).json({ error: 'Failed to reprocess' });
  }
});

// POST /api/admin/cancel-order/:id — cancel and mark order as failed
router.post('/cancel-order/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    const order = result.rows[0];

    if (order.processing_status === 'done')
      return res.status(400).json({ error: 'Cannot cancel a completed order' });

    await query(
      "UPDATE orders SET payment_status='failed', processing_status='failed', processing_error='admin_cancelled', processing_done_at=NOW() WHERE id=$1",
      [req.params.id],
    );

    res.json({ cancelled: true, orderId: order.id, email: order.email });
  } catch (err) {
    console.error('Admin cancel-order error:', err);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// GET /api/admin/ratings — ratings with user emails
router.get('/ratings', adminAuth, async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT id, email, user_rating, user_feedback, feedback_at,
             before_score->'overall' as before_score,
             after_score->'overall' as after_score,
             created_at
      FROM orders
      WHERE user_rating IS NOT NULL
      ORDER BY feedback_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

// GET /api/admin/teasers
router.get('/teasers', async (_req: Request, res: Response) => {
  try {
    const stats = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE converted)::int AS converted,
        COUNT(*) FILTER (WHERE email IS NOT NULL)::int AS with_email,
        COUNT(*) FILTER (WHERE email IS NULL)::int AS without_email
      FROM teaser_attempts
    `);
    const s = stats.rows[0];
    const convPct = s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0;

    const dist = await query(`
      SELECT
        CASE
          WHEN score BETWEEN 0 AND 20 THEN '0-20'
          WHEN score BETWEEN 21 AND 40 THEN '21-40'
          WHEN score BETWEEN 41 AND 60 THEN '41-60'
          WHEN score BETWEEN 61 AND 80 THEN '61-80'
          WHEN score BETWEEN 81 AND 100 THEN '81-100'
          ELSE 'unknown'
        END AS range,
        COUNT(*)::int AS count
      FROM teaser_attempts WHERE score IS NOT NULL
      GROUP BY 1 ORDER BY 1
    `);

    // Average score
    const avgScore = await query(
      `SELECT COALESCE(AVG(score), 0)::int AS avg FROM teaser_attempts WHERE score IS NOT NULL`,
    );

    // Conversion by score range
    const convByScore = await query(`
      SELECT
        CASE WHEN score < 40 THEN 'low' WHEN score < 70 THEN 'mid' ELSE 'high' END AS tier,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE converted)::int AS converted
      FROM teaser_attempts WHERE score IS NOT NULL
      GROUP BY 1
    `);

    // Recent headlines
    const recent = await query(`
      SELECT headline_text, score, email, converted, created_at
      FROM teaser_attempts ORDER BY created_at DESC LIMIT 15
    `);

    // Hourly distribution (last 7 days)
    const hourly = await query(`
      SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Asia/Kolkata')::int AS hour,
             COUNT(*)::int AS cnt
      FROM teaser_attempts WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY 1 ORDER BY 1
    `);

    // Email capture rate
    const emailRate = s.total > 0 ? Math.round((s.with_email / s.total) * 100) : 0;

    res.json({
      total: s.total,
      converted: s.converted,
      conversion_pct: convPct,
      with_email: s.with_email,
      without_email: s.without_email,
      score_distribution: dist.rows,
      avg_score: avgScore.rows[0].avg,
      conversion_by_score: convByScore.rows,
      recent_headlines: recent.rows,
      hourly_distribution: hourly.rows,
      email_capture_rate: emailRate,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teasers' });
  }
});

// GET /api/admin/revenue
router.get('/revenue', async (_req: Request, res: Response) => {
  try {
    const daily = await query(`
      SELECT DATE(created_at) AS date,
        COALESCE(SUM(amount_paise) FILTER (WHERE payment_status='paid'), 0)::int AS revenue,
        COUNT(*) FILTER (WHERE payment_status='paid')::int AS orders
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY 1 ORDER BY 1
    `);

    const plans = await query(`
      SELECT
        COUNT(*) FILTER (WHERE plan='standard' AND payment_status='paid')::int AS standard_count,
        COUNT(*) FILTER (WHERE plan='pro' AND payment_status='paid')::int AS pro_count,
        COUNT(*) FILTER (WHERE payment_status='refunded')::int AS total_refunds
      FROM orders
    `);

    const avg = await query(
      `SELECT COALESCE(AVG(amount_paise), 0)::int AS avg_order_value FROM orders WHERE payment_status='paid'`,
    );

    // Revenue by plan
    const revByPlan = await query(`
      SELECT
        COALESCE(SUM(amount_paise) FILTER (WHERE plan='standard' AND payment_status='paid'), 0)::int AS standard_revenue,
        COALESCE(SUM(amount_paise) FILTER (WHERE plan='pro' AND payment_status='paid'), 0)::int AS pro_revenue,
        COALESCE(SUM(amount_paise) FILTER (WHERE payment_status='refunded'), 0)::int AS refund_amount
      FROM orders
    `);

    // Upgrades (standard → pro)
    const upgrades = await query(`
      SELECT COUNT(*)::int AS cnt FROM orders WHERE upgraded_to_pro=TRUE
    `);

    // MRR (rolling 30-day)
    const mrr = await query(`
      SELECT COALESCE(SUM(amount_paise), 0)::int AS mrr
      FROM orders WHERE payment_status='paid' AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);

    res.json({
      daily: daily.rows,
      standard_count: plans.rows[0].standard_count,
      pro_count: plans.rows[0].pro_count,
      avg_order_value: avg.rows[0].avg_order_value,
      total_refunds: plans.rows[0].total_refunds,
      standard_revenue: revByPlan.rows[0].standard_revenue,
      pro_revenue: revByPlan.rows[0].pro_revenue,
      refund_amount: revByPlan.rows[0].refund_amount,
      upgrades: upgrades.rows[0].cnt,
      mrr: mrr.rows[0].mrr,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

// GET /api/admin/referrals
router.get('/referrals', async (_req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT referrer_email, referral_code, uses_count, earnings_paise,
             payout_history, last_payout_at, created_at
      FROM referrals ORDER BY earnings_paise DESC
    `);

    res.json(result.rows.map(r => {
      const totalPaid = (r.payout_history || []).reduce(
        (sum: number, p: any) => sum + (p.amount_paise || 0), 0,
      );
      return {
        ...r,
        pending_payout_paise: r.earnings_paise - totalPaid,
      };
    }));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

// POST /api/admin/referrals/:code/payout
router.post('/referrals/:code/payout', async (req: Request, res: Response) => {
  try {
    const { amount_paise, txn_ref } = req.body;
    if (!amount_paise || !txn_ref)
      return res.status(400).json({ error: 'amount_paise and txn_ref required' });

    const payoutEntry = JSON.stringify([{ amount_paise, paid_at: new Date(), txn_ref }]);
    const result = await query(
      `UPDATE referrals SET
        payout_history = payout_history || $1::jsonb,
        last_payout_at = NOW()
       WHERE referral_code = $2 RETURNING *`,
      [payoutEntry, req.params.code],
    );

    if (!result.rows.length)
      return res.status(404).json({ error: 'Referral not found' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// ═══════════════════════════════════════════
// Build Orders Admin
// ═══════════════════════════════════════════

// GET /api/admin/build-orders
router.get('/build-orders', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;

    const countResult = await query('SELECT COUNT(*)::int AS total FROM build_orders');
    const result = await query(
      `SELECT id, email, plan, amount_paise, payment_status, processing_status,
              processing_error, created_at, paid_at, processing_done_at,
              email_sent, user_rating, user_feedback
       FROM build_orders ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    res.json({ orders: result.rows, total: countResult.rows[0].total, page, limit });
  } catch (err) {
    console.error('Admin build-orders error:', err);
    res.status(500).json({ error: 'Failed to fetch build orders' });
  }
});

// GET /api/admin/build-orders/:id
router.get('/build-orders/:id', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM build_orders WHERE id=$1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Build order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch build order' });
  }
});

// POST /api/admin/build-orders/:id/approve — Mark as paid + queue processing
router.post('/build-orders/:id/approve', async (req: Request, res: Response) => {
  try {
    const { buildQueue } = require('../queue/build-queue');
    const order = await query('SELECT * FROM build_orders WHERE id=$1', [req.params.id]);
    if (!order.rows.length) return res.status(404).json({ error: 'Build order not found' });

    await query(
      `UPDATE build_orders SET payment_status='paid', paid_at=NOW(), processing_status='queued' WHERE id=$1`,
      [req.params.id],
    );
    await buildQueue.add('job', { razorpay_order_id: order.rows[0].razorpay_order_id });
    res.json({ success: true, message: 'Order approved and queued for processing' });
  } catch (err: any) {
    console.error('Admin approve build order error:', err.message);
    res.status(500).json({ error: 'Failed to approve order' });
  }
});

// POST /api/admin/build-orders/:id/cancel — Cancel order
router.post('/build-orders/:id/cancel', async (req: Request, res: Response) => {
  try {
    await query(
      `UPDATE build_orders SET payment_status='refunded', processing_status='failed', processing_error='Cancelled by admin' WHERE id=$1`,
      [req.params.id],
    );
    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

// POST /api/admin/build-orders/:id/send-email — Send results email
router.post('/build-orders/:id/send-email', async (req: Request, res: Response) => {
  try {
    const { sendBuildResultsEmail } = require('../services/email');
    const order = await query('SELECT * FROM build_orders WHERE id=$1', [req.params.id]);
    if (!order.rows.length) return res.status(404).json({ error: 'Build order not found' });
    if (!order.rows[0].generated_profile) return res.status(400).json({ error: 'No results generated yet' });

    await sendBuildResultsEmail(order.rows[0]);
    res.json({ success: true, message: `Email sent to ${order.rows[0].email}` });
  } catch (err: any) {
    console.error('Admin send build email error:', err.message);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ═══════════════════════════════════════════
// EMAIL SEQUENCE CONTROLS
// ═══════════════════════════════════════════
import { processEmailSequences, sendSingleSequenceEmail, getSequenceKeys } from '../services/email-sequences';

router.use('/email-sequences', adminAuth);

// GET /api/admin/email-sequences/status — global status + opt-outs + available keys
router.get('/email-sequences/status', async (_req: Request, res: Response) => {
  try {
    const settings = await query("SELECT value FROM email_settings WHERE key='sequences_enabled'");
    const optouts = await query('SELECT email, reason, created_at FROM email_optouts ORDER BY created_at DESC');
    const recentSends = await query(`
      SELECT o.id, o.email, o.sequence_emails_sent, o.processing_done_at
      FROM orders o
      WHERE o.sequence_emails_sent IS NOT NULL AND o.sequence_emails_sent != '{}'::jsonb
      ORDER BY o.processing_done_at DESC LIMIT 20
    `);
    res.json({
      enabled: settings.rows[0]?.value === 'true',
      optouts: optouts.rows,
      recentSends: recentSends.rows,
      availableKeys: getSequenceKeys(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/email-sequences/toggle — pause/resume all sequences
router.post('/email-sequences/toggle', async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    await query("UPDATE email_settings SET value=$1, updated_at=NOW() WHERE key='sequences_enabled'", [enabled ? 'true' : 'false']);
    res.json({ enabled: !!enabled, message: enabled ? 'Email sequences ENABLED' : 'Email sequences PAUSED' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/email-sequences/optout — block a specific email from sequences
router.post('/email-sequences/optout', async (req: Request, res: Response) => {
  try {
    const { email, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await query('INSERT INTO email_optouts (email, reason) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET reason=$2', [email.toLowerCase(), reason || 'admin']);
    res.json({ message: `${email} opted out of sequences` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/email-sequences/optout — remove an email from opt-out list
router.delete('/email-sequences/optout', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await query('DELETE FROM email_optouts WHERE email=$1', [email.toLowerCase()]);
    res.json({ message: `${email} removed from opt-out list` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/email-sequences/send — send a specific sequence email to a specific order
router.post('/email-sequences/send', async (req: Request, res: Response) => {
  try {
    const { orderId, emailKey } = req.body;
    if (!orderId || !emailKey) return res.status(400).json({ error: 'orderId and emailKey required' });
    const result = await sendSingleSequenceEmail(orderId, emailKey);
    if (result.success) res.json({ message: `Sent ${emailKey} for order ${orderId}` });
    else res.status(400).json({ error: result.error });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/email-sequences/run-now — manually trigger the sequence processor
router.post('/email-sequences/run-now', async (_req: Request, res: Response) => {
  try {
    const result = await processEmailSequences();
    res.json({ message: 'Sequence processor ran', ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/email-sequences/preview/:emailKey/:orderId — preview an email without sending
router.get('/email-sequences/preview/:emailKey/:orderId', async (req: Request, res: Response) => {
  try {
    const seq = getSequenceKeys().find(s => s.key === req.params.emailKey);
    if (!seq) return res.status(404).json({ error: 'Unknown email key' });

    const result = await query(`
      SELECT o.id, o.email, o.plan,
             o.before_score->'overall' as before_score,
             o.after_score->'overall' as after_score,
             o.roast->'roast_title' as roast_title,
             o.rewrite->'rewritten_headline' as rewritten_headline,
             EXISTS(SELECT 1 FROM resumes r WHERE r.order_id=o.id) as has_resume
      FROM orders o WHERE o.id=$1
    `, [req.params.orderId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });

    // Import the sequence to get subject/body
    const { ROAST_SEQUENCE_EXPORT } = require('../services/email-sequences');
    // Fallback: just return order data + key
    res.json({
      emailKey: req.params.emailKey,
      orderId: req.params.orderId,
      email: result.rows[0].email,
      note: 'Use POST /email-sequences/send to actually send this email',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
// REFERRAL CODES (one-time influencer trials)
// ═══════════════════════════════════════════

router.use('/referral-codes', adminAuth);

// POST /api/admin/referral-codes/generate
router.post('/referral-codes/generate', async (req: Request, res: Response) => {
  try {
    const { product, plan, notes } = req.body;
    if (!product || !plan) return res.status(400).json({ error: 'product and plan required' });
    if (!['roast', 'build'].includes(product)) return res.status(400).json({ error: 'product must be roast or build' });

    const productPrefix = product === 'roast' ? 'ROAST' : 'BUILD';
    const planPrefix = plan.slice(0, 3).toUpperCase();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let random = '';
    for (let i = 0; i < 5; i++) random += chars[Math.floor(Math.random() * chars.length)];
    const code = `${productPrefix}-${planPrefix}-${random}`;

    await query(
      'INSERT INTO referral_codes (code, product, plan, notes) VALUES ($1, $2, $3, $4)',
      [code, product, plan, notes || null],
    );

    res.json({ code, product, plan });
  } catch (err: any) {
    console.error('Generate referral code error:', err.message);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

// GET /api/admin/referral-codes
router.get('/referral-codes', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM referral_codes ORDER BY created_at DESC LIMIT 200',
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referral codes' });
  }
});

// POST /api/admin/referral-codes/deactivate
router.post('/referral-codes/deactivate', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });
    const result = await query(
      "UPDATE referral_codes SET status='deactivated' WHERE code=$1 RETURNING *",
      [code],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Code not found' });
    res.json({ deactivated: true, code });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate code' });
  }
});

// ═══════════════════════════════════════════
// INFLUENCERS
// ═══════════════════════════════════════════

router.use('/influencers', adminAuth);

// POST /api/admin/influencers/create
router.post('/influencers/create', async (req: Request, res: Response) => {
  try {
    const { name, slug, email, commissions } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' });

    const c = commissions || {};
    const result = await query(
      `INSERT INTO influencers (name, slug, email, commission_standard, commission_pro,
       commission_build_starter, commission_build_plus, commission_build_pro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name, slug.toLowerCase(), email || null,
        c.standard ?? 50, c.pro ?? 100,
        c.build_starter ?? 25, c.build_plus ?? 50, c.build_pro ?? 100,
      ],
    );

    res.json(result.rows[0]);
  } catch (err: any) {
    if (err.message?.includes('duplicate key')) {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    console.error('Create influencer error:', err.message);
    res.status(500).json({ error: 'Failed to create influencer' });
  }
});

// GET /api/admin/influencers
router.get('/influencers', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM influencers ORDER BY total_earnings DESC, created_at DESC',
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch influencers' });
  }
});

// GET /api/admin/influencers/:slug/referrals
router.get('/influencers/:slug/referrals', async (req: Request, res: Response) => {
  try {
    const roastOrders = await query(
      `SELECT id, email, plan, amount_paise, payment_status, created_at
       FROM orders WHERE influencer_slug=$1 AND payment_status='paid'
       ORDER BY created_at DESC LIMIT 100`,
      [req.params.slug],
    );
    const buildOrders = await query(
      `SELECT id, email, plan, amount_paise, payment_status, created_at
       FROM build_orders WHERE influencer_slug=$1 AND payment_status='paid'
       ORDER BY created_at DESC LIMIT 100`,
      [req.params.slug],
    );
    res.json({
      roast_orders: roastOrders.rows,
      build_orders: buildOrders.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch influencer referrals' });
  }
});

export default router;

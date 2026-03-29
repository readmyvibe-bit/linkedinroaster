import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { sendResultsEmail } from '../services/email';

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

// GET /api/admin/overview
router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const today = await query(`
      SELECT
        COUNT(*) FILTER (WHERE payment_status='paid')::int AS orders,
        COALESCE(SUM(amount_paise) FILTER (WHERE payment_status='paid'), 0)::int AS revenue_paise
      FROM orders WHERE created_at >= CURRENT_DATE
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
      FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);
    const month = await query(`
      SELECT COUNT(*) FILTER (WHERE payment_status='paid')::int AS orders,
        COALESCE(SUM(amount_paise) FILTER (WHERE payment_status='paid'), 0)::int AS revenue_paise
      FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
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

    res.json({
      today: {
        orders: today.rows[0].orders,
        revenue_paise: today.rows[0].revenue_paise,
        teasers: tTotal,
        conversion_pct: tTotal > 0 ? Math.round((tConverted / tTotal) * 100) : 0,
      },
      week: week.rows[0],
      month: month.rows[0],
      active_jobs: activeJobs.rows[0].cnt,
      refund_rate: Math.round(refundRate * 100) / 100,
      total_teasers_today: tTotal,
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

    res.json({
      total: s.total,
      converted: s.converted,
      conversion_pct: convPct,
      with_email: s.with_email,
      without_email: s.without_email,
      score_distribution: dist.rows,
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

    res.json({
      daily: daily.rows,
      standard_count: plans.rows[0].standard_count,
      pro_count: plans.rows[0].pro_count,
      avg_order_value: avg.rows[0].avg_order_value,
      total_refunds: plans.rows[0].total_refunds,
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

export default router;

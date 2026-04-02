import { Router, Request, Response } from 'express';
import multer from 'multer';
import Razorpay from 'razorpay';
import { jsonrepair } from 'jsonrepair';
import { query } from '../db';
import { validateEmail } from '../lib/validation';
import { buildQueue } from '../queue/build-queue';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_AMOUNTS: Record<string, number> = {
  starter: 19900,
  plus: 39900,
  pro: 69900,
};

// POST /api/build/create-order — Create Razorpay order + DB entry
router.post('/create-order', async (req: Request, res: Response) => {
  try {
    const { email, plan, form_input } = req.body;

    if (!validateEmail(email))
      return res.status(400).json({ error: 'Invalid email address' });

    if (!['starter', 'plus', 'pro'].includes(plan))
      return res.status(400).json({ error: 'Invalid plan. Choose starter, plus, or pro.' });

    if (!form_input || !form_input.full_name || !form_input.target_role)
      return res.status(400).json({ error: 'Name and target role are required.' });

    if (!form_input.education?.length && !form_input.experience?.length && !form_input.skills?.length)
      return res.status(400).json({ error: 'Please provide at least education, experience, or skills.' });

    // Rate limit: 5 per email per 24h
    const emailCount = await query(
      `SELECT COUNT(*)::int AS cnt FROM build_orders WHERE email=$1
       AND created_at > NOW()-INTERVAL '24 hours'`,
      [email],
    );
    if (emailCount.rows[0].cnt >= 5)
      return res.status(429).json({ error: 'Too many orders. Try again in 24 hours.' });

    const amount = PLAN_AMOUNTS[plan];
    const rzpOrder = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `build_${Date.now()}`,
      notes: { email, plan, type: 'build' },
    });

    const result = await query(
      `INSERT INTO build_orders (email, plan, amount_paise, razorpay_order_id, form_input, ip_address,
       utm_source, utm_medium, utm_campaign)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        email, plan, amount, rzpOrder.id,
        JSON.stringify(form_input), req.ip,
        req.query.utm_source || null, req.query.utm_medium || null, req.query.utm_campaign || null,
      ],
    );

    res.json({
      order_id: result.rows[0].id,
      razorpay_order_id: rzpOrder.id,
      razorpay_key: process.env.RAZORPAY_KEY_ID,
      amount,
      currency: 'INR',
    });
  } catch (err: any) {
    console.error('POST /api/build/create-order error:', err.message);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
});

// POST /api/build/upload-resume — Parse uploaded resume for form auto-fill
router.post('/upload-resume', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mime = req.file.mimetype;
    let text = '';

    if (mime === 'application/pdf') {
      const Anthropic = require('@anthropic-ai/sdk').default;
      const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const base64 = req.file.buffer.toString('base64');
      const pdfResponse = await anthropicClient.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: 'Extract ALL text content from this resume PDF. Return only the raw text, preserving structure.' },
          ],
        }],
      });
      text = ((pdfResponse.content[0] as any).text || '').trim();
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else {
      text = req.file.buffer.toString('utf-8');
    }

    if (!text || text.trim().length < 50)
      return res.status(400).json({ error: 'Could not extract enough text. Please try a different file.' });

    // Use Claude to parse into structured form data
    const Anthropic2 = require('@anthropic-ai/sdk').default;
    const anthropicClient2 = new Anthropic2({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const parseResponse = await anthropicClient2.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: 'You are a resume parser. Extract all information accurately. Return ONLY valid JSON, no markdown fences, no commentary.',
      messages: [{
        role: 'user',
        content: `Parse this resume text into structured data. Return ONLY valid JSON:
{
  "full_name": "",
  "email": "",
  "phone": "",
  "location": "",
  "education": [{ "institution": "", "degree": "", "field": "", "year": "", "gpa": "" }],
  "experience": [{ "company": "", "role": "", "start_date": "", "end_date": "", "current": false, "description": "" }],
  "skills": [],
  "certifications": [],
  "achievements": ""
}

Resume text:
${text.slice(0, 5000)}`,
      }],
    });

    let rText = ((parseResponse.content[0] as any).text || '{}').trim();
    if (rText.startsWith('```')) {
      rText = rText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    let parsed;
    try {
      parsed = JSON.parse(rText);
    } catch {
      parsed = JSON.parse(jsonrepair(rText));
    }

    res.json({ parsed, rawTextLength: text.length });
  } catch (err: any) {
    console.error('Upload parse error:', err.message);
    res.status(500).json({ error: `Failed to parse: ${err.message?.slice(0, 100)}` });
  }
});

// GET /api/build/results/:orderId — Fetch build order results
router.get('/results/:orderId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM build_orders WHERE id=$1', [req.params.orderId]);
    if (!result.rows.length)
      return res.status(404).json({ error: 'Order not found' });

    const order = result.rows[0];
    res.json({
      order_id: order.id,
      email: order.email,
      plan: order.plan,
      payment_status: order.payment_status,
      processing_status: order.processing_status,
      processing_error: order.processing_error,
      generated_profile: order.generated_profile,
      quality_check: order.quality_check,
      form_input: order.form_input,
      created_at: order.created_at,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// POST /api/build/:orderId/feedback — Save user feedback
router.post('/:orderId/feedback', async (req: Request, res: Response) => {
  try {
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ error: 'Rating must be 1-5' });

    await query(
      `UPDATE build_orders SET user_rating=$1, user_feedback=$2, feedback_at=NOW() WHERE id=$3`,
      [rating, feedback || null, req.params.orderId],
    );
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

// POST /api/build/update-and-process — for referral code pre-paid orders
router.post('/update-and-process', async (req: Request, res: Response) => {
  try {
    const { order_id, form_input } = req.body;
    if (!order_id || !form_input) return res.status(400).json({ error: 'order_id and form_input required' });

    const result = await query('SELECT * FROM build_orders WHERE id=$1', [order_id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });

    const order = result.rows[0];
    if (order.payment_status !== 'paid') return res.status(400).json({ error: 'Order not paid' });

    await query(
      "UPDATE build_orders SET form_input=$1, processing_status='queued' WHERE id=$2",
      [JSON.stringify(form_input), order_id],
    );

    await buildQueue.add('job', { order_id });
    res.json({ success: true, order_id });
  } catch (err: any) {
    console.error('Build update-and-process error:', err.message);
    res.status(500).json({ error: 'Failed to process' });
  }
});

export default router;

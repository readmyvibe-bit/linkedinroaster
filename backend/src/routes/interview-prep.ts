import { Router, Request, Response } from 'express';
import { query } from '../db';
import { generateInterviewPrep } from '../services/interview-prep';
import { generateInterviewPrepV2 } from '../services/interview-prep-v2';

const router = Router();

const PIPELINE_VERSION = process.env.INTERVIEW_PREP_PIPELINE || 'v2';

// UUID format validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Plan-based quota: how many preps allowed per resume
function getPrepQuota(plan: string): number {
  switch (plan) {
    case 'pro': return 3;
    case 'plus':
    case 'standard': return 1;
    case 'starter': return 0;
    default: return 1;
  }
}

// ─── IMPORTANT: Static paths BEFORE parameterized paths ───

// GET /api/interview-prep/by-resume/:resumeId — get all preps for a resume
router.get('/by-resume/:resumeId', async (req: Request, res: Response) => {
  try {
    const resumeId = req.params.resumeId as string;
    if (!UUID_RE.test(resumeId)) return res.status(400).json({ error: 'Invalid resume ID format' });

    const result = await query(
      `SELECT id, status, career_stage, interview_level, pipeline_version, generation_meta,
              target_role, target_company, error_message, created_at, completed_at
       FROM interview_preps WHERE resume_id=$1 ORDER BY created_at DESC`,
      [resumeId],
    );
    res.json({ preps: result.rows });
  } catch (err: any) {
    console.error('GET /api/interview-prep/by-resume/:resumeId error:', err.message);
    res.status(500).json({ error: 'Failed to fetch interview preps' });
  }
});

// POST /api/interview-prep — create or return existing prep
router.post('/', async (req: Request, res: Response) => {
  try {
    const { resume_id, interview_level } = req.body;
    if (!resume_id) return res.status(400).json({ error: 'Missing resume_id' });
    if (!UUID_RE.test(resume_id)) return res.status(400).json({ error: 'Invalid resume_id format' });

    // Validate interview_level if provided
    if (interview_level && !['entry', 'mid', 'senior', 'lead'].includes(interview_level)) {
      return res.status(400).json({ error: 'Invalid interview_level. Must be: entry, mid, senior, lead' });
    }

    // Validate resume exists and get order info for quota check
    const resumeResult = await query('SELECT id, order_id FROM resumes WHERE id=$1', [resume_id]);
    if (!resumeResult.rows.length) return res.status(404).json({ error: 'Resume not found' });
    const resume = resumeResult.rows[0];

    // Check if prep already exists and is ready/processing
    const existing = await query(
      `SELECT id, status, prep_data, interview_level, pipeline_version, generation_meta,
              career_stage, target_role, target_company, error_message, created_at, completed_at
       FROM interview_preps
       WHERE resume_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [resume_id],
    );
    if (existing.rows.length) {
      const prep = existing.rows[0];
      if (prep.status === 'ready' || prep.status === 'processing' || prep.status === 'queued') {
        return res.json({ id: prep.id, status: prep.status });
      }
      // If failed, allow creating a new one (below)
    }

    // Quota check — count existing non-failed preps for this resume
    const prepCount = await query(
      `SELECT COUNT(*)::int AS cnt FROM interview_preps WHERE resume_id=$1 AND status != 'failed'`,
      [resume_id],
    );
    const usedPreps = prepCount.rows[0]?.cnt || 0;

    // Determine plan from order
    let plan = 'standard';
    if (resume.order_id) {
      const orderResult = await query('SELECT plan FROM orders WHERE id=$1', [resume.order_id]);
      if (orderResult.rows.length) {
        plan = orderResult.rows[0].plan || 'standard';
      } else {
        const buildResult = await query('SELECT plan FROM build_orders WHERE id=$1', [resume.order_id]);
        if (buildResult.rows.length) plan = buildResult.rows[0].plan || 'standard';
      }
    }

    const quota = getPrepQuota(plan);
    if (quota === 0) {
      return res.status(403).json({ error: 'Interview prep is not available on the Starter plan. Upgrade to Standard or Pro.' });
    }
    if (usedPreps >= quota) {
      return res.status(403).json({
        error: `Interview prep limit reached (${usedPreps}/${quota}). ${plan === 'pro' ? '' : 'Upgrade to Pro for up to 3 preps per resume.'}`.trim(),
        limit: quota,
        used: usedPreps,
      });
    }

    // Create new prep row
    const result = await query(
      `INSERT INTO interview_preps (resume_id, status, pipeline_version) VALUES ($1, 'queued', $2) RETURNING id`,
      [resume_id, PIPELINE_VERSION],
    );
    const prepId = result.rows[0].id;

    // Fire and forget — run generation in background (v2 or v1)
    if (PIPELINE_VERSION === 'v2') {
      generateInterviewPrepV2(prepId, resume_id, interview_level).catch((err) => {
        console.error(`[interview-prep-v2] Background generation failed for ${prepId}:`, err.message);
      });
    } else {
      generateInterviewPrep(prepId, resume_id).catch((err) => {
        console.error(`[interview-prep] Background generation failed for ${prepId}:`, err.message);
      });
    }

    res.json({ id: prepId, status: 'queued' });
  } catch (err: any) {
    console.error('POST /api/interview-prep error:', err.message);
    res.status(500).json({ error: 'Failed to create interview prep' });
  }
});

// GET /api/interview-prep/:id — get prep by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!UUID_RE.test(id)) return res.status(400).json({ error: 'Invalid prep ID format' });

    const result = await query(
      `SELECT id, resume_id, status, prep_data, career_stage, interview_level, pipeline_version,
              generation_meta, target_role, target_company, error_message, created_at, completed_at
       FROM interview_preps WHERE id=$1`,
      [id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Interview prep not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('GET /api/interview-prep/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch interview prep' });
  }
});

export default router;

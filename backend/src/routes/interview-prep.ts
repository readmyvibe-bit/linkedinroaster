import { Router, Request, Response } from 'express';
import { query } from '../db';
import { generateInterviewPrep } from '../services/interview-prep';

const router = Router();

// POST /api/interview-prep — create or return existing prep
router.post('/', async (req: Request, res: Response) => {
  try {
    const { resume_id } = req.body;
    if (!resume_id) return res.status(400).json({ error: 'Missing resume_id' });

    // Validate resume exists
    const resumeResult = await query('SELECT id FROM resumes WHERE id=$1', [resume_id]);
    if (!resumeResult.rows.length) return res.status(404).json({ error: 'Resume not found' });

    // Check if prep already exists and is ready
    const existing = await query(
      `SELECT id, status, prep_data, created_at, completed_at FROM interview_preps
       WHERE resume_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [resume_id],
    );
    if (existing.rows.length) {
      const prep = existing.rows[0];
      if (prep.status === 'ready' || prep.status === 'processing' || prep.status === 'queued') {
        return res.json({ id: prep.id, status: prep.status });
      }
      // If failed, allow creating a new one
    }

    // Create new prep row
    const result = await query(
      `INSERT INTO interview_preps (resume_id, status) VALUES ($1, 'queued') RETURNING id`,
      [resume_id],
    );
    const prepId = result.rows[0].id;

    // Fire and forget — run generation in background
    generateInterviewPrep(prepId, resume_id).catch((err) => {
      console.error(`[interview-prep] Background generation failed for ${prepId}:`, err.message);
    });

    res.json({ id: prepId, status: 'queued' });
  } catch (err: any) {
    console.error('POST /api/interview-prep error:', err.message);
    res.status(500).json({ error: 'Failed to create interview prep' });
  }
});

// GET /api/interview-prep/:id — get prep by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, resume_id, status, prep_data, career_stage, target_role, target_company, error_message, created_at, completed_at
       FROM interview_preps WHERE id=$1`,
      [req.params.id],
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Interview prep not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    console.error('GET /api/interview-prep/:id error:', err.message);
    res.status(500).json({ error: 'Failed to fetch interview prep' });
  }
});

// GET /api/interview-prep/by-resume/:resumeId — get all preps for a resume
router.get('/by-resume/:resumeId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, status, career_stage, target_role, target_company, created_at, completed_at
       FROM interview_preps WHERE resume_id=$1 ORDER BY created_at DESC`,
      [req.params.resumeId],
    );
    res.json({ preps: result.rows });
  } catch (err: any) {
    console.error('GET /api/interview-prep/by-resume/:resumeId error:', err.message);
    res.status(500).json({ error: 'Failed to fetch interview preps' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { query } from '../db';
import { generateResume, parseUploadedResume } from '../services/resume-generator';
import { generateDocx } from '../services/resume-docx';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

// GET /api/resume/by-order/:orderId — list resumes for an order
router.get('/by-order/:orderId', async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT id, target_role, target_company, ats_score, template_id, status, created_at FROM resumes WHERE order_id=$1 ORDER BY created_at DESC',
      [req.params.orderId],
    );
    res.json({ resumes: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// POST /api/resume/upload-parse — parse uploaded resume file
router.post('/upload-parse', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const mime = req.file.mimetype;
    let text = '';

    if (mime === 'application/pdf') {
      // Use Claude to extract text from PDF via base64
      const Anthropic = require('@anthropic-ai/sdk').default;
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const base64 = req.file.buffer.toString('base64');
      const pdfResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            { type: 'text', text: 'Extract ALL text content from this PDF resume. Return only the raw text, preserving the structure (names, sections, bullet points). No commentary.' },
          ],
        }],
      });
      text = ((pdfResponse.content[0] as any).text || '').trim();
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mime === 'application/msword') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else if (mime.startsWith('image/')) {
      // For images, return error — OCR not supported yet
      return res.status(400).json({ error: 'Image upload not supported yet. Please upload a PDF or DOCX file.' });
    } else {
      // Try as plain text
      text = req.file.buffer.toString('utf-8');
    }

    if (!text || text.trim().length < 50) {
      return res.status(400).json({ error: 'Could not extract enough text from the file. Please try a different format.' });
    }

    // Use AI to parse into structured data
    const parsed = await parseUploadedResume(text);

    res.json({ parsed, rawTextLength: text.length });
  } catch (err: any) {
    console.error('Upload parse error:', err.message, err.stack?.slice(0, 300));
    res.status(500).json({ error: `Failed to parse: ${err.message?.slice(0, 100)}` });
  }
});

// POST /api/resume/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { orderId, userDetails, targetRole, targetCompany, jobDescription,
      additionalAchievements, certifications, languages, experienceYears,
      templateId, pageCount } = req.body;

    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });
    if (!targetRole) return res.status(400).json({ error: 'Missing target role' });
    if (!jobDescription || jobDescription.length < 100)
      return res.status(400).json({ error: 'Job description must be at least 100 characters' });
    if (!userDetails?.name || !userDetails?.email)
      return res.status(400).json({ error: 'Name and email are required' });

    const result = await generateResume({
      orderId, userDetails, targetRole, targetCompany, jobDescription,
      additionalAchievements, certifications, languages, experienceYears,
      templateId, pageCount,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Resume generate error:', err.message);
    const status = err.message.includes('Pro plan') ? 403
      : err.message.includes('not found') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

// GET /api/resume/:resumeId
router.get('/:resumeId', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM resumes WHERE id=$1', [req.params.resumeId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// PATCH /api/resume/:resumeId
router.patch('/:resumeId', async (req: Request, res: Response) => {
  try {
    const { resume_data } = req.body;
    if (!resume_data) return res.status(400).json({ error: 'Missing resume_data' });

    await query(
      'UPDATE resumes SET resume_data=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(resume_data), req.params.resumeId],
    );
    res.json({ saved: true, updated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save resume' });
  }
});

// POST /api/resume/:resumeId/ats-check
router.post('/:resumeId/ats-check', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM resumes WHERE id=$1', [req.params.resumeId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });

    const resume = result.rows[0];
    const resumeText = JSON.stringify(resume.resume_data).toLowerCase();
    const jd = (resume.job_description || '').toLowerCase();

    // Use AI to extract relevant skills/requirements from JD (not company names)
    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const kwResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Extract the top 25-30 SKILLS, TOOLS, and REQUIREMENTS from this job description. Only include skills, technologies, methodologies, certifications, and professional competencies. Do NOT include company names, locations, benefits, or generic words.\n\nJob Description:\n${jd.slice(0, 3000)}\n\nReturn ONLY a JSON array of lowercase strings. Example: ["customer success","crm","saas","retention","onboarding"]`,
      }],
      system: 'Return ONLY a valid JSON array. No explanation.',
    });
    let kwText = ((kwResponse.content[0] as any).text || '').trim();
    if (kwText.startsWith('```')) kwText = kwText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    let keywords: string[] = [];
    try { keywords = JSON.parse(kwText); } catch { keywords = []; }

    const matched = keywords.filter((kw: string) => resumeText.includes(kw.toLowerCase()));
    const missing = keywords.filter((kw: string) => !resumeText.includes(kw.toLowerCase()));
    const score = keywords.length > 0 ? Math.round((matched.length / keywords.length) * 85) + 15 : 50;

    await query(
      'UPDATE resumes SET ats_score=$1, keywords_matched=$2, keywords_missing=$3, updated_at=NOW() WHERE id=$4',
      [Math.min(score, 100), JSON.stringify(matched), JSON.stringify(missing), req.params.resumeId],
    );

    res.json({ score: Math.min(score, 100), keywords_matched: matched, keywords_missing: missing });
  } catch (err) {
    res.status(500).json({ error: 'ATS check failed' });
  }
});

// GET /api/resume/:resumeId/cover-letter
router.get('/:resumeId/cover-letter', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT cover_letter, target_role, target_company FROM resumes WHERE id=$1', [req.params.resumeId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });
    res.json({
      cover_letter: result.rows[0].cover_letter || '',
      target_role: result.rows[0].target_role,
      target_company: result.rows[0].target_company,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cover letter' });
  }
});

// GET /api/resume/:resumeId/download/docx
router.get('/:resumeId/download/docx', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM resumes WHERE id=$1', [req.params.resumeId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });

    const resume = result.rows[0];
    const data = resume.resume_data;
    const contact = data.contact || {};
    const name = (contact.name || 'resume').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const role = (resume.target_role || 'resume').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    const buffer = await generateDocx(data, resume.template_id);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${name}-${role}-resume.docx"`);
    res.send(buffer);
  } catch (err: any) {
    console.error('DOCX download error:', err.message);
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
});

// POST /api/resume/:resumeId/regenerate-section
router.post('/:resumeId/regenerate-section', async (req: Request, res: Response) => {
  try {
    const { section, jobDescription } = req.body;
    if (!section || !jobDescription)
      return res.status(400).json({ error: 'Missing section or jobDescription' });

    const result = await query('SELECT * FROM resumes WHERE id=$1', [req.params.resumeId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Resume not found' });

    const resume = result.rows[0];
    const data = resume.resume_data;

    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    let prompt = '';
    if (section === 'summary') {
      prompt = `Rewrite this professional summary for an ATS resume targeting this role.

Current summary: ${data.summary || 'None'}
Target role: ${resume.target_role}
Job description: ${jobDescription}

Write a 3-4 sentence professional summary that includes keywords from the JD. Return ONLY the summary text, no JSON, no quotes.`;
    } else if (section === 'skills') {
      prompt = `Suggest relevant skills for this resume based on the job description.

Current skills: ${JSON.stringify(data.skills)}
Target role: ${resume.target_role}
Job description: ${jobDescription}

Return ONLY a JSON object: {"technical":[],"soft":[],"languages":[],"certifications":[]}`;
    } else {
      return res.status(400).json({ error: 'Invalid section. Use: summary, skills' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      system: 'You are an expert ATS resume writer. Be concise and professional.',
    });

    const text = ((response.content[0] as any).text || '').trim();
    let content: any = text;

    if (section === 'skills') {
      try {
        content = JSON.parse(text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, ''));
      } catch {
        const { jsonrepair } = require('jsonrepair');
        content = JSON.parse(jsonrepair(text));
      }
    }

    res.json({ section, content });
  } catch (err: any) {
    console.error('Regenerate section error:', err.message);
    res.status(500).json({ error: 'Failed to regenerate section' });
  }
});

export default router;

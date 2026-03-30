import { Router, Request, Response } from 'express';
import { query } from '../db';
import { generateResume } from '../services/resume-generator';

const router = Router();

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

    // Extract keywords from JD
    const stopWords = new Set(['the', 'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'because', 'but', 'if', 'while', 'about', 'up', 'its', 'it', 'this', 'that', 'these', 'those', 'we', 'you', 'your', 'they', 'their', 'our', 'my', 'his', 'her', 'who', 'which', 'what', 'also', 'must', 'able', 'etc', 'including', 'well', 'within', 'across', 'role', 'work', 'working', 'experience', 'years', 'year', 'strong', 'good', 'team', 'new', 'required', 'preferred', 'minimum', 'plus']);

    const jdWords = jd.match(/\b[a-z]{3,}\b/g) || [];
    const wordFreq: Record<string, number> = {};
    jdWords.forEach((w: string) => { if (!stopWords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1; });

    // Get top keywords (appear 2+ times or are technical terms)
    const keywords = Object.entries(wordFreq)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([word]) => word);

    const matched = keywords.filter(kw => resumeText.includes(kw));
    const missing = keywords.filter(kw => !resumeText.includes(kw));
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

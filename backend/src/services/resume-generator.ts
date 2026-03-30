import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db';
import { jsonrepair } from 'jsonrepair';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface ResumeInput {
  orderId: string;
  userDetails: {
    name: string; email: string; phone: string;
    location: string; linkedin: string; website?: string;
  };
  targetRole: string;
  targetCompany?: string;
  jobDescription: string;
  additionalAchievements?: string;
  certifications?: string[];
  languages?: string[];
  experienceYears?: string;
  uploadedResumeText?: string;
  templateId?: string;
  pageCount?: number;
}

export async function generateResume(input: ResumeInput): Promise<{ resumeId: string; ats_score: number }> {
  // 1. Fetch order data
  const orderResult = await query('SELECT * FROM orders WHERE id=$1', [input.orderId]);
  if (!orderResult.rows.length) throw new Error('Order not found');
  const order = orderResult.rows[0];

  // Standard: 1 resume, Pro: 3 resumes
  const maxResumes = order.plan === 'pro' ? 3 : 1;
  const existingCount = await query('SELECT COUNT(*)::int AS cnt FROM resumes WHERE order_id=$1', [input.orderId]);
  if (existingCount.rows[0].cnt >= maxResumes) {
    throw new Error(order.plan === 'pro'
      ? 'Maximum 3 resumes per Pro order.'
      : 'Standard plan includes 1 resume. Upgrade to Pro for 3 resumes.');
  }
  if (order.processing_status !== 'done') throw new Error('Order not completed');

  const rewrite = order.rewrite;
  const analysis = order.analysis;
  if (!rewrite) throw new Error('No rewrite data found');

  // 2. Gather all data sources
  const parsed = order.parsed_profile || {};
  // Check for uploaded resume data in the resumes table (previous upload)
  const uploadedCheck = await query(
    'SELECT uploaded_resume_text FROM resumes WHERE order_id=$1 AND uploaded_resume_text IS NOT NULL ORDER BY created_at DESC LIMIT 1',
    [input.orderId],
  );
  const uploadedResumeText = input.uploadedResumeText || uploadedCheck.rows[0]?.uploaded_resume_text || '';

  // 2b. Build prompt with ALL data sources
  const prompt = `Build a complete ATS optimized resume by MERGING these data sources.

TARGET ROLE: ${input.targetRole}
${input.targetCompany ? `TARGET COMPANY: ${input.targetCompany}` : ''}

═══ SOURCE 1: LINKEDIN REWRITE (AI-optimized bullets — use these for top 2 roles) ═══
Headline: ${rewrite.rewritten_headline || ''}
About: ${rewrite.rewritten_about || ''}
Experience: ${JSON.stringify(rewrite.rewritten_experience || [])}
ATS Keywords: ${JSON.stringify(rewrite.ats_keywords || [])}

═══ SOURCE 2: ORIGINAL LINKEDIN PROFILE (has education + full career history) ═══
Education: ${JSON.stringify(parsed.education || [])}
Full Experience: ${JSON.stringify(parsed.experience || [])}
Skills: ${JSON.stringify(parsed.skills || [])}

═══ SOURCE 3: UPLOADED RESUME (user's own resume — most accurate personal data) ═══
${uploadedResumeText ? uploadedResumeText.slice(0, 4000) : 'No uploaded resume.'}

═══ MERGE RULES (CRITICAL) ═══
1. EDUCATION: Use EXACT education from Source 2 or Source 3. NEVER invent education. Copy degree name, institution name, and dates exactly as stated.
2. EXPERIENCE: Use AI-rewritten bullets from Source 1 for top roles. For older roles not in Source 1, use Source 2 or Source 3 data.
3. INCLUDE ALL JOBS: If Source 3 has more jobs than Source 1, include them all. Do not skip any employment.
4. PERSONAL INFO: Use Source 3 for name, phone, email if available. Fall back to user-provided details.
5. SKILLS: Merge skills from all 3 sources. Remove duplicates.
6. ACHIEVEMENTS: Include achievements from Source 3 that aren't already in experience bullets.
7. NEVER FABRICATE: Do not invent any degree, institution, company, or achievement not in any source.

CONTACT INFO:
Name: ${input.userDetails.name}
Email: ${input.userDetails.email}
Phone: ${input.userDetails.phone}
Location: ${input.userDetails.location}
LinkedIn: ${input.userDetails.linkedin}
${input.userDetails.website ? `Website: ${input.userDetails.website}` : ''}
${input.additionalAchievements ? `Additional Achievements: ${input.additionalAchievements}` : ''}
${input.certifications?.length ? `Certifications: ${input.certifications.join(', ')}` : ''}
${input.languages?.length ? `Languages: ${input.languages.join(', ')}` : ''}
${input.experienceYears ? `Total Experience: ${input.experienceYears}` : ''}

JOB DESCRIPTION:
${input.jobDescription}

STRICT ATS RULES:
1. No tables, no columns, no text boxes, no graphics
2. Standard section headers ONLY: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS
3. All dates in MMM YYYY format (e.g., Jan 2020 - Present)
4. Every bullet starts with a strong action verb
5. Every bullet must include a metric, number, or measurable outcome
6. Keywords from JD must appear naturally in summary, bullets, and skills
7. Summary is 3-4 sentences maximum
8. Skills grouped by category
9. Maximum ${input.pageCount || 2} pages of content
10. Use exact company names and job titles from the LinkedIn data

KEYWORD ANALYSIS:
Extract ALL important keywords from the job description.
For each, note whether it appears in the resume content.
Provide 3-5 specific recommendations to improve the score.

Return ONLY valid JSON with this exact structure:
{
  "contact": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
  "summary": "3-4 sentence professional summary",
  "experience": [
    { "id": "exp-1", "company": "", "role": "", "location": "", "start_date": "", "end_date": "", "current": false, "bullets": [] }
  ],
  "education": [
    { "id": "edu-1", "institution": "", "degree": "", "field": "", "year": "", "gpa": "" }
  ],
  "skills": { "technical": [], "soft": [], "languages": [], "certifications": [] },
  "achievements": [],
  "custom_sections": [],
  "ats_analysis": {
    "score": 0,
    "keywords_matched": [],
    "keywords_missing": [],
    "recommendations": []
  }
}`;

  // 3. Call Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      { role: 'user', content: prompt },
    ],
    system: 'You are an expert ATS resume writer with 15 years experience. Return ONLY valid JSON. No markdown. No explanation.',
  });

  let text = (response.content[0] as any).text || '';
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let resumeData: any;
  try {
    resumeData = JSON.parse(text);
  } catch {
    resumeData = JSON.parse(jsonrepair(text));
  }

  // 4. Extract ATS analysis
  const atsAnalysis = resumeData.ats_analysis || { score: 0, keywords_matched: [], keywords_missing: [], recommendations: [] };
  delete resumeData.ats_analysis;

  // 5. Generate cover letter
  const coverLetterResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Write a professional cover letter for this job application.

APPLICANT: ${input.userDetails.name}
TARGET ROLE: ${input.targetRole}
${input.targetCompany ? `TARGET COMPANY: ${input.targetCompany}` : ''}

APPLICANT BACKGROUND (from LinkedIn):
${rewrite.rewritten_headline || ''}
${rewrite.rewritten_about || ''}

JOB DESCRIPTION:
${input.jobDescription}

RULES:
- 3-4 paragraphs: Opening hook → Why this role → Proof of impact → Call to action
- Reference specific requirements from the JD
- Include 2-3 measurable achievements from their background
- Professional but confident tone — not generic
- Do NOT start with "I am writing to apply for"
- Do NOT use "Dear Hiring Manager" — use "Dear ${input.targetCompany || 'Hiring'} Team"
- Maximum 350 words
- End with a specific call to action

Return ONLY the cover letter text. No JSON. No formatting markers.`,
    }],
    system: 'You are an expert career coach who writes compelling cover letters that get interviews. Be specific, not generic.',
  });

  const coverLetter = ((coverLetterResponse.content[0] as any).text || '').trim();

  // 6. Save to DB
  const result = await query(
    `INSERT INTO resumes (order_id, email, job_description, target_role, target_company, template_id, page_count, resume_data, ats_score, keywords_matched, keywords_missing, recommendations, cover_letter, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'generated')
     RETURNING id`,
    [
      input.orderId, input.userDetails.email, input.jobDescription,
      input.targetRole, input.targetCompany || null,
      input.templateId || 'classic', input.pageCount || 2,
      JSON.stringify(resumeData), atsAnalysis.score,
      JSON.stringify(atsAnalysis.keywords_matched),
      JSON.stringify(atsAnalysis.keywords_missing),
      JSON.stringify(atsAnalysis.recommendations),
      coverLetter,
    ],
  );

  return { resumeId: result.rows[0].id, ats_score: atsAnalysis.score };
}

// ─── Parse uploaded resume text into structured data ───
export async function parseUploadedResume(text: string): Promise<any> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Extract structured data from this resume text. Return ONLY valid JSON.

RESUME TEXT:
${text.slice(0, 8000)}

Return this exact JSON structure:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "website": "",
  "summary": "",
  "experience": [
    { "role": "", "company": "", "location": "", "start_date": "", "end_date": "", "bullets": [] }
  ],
  "education": [
    { "institution": "", "degree": "", "field": "", "year": "" }
  ],
  "skills": [],
  "certifications": [],
  "languages": [],
  "achievements": []
}`,
    }],
    system: 'You are a resume parser. Extract all information accurately. Return ONLY valid JSON.',
  });

  let rText = ((response.content[0] as any).text || '').trim();
  if (rText.startsWith('```')) {
    rText = rText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    return JSON.parse(rText);
  } catch {
    return JSON.parse(jsonrepair(rText));
  }
}

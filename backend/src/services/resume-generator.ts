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
  templateId?: string;
  pageCount?: number;
}

export async function generateResume(input: ResumeInput): Promise<{ resumeId: string; ats_score: number }> {
  // 1. Fetch order data
  const orderResult = await query('SELECT * FROM orders WHERE id=$1', [input.orderId]);
  if (!orderResult.rows.length) throw new Error('Order not found');
  const order = orderResult.rows[0];

  if (order.plan !== 'pro') throw new Error('Resume builder requires Pro plan');
  if (order.processing_status !== 'done') throw new Error('Order not completed');

  const rewrite = order.rewrite;
  const analysis = order.analysis;
  if (!rewrite) throw new Error('No rewrite data found');

  // 2. Build prompt
  const prompt = `Build a complete ATS optimized resume.

TARGET ROLE: ${input.targetRole}
${input.targetCompany ? `TARGET COMPANY: ${input.targetCompany}` : ''}

LINKEDIN REWRITE DATA (already AI-optimized):
Headline: ${rewrite.rewritten_headline || ''}
About: ${rewrite.rewritten_about || ''}
Experience: ${JSON.stringify(rewrite.rewritten_experience || [])}
ATS Keywords identified: ${JSON.stringify(rewrite.ats_keywords || [])}

ADDITIONAL INFO FROM USER:
Name: ${input.userDetails.name}
Email: ${input.userDetails.email}
Phone: ${input.userDetails.phone}
Location: ${input.userDetails.location}
LinkedIn: ${input.userDetails.linkedin}
${input.userDetails.website ? `Website: ${input.userDetails.website}` : ''}
${input.additionalAchievements ? `Achievements: ${input.additionalAchievements}` : ''}
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

  // 5. Save to DB
  const result = await query(
    `INSERT INTO resumes (order_id, email, job_description, target_role, target_company, template_id, page_count, resume_data, ats_score, keywords_matched, keywords_missing, recommendations, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'generated')
     RETURNING id`,
    [
      input.orderId, input.userDetails.email, input.jobDescription,
      input.targetRole, input.targetCompany || null,
      input.templateId || 'classic', input.pageCount || 2,
      JSON.stringify(resumeData), atsAnalysis.score,
      JSON.stringify(atsAnalysis.keywords_matched),
      JSON.stringify(atsAnalysis.keywords_missing),
      JSON.stringify(atsAnalysis.recommendations),
    ],
  );

  return { resumeId: result.rows[0].id, ats_score: atsAnalysis.score };
}

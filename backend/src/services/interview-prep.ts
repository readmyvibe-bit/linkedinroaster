import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import { query } from '../db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// ─── Run migration on first import ───
const migrationPromise = query(`
  CREATE TABLE IF NOT EXISTS interview_preps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES resumes(id),
    order_id TEXT,
    source TEXT DEFAULT 'resume',
    target_role TEXT,
    target_company TEXT,
    career_stage TEXT DEFAULT 'mid',
    status TEXT DEFAULT 'queued',
    prep_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  )
`).then(() => query(`CREATE INDEX IF NOT EXISTS idx_interview_preps_resume ON interview_preps(resume_id)`))
  .then(() => query(`CREATE INDEX IF NOT EXISTS idx_interview_preps_order ON interview_preps(order_id)`))
  .then(() => console.log('[interview-prep] Migration done'))
  .catch((err: any) => console.error('[interview-prep] Migration error:', err.message));

// ─── Helpers ───

function parseJSON(text: string): any {
  let cleaned = text.trim();
  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(jsonrepair(cleaned));
  }
}

function determineCareerStage(experienceCount: number): string {
  if (experienceCount === 0) return 'fresher';
  if (experienceCount <= 2) return 'early';
  if (experienceCount <= 5) return 'mid';
  return 'senior';
}

async function geminiCall(systemPrompt: string, userPrompt: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  });
  const text = result.response.text();
  return parseJSON(text);
}

// ─── Main generation function ───

export async function generateInterviewPrep(prepId: string, resumeId: string): Promise<void> {
  await migrationPromise;

  try {
    // Update status to processing
    await query(`UPDATE interview_preps SET status='processing' WHERE id=$1`, [prepId]);

    // 1. Fetch resume
    const resumeResult = await query('SELECT * FROM resumes WHERE id=$1', [resumeId]);
    if (!resumeResult.rows.length) throw new Error('Resume not found');
    const resume = resumeResult.rows[0];

    // 2. Fetch order for context
    let order: any = null;
    const orderResult = await query('SELECT * FROM orders WHERE id=$1', [resume.order_id]);
    if (orderResult.rows.length) {
      order = orderResult.rows[0];
    } else {
      const buildResult = await query('SELECT * FROM build_orders WHERE id=$1', [resume.order_id]);
      if (buildResult.rows.length) order = buildResult.rows[0];
    }

    // 3. Extract data
    const resumeData = resume.resume_data || {};
    const experience = resumeData.experience || [];
    const skills = resumeData.skills || [];
    const education = resumeData.education || [];
    const summary = resumeData.summary || '';
    const contact = resumeData.contact || {};
    const jobDescription = resume.job_description || order?.job_description || '';
    const targetRole = resume.target_role || '';
    const targetCompany = resume.target_company || '';

    // 4. Career stage
    const careerStage = determineCareerStage(experience.length);
    await query(`UPDATE interview_preps SET career_stage=$1, target_role=$2, target_company=$3, order_id=$4 WHERE id=$5`,
      [careerStage, targetRole, targetCompany, resume.order_id, prepId]);

    // Format resume text for prompts
    const experienceText = experience.map((e: any, i: number) => {
      const role = e.role || e.title || '';
      const company = e.company || '';
      const dates = e.dates || '';
      const bullets = (e.bullets || []).map((b: string) => `  - ${b}`).join('\n');
      return `${i + 1}. ${role} at ${company} (${dates})\n${bullets}`;
    }).join('\n\n');

    const skillsText = Array.isArray(skills)
      ? (typeof skills[0] === 'string'
        ? skills.join(', ')
        : skills.map((s: any) => `${s.category || s.label || 'Skills'}: ${(s.skills || []).join(', ')}`).join('\n'))
      : Object.entries(skills).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');

    const educationText = education.map((e: any) => {
      return `${e.degree || ''} - ${e.institution || e.school || ''} (${e.year || e.dates || ''})`;
    }).join('\n');

    const resumeContext = `
CANDIDATE NAME: ${contact.name || 'Unknown'}
TARGET ROLE: ${targetRole}
TARGET COMPANY: ${targetCompany}
CAREER STAGE: ${careerStage}

PROFESSIONAL SUMMARY:
${summary}

EXPERIENCE:
${experienceText || 'No experience listed'}

SKILLS:
${skillsText || 'No skills listed'}

EDUCATION:
${educationText || 'No education listed'}
`.trim();

    const jdContext = `
JOB DESCRIPTION:
${jobDescription || 'No job description provided'}
`.trim();

    // ─── CALL 1: Brief + Question Plan ───
    const systemPrompt1 = `You are an expert interview coach specializing in the Indian job market. Generate interview preparation based on the candidate's resume and the target job description. Return ONLY valid JSON, no markdown.`;

    const userPrompt1 = `Analyze the following job description and candidate profile, then generate a company brief and interview question plan.

${jdContext}

${resumeContext}

Return this exact JSON structure:
{
  "company_brief": {
    "what_jd_emphasizes": ["string array of key themes from JD"],
    "interview_style": "string — inferred style (behavioral/technical/mixed)",
    "what_they_value": ["string array — mapped to JD phrases"],
    "red_flags": ["string array — what they screen against"]
  },
  "question_plan": [
    {
      "id": 1,
      "category": "behavioral|role_specific|situational|culture",
      "theme": "string — what this tests",
      "jd_anchor": "string — specific JD phrase this relates to"
    }
  ]
}

Generate exactly 15 questions in the plan: 5 behavioral, 5 role_specific, 3 situational, 2 culture.
Each question_plan entry must have an id from 1-15.`;

    console.log(`[interview-prep] ${prepId}: Starting Call 1 — Brief + Question Plan`);
    const call1Result = await geminiCall(systemPrompt1, userPrompt1);

    // Save partial results
    await query(`UPDATE interview_preps SET prep_data=$1 WHERE id=$2`,
      [JSON.stringify({ company_brief: call1Result.company_brief, question_plan: call1Result.question_plan }), prepId]);

    // ─── CALL 2: Expand Questions ───
    const systemPrompt2 = `You are an expert interview coach. Expand the question plan into full interview questions with STAR-format suggested answers.
CRITICAL RULES:
- Suggested answers MUST use ONLY facts from the resume. No fabricated metrics or numbers.
- If the resume lacks metrics, use qualitative framing — not fake numbers.
- For freshers: answers focus on projects, coursework, learning, potential.
- For senior candidates: answers focus on strategy, leadership, business impact.
- Every answer must reference specific JD requirements.
Return ONLY valid JSON, no markdown.`;

    const userPrompt2 = `Given this question plan and candidate profile, expand each question into a full interview question with suggested answer.

QUESTION PLAN:
${JSON.stringify(call1Result.question_plan, null, 2)}

${resumeContext}

${jdContext}

Return this exact JSON structure:
{
  "questions": [
    {
      "id": 1,
      "category": "behavioral",
      "question": "string",
      "why_they_ask": "string — linked to JD requirement",
      "suggested_answer": {
        "situation": "string",
        "task": "string",
        "action": "string",
        "result": "string"
      },
      "common_mistakes": ["string array, 1-2 items"],
      "follow_ups": ["string array, 2-3 items"]
    }
  ]
}

Generate all 15 expanded questions matching the plan IDs.`;

    console.log(`[interview-prep] ${prepId}: Starting Call 2 — Expand Questions`);
    const call2Result = await geminiCall(systemPrompt2, userPrompt2);

    // Save partial results (calls 1+2)
    await query(`UPDATE interview_preps SET prep_data=$1 WHERE id=$2`,
      [JSON.stringify({
        company_brief: call1Result.company_brief,
        question_plan: call1Result.question_plan,
        questions: call2Result.questions,
      }), prepId]);

    // ─── CALL 3: Closing Pack ───
    const systemPrompt3 = `You are an expert interview coach. Generate a closing interview preparation pack including questions to ask the interviewer, a cheat sheet, and MCQ quiz questions.
CRITICAL RULES:
- key_numbers must ONLY contain numbers/metrics found in the resume. No fabrication.
- power_stories must be based on actual resume experience.
- MCQ questions should test understanding of the JD requirements and role.
Return ONLY valid JSON, no markdown.`;

    const userPrompt3 = `Generate a closing interview preparation pack for this candidate and role.

${resumeContext}

${jdContext}

COMPANY BRIEF:
${JSON.stringify(call1Result.company_brief, null, 2)}

Return this exact JSON structure:
{
  "ask_them": [
    { "question": "string", "why_it_matters": "string" }
  ],
  "cheat_sheet": {
    "key_numbers": ["string array — ONLY from resume, no fabrication"],
    "power_stories": [
      { "title": "string", "hook": "string", "jd_theme": "string" }
    ],
    "jd_keywords": ["string array"],
    "avoid_phrases": [
      { "avoid": "string", "use_instead": "string" }
    ]
  },
  "mcq": [
    {
      "question": "string",
      "options": ["A string", "B string", "C string", "D string"],
      "correct": 0,
      "explanation": "string",
      "jd_link": "string"
    }
  ]
}

Generate exactly 5 ask_them questions, 3 power_stories, 10 MCQs.`;

    console.log(`[interview-prep] ${prepId}: Starting Call 3 — Closing Pack`);
    const call3Result = await geminiCall(systemPrompt3, userPrompt3);

    // Merge all results
    const finalPrepData = {
      company_brief: call1Result.company_brief,
      question_plan: call1Result.question_plan,
      questions: call2Result.questions,
      ask_them: call3Result.ask_them,
      cheat_sheet: call3Result.cheat_sheet,
      mcq: call3Result.mcq,
    };

    await query(
      `UPDATE interview_preps SET status='ready', prep_data=$1, completed_at=NOW() WHERE id=$2`,
      [JSON.stringify(finalPrepData), prepId],
    );

    console.log(`[interview-prep] ${prepId}: Complete`);
  } catch (err: any) {
    console.error(`[interview-prep] ${prepId}: Failed —`, err.message);
    await query(
      `UPDATE interview_preps SET status='failed', error_message=$1 WHERE id=$2`,
      [err.message?.slice(0, 500) || 'Unknown error', prepId],
    );
  }
}

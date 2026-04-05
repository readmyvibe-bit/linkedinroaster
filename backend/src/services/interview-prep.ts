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

    const hasJD = jobDescription && jobDescription.trim().length > 20;

    const jdContext = hasJD
      ? `JOB DESCRIPTION:\n${jobDescription}`
      : '';

    // ─── CALL 1: Brief + Question Plan ───
    const systemPrompt1 = `You are an expert interview coach specializing in the Indian job market. Return ONLY valid JSON, no markdown.

CRITICAL RULES:
- NEVER fabricate or invent company names, company details, or job descriptions that were not provided.
- suggested_answer uses ONLY facts from the resume. NO fabricated metrics, numbers, or achievements.
- Every question must be fully written out — do NOT leave any as "...".
- Fill ALL 15 questions, 5 ask_them, 10 MCQs completely.`;

    const userPrompt1 = hasJD
      ? `Analyze this job description and candidate resume, then generate interview prep.

${jdContext}

${resumeContext}

Return this JSON:
{
  "company_brief": {
    "what_jd_emphasizes": ["3-5 key themes from the JD"],
    "interview_style": "behavioral / technical / mixed",
    "what_they_value": ["3-5 values mapped to actual JD phrases"],
    "red_flags": ["3-4 things they screen against based on JD"]
  },`
      : `Generate interview prep for this candidate targeting a "${targetRole}" role${targetCompany ? ` at ${targetCompany}` : ''}.
No job description was provided, so base ALL questions on the candidate's resume, skills, and target role.

${resumeContext}

IMPORTANT: No job description was provided. Do NOT invent or hallucinate any company details, JD themes, or company values. The company_brief should reflect GENERAL expectations for the "${targetRole}" role in the ${targetCompany ? targetCompany : 'industry'}.

Return this JSON:
{
  "company_brief": {
    "what_jd_emphasizes": ["3-5 key skills/themes typical for ${targetRole} roles"],
    "interview_style": "behavioral / technical / mixed",
    "what_they_value": ["3-5 values typical for ${targetRole} hiring"],
    "red_flags": ["3-4 common red flags interviewers look for in ${targetRole} candidates"]
  },`
    + `
  "questions": [
    {"id":1,"category":"behavioral","question":"Tell me about a time you [specific to role/resume]...","why_they_ask":"reason","suggested_answer":{"situation":"from resume ONLY","task":"from resume ONLY","action":"from resume ONLY","result":"from resume ONLY"},"common_mistakes":["1-2 items"],"follow_ups":["2 items"]},
    {"id":2,"category":"behavioral","question":"second behavioral question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":3,"category":"behavioral","question":"third behavioral question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":4,"category":"behavioral","question":"fourth behavioral question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":5,"category":"behavioral","question":"fifth behavioral question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":6,"category":"role_specific","question":"How would you [role-specific task]?","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":7,"category":"role_specific","question":"second role question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":8,"category":"role_specific","question":"third role question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":9,"category":"role_specific","question":"fourth role question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":10,"category":"role_specific","question":"fifth role question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":11,"category":"situational","question":"What would you do if [scenario]?","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":12,"category":"situational","question":"second situational","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":13,"category":"situational","question":"third situational","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":14,"category":"culture","question":"Why this role?","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]},
    {"id":15,"category":"culture","question":"second culture question","why_they_ask":"reason","suggested_answer":{"situation":"...","task":"...","action":"...","result":"..."},"common_mistakes":["..."],"follow_ups":["..."]}
  ],
  "ask_them": [
    {"question":"Short 1-line question (max 15 words)","why_it_matters":"1-2 sentences"},
    {"question":"second question for interviewer","why_it_matters":"1-2 sentences"},
    {"question":"third question","why_it_matters":"1-2 sentences"},
    {"question":"fourth question","why_it_matters":"1-2 sentences"},
    {"question":"fifth question","why_it_matters":"1-2 sentences"}
  ],
  "cheat_sheet": {
    "key_numbers": ["ONLY real numbers from the resume — no fabrication"],
    "power_stories": [{"title":"story title from resume","hook":"1-line hook","jd_theme":"relevant skill/theme"}],
    "jd_keywords": ["${hasJD ? 'keywords from JD to use in answers' : 'industry keywords relevant to ' + targetRole}"],
    "avoid_phrases": [{"avoid":"weak phrase","use_instead":"stronger alternative"}]
  },
  "mcq": [
    {"question":"interview knowledge question","options":["A","B","C","D"],"correct":0,"explanation":"why correct","jd_link":"${hasJD ? 'JD connection' : 'role relevance'}"},
    {"question":"second MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"third MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"fourth MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"fifth MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"sixth MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"seventh MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"eighth MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"ninth MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"},
    {"question":"tenth MCQ","options":["A","B","C","D"],"correct":0,"explanation":"why","jd_link":"relevance"}
  ]
}

RULES:
- suggested_answer uses ONLY facts from the resume. NO fabricated metrics or achievements.
- ask_them questions must be SHORT (max 15 words).
- ask_them are questions the CANDIDATE asks the INTERVIEWER. Simple, confident, shows interest.
- For ${careerStage} candidates: adjust question difficulty and answer depth accordingly.
- WRITE OUT every single question, answer, MCQ fully. Do NOT leave any field as "...".
- Each question MUST be unique and specific to this candidate's background.`;

    console.log(`[interview-prep] ${prepId}: Starting Call 1 — Brief + Question Plan`);

    let call1Result: any = null;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      call1Result = await geminiCall(systemPrompt1, userPrompt1);

      // Validate completeness
      const questions = call1Result.questions || [];
      const mcqs = call1Result.mcq || [];
      const askThem = call1Result.ask_them || [];

      // Check for placeholder "..." in questions
      const validQuestions = questions.filter((q: any) =>
        q.question && q.question !== '...' && q.question.length > 10 &&
        q.suggested_answer && q.suggested_answer.situation !== '...'
      );
      const validMcqs = mcqs.filter((m: any) =>
        m.question && m.question !== '...' && m.question.length > 10 &&
        m.options && m.options.length === 4 && m.options[0] !== '...'
      );

      if (validQuestions.length >= 12 && validMcqs.length >= 7) {
        // Good enough — use filtered results
        call1Result.questions = validQuestions;
        call1Result.mcq = validMcqs;
        call1Result.ask_them = askThem.filter((a: any) => a.question && a.question !== '...' && a.question.length > 5);
        console.log(`[interview-prep] ${prepId}: Attempt ${attempt + 1} — ${validQuestions.length} questions, ${validMcqs.length} MCQs`);
        break;
      }

      console.log(`[interview-prep] ${prepId}: Attempt ${attempt + 1} incomplete — ${validQuestions.length}/15 questions, ${validMcqs.length}/10 MCQs. ${attempt < MAX_RETRIES ? 'Retrying...' : 'Using best result.'}`);
    }

    // Single call generates everything — merge into final structure
    const finalPrepData = {
      company_brief: call1Result.company_brief,
      questions: (call1Result.questions || []).filter((q: any) => q.question && q.question !== '...'),
      ask_them: (call1Result.ask_them || []).filter((a: any) => a.question && a.question !== '...'),
      cheat_sheet: call1Result.cheat_sheet || {},
      mcq: (call1Result.mcq || []).filter((m: any) => m.question && m.question !== '...'),
    };

    const durationMs = Date.now() - Date.now(); // approximate — v1 doesn't track start time inline
    const meta = {
      pipeline_version: 'v1',
      interview_level: careerStage,
      question_count: finalPrepData.questions.length,
      mcq_count: finalPrepData.mcq.length,
      degraded: finalPrepData.questions.length < 12 || finalPrepData.mcq.length < 7,
      degraded_reason: finalPrepData.questions.length < 12 || finalPrepData.mcq.length < 7
        ? `${finalPrepData.questions.length}/15 questions, ${finalPrepData.mcq.length}/10 MCQs`
        : null,
    };

    await query(
      `UPDATE interview_preps SET status='ready', prep_data=$1, generation_meta=$2, pipeline_version='v1', completed_at=NOW() WHERE id=$3`,
      [JSON.stringify(finalPrepData), JSON.stringify(meta), prepId],
    );

    console.log(`[interview-prep] ${prepId}: Complete — ${finalPrepData.questions.length} questions, ${finalPrepData.mcq.length} MCQs${meta.degraded ? ' (degraded)' : ''}`);
  } catch (err: any) {
    console.error(`[interview-prep] ${prepId}: Failed —`, err.message);
    await query(
      `UPDATE interview_preps SET status='failed', error_message=$1 WHERE id=$2`,
      [err.message?.slice(0, 500) || 'Unknown error', prepId],
    );
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import { query } from '../db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// ─── Schema migration (runs once per process, idempotent) ───
const v2MigrationPromise = (async () => {
  try {
    await query(`
      ALTER TABLE interview_preps ADD COLUMN IF NOT EXISTS interview_level TEXT DEFAULT 'mid';
      ALTER TABLE interview_preps ADD COLUMN IF NOT EXISTS pipeline_version TEXT DEFAULT 'v1';
      ALTER TABLE interview_preps ADD COLUMN IF NOT EXISTS generation_meta JSONB;
    `);
    // Additional indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_interview_preps_status ON interview_preps(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_interview_preps_resume_status ON interview_preps(resume_id, status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_interview_preps_created ON interview_preps(created_at DESC)`);
    console.log('[interview-prep-v2] Schema + indexes updated');
  } catch (err: any) {
    if (!err.message?.includes('already exists')) {
      console.error('[interview-prep-v2] Migration:', err.message);
    }
  }
})();

// ─── Helpers ───

function parseJSON(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  try { return JSON.parse(cleaned); } catch { return JSON.parse(jsonrepair(cleaned)); }
}

async function geminiPhase(prompt: string, system: string, opts: { temperature?: number; maxTokens?: number; model?: string } = {}): Promise<any> {
  const modelName = opts.model || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { role: 'system', parts: [{ text: system }] },
    generationConfig: { temperature: opts.temperature ?? 0.5, maxOutputTokens: opts.maxTokens ?? 4096 },
  });
  const text = result.response.text();
  const finishReason = result.response.candidates?.[0]?.finishReason;
  if (finishReason === 'MAX_TOKENS') {
    console.warn(`[interview-prep-v2] MAX_TOKENS hit for phase. Retrying with Pro model.`);
    throw new Error('MAX_TOKENS');
  }
  return parseJSON(text);
}

async function geminiPhaseWithRetry(prompt: string, system: string, opts: { temperature?: number; maxTokens?: number } = {}): Promise<any> {
  try {
    return await geminiPhase(prompt, system, opts);
  } catch (err: any) {
    const msg = err.message || '';
    const isRetryable = msg === 'MAX_TOKENS'
      || msg.includes('parse')
      || msg.includes('Unexpected token')
      || msg.includes('JSON at position')
      || err instanceof SyntaxError
      || err.name === 'SyntaxError';
    if (isRetryable) {
      console.log(`[interview-prep-v2] Retrying phase with gemini-2.5-pro (reason: ${msg.slice(0, 80)})`);
      return await geminiPhase(prompt, system, { ...opts, model: 'gemini-2.5-pro', maxTokens: (opts.maxTokens || 4096) + 2048 });
    }
    throw err;
  }
}

// ─── C2: Input Normalization ───

export interface NormalizedRole {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  bullets: string[];
  level: 'intern' | 'entry' | 'mid' | 'senior' | 'lead';
}

export interface CandidateProfile {
  name: string;
  targetRole: string;
  targetCompany: string;
  totalExperienceMonths: number;
  roles: NormalizedRole[];
  skills: string[];
  education: string[];
  summary: string;
  jobDescription: string;
  hasJD: boolean;
}

function parseMonthYear(dateStr: string): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.trim().toLowerCase();
  if (normalized === 'present' || normalized === 'current') return new Date();
  const monthMap: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11, january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11 };
  const match = normalized.match(/(\w+)\s+(\d{4})/);
  if (match) {
    const month = monthMap[match[1]] ?? 0;
    return new Date(parseInt(match[2]), month);
  }
  const yearOnly = normalized.match(/^(\d{4})$/);
  if (yearOnly) return new Date(parseInt(yearOnly[1]), 0);
  return null;
}

function estimateDurationMonths(startStr: string, endStr: string): number {
  const start = parseMonthYear(startStr);
  const end = parseMonthYear(endStr) || new Date();
  if (!start) return 0; // unknown dates = 0 months, not 12
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

function inferRoleLevel(title: string): NormalizedRole['level'] {
  const t = title.toLowerCase();
  if (/intern|trainee|apprentice/.test(t)) return 'intern';
  if (/junior|associate|analyst|executive|fresher|entry/.test(t)) return 'entry';
  if (/senior|sr\.|lead|principal|head|vp|director|chief|cto|ceo|coo|cfo/.test(t)) return 'senior';
  if (/manager|team.lead|supervisor/.test(t)) return 'lead';
  return 'mid';
}

export function normalizeCandidateProfile(resumeData: any, resume: any, order: any): CandidateProfile {
  const contact = resumeData.contact || {};
  const experience = resumeData.experience || [];
  const skills = resumeData.skills || [];
  const education = resumeData.education || [];
  const jd = resume.job_description || order?.job_description || '';

  // Robust skill flattening — handles string[], object[], or Record<string, string[]>
  let flatSkills: string[] = [];
  if (Array.isArray(skills) && skills.length > 0) {
    if (typeof skills[0] === 'string') {
      flatSkills = skills as string[];
    } else {
      flatSkills = skills.flatMap((s: any) => s.skills || s.items || [s.label || s.category || ''].filter(Boolean));
    }
  } else if (skills && typeof skills === 'object') {
    flatSkills = Object.values(skills).flat().map(String);
  }

  const roles: NormalizedRole[] = experience.map((e: any) => {
    const startDate = e.start_date || e.dates?.split(/[-–]/)[0]?.trim() || '';
    const endDate = e.end_date || e.dates?.split(/[-–]/)[1]?.trim() || 'Present';
    return {
      title: e.title || e.role || '',
      company: e.company || '',
      startDate,
      endDate,
      durationMonths: estimateDurationMonths(startDate, endDate),
      bullets: Array.isArray(e.bullets) ? e.bullets : [],
      level: inferRoleLevel(e.title || e.role || ''),
    };
  });

  const totalExperienceMonths = roles.reduce((sum, r) => sum + r.durationMonths, 0);

  // Clean target company — reject validation error messages
  const rawCompany = resume.target_company || '';
  const targetCompany = rawCompany.includes('must be at least') || rawCompany.length < 2 ? '' : rawCompany;

  return {
    name: contact.name || '',
    targetRole: resume.target_role || '',
    targetCompany,
    totalExperienceMonths,
    roles,
    skills: flatSkills.filter(Boolean),
    education: education.map((e: any) => `${e.degree || ''} ${e.field || ''} - ${e.institution || e.school || ''} (${e.year || e.dates || ''})`).filter((s: string) => s.trim() !== '- ()'),
    summary: resumeData.summary || '',
    jobDescription: jd,
    hasJD: !!(jd && jd.trim().length > 50),
  };
}

// ─── C3: Interview Level Inference ───

export type InterviewLevel = 'entry' | 'mid' | 'senior' | 'lead';

export function extractJdSignals(jd: string): { suggestedLevel: InterviewLevel | null; yearsRequired: number | null } {
  if (!jd || jd.length < 50) return { suggestedLevel: null, yearsRequired: null };
  const lower = jd.toLowerCase();

  // Years extraction
  const yearsMatch = lower.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/);
  const yearsRequired = yearsMatch ? parseInt(yearsMatch[1]) : null;

  // Title signals
  if (/\b(?:intern|trainee|graduate|entry.level|fresher)\b/.test(lower)) return { suggestedLevel: 'entry', yearsRequired };
  if (/\b(?:director|vp|vice.president|head of|chief|c-level)\b/.test(lower)) return { suggestedLevel: 'lead', yearsRequired };
  if (/\b(?:senior|sr\.|principal|staff|lead)\b/.test(lower)) return { suggestedLevel: 'senior', yearsRequired };
  if (/\b(?:manager|team.lead|supervisor)\b/.test(lower)) return { suggestedLevel: 'lead', yearsRequired };

  if (yearsRequired !== null) {
    if (yearsRequired <= 2) return { suggestedLevel: 'entry', yearsRequired };
    if (yearsRequired <= 5) return { suggestedLevel: 'mid', yearsRequired };
    if (yearsRequired <= 10) return { suggestedLevel: 'senior', yearsRequired };
    return { suggestedLevel: 'lead', yearsRequired };
  }

  return { suggestedLevel: null, yearsRequired };
}

export function inferInterviewLevel(profile: CandidateProfile, userOverride?: string): InterviewLevel {
  // 1. User override — always respected
  if (userOverride && ['entry', 'mid', 'senior', 'lead'].includes(userOverride)) return userOverride as InterviewLevel;

  // 2. JD signals (if JD provided)
  const jdSignals = extractJdSignals(profile.jobDescription);
  if (jdSignals.suggestedLevel) return jdSignals.suggestedLevel;

  // 3. Fresher detection — no roles or zero experience
  if (profile.roles.length === 0 || profile.totalExperienceMonths === 0) return 'entry';

  // 4. Title keywords from most recent roles
  const recentRoles = profile.roles.slice(0, 2);
  const hasLeadTitle = recentRoles.some(r => r.level === 'lead' || r.level === 'senior');
  if (hasLeadTitle && profile.totalExperienceMonths > 84) return 'lead';
  if (hasLeadTitle) return 'senior';

  // 5. Total experience bands (India-tuned)
  const months = profile.totalExperienceMonths;
  if (months <= 24) return 'entry';
  if (months <= 60) return 'mid';
  if (months <= 120) return 'senior';
  return 'lead';
}

// ─── Level Rubrics ───

const LEVEL_RUBRICS: Record<InterviewLevel, string> = {
  entry: `INTERVIEW LEVEL: ENTRY (0-2 years)
- Questions: Focus on learning ability, academic projects, internship experience, basic technical skills
- STAR answers: Use college projects, internships, volunteer work. Okay to reference coursework.
- Difficulty: Foundational. Test willingness to learn, not deep expertise.
- MCQs: Conceptual, not advanced. Test understanding of basics.
- Tone: Encouraging. This person is building confidence.`,

  mid: `INTERVIEW LEVEL: MID (2-5 years)
- Questions: Role-specific scenarios, process improvement, cross-team collaboration, technical depth
- STAR answers: Must reference specific work achievements with metrics. No generic responses.
- Difficulty: Moderate. Expect ownership of projects and measurable outcomes.
- MCQs: Applied knowledge. Scenario-based with nuance.
- Tone: Professional. This person should demonstrate growing expertise.`,

  senior: `INTERVIEW LEVEL: SENIOR (5-10 years)
- Questions: Leadership without authority, strategic decisions, mentoring, scaling systems/processes
- STAR answers: Impact-driven. Revenue, team growth, process transformation, org-level changes.
- Difficulty: High. Expect strategic thinking and systemic impact.
- MCQs: Advanced scenarios. Decision-making under constraints.
- Tone: Peer conversation. Test judgment and strategic insight.`,

  lead: `INTERVIEW LEVEL: LEAD (10+ years / management)
- Questions: Org-level strategy, P&L ownership, stakeholder management, culture building, hard trade-offs
- STAR answers: Business impact in crores/revenue/headcount. Organizational transformation stories.
- Difficulty: Executive-level. Expect cross-functional leadership and business acumen.
- MCQs: Strategic and leadership-oriented. No basic technical questions.
- Tone: Board-level. Test vision, judgment, and executive presence.`,
};

// ─── C4: Phased Pipeline ───

function buildResumeContext(profile: CandidateProfile): string {
  const rolesText = profile.roles.map((r, i) => {
    const bullets = r.bullets.map(b => `  - ${b}`).join('\n');
    return `${i + 1}. ${r.title} at ${r.company} (${r.durationMonths} months)\n${bullets}`;
  }).join('\n\n');

  return `
CANDIDATE: ${profile.name}
TARGET ROLE: ${profile.targetRole}
${profile.targetCompany ? `TARGET COMPANY: ${profile.targetCompany}` : ''}
TOTAL EXPERIENCE: ${Math.round(profile.totalExperienceMonths / 12)} years

EXPERIENCE:
${rolesText || 'No experience listed'}

SKILLS: ${profile.skills.join(', ') || 'None listed'}

EDUCATION: ${profile.education.join(' | ') || 'None listed'}

SUMMARY: ${profile.summary || 'None provided'}
`.trim();
}

const GLOBAL_RULES = `ABSOLUTE RULES:
- Return ONLY valid JSON. No markdown, no commentary.
- NEVER fabricate company names, metrics, or achievements not in the resume.
- Every field must be fully written — NO "..." or placeholder text.
- Ground all STAR answers in the actual resume data provided.`;

async function phase1_plan(profile: CandidateProfile, level: InterviewLevel): Promise<{ question_mix: Record<string, number>; focus_themes: string[] }> {
  const system = `You are an expert interview prep strategist. Plan the question distribution for a ${level}-level candidate.\n${GLOBAL_RULES}`;
  const prompt = `${buildResumeContext(profile)}
${profile.hasJD ? `\nJOB DESCRIPTION:\n${profile.jobDescription.slice(0, 6000)}` : ''}

${LEVEL_RUBRICS[level]}

Plan 15 interview questions distributed across categories. Return JSON:
{
  "question_mix": {"behavioral": 5, "role_specific": 5, "situational": 3, "culture": 2},
  "focus_themes": ["3-5 themes to focus questions on based on resume + target role"]
}
The mix must sum to exactly 15. Adjust distribution based on level and role.`;

  return geminiPhaseWithRetry(prompt, system, { temperature: 0.3, maxTokens: 1024 });
}

async function phase2_brief(profile: CandidateProfile): Promise<any> {
  const system = `You are an interview intelligence analyst. ${profile.hasJD ? 'Analyze the job description.' : 'Provide general role expectations.'}\n${GLOBAL_RULES}`;
  const prompt = profile.hasJD
    ? `JOB DESCRIPTION:\n${profile.jobDescription.slice(0, 8000)}\n\nReturn JSON:
{
  "what_jd_emphasizes": ["3-5 key themes"],
  "interview_style": "behavioral | technical | mixed",
  "what_they_value": ["3-5 values with JD quotes"],
  "red_flags": ["3-4 screening criteria from JD"]
}`
    : `TARGET ROLE: ${profile.targetRole}\n${profile.targetCompany ? `COMPANY: ${profile.targetCompany}` : ''}\n\nNo JD provided. Do NOT invent company details.\nReturn JSON:
{
  "what_jd_emphasizes": ["3-5 typical expectations for ${profile.targetRole}"],
  "interview_style": "mixed",
  "what_they_value": ["3-5 values typical for this role"],
  "red_flags": ["3-4 common screening criteria"]
}`;

  return geminiPhaseWithRetry(prompt, system, { temperature: 0.3, maxTokens: 2048 });
}

async function phase3_skeleton(profile: CandidateProfile, level: InterviewLevel, plan: { question_mix: Record<string, number>; focus_themes: string[] }): Promise<any[]> {
  const system = `You are an expert interviewer. Generate question skeletons (no answers yet).\n${GLOBAL_RULES}\n${LEVEL_RUBRICS[level]}`;
  const prompt = `${buildResumeContext(profile)}
${profile.hasJD ? `\nJOB DESCRIPTION (excerpt):\n${profile.jobDescription.slice(0, 4000)}` : ''}

QUESTION MIX: ${JSON.stringify(plan.question_mix)}
FOCUS THEMES: ${plan.focus_themes.join(', ')}

Generate exactly 15 questions. Return JSON array:
[
  {"id": 1, "category": "behavioral", "question": "full question text", "why_they_ask": "1-2 sentences", "difficulty": "${level}"},
  ...15 total
]
Each question must be specific to THIS candidate's background and target role. No generic questions.`;

  const result = await geminiPhaseWithRetry(prompt, system, { temperature: 0.5, maxTokens: 4096 });
  return Array.isArray(result) ? result : result.questions || result;
}

async function phase4_starBatch(profile: CandidateProfile, level: InterviewLevel, questions: any[]): Promise<any[]> {
  const answered: any[] = [];
  // Process in batches of 5
  for (let i = 0; i < questions.length; i += 5) {
    const batch = questions.slice(i, i + 5);
    const system = `You are an expert interview coach. Generate STAR answers grounded ONLY in the resume.\n${GLOBAL_RULES}\n${LEVEL_RUBRICS[level]}`;
    const prompt = `${buildResumeContext(profile)}

Generate STAR answers for these questions. Use ONLY facts from the resume above.
QUESTIONS:
${batch.map((q: any, j: number) => `${j + 1}. [${q.category}] ${q.question}`).join('\n')}

Return JSON array (one per question):
[
  {
    "id": ${batch[0]?.id || i + 1},
    "category": "${batch[0]?.category || 'behavioral'}",
    "question": "exact question text",
    "why_they_ask": "reason",
    "suggested_answer": {
      "situation": "specific context from resume (2-3 sentences)",
      "task": "what needed to be done (1-2 sentences)",
      "action": "specific actions taken (2-3 sentences)",
      "result": "measurable outcome from resume (1-2 sentences)"
    },
    "common_mistakes": ["2 mistakes to avoid"],
    "follow_ups": ["2 likely follow-up questions"]
  }
]`;

    const result = await geminiPhaseWithRetry(prompt, system, { temperature: 0.5, maxTokens: 6144 });
    const items = Array.isArray(result) ? result : result.questions || [];
    answered.push(...items);
  }
  return answered;
}

async function phase5_extras(profile: CandidateProfile, level: InterviewLevel): Promise<{ ask_them: any[]; cheat_sheet: any }> {
  const system = `You are an interview coach. Generate questions-to-ask-interviewer and a cheat sheet.\n${GLOBAL_RULES}`;
  const prompt = `${buildResumeContext(profile)}
${profile.hasJD ? `\nJD excerpt:\n${profile.jobDescription.slice(0, 3000)}` : ''}
LEVEL: ${level}

Return JSON:
{
  "ask_them": [
    {"question": "short question max 15 words", "why_it_matters": "1-2 sentences"}
  ] (exactly 5),
  "cheat_sheet": {
    "key_numbers": ["real numbers from resume ONLY — no fabrication"],
    "power_stories": [{"title": "story from resume", "hook": "1-line hook", "jd_theme": "relevant skill"}] (3-4 stories),
    "jd_keywords": ["${profile.hasJD ? 'keywords from JD' : 'industry keywords for ' + profile.targetRole}"] (5-8 keywords),
    "avoid_phrases": [{"avoid": "weak phrase", "use_instead": "stronger alternative"}] (3-4 items)
  }
}`;

  return geminiPhaseWithRetry(prompt, system, { temperature: 0.4, maxTokens: 3072 });
}

async function phase6_mcq(profile: CandidateProfile, level: InterviewLevel): Promise<any[]> {
  const system = `You are an interview knowledge quiz designer.\n${GLOBAL_RULES}\n${LEVEL_RUBRICS[level]}`;
  const prompt = `${buildResumeContext(profile)}
${profile.hasJD ? `\nJD excerpt:\n${profile.jobDescription.slice(0, 2000)}` : ''}

Generate 10 MCQs testing interview readiness for a ${level}-level ${profile.targetRole} candidate.
5 should test role/domain knowledge, 5 should test behavioral/situational judgment.

Return JSON array:
[
  {"question": "full question", "options": ["A text", "B text", "C text", "D text"], "correct": 0, "explanation": "why correct", "jd_link": "relevance to role"}
] (exactly 10)`;

  const result = await geminiPhaseWithRetry(prompt, system, { temperature: 0.5, maxTokens: 4096 });
  return Array.isArray(result) ? result : result.mcq || result;
}

// ─── C6: Validation ───

export interface ValidationResult {
  valid: boolean;
  degraded: boolean;
  errors: string[];
  questionCount: number;
  mcqCount: number;
}

export function validatePrepData(data: any): ValidationResult {
  const errors: string[] = [];
  const questions = data.questions || [];
  const mcqs = data.mcq || [];
  const askThem = data.ask_them || [];

  // Validate questions
  const validQs = questions.filter((q: any) =>
    q.question && q.question.length > 15 && !q.question.includes('...') &&
    q.suggested_answer &&
    q.suggested_answer.situation && q.suggested_answer.situation.length > 10 && !q.suggested_answer.situation.includes('...') &&
    q.suggested_answer.action && q.suggested_answer.action.length > 10
  );

  // Validate MCQs
  const validMcqs = mcqs.filter((m: any) =>
    m.question && m.question.length > 15 &&
    m.options && m.options.length === 4 &&
    m.options.every((o: string) => o && o.length > 2 && o !== '...') &&
    typeof m.correct === 'number'
  );

  // Validate ask_them
  const validAsk = askThem.filter((a: any) => a.question && a.question.length > 5 && !a.question.includes('...'));

  if (validQs.length < 15) errors.push(`Only ${validQs.length}/15 valid questions`);
  if (validMcqs.length < 10) errors.push(`Only ${validMcqs.length}/10 valid MCQs`);
  if (validAsk.length < 5) errors.push(`Only ${validAsk.length}/5 valid ask-them questions`);
  if (!data.company_brief) errors.push('Missing company brief');
  if (!data.cheat_sheet) errors.push('Missing cheat sheet');

  // Full pass: meets ideal thresholds
  const fullPass = validQs.length >= 12 && validMcqs.length >= 8 && validAsk.length >= 3;
  // Degraded pass: meets minimum thresholds but not ideal
  const meetsMinimum = validQs.length >= 10 && validMcqs.length >= 6;
  const degraded = meetsMinimum && !fullPass;

  return { valid: fullPass || meetsMinimum, degraded, errors, questionCount: validQs.length, mcqCount: validMcqs.length };
}

// ─── C4 Main: Phased Pipeline ───

export async function generateInterviewPrepV2(prepId: string, resumeId: string, userLevelOverride?: string): Promise<void> {
  await v2MigrationPromise;
  const startTime = Date.now();

  try {
    await query(`UPDATE interview_preps SET status='processing', pipeline_version='v2' WHERE id=$1`, [prepId]);

    // 1. Fetch resume + order
    const resumeResult = await query('SELECT * FROM resumes WHERE id=$1', [resumeId]);
    if (!resumeResult.rows.length) throw new Error('Resume not found');
    const resume = resumeResult.rows[0];

    let order: any = null;
    const orderResult = await query('SELECT * FROM orders WHERE id=$1', [resume.order_id]);
    if (orderResult.rows.length) order = orderResult.rows[0];
    else {
      const buildResult = await query('SELECT * FROM build_orders WHERE id=$1', [resume.order_id]);
      if (buildResult.rows.length) order = buildResult.rows[0];
    }

    // 2. Normalize
    const profile = normalizeCandidateProfile(resume.resume_data || {}, resume, order);
    const level = inferInterviewLevel(profile, userLevelOverride);

    // career_stage uses legacy v1 semantics for analytics consistency
    const careerStage = profile.roles.length === 0 ? 'fresher'
      : profile.roles.length <= 2 ? 'early'
      : profile.roles.length <= 5 ? 'mid' : 'senior';

    await query(
      `UPDATE interview_preps SET interview_level=$1, career_stage=$2, target_role=$3, target_company=$4, order_id=$5 WHERE id=$6`,
      [level, careerStage, profile.targetRole, profile.targetCompany, resume.order_id, prepId],
    );

    console.log(`[interview-prep-v2] ${prepId}: Level=${level}, Experience=${Math.round(profile.totalExperienceMonths / 12)}yr, HasJD=${profile.hasJD}`);

    // 3. Phase 1 — Plan
    console.log(`[interview-prep-v2] ${prepId}: Phase 1 — Plan`);
    let plan = await phase1_plan(profile, level);

    // Validate question_mix sums to 15 with valid categories
    const validCategories = ['behavioral', 'role_specific', 'situational', 'culture'];
    const mix = plan.question_mix || {};
    const mixSum = Object.values(mix).reduce((s: number, v: any) => s + (typeof v === 'number' ? v : 0), 0);
    const hasValidKeys = Object.keys(mix).every(k => validCategories.includes(k));
    if (mixSum !== 15 || !hasValidKeys) {
      console.warn(`[interview-prep-v2] ${prepId}: Phase 1 bad mix (sum=${mixSum}, keys=${Object.keys(mix)}). Using defaults.`);
      plan = {
        question_mix: { behavioral: 5, role_specific: 5, situational: 3, culture: 2 },
        focus_themes: plan.focus_themes?.length ? plan.focus_themes : ['role fit', 'technical depth', 'problem solving'],
      };
    }

    // 4. Phase 2 — Brief
    console.log(`[interview-prep-v2] ${prepId}: Phase 2 — Brief`);
    const brief = await phase2_brief(profile);

    // 5. Phase 3 — Skeleton
    console.log(`[interview-prep-v2] ${prepId}: Phase 3 — Skeleton (15 questions)`);
    const skeleton = await phase3_skeleton(profile, level, plan);

    // 6. Phase 4 — STAR answers (batched)
    console.log(`[interview-prep-v2] ${prepId}: Phase 4 — STAR answers (${skeleton.length} questions in batches)`);
    const questions = await phase4_starBatch(profile, level, skeleton);

    // 7. Phase 5 — Extras
    console.log(`[interview-prep-v2] ${prepId}: Phase 5 — Ask-them + Cheat sheet`);
    const extras = await phase5_extras(profile, level);

    // 8. Phase 6 — MCQ
    console.log(`[interview-prep-v2] ${prepId}: Phase 6 — MCQs`);
    const mcqs = await phase6_mcq(profile, level);

    // 9. Phase 7 — Merge + Validate
    const prepData = {
      company_brief: brief,
      questions: questions.filter((q: any) => q.question && !q.question.includes('...')),
      ask_them: (extras.ask_them || []).filter((a: any) => a.question && !a.question.includes('...')),
      cheat_sheet: extras.cheat_sheet || {},
      mcq: mcqs.filter((m: any) => m.question && m.options?.length === 4),
    };

    const validation = validatePrepData(prepData);
    const durationMs = Date.now() - startTime;
    const meta = {
      pipeline_version: 'v2',
      interview_level: level,
      total_experience_months: profile.totalExperienceMonths,
      has_jd: profile.hasJD,
      duration_ms: durationMs,
      question_count: validation.questionCount,
      mcq_count: validation.mcqCount,
      degraded: validation.degraded,
      degraded_reason: validation.degraded ? validation.errors.join('; ') : null,
    };

    if (validation.valid) {
      await query(
        `UPDATE interview_preps SET status='ready', prep_data=$1, generation_meta=$2, completed_at=NOW() WHERE id=$3`,
        [JSON.stringify(prepData), JSON.stringify(meta), prepId],
      );
      console.log(`[interview-prep-v2] ${prepId}: Complete in ${durationMs}ms — ${validation.questionCount} questions, ${validation.mcqCount} MCQs${validation.degraded ? ' (degraded)' : ''}`);
    } else {
      // Hard failure — below minimum thresholds, save as failed with what we have for debugging
      const failMeta = { ...meta, degraded: true, degraded_reason: validation.errors.join('; ') };
      await query(
        `UPDATE interview_preps SET status='failed', prep_data=$1, generation_meta=$2, error_message=$3, completed_at=NOW() WHERE id=$4`,
        [JSON.stringify(prepData), JSON.stringify(failMeta), `Insufficient content: ${validation.errors.join('; ')}`, prepId],
      );
      console.warn(`[interview-prep-v2] ${prepId}: Failed validation — ${validation.errors.join(', ')}`);
    }
  } catch (err: any) {
    console.error(`[interview-prep-v2] ${prepId}: Failed —`, err.message);
    await query(
      `UPDATE interview_preps SET status='failed', error_message=$1, generation_meta=$2 WHERE id=$3`,
      [err.message?.slice(0, 500) || 'Unknown error', JSON.stringify({ pipeline_version: 'v2', duration_ms: Date.now() - startTime }), prepId],
    );
  }
}

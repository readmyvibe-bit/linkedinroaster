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
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) cleaned = cleaned.slice(firstBrace);
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace > 0 && lastBrace < cleaned.length - 1) cleaned = cleaned.slice(0, lastBrace + 1);
  try { return JSON.parse(cleaned); } catch {
    try { return JSON.parse(jsonrepair(cleaned)); } catch {
      cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      return JSON.parse(jsonrepair(cleaned));
    }
  }
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
      // Pro model has 65K output limit — give it generous room
      const proTokens = Math.max((opts.maxTokens || 4096) * 2, 16384);
      console.log(`[interview-prep-v2] Retry with gemini-2.5-pro @ ${proTokens} tokens (reason: ${msg.slice(0, 80)})`);
      return await geminiPhase(prompt, system, { ...opts, model: 'gemini-2.5-pro', maxTokens: proTokens });
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

// ─── JD Analysis Types ───

export interface JdAnalysis {
  must_have_skills: string[];
  nice_to_have: string[];
  tools: string[];
  responsibilities: string[];
  seniority_signals: string[];
  themes: string[];
  red_flags: string[];
}

export interface GapItem {
  jd_theme: string;
  resume_evidence: string | null;
  bridge_talking_point: string;
  status: 'strong' | 'partial' | 'gap';
}

export interface CompanyContext {
  summary: string;
  inferred_from: 'jd_only' | 'public_patterns';
  interview_style_guess: string;
}

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

// ─── Phase 0: JD Extraction (LLM) ───

async function phase0_jdExtraction(profile: CandidateProfile): Promise<JdAnalysis> {
  if (!profile.hasJD) {
    return { must_have_skills: [], nice_to_have: [], tools: [], responsibilities: [], seniority_signals: [], themes: [], red_flags: [] };
  }
  const system = `You are a job description analyst. Extract structured requirements from the JD.\n${GLOBAL_RULES}`;
  const prompt = `JOB DESCRIPTION:\n${profile.jobDescription.slice(0, 4000)}

TARGET ROLE: ${profile.targetRole}
${profile.targetCompany ? `COMPANY: ${profile.targetCompany}` : ''}

Extract structured data from this JD. Return JSON:
{
  "must_have_skills": ["skills explicitly required — exact phrases from JD"],
  "nice_to_have": ["skills listed as preferred/bonus/nice-to-have"],
  "tools": ["specific tools, frameworks, platforms mentioned"],
  "responsibilities": ["key responsibilities/deliverables (max 6)"],
  "seniority_signals": ["phrases indicating expected seniority level"],
  "themes": ["5-8 overarching themes: e.g. 'distributed systems', 'people management', 'data-driven decisions'"],
  "red_flags": ["what they screen against / dealbreakers mentioned"]
}
Extract ONLY what the JD actually says. Do NOT infer or add skills not mentioned.`;

  return geminiPhaseWithRetry(prompt, system, { temperature: 0.2, maxTokens: 2048 });
}

// ─── Gap Map: Code-level comparison + LLM bridge points ───

function computeGapMap(jdAnalysis: JdAnalysis, profile: CandidateProfile): GapItem[] {
  if (!jdAnalysis.themes.length) return [];

  const allBullets = profile.roles.flatMap(r => r.bullets).join(' ').toLowerCase();
  const allSkills = profile.skills.map(s => s.toLowerCase());
  const allTitles = profile.roles.map(r => r.title.toLowerCase()).join(' ');
  const summaryLower = profile.summary.toLowerCase();
  const allText = `${allBullets} ${allSkills.join(' ')} ${allTitles} ${summaryLower}`;

  // Combine must_have_skills + themes for gap analysis
  const jdItems = [...new Set([...jdAnalysis.themes, ...jdAnalysis.must_have_skills])];

  return jdItems.map(theme => {
    const themeLower = theme.toLowerCase();
    const words = themeLower.split(/\s+/).filter(w => w.length > 2);

    // Check if resume has evidence for this theme
    const hasExactMatch = allText.includes(themeLower);
    const wordMatches = words.filter(w => allText.includes(w));
    const matchRatio = words.length > 0 ? wordMatches.length / words.length : 0;

    // Find specific bullet evidence
    let evidence: string | null = null;
    for (const role of profile.roles) {
      const matchBullet = role.bullets.find(b => {
        const bLower = b.toLowerCase();
        return bLower.includes(themeLower) || wordMatches.some(w => bLower.includes(w));
      });
      if (matchBullet) {
        evidence = `${role.title} at ${role.company}: "${matchBullet}"`;
        break;
      }
    }
    if (!evidence && allSkills.some(s => themeLower.includes(s) || s.includes(themeLower))) {
      evidence = `Listed in skills: ${profile.skills.find(s => themeLower.includes(s.toLowerCase()) || s.toLowerCase().includes(themeLower))}`;
    }

    const status: GapItem['status'] = hasExactMatch || matchRatio > 0.7 ? 'strong'
      : matchRatio > 0.3 || evidence ? 'partial' : 'gap';

    return { jd_theme: theme, resume_evidence: evidence, bridge_talking_point: '', status };
  });
}

async function enrichGapBridges(gaps: GapItem[], profile: CandidateProfile): Promise<GapItem[]> {
  const gapsNeedingBridge = gaps.filter(g => g.status === 'gap' || g.status === 'partial');
  if (!gapsNeedingBridge.length) return gaps;

  const system = `You are an interview coach. For each gap between a JD requirement and a candidate's resume, suggest a 1-2 sentence talking point the candidate can use to bridge the gap. Use ONLY facts from the resume — do NOT fabricate experience.\n${GLOBAL_RULES}`;
  const prompt = `${buildResumeContext(profile)}

GAPS TO BRIDGE:
${gapsNeedingBridge.map((g, i) => `${i + 1}. JD requires: "${g.jd_theme}" | Resume evidence: ${g.resume_evidence || 'none found'} | Status: ${g.status}`).join('\n')}

Return JSON array (one per gap, same order):
[
  {"jd_theme": "exact theme", "bridge_talking_point": "1-2 sentences showing how existing experience is transferable or how eagerness to learn compensates"}
]`;

  try {
    const bridges = await geminiPhaseWithRetry(prompt, system, { temperature: 0.4, maxTokens: 2048 });
    const bridgeArr = Array.isArray(bridges) ? bridges : [];
    gapsNeedingBridge.forEach((g, i) => {
      if (bridgeArr[i]?.bridge_talking_point) g.bridge_talking_point = bridgeArr[i].bridge_talking_point;
    });
  } catch (err: any) {
    console.warn(`[interview-prep-v2] Gap bridge enrichment failed: ${err.message}`);
  }
  return gaps;
}

// ─── Company Context (honest, inferred) ───

async function buildCompanyContext(profile: CandidateProfile, jdAnalysis: JdAnalysis): Promise<CompanyContext> {
  if (!profile.hasJD && !profile.targetCompany) {
    return { summary: '', inferred_from: 'public_patterns', interview_style_guess: 'mixed' };
  }
  const system = `You are a recruitment analyst. Infer company context ONLY from the JD text and role title. Do NOT hallucinate company facts, revenue, employee count, or founding year unless explicitly stated in the JD. Label everything as inferred.\n${GLOBAL_RULES}`;
  const prompt = `${profile.hasJD ? `JOB DESCRIPTION:\n${profile.jobDescription.slice(0, 4000)}` : `ROLE: ${profile.targetRole}`}
${profile.targetCompany ? `COMPANY NAME: ${profile.targetCompany}` : ''}
JD THEMES: ${jdAnalysis.themes.join(', ') || 'none'}

Return JSON:
{
  "summary": "2-3 sentences about what this role/team likely does based ONLY on the JD text. Start with 'Based on the job description...'",
  "inferred_from": "${profile.hasJD ? 'jd_only' : 'public_patterns'}",
  "interview_style_guess": "behavioral | technical | system_design | mixed — inferred from JD emphasis"
}`;

  try {
    return await geminiPhaseWithRetry(prompt, system, { temperature: 0.3, maxTokens: 1024 });
  } catch {
    return { summary: '', inferred_from: profile.hasJD ? 'jd_only' : 'public_patterns', interview_style_guess: 'mixed' };
  }
}

async function phase1_plan(profile: CandidateProfile, level: InterviewLevel): Promise<{ question_mix: Record<string, number>; focus_themes: string[] }> {
  const system = `You are an expert interview prep strategist. Plan the question distribution for a ${level}-level candidate.\n${GLOBAL_RULES}`;
  const prompt = `${buildResumeContext(profile)}
${profile.hasJD ? `\nJOB DESCRIPTION:\n${profile.jobDescription.slice(0, 4000)}` : ''}

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
    ? `JOB DESCRIPTION:\n${profile.jobDescription.slice(0, 4000)}\n\nReturn JSON:
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

async function phase3_skeleton(profile: CandidateProfile, level: InterviewLevel, plan: { question_mix: Record<string, number>; focus_themes: string[] }, jdAnalysis: JdAnalysis): Promise<any[]> {
  const jdContext = profile.hasJD
    ? `\nJOB DESCRIPTION (excerpt):\n${profile.jobDescription.slice(0, 4000)}\n\nSTRUCTURED JD REQUIREMENTS:\n- Must have: ${jdAnalysis.must_have_skills.join(', ')}\n- Tools: ${jdAnalysis.tools.join(', ')}\n- Themes: ${jdAnalysis.themes.join(', ')}`
    : '';
  const system = `You are an expert interviewer. Generate question skeletons (no answers yet). ${profile.hasJD ? 'Each question MUST link to specific JD themes.' : ''}\n${GLOBAL_RULES}\n${LEVEL_RUBRICS[level]}`;
  const prompt = `${buildResumeContext(profile)}
${jdContext}

QUESTION MIX: ${JSON.stringify(plan.question_mix)}
FOCUS THEMES: ${plan.focus_themes.join(', ')}

Generate exactly 15 questions. Return JSON array:
[
  {"id": 1, "category": "behavioral", "question": "full question text", "why_they_ask": "1-2 sentences", "difficulty": "${level}"${profile.hasJD ? ', "jd_themes": ["1-3 JD themes this tests"], "why_for_this_role": "1-2 sentences explaining why THIS company/role needs this answer, tied to JD"' : ''}},
  ...15 total
]
Each question must be specific to THIS candidate's background and target role. No generic questions.${profile.hasJD ? ' Every question must map to at least one JD theme.' : ''}`;

  const result = await geminiPhaseWithRetry(prompt, system, { temperature: 0.5, maxTokens: 8192 });
  return Array.isArray(result) ? result : result.questions || result;
}

async function phase4_starBatch(profile: CandidateProfile, level: InterviewLevel, questions: any[], jdAnalysis: JdAnalysis, gaps: GapItem[]): Promise<any[]> {
  const answered: any[] = [];
  const gapContext = gaps.filter(g => g.status !== 'strong').length > 0
    ? `\nGAPS TO ADDRESS IN ANSWERS:\n${gaps.filter(g => g.status !== 'strong').map(g => `- ${g.jd_theme}: ${g.bridge_talking_point || 'show transferable skills'}`).join('\n')}`
    : '';
  // Process in batches of 3 to reduce per-call output size (MAX_TOKENS)
  for (let i = 0; i < questions.length; i += 3) {
    const batch = questions.slice(i, i + 3);
    const system = `You are an expert interview coach. Generate STAR answers grounded ONLY in the resume.${profile.hasJD ? ' When a question targets a JD gap, the answer should explicitly bridge it using transferable experience.' : ''}\n${GLOBAL_RULES}\n${LEVEL_RUBRICS[level]}`;
    const prompt = `${buildResumeContext(profile)}
${profile.hasJD ? `\nJD THEMES: ${jdAnalysis.themes.join(', ')}` : ''}${gapContext}

Generate STAR answers for these questions. Use ONLY facts from the resume above.
QUESTIONS:
${batch.map((q: any, j: number) => `${j + 1}. [${q.category}] ${q.question}${q.jd_themes?.length ? ` (JD themes: ${q.jd_themes.join(', ')})` : ''}`).join('\n')}

Return JSON array (one per question):
[
  {
    "id": ${batch[0]?.id || i + 1},
    "category": "${batch[0]?.category || 'behavioral'}",
    "question": "exact question text",
    "why_they_ask": "reason",
    ${profile.hasJD ? '"jd_themes": ["themes from JD this tests"],\n    "why_for_this_role": "1-2 sentences on why this matters for THIS specific role/company",' : ''}
    "suggested_answer": {
      "situation": "specific context from resume (2-3 sentences)",
      "task": "what needed to be done (1-2 sentences)",
      "action": "specific actions taken (2-3 sentences)",
      "result": "measurable outcome from resume (1-2 sentences)"
    },
    "common_mistakes": ["2 mistakes to avoid"],
    "follow_ups": ["2 likely follow-up questions${profile.hasJD ? ' — tied to JD themes' : ''}"]
  }
]`;

    try {
      const result = await geminiPhaseWithRetry(prompt, system, { temperature: 0.5, maxTokens: 8192 });
      const items = Array.isArray(result) ? result : result.questions || [];
      answered.push(...items);
    } catch (batchErr: any) {
      // If one batch fails, continue with others — partial answers better than none
      console.warn(`[interview-prep-v2] STAR batch ${Math.floor(i / 3) + 1} failed: ${batchErr.message?.slice(0, 100)}. Continuing with remaining batches.`);
      // Add skeleton questions without STAR answers so they're counted
      batch.forEach((q: any) => answered.push({ ...q, suggested_answer: { situation: 'Unable to generate — please prepare your own STAR answer for this question.', task: '', action: '', result: '' } }));
    }
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

export function validatePrepData(data: any, hasJD = false): ValidationResult {
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
    typeof m.correct === 'number' && m.correct >= 0 && m.correct <= 3
  );

  // Validate ask_them
  const validAsk = askThem.filter((a: any) => a.question && a.question.length > 5 && !a.question.includes('...'));

  if (validQs.length < 15) errors.push(`Only ${validQs.length}/15 valid questions`);
  if (validMcqs.length < 10) errors.push(`Only ${validMcqs.length}/10 valid MCQs`);
  if (validAsk.length < 5) errors.push(`Only ${validAsk.length}/5 valid ask-them questions`);
  if (!data.company_brief) errors.push('Missing company brief');
  if (!data.cheat_sheet) errors.push('Missing cheat sheet');

  // JD-specific validation (only when JD was provided)
  if (hasJD) {
    const jdAnalysis = data.jd_analysis;
    if (!jdAnalysis || !jdAnalysis.themes?.length) {
      errors.push('Missing JD analysis themes');
    }
    const gapMap = data.gap_map || [];
    if (gapMap.length < 3) {
      errors.push(`Only ${gapMap.length} gap map items (expected 3+)`);
    }
    // Check per-question JD linkage
    const qsWithJdLink = validQs.filter((q: any) => q.why_for_this_role && q.why_for_this_role.length > 15);
    if (qsWithJdLink.length < Math.floor(validQs.length * 0.5)) {
      errors.push(`Only ${qsWithJdLink.length}/${validQs.length} questions have JD linkage`);
    }
  }

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

    // career_stage — prefer form input for build orders (student/fresher), else infer from experience
    const formCareerStage = order?.form_input?.career_stage;
    const careerStage = (formCareerStage === 'student' || formCareerStage === 'fresher')
      ? formCareerStage
      : profile.roles.length === 0 ? 'fresher'
      : profile.roles.length <= 2 ? 'early'
      : profile.roles.length <= 5 ? 'mid' : 'senior';

    await query(
      `UPDATE interview_preps SET interview_level=$1, career_stage=$2, target_role=$3, target_company=$4, order_id=$5 WHERE id=$6`,
      [level, careerStage, profile.targetRole, profile.targetCompany, resume.order_id, prepId],
    );

    console.log(`[interview-prep-v2] ${prepId}: Level=${level}, Experience=${Math.round(profile.totalExperienceMonths / 12)}yr, HasJD=${profile.hasJD}`);

    // 3. Phase 0 — JD Extraction (new, non-fatal)
    console.log(`[interview-prep-v2] ${prepId}: Phase 0 — JD Extraction`);
    let jdAnalysis: JdAnalysis = { must_have_skills: [], nice_to_have: [], tools: [], responsibilities: [], seniority_signals: [], themes: [], red_flags: [] };
    try {
      jdAnalysis = await phase0_jdExtraction(profile);
    } catch (e: any) {
      console.warn(`[interview-prep-v2] ${prepId}: Phase 0 failed (non-fatal): ${e.message?.slice(0, 100)}`);
    }

    // 3b. Gap Map (code-level + LLM bridge, non-fatal)
    console.log(`[interview-prep-v2] ${prepId}: Computing gap map (${jdAnalysis.themes.length} themes)`);
    let gapMap = computeGapMap(jdAnalysis, profile);
    try {
      gapMap = await enrichGapBridges(gapMap, profile);
    } catch (e: any) {
      console.warn(`[interview-prep-v2] ${prepId}: Gap bridge enrichment failed (non-fatal): ${e.message?.slice(0, 100)}`);
    }

    // 3c. Company Context (non-fatal)
    console.log(`[interview-prep-v2] ${prepId}: Building company context`);
    let companyContext: CompanyContext = { summary: '', inferred_from: profile.hasJD ? 'jd_only' : 'public_patterns', interview_style_guess: 'mixed' };
    try {
      companyContext = await buildCompanyContext(profile, jdAnalysis);
    } catch (e: any) {
      console.warn(`[interview-prep-v2] ${prepId}: Company context failed (non-fatal): ${e.message?.slice(0, 100)}`);
    }

    // 4. Phase 1 — Plan
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
        focus_themes: plan.focus_themes?.length ? plan.focus_themes : jdAnalysis.themes.slice(0, 5).concat(['role fit', 'technical depth']).slice(0, 5),
      };
    }

    // 5. Phase 2 — Brief
    console.log(`[interview-prep-v2] ${prepId}: Phase 2 — Brief`);
    const brief = await phase2_brief(profile);

    // 6. Phase 3 — Skeleton (with JD analysis)
    console.log(`[interview-prep-v2] ${prepId}: Phase 3 — Skeleton (15 questions)`);
    const skeleton = await phase3_skeleton(profile, level, plan, jdAnalysis);

    // 7. Phase 4 — STAR answers (with JD + gaps)
    console.log(`[interview-prep-v2] ${prepId}: Phase 4 — STAR answers (${skeleton.length} questions in batches)`);
    const questions = await phase4_starBatch(profile, level, skeleton, jdAnalysis, gapMap);

    // 8. Phase 5 — Extras
    console.log(`[interview-prep-v2] ${prepId}: Phase 5 — Ask-them + Cheat sheet`);
    const extras = await phase5_extras(profile, level);

    // 9. Phase 6 — MCQ
    console.log(`[interview-prep-v2] ${prepId}: Phase 6 — MCQs`);
    const mcqs = await phase6_mcq(profile, level);

    // 10. Phase 7 — Merge + Validate
    const prepData: any = {
      company_brief: brief,
      company_context: companyContext,
      jd_analysis: profile.hasJD ? jdAnalysis : null,
      gap_map: gapMap.length > 0 ? gapMap : null,
      questions: questions.filter((q: any) => q.question && !q.question.includes('...')),
      ask_them: (extras.ask_them || []).filter((a: any) => a.question && !a.question.includes('...')),
      cheat_sheet: extras.cheat_sheet || {},
      mcq: mcqs.filter((m: any) => m.question && m.options?.length === 4),
    };

    const validation = validatePrepData(prepData, profile.hasJD);
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

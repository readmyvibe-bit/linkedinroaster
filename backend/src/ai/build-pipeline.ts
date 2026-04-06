// ═══════════════════════════════════════════════════════════════
// BUILD PIPELINE — Generate LinkedIn profile from scratch
// Completely separate from the main pipeline (pipeline.ts)
// ═══════════════════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import * as Sentry from '@sentry/node';
import { query } from '../db';
import { sendBuildResultsEmail } from '../services/email';

// --- Clients ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// --- Types ---
export interface BuildFormInput {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  career_stage: 'student' | 'fresher' | '1-3' | '3-7' | '7+' | 'career_changer';
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
    gpa?: string;
    coursework?: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    start_date: string;
    end_date: string;
    current: boolean;
    description: string;
  }>;
  skills: string[];
  certifications: string[];
  achievements: string;
  projects?: string;
  target_role: string;
  target_industry: string;
  tone: 'professional' | 'friendly' | 'bold';
}

export interface BuildResult {
  headline_variations: Array<{
    text: string;
    style: string;
    best_for: string;
  }>;
  about: string;
  experience: Array<{
    role: string;
    company: string;
    duration: string;
    bullets: string[];
    changes_made: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
  };
  setup_guide: Array<{
    step: number;
    title: string;
    menu_path: string;
    description: string;
    common_mistake: string;
    time: string;
  }>;
}

export interface BuildQCResult {
  verdict: 'APPROVE' | 'REVISE' | 'REJECT';
  issues: string[];
  score: number;
  revision_instructions?: string;
}

// --- Helpers ---
function safeJsonParse(text: string): any {
  // Strip markdown fences
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    try {
      return JSON.parse(jsonrepair(cleaned));
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON');
    }
  }
}

async function updateBuildStatus(orderId: string, status: string, error?: string) {
  if (error) {
    await query(
      `UPDATE build_orders SET processing_status=$1, processing_error=$2, updated_at=NOW() WHERE id=$3`,
      [status, error, orderId],
    );
  } else {
    const extra = status === 'generating' ? ', processing_started_at=NOW()' :
                  status === 'done' ? ', processing_done_at=NOW()' : '';
    await query(
      `UPDATE build_orders SET processing_status=$1${extra}, updated_at=NOW() WHERE id=$2`,
      [status, orderId],
    );
  }
}

// ═══════════════════════════════════════════
// STAGE 1: Profile Generation (Claude Sonnet)
// ═══════════════════════════════════════════
export async function stage1_generateProfile(formInput: BuildFormInput, revisionInstructions?: string): Promise<BuildResult> {
  const educationText = formInput.education.map(e =>
    `${e.degree} in ${e.field} from ${e.institution} (${e.year})${e.gpa ? `, GPA: ${e.gpa}` : ''}${e.coursework ? `, Coursework: ${e.coursework}` : ''}`
  ).join('\n');

  const experienceText = formInput.experience.map(e =>
    `${e.role} at ${e.company} (${e.start_date} - ${e.current ? 'Present' : e.end_date})\n${e.description}`
  ).join('\n\n');

  const prompt = `You are a LinkedIn profile optimization expert specializing in the Indian job market.

Build a COMPLETE LinkedIn profile from scratch using the information below. This person does NOT have a LinkedIn profile yet.

═══ ABOUT THE PERSON ═══
Name: ${formInput.full_name}
Location: ${formInput.location || 'India'}
Career Stage: ${formInput.career_stage}
Target Role: ${formInput.target_role}
Target Industry: ${formInput.target_industry}
Tone Preference: ${formInput.tone}

═══ EDUCATION ═══
${educationText || 'Not provided'}

═══ EXPERIENCE ═══
${experienceText || 'No work experience yet — fresher/student'}

═══ SKILLS ═══
${formInput.skills.length ? formInput.skills.join(', ') : 'Not specified'}

═══ CERTIFICATIONS ═══
${formInput.certifications.length ? formInput.certifications.join(', ') : 'None'}

═══ PROJECTS & PORTFOLIO ═══
${formInput.projects || 'Not specified'}

═══ ACHIEVEMENTS ═══
${formInput.achievements || 'Not specified'}

═══ GENERATION RULES (CRITICAL) ═══

HEADLINE (3 variations):
1. Each headline must be 60-120 characters
2. Include: target role + key skill/achievement + value proposition
3. Use separators: | or •
4. NEVER use "Aspiring" or "Seeking opportunities"
5. For freshers: focus on education, skills, and projects instead of experience
6. Each variation must have a DIFFERENT style:
   - Style 1: "Achievement-focused" — leads with a result or metric
   - Style 2: "Role-focused" — leads with the target role and key skills
   - Style 3: "Skills-focused" — leads with technical expertise and tools

ABOUT SECTION:
1. 250-400 words
2. Start with a HOOK — not "I am a..." or "My name is..."
3. Structure: Hook → Background → Key skills/projects → What you're looking for
4. Include specific technologies, tools, and methodologies
5. End with a clear call-to-action
6. If fresher: highlight academic projects, internships, learning journey
7. Tone must match preference: ${formInput.tone}
8. Use short paragraphs (3-4 sentences each), with line breaks between them

EXPERIENCE BULLETS:
1. 4-6 bullets per role
2. Every bullet starts with a STRONG action verb (not "Responsible for")
3. Include metrics/numbers where possible — if user didn't provide exact numbers, use reasonable estimates with "~" prefix
4. Use STAR format: what you did + how + result
5. For internships/projects: treat them as real experience
6. If NO experience provided: skip this section entirely, return empty array

SKILLS:
1. Split into: technical, soft, tools
2. 8-15 technical skills relevant to target role
3. 5-8 soft skills
4. 5-10 tools/platforms
5. Only include skills mentioned by user or directly inferable from their education/experience. Do NOT fabricate skills.

LINKEDIN SETUP GUIDE:
Generate a detailed 10-step guide for setting up LinkedIn from scratch. Each step must include:
- step number
- title (what to do)
- menu_path (exact LinkedIn menu path, e.g., "Profile → Edit Intro → Headline")
- description (detailed instructions, 2-3 sentences)
- common_mistake (what NOT to do)
- time (estimated time, e.g., "30 seconds")

Steps must cover:
1. Create account
2. Add professional photo
3. Add banner image
4. Set headline
5. Write About section
6. Add experience
7. Add education
8. Add skills (and get endorsements)
9. Set "Open to Work" preferences
10. Make first 50 connections

STUDENT/FRESHER SPECIAL RULES (when career_stage is 'student' or 'fresher'):
- Education section MUST come before Experience in the resume
- Projects ARE experience — treat each project as a job entry with: Project Name as "role", Tech Stack as "company", duration, and 2-3 achievement bullets
- If CGPA/GPA is 7.0+ (on 10 scale) or 3.0+ (on 4 scale), include it prominently
- Add "Relevant Coursework" as a bullet under education if courses match the target role
- For internships: quantify everything — "Worked on dashboard" → "Built analytics dashboard serving 200+ users, reducing report generation time by 40%"
- Never fabricate metrics — if no numbers exist, use qualitative impact ("improved user experience", "streamlined process")
- Headline format for students: "[Degree] [Branch] '[GradYear] | [Target Role] | [Top Skill] + [Top Skill] | [Achievement]"
  Example: "B.Tech CSE '25 | Full-Stack Developer | React + Node.js | SIH 2024 Finalist"
- About section: Start with career aspiration, NOT "I am a student". Example: "Building scalable web applications..." NOT "I am a final year student..."
- Skills section: List technical skills first, then tools, then soft skills. Minimum 8 skills.

PROJECTS (important for students/freshers):
If the user provided projects, incorporate them into the profile:
- Mention key projects in the About section (1-2 sentences about most impressive ones)
- For freshers/students with no work experience, use projects as experience entries:
  each project becomes an "experience" entry with role="Project Lead" or similar,
  company=project context (e.g., "Academic Project" or "Personal Project"),
  and bullets describing what was built, tech used, and outcomes
- If the user has work experience AND projects, mention projects in About but
  keep experience section for actual jobs only

═══ NEVER FABRICATE ═══
- Do NOT invent companies, degrees, certifications, achievements, or projects
- Do NOT add metrics the user didn't mention (except with ~ prefix for estimates)
- Use ONLY information provided above

Return ONLY valid JSON:
{
  "headline_variations": [
    { "text": "", "style": "Achievement-focused", "best_for": "" },
    { "text": "", "style": "Role-focused", "best_for": "" },
    { "text": "", "style": "Skills-focused", "best_for": "" }
  ],
  "about": "",
  "experience": [
    { "role": "", "company": "", "duration": "", "bullets": ["", "", ""], "changes_made": "" }
  ],
  "skills": {
    "technical": [],
    "soft": [],
    "tools": []
  },
  "setup_guide": [
    { "step": 1, "title": "", "menu_path": "", "description": "", "common_mistake": "", "time": "" }
  ]
}`;

  const fullPrompt = revisionInstructions
    ? `${prompt}\n\n═══ REVISION REQUIRED ═══\nA quality check found issues with a previous attempt. Fix these specific problems:\n${revisionInstructions}`
    : prompt;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: fullPrompt }],
  });

  const text = (response.content[0] as any).text || '';
  const parsed = safeJsonParse(text) as BuildResult;

  // Post-generation validation: ensure critical fields are not empty
  if (!parsed.about || parsed.about.trim().length < 50) {
    console.warn('[BUILD] About section empty or too short, regenerating...');
    // Regenerate just the about section with Gemini (fast, cheap)
    const aboutModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const aboutResult = await aboutModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Write a LinkedIn About section (250-350 words) for:
Name: ${formInput.full_name}, Target Role: ${formInput.target_role}, Career Stage: ${formInput.career_stage}
Education: ${formInput.education.map(e => `${e.degree} ${e.field} from ${e.institution}`).join(', ')}
Experience: ${formInput.experience.map(e => `${e.role} at ${e.company}`).join(', ') || 'Fresher/student'}
Skills: ${formInput.skills.join(', ') || 'Not specified'}
Achievements: ${formInput.achievements || 'Not specified'}
RULES: Start with a HOOK (not "I am..."). Short paragraphs. Tone: ${formInput.tone}. Return ONLY the about text.` }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2000 },
    });
    parsed.about = aboutResult.response.text().trim();
  }

  if (!parsed.headline_variations || parsed.headline_variations.length === 0) {
    console.warn('[BUILD] No headline variations generated, adding fallback');
    parsed.headline_variations = [{
      text: `${formInput.target_role} | ${formInput.education?.[0]?.degree || ''} ${formInput.education?.[0]?.field || ''} Graduate`,
      style: 'Role-focused',
      best_for: 'General use',
    }];
  }

  return parsed;
}

// ═══════════════════════════════════════════
// STAGE 2: Quality Check (Gemini)
// ═══════════════════════════════════════════
export async function stage2_qualityCheck(
  formInput: BuildFormInput,
  profile: BuildResult,
): Promise<BuildQCResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a quality checker for AI-generated LinkedIn profiles.

ORIGINAL USER INPUT:
Name: ${formInput.full_name}
Career Stage: ${formInput.career_stage}
Target Role: ${formInput.target_role}
Education: ${JSON.stringify(formInput.education)}
Experience: ${JSON.stringify(formInput.experience)}
Skills: ${formInput.skills.join(', ')}
Certifications: ${formInput.certifications.join(', ')}

GENERATED PROFILE:
${JSON.stringify(profile, null, 2)}

CHECK ALL OF THE FOLLOWING:
1. FABRICATION: Are there ANY companies, degrees, certifications, or achievements in the generated profile that are NOT in the user input? If yes → REVISE
2. HEADLINES: Are all 3 headline variations different styles? Are they 60-120 chars? Do they avoid "Aspiring/Seeking"?
3. ABOUT: Does it start with a hook (not "I am...")? Is it 250-400 words? Does it match the tone?
4. EXPERIENCE BULLETS: Do they start with action verbs? Are there metrics? No "Responsible for"?
5. SKILLS: Are they relevant to the target role? Not fabricated?
6. SETUP GUIDE: Does it have 10 steps with menu_path, common_mistake, and time for each?

Return ONLY valid JSON:
{
  "verdict": "APPROVE" or "REVISE" or "REJECT",
  "issues": ["list of specific issues found"],
  "score": 0-100,
  "revision_instructions": "specific instructions for revision if verdict is REVISE"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return safeJsonParse(text);
}

// ═══════════════════════════════════════════
// MAIN: Run Build Pipeline
// ═══════════════════════════════════════════
export async function runBuildPipeline(orderId: string): Promise<void> {
  console.log(`[BUILD] Starting pipeline for order ${orderId}`);

  try {
    const orderResult = await query('SELECT * FROM build_orders WHERE id=$1', [orderId]);
    const order = orderResult.rows[0];
    if (!order) throw new Error('Build order not found');

    const formInput: BuildFormInput = order.form_input;

    // Stage 1: Generate profile
    await updateBuildStatus(orderId, 'generating');
    let profile: BuildResult;
    let attempts = 0;
    const maxAttempts = 3;
    let revisionInstructions = '';

    while (true) {
      attempts++;
      console.log(`[BUILD] Stage 1 attempt ${attempts}/${maxAttempts} for ${orderId}`);

      profile = await stage1_generateProfile(formInput, revisionInstructions);

      // Stage 2: Quality check
      await updateBuildStatus(orderId, 'checking');
      const qc = await stage2_qualityCheck(formInput, profile);

      console.log(`[BUILD] QC verdict: ${qc.verdict}, score: ${qc.score}, issues: ${qc.issues.length}`);

      if (qc.verdict === 'APPROVE' || attempts >= maxAttempts) {
        await query(
          `UPDATE build_orders SET generated_profile=$1, quality_check=$2,
           processing_status='done', processing_done_at=NOW(), updated_at=NOW()
           WHERE id=$3`,
          [JSON.stringify(profile), JSON.stringify(qc), orderId],
        );
        break;
      }

      // REVISE: pass revision instructions to next attempt
      revisionInstructions = qc.revision_instructions || qc.issues.join('. ');
      console.log(`[BUILD] Revision needed: ${revisionInstructions}`);
    }

    // Send results email
    try {
      const updatedOrder = await query('SELECT * FROM build_orders WHERE id=$1', [orderId]);
      if (updatedOrder.rows[0]) {
        await sendBuildResultsEmail(updatedOrder.rows[0]);
        console.log(`[BUILD] Results email sent for ${orderId}`);
      }
    } catch (emailErr: any) {
      console.error(`[BUILD] Email failed for ${orderId}:`, emailErr.message);
    }

    console.log(`[BUILD] Pipeline complete for ${orderId}`);

  } catch (err: any) {
    console.error(`[BUILD] Pipeline failed for ${orderId}:`, err.message);
    Sentry.captureException(err, { extra: { orderId } });
    await updateBuildStatus(orderId, 'failed', err.message);
  }
}

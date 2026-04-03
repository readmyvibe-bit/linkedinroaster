import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { jsonrepair } from 'jsonrepair';
import { PostHog } from 'posthog-node';
import Razorpay from 'razorpay';
import * as Sentry from '@sentry/node';
import { query } from '../db';
import { calculateScore, capAfterScore, ScoreBreakdown } from '../lib/scoring';
import { sendResultsEmail, sendRefundEmail as sendRefundEmailService } from '../services/email';
import { generateAndUploadCard } from '../services/card-generator';

// --- Clients ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY || 'dummy', {
  host: 'https://app.posthog.com',
  flushAt: 1,
  flushInterval: 0,
});
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// --- Types ---
export interface ParsedProfile {
  headline: string | null;
  about: string | null;
  current_role: {
    title: string | null;
    company: string | null;
    duration: string | null;
    description: string | null;
  };
  experience: Array<{
    title: string;
    company: string;
    duration: string | null;
    description: string | null;
  }>;
  education: Array<{
    degree: string | null;
    institution: string | null;
    year: string | null;
  }>;
  skills: string[];
  certifications: string[];
  detected_industry: string;
  detected_seniority: 'student' | 'entry' | 'mid' | 'senior' | 'executive';
  profile_completeness: 'minimal' | 'partial' | 'complete';
  input_quality: 'good' | 'fair' | 'poor';
  word_count: number;
  error?: string;
  reason?: string;
}

export interface AnalysisIssue {
  issue: string;
  severity: 'critical' | 'major' | 'minor';
  exact_quote: string;
  why_it_matters: string;
}

export interface WeakVerbFound {
  verb: string;
  location: string;
  suggested_replacement: string;
}

export interface QuantificationBreakdown {
  total_bullets: number;
  quantified_bullets: number;
  unquantified_bullets: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'F';
}

export interface ATSIntelligence {
  top_searched_keywords: string[];
  keywords_present: string[];
  keywords_missing: string[];
  critical_missing: string[];
}

export interface Analysis {
  headline_score: number;
  headline_issues: AnalysisIssue[];
  about_score: number;
  about_issues: AnalysisIssue[];
  experience_score: number;
  experience_issues: AnalysisIssue[];
  overall_score: number;
  buzzword_count: number;
  buzzwords_found: string[];
  metrics_count: number;
  positioning: 'clear' | 'vague' | 'missing' | 'contradictory';
  top_3_problems: string[];
  detected_strengths: string[];
  weak_verbs_found: WeakVerbFound[];
  quantification_score: number;
  quantification_breakdown: QuantificationBreakdown;
  total_bullets_detected: number;
  ats_intelligence: ATSIntelligence;
}

export interface RoastPoint {
  point_number: number;
  section_targeted: 'headline' | 'about' | 'experience' | 'skills' | 'overall';
  roast: string;
  underlying_issue: string;
  humor_mechanism: 'analogy' | 'exaggeration' | 'rhetorical_question' | 'sarcasm' | 'unexpected_observation' | 'irony';
}

export interface HiddenStrength {
  strength: string;
  evidence: string;
  why_valuable: string;
  how_to_show_it: string;
}

export interface Roast {
  roast_title: string;
  roast_points: RoastPoint[];
  closing_compliment: string;
  overall_verdict: string;
  linkedin_caption: string;
  hidden_strengths?: HiddenStrength[];
}

export interface RewrittenExperience {
  title: string;
  company: string;
  bullets: string[];
  changes_made: string;
}

export interface Placeholder {
  location: string;
  placeholder: string;
  instruction: string;
}

export interface StandardRewrite {
  rewritten_headline: string;
  headline_rationale: string;
  rewritten_about: string;
  about_changes: string;
  rewritten_experience: RewrittenExperience[];
  suggested_skills: Array<{ skill: string; reason: string }>;
  ats_keywords: string[];
  placeholders_to_fill: Placeholder[];
  personalization_note: string;
  linkedin_post_hook: string;
}

export interface HeadlineVariation {
  headline: string;
  style: string;
  best_for: string;
}

export interface JdAnalysis {
  match_score: number | null;
  matched_keywords: string[];
  missing_keywords: string[];
  gap_summary: string;
  application_recommendation: string;
}

export interface CoverLetter {
  subject_line: string;
  body: string;
  personalization_notes: string;
}

export interface ProRewrite extends StandardRewrite {
  headline_variations: HeadlineVariation[];
  ats_keywords: string[];
  jd_analysis: JdAnalysis;
  cover_letter: CoverLetter;
}

export interface QualityCheck {
  safety_passed: boolean;
  safety_issues: string[];
  quality_score: number;
  quality_issues: Array<{
    issue: string;
    severity: 'critical' | 'minor';
    fix: string;
  }>;
  verdict: 'APPROVE' | 'REVISE' | 'REJECT';
  revision_instructions: string;
}

// --- Preprocessor (Layer 1) ---
function preprocessInput(text: string): string {
  return text
    // Normalize multiple newlines to single
    .replace(/\n{3,}/g, '\n\n')
    // Normalize multiple spaces to single
    .replace(/[ \t]+/g, ' ')
    // Remove LinkedIn UI artifacts
    .replace(/LinkedIn helped me get this job/gi, '')
    .replace(/· (1st|2nd|3rd|connection)/gi, '')
    .replace(/\b(He\/Him|She\/Her|They\/Them)\b/gi, '')
    .replace(/…\s*more/gi, '')
    .replace(/\.\.\.\s*more/gi, '')
    .replace(/^\s*logo\s*$/gim, '')
    // Normalize section headings
    .replace(/\b(About me|Summary|Profile Overview)\b/gi, 'About')
    .replace(/\b(Work Experience|Professional Experience|Career)\b/gi, 'Experience')
    // Remove emoji clusters that are just decorative
    .replace(/^[🏆🎯🔥⭐✨💼🎓]+\s*/gm, '')
    // Remove skill tag count lines
    .replace(/^.*and \+\d+ skills\s*$/gim, '')
    // Trim each line
    .split('\n').map(l => l.trim()).join('\n')
    .trim();
}

// --- Helpers ---
function safeJsonParse<T>(text: string): T {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // First repair attempt
    try {
      return JSON.parse(jsonrepair(cleaned));
    } catch {
      // Second repair attempt with more aggressive cleaning
      try {
        const aggressive = cleaned
          .replace(/[\x00-\x1f]/g, ' ')
          .replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(jsonrepair(aggressive));
      } catch (err) {
        throw new Error(`JSON parse failed after 2 repair attempts: ${(err as Error).message}`);
      }
    }
  }
}

async function updateProcessingStatus(orderId: string, status: string): Promise<void> {
  const extra = status === 'parsing' ? ', processing_started_at = NOW()' : '';
  await query(
    `UPDATE orders SET processing_status = $1${extra} WHERE id = $2`,
    [status, orderId],
  );
}

// --- Anti-repetition ---
export async function getRecentPatterns(): Promise<string[]> {
  try {
    const result = await query(
      `SELECT roast->>'roast_points' FROM orders WHERE roast IS NOT NULL
       ORDER BY created_at DESC LIMIT 50`,
    );
    const patterns: string[] = [];
    for (const row of result.rows) {
      const pointsJson = row['?column?'];
      if (!pointsJson) continue;
      try {
        const points = JSON.parse(pointsJson);
        for (const p of points) {
          if (p.roast) patterns.push(p.roast);
        }
      } catch { /* skip malformed */ }
    }
    return patterns.slice(0, 20);
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════
// STAGE 1 — PROFILE PARSER (3-Layer Architecture)
// ═══════════════════════════════════════════════════════
const STAGE1_SYSTEM = `You are a LinkedIn profile data extractor.
Extract ALL data from the profile text into JSON.
Never skip sections. Never hallucinate.
If data is missing return empty string or empty array.

EXPERIENCE EXTRACTION RULES:
Every job = one object in experience array.
Detect jobs by looking for:
- Employment type words: Full-time Internship Freelance Part-time Contract
- Date patterns: Month Year to Month Year or Month Year to Present
- Duration: X mos X yr X yrs
A new company name before these signals = new job.
Extract ALL bullet points as description text.
Preserve ALL numbers exactly as written.

BULLET POINT FORMATS TO HANDLE:
- Standard bullet: • text
- Emoji bullet: 🔹 text
- Dash bullet: - text
- Asterisk: * text (this is a bullet, NOT a new job entry)
- Numbered: 1. text
All formats are valid bullet points within a single experience entry.

METRICS EXTRACTION:
Preserve ALL numbers and metrics exactly as written:
- Percentages: 50%, 75%
- Ranges: 50-70 calls/day
- Large numbers: 1000+, 350+
- Currency: $X, ₹X
- Time periods: 3 months, 1 year
These metrics are critical for the rewrite. Never drop or round numbers.

If the input is clearly not a LinkedIn profile, return:
{"error":"invalid_input","reason":"brief explanation"}

OUTPUT (strict JSON):
{
  "headline": "string | null",
  "about": "string | null",
  "current_role": {
    "title": "string | null",
    "company": "string | null",
    "duration": "string | null",
    "description": "string | null"
  },
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string | null",
      "description": "string | null"
    }
  ],
  "education": [
    {
      "degree": "string | null",
      "institution": "string | null",
      "year": "string | null"
    }
  ],
  "skills": ["string"],
  "certifications": ["string"],
  "detected_industry": "string",
  "detected_seniority": "student | entry | mid | senior | executive",
  "profile_completeness": "minimal | partial | complete",
  "input_quality": "good | fair | poor",
  "word_count": number
}

Return ONLY valid JSON. No markdown. No explanation.`;

// Layer 3 — Validation + Retry
async function validateAndRetry(
  parsed: any,
  preprocessedInput: string,
  flash: any,
): Promise<ParsedProfile> {
  // Count company signals in preprocessed text
  const companySignals = (preprocessedInput.match(
    /\b(Full-time|Internship|Freelance|Part-time|Contract)\b/gi
  ) || []).length;

  const experienceCount = parsed.experience?.length || 0;

  // VALIDATION CHECKS
  const issues: string[] = [];

  if (!parsed.headline || parsed.headline.length < 5)
    issues.push('headline missing or too short');

  if (experienceCount === 0 && preprocessedInput.length > 300)
    issues.push('experience array empty on long input');

  if (companySignals > 0 && experienceCount < companySignals)
    issues.push(`expected ${companySignals} jobs based on employment type signals, got ${experienceCount}`);

  // If validation passes — return as-is
  if (issues.length === 0) {
    return parsed;
  }

  // If validation fails — retry with stricter prompt

  const retryPrompt = `The previous extraction missed these sections: ${issues.join(', ')}

Re-extract the COMPLETE profile.
Pay special attention to the experience section.
Extract EVERY job entry. Do not miss any.
Every employment type keyword (Full-time, Internship, Freelance, Part-time, Contract) indicates a separate job.
Return complete JSON in the exact same format.

Profile text:
---
${preprocessedInput}
---
Return ONLY valid JSON. No markdown. No explanation.`;

  const retryResult = await flash.generateContent({
    contents: [{ role: 'user', parts: [{ text: retryPrompt }] }],
    systemInstruction: STAGE1_SYSTEM,
  });

  const retried = safeJsonParse<ParsedProfile>(retryResult.response.text());

  // Return retried result if it has more experience entries, otherwise keep original
  if ((retried.experience?.length || 0) >= experienceCount) {
    return retried;
  }
  return parsed;
}

export async function stage1_parse(rawInput: string, orderId?: string): Promise<ParsedProfile> {
  if (orderId) await updateProcessingStatus(orderId, 'parsing');

  try {
    // Layer 1: Preprocess (deterministic cleanup)
    const clean = preprocessInput(rawInput);

    const flash = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.0, maxOutputTokens: 4000, thinkingConfig: { thinkingBudget: 0 } } as any,
    });

    // Layer 2: Single AI extraction call
    const result = await flash.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Extract all data from this LinkedIn profile:\n---\n${clean}\n---\nReturn ONLY valid JSON.` }] }],
      systemInstruction: STAGE1_SYSTEM,
    });

    const parsed = safeJsonParse<ParsedProfile>(result.response.text());

    // Layer 3: Validate + retry if needed
    const validated = await validateAndRetry(parsed, clean, flash);

    return validated;
  } catch (err) {
    console.error('Stage 1 parse error:', err);
    throw new Error(`Stage 1 failed: ${(err as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════
// STAGE 2 — PROFILE ANALYZER
// ═══════════════════════════════════════════════════════
const STAGE2_SYSTEM = `You are a LinkedIn profile scoring engine. Analyze structured profile
data and identify specific issues. Be clinical and precise.
You are NOT generating the roast or rewrite — only the analysis.

SCORING RUBRIC:
HEADLINE (0-100):
  0-20:  Missing, or only generic words (Aspiring / Looking / Professional)
  21-40: Job title + company only. No value proposition.
  41-60: Role + some specialization but not compelling
  61-80: Clear role + value proposition. Could be sharper.
  81-100: Role + value + who they help + specific differentiator

ABOUT (0-100):
  0-20:  Missing or under 50 words
  21-40: Vague, all buzzwords, no structure
  41-60: Some substance, no hook, no CTA, no metrics
  61-80: Good structure, some metrics, could be tighter
  81-100: Compelling hook, clear positioning, metrics, CTA, personality

EXPERIENCE (0-100):
  0-20:  Missing or just company names
  21-40: Duty language only (Responsible for / Tasked with)
  41-60: Specific tasks but no metrics or impact
  61-80: Shows impact with some metrics
  81-100: Every bullet = Strong Verb + Context + Measurable Result

OVERALL = Headline(0.25) + About(0.35) + Experience(0.30) + Completeness(0.10)

WEAK VERB DETECTION:
Scan ALL experience bullets for these weak starters and flag each one found.
Maximum 10 entries — if more than 10, keep the worst offenders.

Weak verbs to detect:
Responsible for, Tasked with, Duties include, Helped, Assisted, Supported,
Worked on, Participated in, Involved in, Contributed to, Was part of,
Collaborated on, Did, Made, Handled, Dealt with, Took care of.
Note: "Managed" is weak ONLY when used without specific scope or numbers
(e.g. "Managed tasks" is weak, "Managed $2M portfolio across 15 accounts" is strong).

QUANTIFICATION ANALYSIS:
Count experience bullets that contain real numbers, percentages, or metrics.
Calculate: quantified_bullets / total_bullets * 100.
Calibrate grade by detected_seniority from the parsed profile:
  Student/Entry: A (60%+) B (40-59%) C (25-39%) F (below 25%)
  Mid level: A (70%+) B (50-69%) C (35-49%) F (below 35%)
  Senior/Executive: A (80%+) B (65-79%) C (45-64%) F (below 45%)

OUTPUT FORMAT (strict JSON):
{
  "headline_score": number,
  "headline_issues": [{
    "issue": "specific problem",
    "severity": "critical | major | minor",
    "exact_quote": "quoted text from profile",
    "why_it_matters": "1 sentence"
  }],
  "about_score": number,
  "about_issues": [same format as headline_issues],
  "experience_score": number,
  "experience_issues": [same format],
  "overall_score": number,
  "buzzword_count": number,
  "buzzwords_found": ["exact buzzwords from profile"],
  "metrics_count": number,
  "positioning": "clear | vague | missing | contradictory",
  "top_3_problems": ["most impactful problems, 1 sentence each"],
  "detected_strengths": ["genuine positives — 1 to 3"],
  "weak_verbs_found": [{
    "verb": "exact weak phrase found",
    "location": "which company or section",
    "suggested_replacement": "stronger verb"
  }],
  "quantification_score": number,
  "quantification_breakdown": {
    "total_bullets": number,
    "quantified_bullets": number,
    "unquantified_bullets": number,
    "percentage": number,
    "grade": "A | B | C | F"
  },
  "total_bullets_detected": number,
  "ats_intelligence": {
    "top_searched_keywords": ["10-15 keywords that LinkedIn recruiters actually search for in this specific role and industry"],
    "keywords_present": ["which of the top keywords already exist in their current profile"],
    "keywords_missing": ["which top keywords are completely absent from their profile"],
    "critical_missing": ["top 3 keywords that MUST be added for basic ATS visibility"]
  }
}

ATS KEYWORD INTELLIGENCE:
Based on their role, industry, and seniority, identify the keywords LinkedIn recruiters
actually search for when hiring for this type of position.
top_searched_keywords: 10-15 keywords recruiters would type into LinkedIn search.
keywords_present: which of those keywords already appear somewhere in the profile.
keywords_missing: which of those keywords are completely absent.
critical_missing: the top 3 most important missing keywords — these must be added first.`;

export async function stage2_analyze(parsed: ParsedProfile, orderId?: string): Promise<Analysis> {
  if (orderId) await updateProcessingStatus(orderId, 'analyzing');

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: { temperature: 0.2, maxOutputTokens: 4000 },
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${STAGE2_SYSTEM}\n\nAnalyze this LinkedIn profile:\n---\n${JSON.stringify(parsed, null, 2)}\n---\nReturn ONLY valid JSON.` }],
      }],
    });

    const text = result.response.text();
    return safeJsonParse<Analysis>(text);
  } catch (err) {
    console.error('Stage 2 analyze error:', err);
    throw new Error(`Stage 2 failed: ${(err as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════
// STAGE 3 — ROAST GENERATOR
// ═══════════════════════════════════════════════════════
const STAGE3_SYSTEM = `You are The LinkedIn Roastmaster — a witty, sharp, satirical career
expert who tells professionals the honest truth about their profiles.

PERSONA:
Think: stand-up comedian who is also a Fortune 500 recruiter.
Clever wordplay, sharp analogies, unexpected comparisons.
Roasting the PROFILE — never the PERSON.
Goal: user laughs AND thinks that is actually true, I need to fix this.

10 ABSOLUTE LAWS — ZERO EXCEPTIONS:
1. Never reference: gender, age, race, caste, religion, disability,
   appearance, salary level, institution tier, or language ability
2. Never use: profanity, slurs, or adult language in any form
3. Never imply: unemployable, hopeless, should give up, no chance
4. Never attack: the person — only the profile text itself
5. Every point MUST quote specific text from THIS profile — no generic points
6. Never fabricate: only reference what is in the actual profile
7. Must be safe to screenshot and post on LinkedIn publicly
8. Always end with one genuine, warm, specific compliment
9. Match intensity to seniority (student/fresher = gentle 30%, mid-level = full 75%)
10. Every issue must feel FIXABLE — not permanent or hopeless

SPECIFICITY RULES:
Before generating each roast point, identify one specific phrase from the actual profile this targets.
That specific quote MUST appear in the roast text.
Ask before finalizing each point: "Could this apply to any other LinkedIn profile?"
If yes — it is not specific enough. Rewrite it.

DEPTH AND SPECIFICITY RULES:
BEFORE writing each roast point:
1. Find the most specific detail in that section
2. Find any number or metric in that section
3. Find any contradiction or gap in that section
4. Write the roast around that specific finding

USE THEIR ACTUAL NUMBERS:
If profile mentions specific metrics — use them. Do not say 'no results mentioned' when numbers exist.
Roast the GAP between the activity and the outcome.
Example: 'You mention 50-70 calls per day but nowhere do you tell us what happened after those calls — did they convert? Did they hang up? Did they order pizza? Activity without outcome is just very expensive noise.'

BANNED PHRASES — never use these:
LinkedIn bingo card / Elevator music / Motivational poster / Magic trick / Houdini / Resume in a single line / any generic phrase that could appear in any roast.

INDUSTRY-SPECIFIC HUMOR:
Sales profiles — use sales language and analogies. Tech profiles — use software analogies. Finance — numbers and ROI. The roast should feel written by an expert in their field.

INDIAN HUMOR STYLE (IMPORTANT):
Write roasts in a friendly Indian style — like how friends roast each other in India. Mix English with light Hinglish where it fits naturally.
Examples of the tone:
- "Bhai, 'Passionate about everything' likha hai — matlab kisi cheez mein expert nahi?"
- "This headline has more buzzwords than a Sharma ji ka beta's wedding invitation."
- "Your about section reads like a JD from Naukri.com — nobody reads those either."
- Use references Indians relate to: chai breaks, Sharma ji ka beta, naukri.com, Monday morning meetings, HR calls, appraisal season, notice period.
The roast should make the user smile and share with friends. Not mean — friendly brutal, like a best friend who tells you the truth.

OUCH MOMENT RULE:
Each point needs one line that makes them think: 'That is painfully accurate and I need to fix it.' Not just funny — accurate AND funny.

HUMOR QUALITY STANDARD:
Each roast point must pass this test: Would someone screenshot this and send to a friend?
If the answer is maybe — rewrite it. Every point needs ONE killer line.

CLOSING COMPLIMENT RULES:
Must reference a SPECIFIC achievement from the profile.
Must reframe it in a way they have never considered.
Must make them feel genuinely seen, not just flattered.
Maximum 2 sentences.
Bad: "Your experience is impressive."
Good: "Seven consecutive Hall of Fame awards means seven years of being the person your company could not afford to lose — that is not luck, that is a system worth showing the world."

ANTI-REPETITION RULES (critical at scale):
NEVER use these overused analogies:
  - restaurant menu analogy
  - Hello World analogy
  - bingo card analogy
  - grocery receipt analogy
  - filed under generic
  - close the tab / back button
Create a FRESH analogy specific to their detected industry.
Generate exactly 3 roast points (not 6). Each must use a DIFFERENT humor mechanism.
Available mechanisms (pick 3):
  analogy / exaggeration / rhetorical_question / sarcasm /
  unexpected_observation / irony

HIDDEN STRENGTHS — MANDATORY — find 2-3 things the person is underselling:
You MUST include the hidden_strengths array with at least 2 items. This is NOT optional.
RULES:
1. Minimum 2 strengths. Maximum 3.
2. Every strength must have evidence pointing to actual text from the profile.
3. If you cannot find evidence — do not include it.
4. Never invent achievements not in the profile.
5. Never say "likely" or "probably" or "seems like" — only state what is clearly present.
6. Focus on strengths the person may not realize they are underselling.
Use the detected_strengths from analysis as starting context but go deeper.

OUTPUT FORMAT (strict JSON — EXACTLY 3 roast points):
{
  "roast_title": "witty 5-8 word title for this specific profile",
  "roast_points": [
    {
      "point_number": 1,
      "section_targeted": "headline | about | experience | skills | overall",
      "roast": "1-3 sentences. Witty. Quotes actual text from their profile.",
      "underlying_issue": "the real professional problem, 1 sentence",
      "humor_mechanism": "analogy | exaggeration | rhetorical_question | sarcasm | unexpected_observation | irony"
    }
  ],
  "closing_compliment": "1-2 sentences, genuine, warm, specific to their real experience",
  "overall_verdict": "1 sentence summary in roast style",
  "linkedin_caption": "ready-to-post caption when they share the card on LinkedIn",
  "hidden_strengths": [
    {
      "strength": "specific strength found in profile",
      "evidence": "exact quote or detail from their profile that proves this",
      "why_valuable": "why employers or clients care about this in 1 sentence",
      "how_to_show_it": "specific actionable way to present this better on LinkedIn"
    }
  ]
}`;

export async function stage3_roast(
  parsed: ParsedProfile,
  analysis: Analysis,
  recentPatterns: string[],
  orderId?: string,
): Promise<Roast> {
  if (orderId) await updateProcessingStatus(orderId, 'roasting');

  const patternsBlock = recentPatterns.length > 0
    ? `RECENT PATTERNS TO AVOID:\n${recentPatterns.map(p => `- ${p.substring(0, 100)}`).join('\n')}`
    : 'RECENT PATTERNS TO AVOID: None yet — you are the first.';

  const userPrompt = `PROFILE: ${JSON.stringify(parsed, null, 2)}
ANALYSIS: ${JSON.stringify(analysis, null, 2)}
SENIORITY: ${parsed.detected_seniority}
INDUSTRY: ${parsed.detected_industry}
DETECTED_STRENGTHS: ${JSON.stringify(analysis.detected_strengths || [])}
Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.75,
      system: `${STAGE3_SYSTEM}\n\n${patternsBlock}`,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const roast = safeJsonParse<Roast>(text);

    // Ensure hidden_strengths is always present
    if (!roast.hidden_strengths || !Array.isArray(roast.hidden_strengths)) {
      console.warn(`[Stage 3] hidden_strengths missing from AI response, stop_reason: ${response.stop_reason}`);
      roast.hidden_strengths = [];
    }

    return roast;
  } catch (err) {
    console.error('Stage 3 roast error:', err);
    throw new Error(`Stage 3 failed: ${(err as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════
// INDUSTRY-SPECIFIC POWER VERB BANKS
// ═══════════════════════════════════════════════════════
const VERB_BANKS: Record<string, string> = {
  'sales': `POWER VERBS FOR SALES / BUSINESS DEVELOPMENT:
Generated, Closed, Negotiated, Prospected, Converted, Exceeded, Penetrated, Captured,
Expanded, Accelerated, Drove, Delivered, Secured, Landed, Grew, Spearheaded`,

  'hr': `POWER VERBS FOR HR / RECRUITMENT / TALENT:
Sourced, Screened, Placed, Headhunted, Reduced, Streamlined, Implemented, Built,
Developed, Transformed, Optimized, Led, Recruited, Onboarded, Retained, Coached`,

  'technology': `POWER VERBS FOR TECHNOLOGY / ENGINEERING:
Architected, Engineered, Deployed, Shipped, Automated, Scaled, Optimized, Integrated,
Developed, Launched, Refactored, Designed, Built, Implemented, Migrated, Delivered`,

  'marketing': `POWER VERBS FOR MARKETING / GROWTH:
Grew, Increased, Launched, Managed, Created, Drove, Generated, Amplified, Executed, Built,
Designed, Produced, Improved, Boosted, Led`,

  'finance': `POWER VERBS FOR FINANCE / OPERATIONS:
Managed, Reduced, Saved, Increased, Audited, Forecasted, Streamlined, Improved, Delivered,
Controlled, Analyzed, Reported, Optimized`,

  'customer_success': `POWER VERBS FOR CUSTOMER SUCCESS / ACCOUNT MANAGEMENT:
Retained, Expanded, Upsold, Managed, Built, Delivered, Resolved, Improved, Achieved,
Maintained, Grew, Exceeded, Partnered`,

  'general': `POWER VERBS FOR GENERAL / LEADERSHIP:
Led, Spearheaded, Championed, Directed, Established, Launched, Built, Drove,
Delivered, Achieved, Exceeded, Transformed`,
};

// ═══════════════════════════════════════════════════════
// INDUSTRY-SPECIFIC KEYWORD BANKS (ATS fallback)
// ═══════════════════════════════════════════════════════
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  sales: ['Revenue Generation', 'Pipeline', 'CRM', 'B2B Sales', 'Lead Generation',
    'Account Management', 'Quota', 'Closing', 'Prospecting', 'Client Relations'],
  hr: ['Talent Acquisition', 'Recruitment', 'HRIS', 'Onboarding', 'Employee Engagement',
    'Performance Management', 'Sourcing', 'ATS', 'Workforce Planning', 'HR Analytics'],
  technology: ['Software Development', 'Agile', 'Cloud', 'API', 'Microservices', 'DevOps',
    'CI/CD', 'System Design', 'Full Stack', 'Data Structures'],
  marketing: ['Digital Marketing', 'SEO', 'SEM', 'Content Strategy', 'Brand Management',
    'Analytics', 'Campaign Management', 'Social Media', 'Lead Generation', 'ROI'],
  finance: ['Financial Analysis', 'Forecasting', 'Budgeting', 'Risk Management', 'Compliance',
    'Excel', 'Financial Modeling', 'Audit', 'Cost Reduction', 'Variance Analysis'],
  customer_success: ['Customer Retention', 'Account Management', 'NPS', 'Churn Reduction',
    'Upselling', 'Customer Satisfaction', 'SaaS', 'Revenue Expansion', 'QBR',
    'Customer Onboarding', 'Stakeholder Management', 'Business Value',
    'Enterprise Accounts', 'Customer Health', 'Post-Sales'],
  general: ['Leadership', 'Project Management', 'Stakeholder Management', 'Communication',
    'Problem Solving', 'Team Management', 'Strategic Planning', 'Data Analysis',
    'Cross-functional', 'Process Improvement'],
};

function getKeywordsForIndustry(industry: string): string[] {
  const lower = (industry || '').toLowerCase();
  // Check customer_success and account management BEFORE technology
  if (/customer.?success|csm|account.?manage/i.test(lower)) return INDUSTRY_KEYWORDS['customer_success'];
  if (/sales|business.?dev|inside.?sales|bdr|sdr/i.test(lower)) return INDUSTRY_KEYWORDS['sales'];
  if (/hr|human.?resource|recruit|talent/i.test(lower)) return INDUSTRY_KEYWORDS['hr'];
  if (/market|growth|brand|content|seo|social.?media|digital/i.test(lower)) return INDUSTRY_KEYWORDS['marketing'];
  if (/finance|accounting|banking/i.test(lower)) return INDUSTRY_KEYWORDS['finance'];
  // Use word boundary for "it" to avoid matching "training", "recruiting", etc.
  if (/software|engineer|developer|technology|\bit\b|devops|cloud|cyber/i.test(lower)) return INDUSTRY_KEYWORDS['technology'];
  return INDUSTRY_KEYWORDS['general'];
}

function getVerbBankForIndustry(industry: string): string {
  const lower = industry.toLowerCase();
  if (/sales|business.?dev|bdr|sdr/i.test(lower)) return VERB_BANKS['sales'];
  if (/hr|human.?resource|recruit|talent/i.test(lower)) return VERB_BANKS['hr'];
  if (/tech|engineer|software|data|devops|it|cloud|cyber/i.test(lower)) return VERB_BANKS['technology'];
  if (/market|growth|brand|content|seo|social.?media|digital/i.test(lower)) return VERB_BANKS['marketing'];
  if (/finance|account|banking|operations|supply.?chain|logistics/i.test(lower)) return VERB_BANKS['finance'];
  if (/customer.?success|account.?manage|client|support/i.test(lower)) return VERB_BANKS['customer_success'];
  return VERB_BANKS['general'];
}

// ═══════════════════════════════════════════════════════
// STAGE 4 — SHARED REWRITE RULES (used by Standard + Pro)
// ═══════════════════════════════════════════════════════
const BASE_REWRITE_RULES = `You are a top-tier LinkedIn ghostwriter who has optimized 10,000+
profiles for executives, founders, and job seekers globally.

ABSOLUTE REWRITING RULES:
1. NEVER invent: metrics, achievements, company names, credentials,
   certifications, awards not in the original profile
2. When metrics are missing from the original profile, use a realistic industry-appropriate estimate instead of [X]. For example write '90%+ client retention' or '3x pipeline coverage' or 'reduced time-to-hire by 30%'. Only use [X] as a last resort for highly specific metrics like exact team headcount or exact budget amount where no reasonable estimate is possible. Maximum 2 [X] in entire output. Never replace or modify numbers that already exist in the original profile — use them exactly.
3. Keep actual job titles — never inflate or change them
4. Match industry tone exactly: tech differs from finance, creative, healthcare
5. Calibrate for detected seniority — fresher profile must not sound executive

COMPANY NAME RULE — ABSOLUTE ZERO EXCEPTIONS:
Copy every company name exactly as it appears in parsed_profile.experience[].company field.
Character by character. No corrections. No abbreviations. No expansions.
No spelling fixes. No punctuation changes.
If parsed profile has 'GAOTek Inc.' — rewrite must say 'GAOTek Inc.' exactly.
If parsed profile has 'CloudThat' — rewrite must say 'CloudThat' exactly.
Violation of this rule = fabrication error.

HEADLINE FORMULA:
[What You Do] | [Who You Help or Where You Work] | [Key Result / Differentiator]
Max 220 characters. No emojis for Finance, Legal, Healthcare, Government.
Banned headline words: Aspiring, Passionate, Dedicated, Committed,
Results-driven, Thought Leader, Ninja, Guru, Rockstar, Looking for opportunities

ABOUT SECTION FRAMEWORK (follow this order exactly):
Lines 1-2:  HOOK — compelling, above LinkedIn fold, NOT starting with I am a
Lines 3-4:  PROBLEM or VALUE — pain you solve, for whom
Lines 5-8:  HOW — your approach, methodology, specific tools
Lines 9-11: PROOF — achievements with numbers, [X] where missing
Lines 12-13: CTA — specific next step, not just open to work
Line 14:   CONTACT — email or message preference
Max 2600 characters. Use line breaks between sections.

ABOUT SECTION FORMATTING RULES:
1. Maximum 3 sentences per paragraph
2. Blank line between every paragraph — use \\n\\n in JSON output
3. Use bullet points (•) for listing skills or achievements
4. Never write more than 3 items in a comma list — convert to bullet points instead
5. Final output must have at least 3 separate paragraphs with blank lines between them
6. CTA must be its own separate final paragraph
7. The about section must NOT be one wall of text

EXPERIENCE BULLET FORMAT:
[Strong Action Verb] + [Specific What You Did] + [Measurable Result]
Never start a bullet with: I / The / Was / Responsible / Helped / Supported / Assisted
Recent role: 4-5 bullets. Previous roles: 2-3 bullets. Old roles: 1-2 bullets.

EXPERIENCE BULLETS FORMATTING RULES:
1. Each bullet point = one separate string in the bullets array
2. Never combine multiple bullets with • separator in a single string
3. Never put more than one achievement per bullet
4. Each bullet starts with a strong action verb
5. Each bullet is one complete sentence
6. Minimum 3 bullets per role, maximum 5 bullets
7. Recent role: 4-5 bullets
8. Older roles: 2-3 bullets
9. Very old roles (3+ years ago): 1-2 bullets

PLACEHOLDER RULES — MAXIMUM 2 [X] IN ENTIRE OUTPUT (prefer industry estimates over [X]):
NEVER use placeholders for these — always use real data:
- Company name — use exact company from parsed profile
- Job title — use exact title from parsed profile
- Year — calculate from date ranges in parsed profile
- Numbers stated in profile — use them directly
  If profile says 50-70 calls — write 50-70 calls
  If profile says 1000+ students — write 1000+ students
  If profile says 350+ leads — write 350+ leads
  Never replace stated numbers with [X]
NEVER output these under any circumstances:
- [Your Current Company Name] — use actual company name
- [Your Email Address] — write 'Connect via LinkedIn message'
- [Year] — use actual year from profile dates
- [Your Name]
ONLY use [X] when metric is genuinely unknown:
- Specific revenue figure if not mentioned
- Team headcount if not mentioned
- Percentage improvement if not mentioned
Count [X] brackets before finalizing output. If more than 2 — replace with realistic industry estimates instead.

COMPANY NAME PRESERVATION:
For every experience entry in rewritten_experience:
The company field must be copied character by character from parsed_profile.experience[i].company.
No spelling corrections. No abbreviations. No additions. No removals.
If parsed company is 'SkilloVilla' write 'SkilloVilla'. If parsed company is 'The Narayana Group' write 'The Narayana Group'.
This rule applies to every company in every profile.

HEADLINE QUALITY STANDARD:
Extract the single most impressive metric or achievement from the profile. Build the headline around that specific data point.
WEAK headline (never acceptable): 'Business Development Representative | Driving Growth | Pipeline Generation'
STRONG headline (target this quality): 'BDR | 50-70 Qualified Conversations Daily | HealthTech Pipeline Builder | SaaS Sales'
Formula: [Specific Role] | [Their Best Metric or Achievement] | [Their Niche or Specialization]. Maximum 220 characters.
BANNED: Aspiring / Passionate / Dedicated / Dynamic / Results-driven / Seeking / Looking / Motivated / Hardworking / Enthusiastic.
If profile has NO metrics at all — use their most specific niche or specialization instead.

VOICE MATCHING:
Study the tone and voice of the original profile. If person writes casually — keep it warm. If person writes formally — keep it professional. If they use Indian English — preserve it. Rewrite should feel like THEIR voice upgraded, not like a different person wrote it.

POWER VERB RULES:
Every experience bullet MUST start with a verb from the POWER VERBS list provided below.
Never repeat the same verb within a single role. Minimize repetition across roles.
If the list does not have enough verbs, you may use similar strong action verbs.

PERSONALIZATION NOTE:
Write 2 sentences explaining what makes this rewrite specific to THIS person.
Reference specific names, numbers, or achievements from THIS profile that shaped the rewrite.
Example: "Your rewrite is built around your 7x Hall of Fame record and 6.5 Crore revenue. We positioned you as a revenue-driving CSM, not a generic customer success professional."
This must feel custom — never generic.`;

// ═══════════════════════════════════════════════════════
// STAGE 4 — STANDARD REWRITE
// ═══════════════════════════════════════════════════════
const STANDARD_OUTPUT_FORMAT = `
STANDARD PLAN — Include 5-8 core ATS keywords in ats_keywords field.
These are the most important searchable terms for their role and industry.
Pro plan gets 10-15 keywords and JD matching.

OUTPUT FORMAT (strict JSON):
{
  "rewritten_headline": "string",
  "headline_rationale": "why this is better, 1 sentence",
  "rewritten_about": "full about section with newline breaks",
  "about_changes": "key improvements made",
  "rewritten_experience": [{
    "title": "exact original title",
    "company": "exact original company",
    "bullets": ["rewritten achievement bullets"],
    "changes_made": "what was improved"
  }],
  "suggested_skills": [{"skill": "string", "reason": "why this matters"}],
  "ats_keywords": ["5-8 most important searchable keywords for their role and industry"],
  "placeholders_to_fill": [{
    "location": "where in the rewrite",
    "placeholder": "[X]%",
    "instruction": "replace with your actual number"
  }],
  "personalization_note": "2 sentences explaining what makes this rewrite specific to this person",
  "linkedin_post_hook": "punchy 1-line opener for their LinkedIn transformation post"
}`;

function buildStage4System(industry: string): string {
  const verbBank = getVerbBankForIndustry(industry);
  return `${BASE_REWRITE_RULES}\n\n${verbBank}\n\n${STANDARD_OUTPUT_FORMAT}`;
}

export async function stage4_rewrite(
  parsed: ParsedProfile,
  analysis: Analysis,
  orderId?: string,
): Promise<StandardRewrite> {
  if (orderId) await updateProcessingStatus(orderId, 'rewriting');

  const userPrompt = `PROFILE: ${JSON.stringify(parsed, null, 2)}
ANALYSIS: ${JSON.stringify(analysis, null, 2)}
PLAN: standard
Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      temperature: 0.5,
      system: buildStage4System(parsed.detected_industry),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return safeJsonParse<StandardRewrite>(text);
  } catch (err) {
    console.error('Stage 4 rewrite error:', err);
    throw new Error(`Stage 4 failed: ${(err as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════
// STAGE 4b — PRO REWRITE
// ═══════════════════════════════════════════════════════
const PRO_OUTPUT_FORMAT = `
PRO PLAN — Include 10-15 ATS keywords, 5 headline variations, JD analysis, and cover letter.

OUTPUT FORMAT (strict JSON — Pro plan):
{
  "rewritten_headline": "primary recommended headline",
  "headline_rationale": "why this is the best choice",

  "headline_variations": [
    {"headline": "max 220 chars", "style": "achievement-focused",
     "best_for": "when to use this version"},
    {"headline": "string", "style": "value-proposition", "best_for": "string"},
    {"headline": "string", "style": "metric-driven", "best_for": "string"},
    {"headline": "string", "style": "niche-specialist", "best_for": "string"},
    {"headline": "string", "style": "ats-keyword-optimized", "best_for": "string"}
  ],

  "rewritten_about": "full about section with newline breaks",
  "about_changes": "key improvements",
  "rewritten_experience": [{
    "title": "exact original", "company": "exact original",
    "bullets": [], "changes_made": "string"
  }],
  "suggested_skills": [{"skill": "", "reason": ""}],
  "ats_keywords": ["10-15 searchable keywords for their role and industry"],

  "jd_analysis": {
    "match_score": number or null,
    "matched_keywords": [],
    "missing_keywords": [],
    "gap_summary": "2-3 sentences",
    "application_recommendation": "Apply now | Fix 3 things first | Strong match"
  },

  "cover_letter": {
    "subject_line": "for email applications",
    "body": "max 350 words. Hook + Why this role + Proof + CTA. ONLY use achievements/metrics from the profile — NEVER fabricate numbers. If JOB_DESCRIPTION is null, leave body empty.",
    "personalization_notes": "what to customize before sending"
  },

  "placeholders_to_fill": [{"location": "", "placeholder": "", "instruction": ""}],
  "personalization_note": "2 sentences explaining what makes this rewrite specific to this person",
  "linkedin_post_hook": "punchy opener for transformation LinkedIn post"
}`;

function buildStage4bSystem(industry: string): string {
  const verbBank = getVerbBankForIndustry(industry);
  return `${BASE_REWRITE_RULES}\n\n${verbBank}\n\n${PRO_OUTPUT_FORMAT}`;
}

export async function stage4b_proRewrite(
  parsed: ParsedProfile,
  analysis: Analysis,
  jobDescription: string | null,
  orderId?: string,
): Promise<ProRewrite> {
  if (orderId) await updateProcessingStatus(orderId, 'rewriting');

  const jdBlock = jobDescription
    ? `JOB_DESCRIPTION: ${jobDescription}`
    : 'JOB_DESCRIPTION: null\nNOTE: If JOB_DESCRIPTION is null, set jd_analysis.match_score to null and all jd_analysis arrays to empty. Set cover_letter to {"subject_line":"","body":"","personalization_notes":"No job description provided — add a JD to generate a targeted cover letter."}. Do NOT invent a job description or company details.';

  const userPrompt = `PROFILE: ${JSON.stringify(parsed, null, 2)}
ANALYSIS: ${JSON.stringify(analysis, null, 2)}
${jdBlock}
PLAN: pro
Return ONLY valid JSON.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.5,
      system: buildStage4bSystem(parsed.detected_industry),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return safeJsonParse<ProRewrite>(text);
  } catch (err) {
    console.error('Stage 4b pro rewrite error:', err);
    throw new Error(`Stage 4b failed: ${(err as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════
// STAGE 5 — QUALITY CHECKER
// ═══════════════════════════════════════════════════════
const STAGE5_SYSTEM = `You are a QA reviewer for an AI LinkedIn profile service.
Check SAFETY (any failure = REJECT) and QUALITY (failure = REVISE).

SAFETY CHECKS — any YES answer = REJECT:
Does the roast reference gender, age, race, caste, religion, appearance, disability?
Does the roast contain profanity or adult language in any form?
Does the roast attack the PERSON rather than the profile?
Does the roast imply unemployability, hopelessness, or giving up?
Does the roast mock educational institution tier or English language ability?
Does the rewrite contain fabricated company names, fake credentials, or invented awards not in the original profile? Note: industry-standard metric estimates (e.g. '95% retention', '3x pipeline', '30% improvement') used to replace missing data are ALLOWED and should NOT be flagged — only flag invented company names, fake job titles, or credentials the person does not have.
Does the rewrite contain ANY company name not in the original profile?

COMPANY NAME CHECK — runs for every experience entry:
Compare rewrite company name against parsed_profile company name character by character.
Any difference = REJECT immediately.
This check must pass for all experience entries.

QUALITY CHECKS — failure = REVISE:
Do all 3 roast points quote specific text from THIS profile?
Do all 6 points use different humor mechanisms?
Is the rewritten headline under 220 characters?
Does the rewritten About start with a hook (not I am a...)?
Is the rewritten About under 2600 characters?
Are 50% or more of experience bullets quantified or have [X] brackets?

OUTPUT FORMAT (strict JSON):
{
  "safety_passed": boolean,
  "safety_issues": ["specific issue found if any"],
  "quality_score": number (0-100),
  "quality_issues": [{
    "issue": "description",
    "severity": "critical | minor",
    "fix": "exact instruction to fix this"
  }],
  "verdict": "APPROVE | REVISE | REJECT",
  "revision_instructions": "if REVISE: precise instructions for what to fix"
}`;

export async function stage5_qualityCheck(
  parsed: ParsedProfile,
  roast: Roast,
  rewrite: StandardRewrite | ProRewrite,
  orderId?: string,
): Promise<QualityCheck> {
  if (orderId) await updateProcessingStatus(orderId, 'checking');

  const userPrompt = `ORIGINAL PROFILE: ${JSON.stringify(parsed, null, 2)}
ROAST: ${JSON.stringify(roast, null, 2)}
REWRITE: ${JSON.stringify(rewrite, null, 2)}
Return ONLY valid JSON.`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.0, maxOutputTokens: 1000 },
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${STAGE5_SYSTEM}\n\n${userPrompt}` }],
      }],
    });

    const text = result.response.text();
    const raw = safeJsonParse<any>(text);

    // Normalize — derive verdict if model omitted it
    if (!raw.verdict) {
      if (raw.safety_passed === false) {
        raw.verdict = 'REJECT';
      } else if (raw.quality_issues?.some((i: any) => i.severity === 'critical')) {
        raw.verdict = 'REVISE';
      } else {
        raw.verdict = 'APPROVE';
      }
    }

    // Normalize quality_issues from string[] to object[] if needed
    if (Array.isArray(raw.quality_issues)) {
      raw.quality_issues = raw.quality_issues.map((item: any) =>
        typeof item === 'string' ? { issue: item, severity: 'minor' as const, fix: '' } : item,
      );
    }

    return raw as QualityCheck;
  } catch (err) {
    console.error('Stage 5 quality check error:', err);
    throw new Error(`Stage 5 failed: ${(err as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════
// TIMEOUT WRAPPER
// ═══════════════════════════════════════════════════════
const TIMEOUTS = {
  parse: 30000,
  analyze: 60000,
  roast: 45000,
  rewrite: 45000,
  rewrite_pro: 60000,
  check: 30000,
};

async function withTimeout<T>(fn: () => Promise<T>, ms: number, stage: string): Promise<T> {
  const backoffs = [5000, 15000, 30000]; // retry delays
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      return await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${stage} timed out after ${ms}ms`)), ms),
        ),
      ]);
    } catch (err: any) {
      const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('rate');
      const isTimeout = err?.message?.includes('timed out');
      if ((isRateLimit || isTimeout) && attempt < 3) {
        const delay = backoffs[attempt];
        console.warn(`[RETRY] ${stage} attempt ${attempt + 1}/3 failed (${isRateLimit ? '429' : 'timeout'}), waiting ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`${stage} failed after 3 retries`);
}

// Re-export scoring from shared
export { calculateScore, capAfterScore, ScoreBreakdown };

export function parseRewriteToProfile(
  rewrite: StandardRewrite | ProRewrite,
): ParsedProfile {
  return {
    headline: rewrite.rewritten_headline,
    about: rewrite.rewritten_about,
    current_role: rewrite.rewritten_experience?.[0]
      ? {
          title: rewrite.rewritten_experience[0].title,
          company: rewrite.rewritten_experience[0].company,
          duration: null,
          description: rewrite.rewritten_experience[0].bullets.join('\n'),
        }
      : { title: null, company: null, duration: null, description: null },
    experience: (rewrite.rewritten_experience || []).map(exp => ({
      title: exp.title,
      company: exp.company,
      duration: null,
      description: exp.bullets.join('\n'),
    })),
    education: [],
    skills: (rewrite.suggested_skills || []).map(s => s.skill),
    certifications: [],
    detected_industry: 'Technology',
    detected_seniority: 'mid',
    profile_completeness: 'complete',
    input_quality: 'good',
    word_count: rewrite.rewritten_about?.split(/\s+/).length || 0,
  };
}

// ═══════════════════════════════════════════════════════
// STUBS — Implemented in later sessions
// ═══════════════════════════════════════════════════════
async function sendRefundEmail(email: string, orderId: string): Promise<void> {
  try {
    await sendRefundEmailService(email, orderId);
  } catch (err) {
    console.error('sendRefundEmail failed:', (err as Error).message);
  }
}

async function alertTeam(message: string): Promise<void> {
  console.error(`[ALERT] ${message}`);
}

async function postProcess(orderId: string): Promise<void> {
  try {
    const result = await query('SELECT * FROM orders WHERE id=$1', [orderId]);
    const order = result.rows[0];
    if (!order) return;

    // Generate card image
    const firstStrength = order.roast?.hidden_strengths?.[0] || null;
    const cardUrl = await generateAndUploadCard({
      orderId,
      beforeScore: order.before_score?.overall || 0,
      afterScore: order.after_score?.overall || 0,
      headlineScore: order.before_score?.headline || 0,
      aboutScore: order.before_score?.about || 0,
      experienceScore: order.before_score?.experience || 0,
      topRoast: order.roast?.roast_points?.[0]?.roast || 'Your profile got roasted!',
      secondRoast: order.roast?.roast_points?.[1]?.roast || '',
      hiddenStrength: firstStrength ? { strength: firstStrength.strength, evidence: firstStrength.evidence || '', how_to_show_it: firstStrength.how_to_show_it } : null,
      closingCompliment: order.roast?.closing_compliment || '',
      rewrittenHeadline: order.rewrite?.rewritten_headline || '',
      industry: order.parsed_profile?.detected_industry || 'Technology',
    });

    if (cardUrl) {
      await query('UPDATE orders SET card_image_url=$1 WHERE id=$2', [cardUrl, orderId]);
      order.card_image_url = cardUrl;
    }

    // Send results email
    await sendResultsEmail(order);
  } catch (err) {
    console.error('postProcess failed:', (err as Error).message);
  }
}

// ═══════════════════════════════════════════════════════
// AUTO-REFUND
// ═══════════════════════════════════════════════════════
export async function processAutoRefund(orderId: string, reason: string): Promise<void> {
  const { rows } = await query(
    'SELECT razorpay_payment_id, amount_paise, email FROM orders WHERE id=$1',
    [orderId],
  );
  if (!rows[0]?.razorpay_payment_id) return;

  try {
    await razorpay.payments.refund(rows[0].razorpay_payment_id, {
      amount: rows[0].amount_paise,
      notes: { reason, order_id: orderId },
    });
    await query(
      `UPDATE orders SET payment_status=$1, processing_status=$2,
       processing_error=$3 WHERE id=$4`,
      ['refunded', 'failed', reason, orderId],
    );
    await sendRefundEmail(rows[0].email, orderId);
    posthog.capture({
      distinctId: rows[0].email,
      event: 'refund_issued',
      properties: { reason, order_id: orderId },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { critical: 'refund_failed' } });
    await alertTeam('URGENT: Refund FAILED for order ' + orderId);
  }
}

// ═══════════════════════════════════════════════════════
// MAIN PIPELINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════
function generateProfileHash(profileInput: any): string {
  const raw = typeof profileInput === 'string' ? profileInput : JSON.stringify(profileInput);
  const normalized = raw.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 16);
}

export async function runPipeline(orderId: string): Promise<void> {
  let attempts = 0;
  const orderResult = await query('SELECT * FROM orders WHERE id=$1', [orderId]);
  if (!orderResult.rows.length) throw new Error(`Order ${orderId} not found`);

  const order = orderResult.rows[0];
  const profileInput = order.profile_input;
  const plan: string = order.plan;
  const jobDesc: string | null = order.job_description;

  // Profile fingerprinting — check for duplicate
  const profileHash = generateProfileHash(profileInput);
  await query('UPDATE orders SET profile_hash=$1 WHERE id=$2', [profileHash, orderId]);

  const existing = await query(
    `SELECT * FROM orders WHERE profile_hash=$1 AND processing_status='done'
     AND created_at > NOW() - INTERVAL '30 days' AND id != $2
     ORDER BY created_at DESC LIMIT 1`,
    [profileHash, orderId],
  );

  if (existing.rows.length > 0) {
    const src = existing.rows[0];
    console.log(`[FINGERPRINT] Duplicate detected for ${orderId}, copying results from ${src.id}`);
    await query(
      `UPDATE orders SET parsed_profile=$1, analysis=$2, roast=$3, rewrite=$4,
       quality_check=$5, before_score=$6, after_score=$7, card_image_url=$8,
       processing_status='done', processing_done_at=NOW() WHERE id=$9`,
      [JSON.stringify(src.parsed_profile), JSON.stringify(src.analysis),
       JSON.stringify(src.roast), JSON.stringify(src.rewrite),
       JSON.stringify(src.quality_check), JSON.stringify(src.before_score),
       JSON.stringify(src.after_score), src.card_image_url, orderId],
    );
    // Track in result_lookups
    await query('INSERT INTO result_lookups (email, order_id) VALUES ($1, $2)',
      [order.email, src.id]);
    await postProcess(orderId);
    return;
  }

  while (attempts < 3) {
    try {
      await query(
        'UPDATE orders SET processing_started_at=NOW(), retry_count=$1 WHERE id=$2',
        [attempts, orderId],
      );

      // Stage 1 — Parse
      const rawInput = typeof profileInput === 'string' ? profileInput : JSON.stringify(profileInput);
      const parsed = await withTimeout(
        () => stage1_parse(rawInput),
        TIMEOUTS.parse,
        'parse',
      );

      // Validate parsed output looks like a real profile
      if (!parsed.headline && !parsed.experience?.length && !parsed.about) {
        throw new Error('Could not identify LinkedIn profile content. Please paste your actual LinkedIn profile text.');
      }

      await query(
        'UPDATE orders SET parsed_profile=$1, processing_status=$2 WHERE id=$3',
        [JSON.stringify(parsed), 'analyzing', orderId],
      );

      // Stage 2 — Analyze
      const analysis = await withTimeout(
        () => stage2_analyze(parsed),
        TIMEOUTS.analyze,
        'analyze',
      );

      // Fallback: if Stage 2 did not return ats_intelligence, build from industry keywords
      if (!analysis.ats_intelligence) {
        console.warn('ats_intelligence missing from Stage 2 — using keyword fallback');
        // Include role title so a CSM at a tech company gets CSM keywords, not tech keywords
        const roleSignal = `${parsed.detected_industry} ${parsed.current_role?.title || ''}`;
        const industryKeywords = getKeywordsForIndustry(roleSignal);
        analysis.ats_intelligence = {
          top_searched_keywords: industryKeywords,
          keywords_present: [],
          keywords_missing: industryKeywords,
          critical_missing: industryKeywords.slice(0, 3),
        };
      }

      await query(
        'UPDATE orders SET analysis=$1, processing_status=$2 WHERE id=$3',
        [JSON.stringify(analysis), 'roasting', orderId],
      );

      // Stage 3 — Roast
      const patterns = await getRecentPatterns();
      const roast = await withTimeout(
        () => stage3_roast(parsed, analysis, patterns),
        TIMEOUTS.roast,
        'roast',
      );
      await query(
        'UPDATE orders SET roast=$1, processing_status=$2 WHERE id=$3',
        [JSON.stringify(roast), 'rewriting', orderId],
      );

      // Stage 4 / 4b — Rewrite (plan-gated)
      const rewrite = plan === 'pro'
        ? await withTimeout(
            () => stage4b_proRewrite(parsed, analysis, jobDesc),
            TIMEOUTS.rewrite_pro,
            'rewrite_pro',
          )
        : await withTimeout(
            () => stage4_rewrite(parsed, analysis),
            TIMEOUTS.rewrite,
            'rewrite',
          );
      await query(
        'UPDATE orders SET rewrite=$1, processing_status=$2 WHERE id=$3',
        [JSON.stringify(rewrite), 'checking', orderId],
      );

      // Stage 5 — Quality Check
      const qc = await withTimeout(
        () => stage5_qualityCheck(parsed, roast, rewrite),
        TIMEOUTS.check,
        'check',
      );
      await query(
        'UPDATE orders SET quality_check=$1 WHERE id=$2',
        [JSON.stringify(qc), orderId],
      );

      if (qc.verdict === 'APPROVE') {
        const before = calculateScore(parsed, analysis);
        const rewriteAsParsed = parseRewriteToProfile(rewrite);

        // Merge original skills/education/certs for completeness scoring
        // (Stage 4 only rewrites headline, about, experience — not skills/education)
        const mergedForScoring = {
          ...rewriteAsParsed,
          skills: parsed.skills,
          education: parsed.education,
          certifications: parsed.certifications,
        };

        // Re-analyze the rewrite for after score
        let afterAnalysis: Analysis;
        try {
          afterAnalysis = await withTimeout(
            () => stage2_analyze(rewriteAsParsed),
            TIMEOUTS.analyze,
            'after_analyze',
          );
        } catch {
          // Fallback: estimate after scores
          afterAnalysis = {
            ...analysis,
            headline_score: Math.min(analysis.headline_score + 30, 90),
            about_score: Math.min(analysis.about_score + 30, 90),
            experience_score: Math.min(analysis.experience_score + 25, 85),
            overall_score: Math.min(analysis.overall_score + 28, 88),
          };
        }

        // Connect Stage 4 ats_keywords to after score: boost ATS by matching rewrite keywords
        const rewriteKeywords = rewrite.ats_keywords || [];
        const expectedKeywords = analysis.ats_intelligence?.top_searched_keywords || [];
        if (rewriteKeywords.length > 0 && expectedKeywords.length > 0) {
          const matched = expectedKeywords.filter(expected =>
            rewriteKeywords.some(rk =>
              rk.toLowerCase().includes(expected.toLowerCase()) ||
              expected.toLowerCase().includes(rk.toLowerCase())
            )
          );
          // Update afterAnalysis ats_intelligence to reflect rewrite keywords
          afterAnalysis.ats_intelligence = {
            ...afterAnalysis.ats_intelligence,
            top_searched_keywords: expectedKeywords,
            keywords_present: matched,
            keywords_missing: expectedKeywords.filter(k => !matched.includes(k)),
            critical_missing: (afterAnalysis.ats_intelligence?.critical_missing || [])
              .filter(k => !matched.includes(k)),
          };
        }

        const rawAfter = calculateScore(mergedForScoring, afterAnalysis);
        const cappedAfterOverall = capAfterScore(before.overall, rawAfter.overall);
        const after = {
          ...rawAfter,
          overall: cappedAfterOverall,
          ats: Math.max(rawAfter.ats, before.ats),
        };

        await query(
          `UPDATE orders SET before_score=$1, after_score=$2,
           processing_status='done', processing_done_at=NOW() WHERE id=$3`,
          [JSON.stringify(before), JSON.stringify(after), orderId],
        );

        await postProcess(orderId);

        posthog.capture({
          distinctId: order.email,
          event: 'processing_completed',
          properties: {
            plan,
            before_score: before.overall,
            after_score: after.overall,
            order_id: orderId,
          },
        });

        return;
      }

      // REVISE or REJECT — retry
      if (qc.verdict === 'REVISE' || qc.verdict === 'REJECT') {
        attempts++;
        console.log(`Pipeline attempt ${attempts}/3 — verdict: ${qc.verdict} for order ${orderId}`);
        continue;
      }
    } catch (err) {
      attempts++;
      console.error(`Pipeline attempt ${attempts}/3 failed for order ${orderId}:`, (err as Error).message);
      Sentry.captureException(err, { extra: { orderId, attempts } });
      if (attempts >= 3) break;
    }
  }

  // All 3 attempts failed — issue auto-refund
  await processAutoRefund(orderId, 'AI pipeline failed after 3 attempts');
}

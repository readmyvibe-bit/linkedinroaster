import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface TeaserResult {
  score: number;
  verdict: string;
  grade: string;
  issues: Array<{ issue: string; quick_tip: string }>;
  teaser_insight: string;
  suggested_headline: string;
  sample_interview_question: string;
  // Enhanced teaser fields
  subscores: {
    ats_keywords: number;
    experience_impact: number;
    headline_strength: number;
    overall_readiness: number;
  };
  missing_keywords: string[];
  sample_improvement: {
    before: string;
    after: string;
  };
  ranking_percentile: number;
}

const TEASER_SYSTEM = `LinkedIn headline analyzer. Score and identify top 2 problems.
This is a FREE PREVIEW — punchy, specific, make them want the full rewrite.
SCORING (0-100):
  0-20: Missing or generic (Aspiring/Looking/Professional)
  21-40: Job title only, no value proposition
  41-60: Role + some specialization, not compelling
  61-80: Clear role + value prop, could be sharper
  81-100: Role + value + who they help + differentiator
VERDICT THRESHOLDS (must match score exactly):
  Score below 50: verdict = "needs work"
  Score 50-69: verdict = "needs work"
  Score 70-84: verdict = "decent"
  Score 85+: verdict = "strong"
  Only use "strong" when score is 85 or above. Never say "strong" below 85.
RULES:
  - Reference SPECIFIC text from the headline
  - quick_tip: actionable fix in 1 sentence
  - teaser_insight: 1 punchy PG-rated sentence — same safety rules as main pipeline
  - If score is 75+: start with a positive acknowledgment then give the one thing to improve. Keep it direct but constructive.
  - NEVER use profanity, identity references, or cruelty
OUTPUT (strict JSON):
{
  "score": number,
  "verdict": "needs work" or "decent" or "strong",
  "grade": "D" or "C" or "B" or "A",
  "issues": [
    {"issue": "specific problem", "quick_tip": "1-sentence fix"},
    {"issue": "second problem", "quick_tip": "1-sentence fix"}
  ],
  "teaser_insight": "1 witty sentence referencing actual headline text",
  "suggested_headline": "A rewritten version of their headline that scores 85+. Specific, value-driven, uses their actual role/skills.",
  "sample_interview_question": "One behavioral interview question a recruiter would likely ask based on this specific headline. Format: 'Tell me about a time you [specific thing from their headline/role]...'. Must reference their actual role or domain.",
  "subscores": {
    "ats_keywords": 0-100,
    "experience_impact": 0-100,
    "headline_strength": 0-100,
    "overall_readiness": 0-100
  },
  "missing_keywords": ["3-5 keywords recruiters search for that are absent from this headline/role"],
  "sample_improvement": {
    "before": "one weak phrase from their headline or typical resume bullet",
    "after": "the improved version with metrics and power verbs"
  },
  "ranking_percentile": number (what % of profiles score worse — e.g., if score is 40, percentile is ~35)
}
SUBSCORES:
  - ats_keywords: How well would this headline perform in ATS keyword matching? (0-100)
  - experience_impact: Does the headline show measurable impact? (0-100)
  - headline_strength: Overall headline quality against recruiter expectations (0-100)
  - overall_readiness: How job-ready does this profile appear? (0-100)
MISSING KEYWORDS:
  - Based on the role implied by the headline, list 3-5 keywords that recruiters commonly search for but are NOT in this headline
  - Example for "Software Engineer": if missing, suggest "microservices", "CI/CD", "agile", "AWS"
SAMPLE IMPROVEMENT:
  - Take one generic phrase from the headline (or create a typical weak bullet for this role)
  - Rewrite it with specifics, metrics, and power verbs
  - before: "Managed team projects" → after: "Led 8-member team delivering 3 products, reducing deployment time by 40%"
RANKING PERCENTILE:
  - Estimate: if score is 30, percentile is ~25 (bottom 25%)
  - If score is 60, percentile is ~55
  - If score is 80, percentile is ~75 (top 25%)
  - This creates urgency: "Your profile ranks in the bottom 38% of applicants"`;

export async function teaserAnalysis(headline: string): Promise<TeaserResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.2, maxOutputTokens: 2000, thinkingConfig: { thinkingBudget: 0 } } as any,
    });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `${TEASER_SYSTEM}\n\nScore and analyze this LinkedIn headline: ${headline}\nReturn ONLY valid JSON.` }],
      }],
    });

    const text = result.response.text().trim();
    let cleaned = text;
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    try {
      return JSON.parse(cleaned);
    } catch {
      return JSON.parse(jsonrepair(cleaned));
    }
  } catch (err) {
    console.error('Teaser analysis error:', err);
    throw new Error(`Teaser analysis failed: ${(err as Error).message}`);
  }
}

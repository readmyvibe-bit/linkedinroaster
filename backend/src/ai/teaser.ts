import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface TeaserResult {
  score: number;
  verdict: string;
  grade: string;
  issues: Array<{ issue: string; quick_tip: string }>;
  teaser_roast: string;
}

const TEASER_SYSTEM = `LinkedIn headline analyzer. Score and identify top 2 problems.
This is a FREE PREVIEW — punchy, specific, make them want the full roast.
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
  - teaser_roast: 1 punchy PG-rated sentence — same safety rules as main pipeline
  - If score is 75+: start roast with a positive acknowledgment then give the one thing to improve. Keep it funny but frame as refinement not rejection.
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
  "teaser_roast": "1 witty sentence referencing actual headline text"
}`;

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

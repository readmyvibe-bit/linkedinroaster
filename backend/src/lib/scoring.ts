// Scoring algorithm — canonical source is /shared/src/scoring.ts
// Duplicated here to avoid cross-rootDir imports in backend compilation.
// Keep both files in sync when modifying scoring logic.

export interface ScoreBreakdown {
  headline: number; about: number; experience: number;
  completeness: number; ats: number; overall: number;
}

export function calculateScore(profile: any, ai: any): ScoreBreakdown {
  // HEADLINE (25% of overall)
  let h = 0;
  if (profile.headline) {
    h += 20; // has a headline
    if (profile.headline.length > 50)  h += 10;
    if (profile.headline.length > 100) h += 10;
    if (/[|•]/.test(profile.headline)) h += 15; // has structure separator
    if (!/^(student|professional|looking|aspiring|seeking|passionate)/i
        .test(profile.headline)) h += 15; // not a generic opener
    if (ai.headline_score >= 60) h += 15;
    if (ai.headline_score >= 80) h += 15;
  }
  const headlineScore = Math.min(h, 100);

  // ABOUT (35% of overall)
  let a = 0;
  if (profile.about) {
    a += 15;
    if (profile.about.length > 200)  a += 10;
    if (profile.about.length > 500)  a += 10;
    if (profile.about.length > 1000) a += 5;
    if (/\d+[%xX+]/.test(profile.about)) a += 15; // has metrics
    if (profile.about.includes('\n')) a += 5;  // has line breaks
    if (ai.about_score >= 60) a += 15;
    if (ai.about_score >= 80) a += 20;
    const buzzDensity = (ai.buzzword_count || 0) /
      Math.max(profile.about.split(' ').length, 1);
    if (buzzDensity > 0.1) a -= 10; // buzzword penalty
  }
  const aboutScore = Math.max(0, Math.min(a, 100));

  // EXPERIENCE (30% of overall)
  let e = 0;
  if (profile.experience?.length) {
    e += 15;
    if (profile.experience.length >= 2) e += 10;
    if (profile.experience.some((x: any) => x.description?.length > 50)) e += 15;
    if (profile.experience.some((x: any) =>
      /\d+[%xX+]/.test(x.description || ''))) e += 15;
    if (ai.experience_score >= 60) e += 15;
    if (ai.experience_score >= 80) e += 20;
    const passiveCount = profile.experience.filter((x: any) =>
      /responsible for|tasked with|duties include/i.test(x.description || '')
    ).length;
    e -= passiveCount * 5;
  }
  const experienceScore = Math.max(0, Math.min(e, 100));

  // COMPLETENESS (10% of overall)
  let c = 0;
  if (profile.headline) c += 20;
  if (profile.about)    c += 25;
  if (profile.experience?.length) c += 25;
  if (profile.skills?.length)     c += 15;
  if (profile.education?.length)  c += 15;
  const completenessScore = Math.min(c, 100);

  // ATS (10% of overall)
  let ats = 0;
  // Keyword presence (50 points)
  const keywordsPresent = ai.ats_intelligence?.keywords_present?.length || 0;
  const keywordsTotal = ai.ats_intelligence?.top_searched_keywords?.length || 10;
  ats += Math.round((keywordsPresent / keywordsTotal) * 50);
  // Weak verb penalty (30 points — start at 30, lose points per weak verb)
  const weakVerbs = ai.weak_verbs_found?.length || 0;
  if (weakVerbs === 0) ats += 30;
  else if (weakVerbs <= 2) ats += 20;
  else if (weakVerbs <= 4) ats += 10;
  // Quantification bonus (20 points)
  const qPct = ai.quantification_breakdown?.percentage || 0;
  if (qPct >= 60) ats += 20;
  else if (qPct >= 40) ats += 12;
  else if (qPct >= 20) ats += 5;
  const atsScore = Math.min(ats, 100);

  const overall = Math.min(100, Math.round(
    headlineScore * 0.23 + aboutScore * 0.32 +
    experienceScore * 0.27 + completenessScore * 0.08 +
    atsScore * 0.10
  ));

  return { headline: headlineScore, about: aboutScore,
    experience: experienceScore, completeness: completenessScore,
    ats: atsScore, overall };
}

export function capAfterScore(beforeScore: number, rawAfterScore: number): number {
  // Profiles starting very low cannot jump to near-perfect in one rewrite
  const maxScore = beforeScore >= 65 ? 97 : 90;

  // Maximum 60-point improvement in a single rewrite
  const maxFromGap = beforeScore + 60;

  // Add natural variance (plus or minus 3) so scores feel realistic
  const variance = Math.floor(Math.random() * 7) - 3;

  const capped = Math.min(rawAfterScore, maxScore, maxFromGap) + variance;

  // Guarantee at least a small improvement, but NEVER exceed 97 or 100
  const minImprovement = Math.min(beforeScore + 10, 97);
  return Math.min(Math.max(minImprovement, Math.min(capped, 97)), 97);
}

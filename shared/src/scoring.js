"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateScore = calculateScore;
exports.capAfterScore = capAfterScore;
function calculateScore(profile, ai) {
    // HEADLINE (25% of overall)
    let h = 0;
    if (profile.headline) {
        h += 20; // has a headline
        if (profile.headline.length > 50)
            h += 10;
        if (profile.headline.length > 100)
            h += 10;
        if (/[|•]/.test(profile.headline))
            h += 15; // has structure separator
        if (!/^(student|professional|looking|aspiring|seeking|passionate)/i
            .test(profile.headline))
            h += 15; // not a generic opener
        if (ai.headline_score >= 60)
            h += 15;
        if (ai.headline_score >= 80)
            h += 15;
    }
    const headlineScore = Math.min(h, 100);
    // ABOUT (35% of overall)
    let a = 0;
    if (profile.about) {
        a += 15;
        if (profile.about.length > 200)
            a += 10;
        if (profile.about.length > 500)
            a += 10;
        if (profile.about.length > 1000)
            a += 5;
        if (/\d+[%xX+]/.test(profile.about))
            a += 15; // has metrics
        if (profile.about.includes('\n'))
            a += 5; // has line breaks
        if (ai.about_score >= 60)
            a += 15;
        if (ai.about_score >= 80)
            a += 20;
        const buzzDensity = (ai.buzzword_count || 0) /
            Math.max(profile.about.split(' ').length, 1);
        if (buzzDensity > 0.1)
            a -= 10; // buzzword penalty
    }
    const aboutScore = Math.max(0, Math.min(a, 100));
    // EXPERIENCE (30% of overall)
    let e = 0;
    if (profile.experience?.length) {
        e += 15;
        if (profile.experience.length >= 2)
            e += 10;
        if (profile.experience.some((x) => x.description?.length > 50))
            e += 15;
        if (profile.experience.some((x) => /\d+[%xX+]/.test(x.description || '')))
            e += 15;
        if (ai.experience_score >= 60)
            e += 15;
        if (ai.experience_score >= 80)
            e += 20;
        const passiveCount = profile.experience.filter((x) => /responsible for|tasked with|duties include/i.test(x.description || '')).length;
        e -= passiveCount * 5;
    }
    const experienceScore = Math.max(0, Math.min(e, 100));
    // COMPLETENESS (10% of overall)
    let c = 0;
    if (profile.headline)
        c += 20;
    if (profile.about)
        c += 25;
    if (profile.experience?.length)
        c += 25;
    if (profile.skills?.length)
        c += 15;
    if (profile.education?.length)
        c += 15;
    const completenessScore = Math.min(c, 100);
    const overall = Math.round(headlineScore * 0.25 + aboutScore * 0.35 +
        experienceScore * 0.30 + completenessScore * 0.10);
    return { headline: headlineScore, about: aboutScore,
        experience: experienceScore, completeness: completenessScore, overall };
}
function capAfterScore(beforeScore, rawAfterScore) {
    // Profiles starting very low cannot jump to near-perfect in one rewrite
    const maxScore = beforeScore >= 65 ? 97 : 90;
    // Maximum 60-point improvement in a single rewrite
    const maxFromGap = beforeScore + 60;
    // Add natural variance (plus or minus 3) so scores feel realistic
    const variance = Math.floor(Math.random() * 7) - 3;
    const capped = Math.min(rawAfterScore, maxScore, maxFromGap) + variance;
    // Guarantee at least 10-point improvement (rewrite always helps)
    return Math.max(beforeScore + 10, Math.min(capped, 97));
}

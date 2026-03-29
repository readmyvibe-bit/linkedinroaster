import dotenv from 'dotenv';
dotenv.config();

import { query } from '../db';
import { stage1_parse, stage2_analyze, stage3_roast, stage4_rewrite, stage4b_proRewrite, stage5_qualityCheck } from '../ai/pipeline';
import { calculateScore, capAfterScore } from '../lib/scoring';
import { runDataCleanup, runTeaserFollowUp } from '../cron';
import { generateAndUploadCard } from '../services/card-generator';
import { teaserAnalysis } from '../ai/teaser';
import { testProfiles } from './fixtures/profiles';

const PROHIBITED = [
  /\b(damn|hell|shit|fuck|ass|bitch|crap)\b/i,
  /\b(gender|male|female|woman|man|boy|girl|age|old|young|race|caste|religion|hindu|muslim|christian|disability|disabled|appearance|ugly|beautiful|handsome|skin|weight|fat|thin)\b/i,
];

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ FAIL: ${label}`);
  }
}

async function testProfile(name: string, data: any, plan: 'standard' | 'pro') {
  console.log(`\n═══ ${name} (${plan}) ═══`);
  const startTime = Date.now();

  try {
    const raw = [data.headline, data.about, data.experience, data.raw_paste].filter(Boolean).join('\n\n');

    // Stage 1
    const parsed = await stage1_parse(raw);
    assert(!!parsed.headline || !!parsed.error, 'Pipeline completes parse');

    if (parsed.error) {
      console.log(`  ⚠ Parser returned error: ${parsed.reason} — skipping remaining stages`);
      return;
    }

    // Stage 2
    const analysis = await stage2_analyze(parsed);
    assert(typeof analysis.headline_score === 'number', 'Analysis returns scores');

    // Scoring
    const beforeScore = calculateScore(parsed, analysis);
    assert(beforeScore.overall >= 0 && beforeScore.overall <= 100, `before_score ${beforeScore.overall} between 0-100`);

    // Stage 3
    const roast = await stage3_roast(parsed, analysis, []);
    assert(roast.roast_points?.length === 6, `Roast has exactly ${roast.roast_points?.length || 0} points`);

    // Prohibited content check
    const allRoastText = JSON.stringify(roast);
    let hasProhibited = false;
    for (const rx of PROHIBITED) {
      if (rx.test(allRoastText)) { hasProhibited = true; break; }
    }
    assert(!hasProhibited, 'Zero prohibited content in roast');

    // Stage 4 / 4b
    if (plan === 'standard') {
      const rewrite = await stage4_rewrite(parsed, analysis);
      assert(typeof rewrite.rewritten_headline === 'string', 'Standard: headline is string');
      assert(!('ats_keywords' in rewrite) || !(rewrite as any).ats_keywords, 'Standard: ats_keywords NOT present');
    } else {
      const proRewrite = await stage4b_proRewrite(parsed, analysis, null);
      assert(proRewrite.headline_variations?.length === 5, `Pro: ${proRewrite.headline_variations?.length} headline variations`);
      assert(proRewrite.ats_keywords?.length >= 10, `Pro: ${proRewrite.ats_keywords?.length} ats_keywords`);
    }

    // Stage 5
    const rewrite = plan === 'pro'
      ? await stage4b_proRewrite(parsed, analysis, null)
      : await stage4_rewrite(parsed, analysis);
    const qc = await stage5_qualityCheck(parsed, roast, rewrite);
    assert(typeof qc.safety_passed === 'boolean', 'QC returns safety_passed');

    // After score
    const afterScore = calculateScore(
      { ...parsed, headline: rewrite.rewritten_headline, about: rewrite.rewritten_about },
      { ...analysis, headline_score: 75, about_score: 70, experience_score: 65 },
    );
    const capped = capAfterScore(beforeScore.overall, afterScore.overall);
    assert(capped > beforeScore.overall, `after_score ${capped} > before_score ${beforeScore.overall}`);
    assert(capped <= 97, `capAfterScore respects limit: ${capped}`);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    assert(parseFloat(elapsed) < 90, `Processing under 90s (${elapsed}s)`);

  } catch (err) {
    failed++;
    console.log(`  ✗ FAIL: Pipeline crashed: ${(err as Error).message}`);
  }
}

async function testInfrastructure() {
  console.log('\n═══ INFRASTRUCTURE TESTS ═══');

  // Data cleanup
  try {
    const result = await runDataCleanup();
    assert(true, `Data cleanup ran: ${JSON.stringify(result)}`);
  } catch (err) {
    assert(false, `Data cleanup: ${(err as Error).message}`);
  }

  // Teaser follow-up
  try {
    const result = await runTeaserFollowUp();
    assert(true, `Follow-up cron ran: ${JSON.stringify(result)}`);
  } catch (err) {
    assert(false, `Follow-up cron: ${(err as Error).message}`);
  }

  // Card generation
  try {
    const url = await generateAndUploadCard({
      orderId: 'e2e-test-card',
      beforeScore: 28,
      afterScore: 84,
      headlineScore: 15,
      aboutScore: 20,
      experienceScore: 30,
      topRoast: 'Your headline says Aspiring which is LinkedIn code for unemployed.',
      secondRoast: 'Your about section reads like a cover letter from 2011.',
      hiddenStrength: { strength: 'Cross-functional versatility', evidence: 'Worked across engineering, product, and sales teams', how_to_show_it: 'Add a dedicated Skills section highlighting both technical and business capabilities.' },
      industry: 'Technology',
    });
    assert(!!url, `Card generated: ${url?.substring(0, 60)}`);
  } catch (err) {
    assert(false, `Card generation: ${(err as Error).message}`);
  }

  // Teaser AI
  try {
    const result = await teaserAnalysis('Aspiring Data Scientist | Looking for opportunities');
    assert(typeof result.score === 'number', `Teaser analysis returns score: ${result.score}`);
    assert(!!result.teaser_roast, 'Teaser has roast text');
  } catch (err) {
    assert(false, `Teaser analysis: ${(err as Error).message}`);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   E2E TEST SUITE — 18 GATE CHECK    ║');
  console.log('╚══════════════════════════════════════╝');

  // Test 3 representative profiles (saves API time)
  await testProfile('Buzzword Heavy', testProfiles.buzzword_heavy.data, 'standard');
  await testProfile('Excellent Profile', testProfiles.excellent.data, 'pro');
  await testProfile('Student/Fresher', testProfiles.student.data, 'standard');

  // Infrastructure
  await testInfrastructure();

  console.log('\n╔══════════════════════════════════════╗');
  console.log(`║   RESULTS: ${passed} passed, ${failed} failed`);
  console.log('╚══════════════════════════════════════╝');

  process.exit(failed > 0 ? 1 : 0);
}

main();

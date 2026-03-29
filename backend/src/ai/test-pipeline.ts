import dotenv from 'dotenv';
dotenv.config();

import { stage1_parse, stage2_analyze, stage3_roast } from './pipeline';

const SAMPLE_PROFILE = `
Aspiring Data Scientist | Looking for opportunities | Passionate about AI

About:
I am a passionate and motivated individual looking for opportunities in the field of data science.
I am a quick learner and team player with excellent communication skills.
I am proficient in Python, R, and SQL. I love solving problems and working with data.
I believe in continuous learning and am always looking to grow.

Experience:
Data Science Intern - TechCorp (6 months)
- Responsible for cleaning data and creating reports
- Tasked with building dashboards using Tableau
- Worked on various machine learning projects
- Assisted the team with day-to-day tasks

Junior Analyst - DataWorks (1 year)
- Responsible for maintaining databases
- Created weekly reports for stakeholders
- Participated in team meetings and brainstorming sessions

Education:
B.Tech in Computer Science - State University, 2023

Skills:
Python, R, SQL, Excel, Tableau, Machine Learning, Deep Learning, NLP,
Communication Skills, Team Player, Problem Solving, Quick Learner
`;

const PROHIBITED_TERMS = [
  // profanity
  /\b(damn|hell|shit|fuck|ass|bitch|crap)\b/i,
  // identity references
  /\b(gender|male|female|woman|man|boy|girl|age|old|young|race|caste|religion|hindu|muslim|christian|disability|disabled|appearance|ugly|beautiful|handsome|skin|weight|fat|thin)\b/i,
];

async function runTests() {
  console.log('═══ STAGE 1 — Parse ═══');
  let parsed;
  try {
    parsed = await stage1_parse(SAMPLE_PROFILE);
    console.log('✓ headline:', parsed.headline);
    console.log('✓ detected_seniority:', parsed.detected_seniority);
    console.log('✓ detected_industry:', parsed.detected_industry);
    console.log('✓ word_count:', parsed.word_count);
    console.log('✓ skills count:', parsed.skills?.length);
    if (!parsed.headline) throw new Error('headline is null');
    console.log('STAGE 1 PASSED\n');
  } catch (err) {
    console.error('STAGE 1 FAILED:', (err as Error).message);
    process.exit(1);
  }

  console.log('═══ STAGE 2 — Analyze ═══');
  let analysis;
  try {
    analysis = await stage2_analyze(parsed);
    console.log('✓ headline_score:', analysis.headline_score);
    console.log('✓ about_score:', analysis.about_score);
    console.log('✓ experience_score:', analysis.experience_score);
    console.log('✓ overall_score:', analysis.overall_score);
    console.log('✓ buzzword_count:', analysis.buzzword_count);
    console.log('✓ buzzwords_found:', analysis.buzzwords_found);
    console.log('✓ top_3_problems:', analysis.top_3_problems);
    if (analysis.buzzword_count <= 0) throw new Error('buzzword_count should be > 0');
    console.log('STAGE 2 PASSED\n');
  } catch (err) {
    console.error('STAGE 2 FAILED:', (err as Error).message);
    process.exit(1);
  }

  console.log('═══ STAGE 3 — Roast ═══');
  try {
    const roast = await stage3_roast(parsed, analysis, []);
    console.log('✓ roast_title:', roast.roast_title);
    console.log('✓ roast_points count:', roast.roast_points?.length);
    if (roast.roast_points?.length !== 6) throw new Error(`Expected 6 roast points, got ${roast.roast_points?.length}`);

    for (const point of roast.roast_points) {
      console.log(`  Point ${point.point_number}: [${point.humor_mechanism}] ${point.section_targeted}`);
      if (!point.roast) throw new Error(`Point ${point.point_number} missing roast text`);
      if (!point.underlying_issue) throw new Error(`Point ${point.point_number} missing underlying_issue`);
    }

    console.log('✓ closing_compliment:', roast.closing_compliment?.substring(0, 80) + '...');
    console.log('✓ overall_verdict:', roast.overall_verdict?.substring(0, 80) + '...');

    // Check for prohibited content
    const allText = JSON.stringify(roast);
    for (const regex of PROHIBITED_TERMS) {
      const match = allText.match(regex);
      if (match) {
        throw new Error(`PROHIBITED CONTENT found: "${match[0]}"`);
      }
    }
    console.log('✓ No prohibited content found');

    // Check unique humor mechanisms
    const mechanisms = roast.roast_points.map(p => p.humor_mechanism);
    const unique = new Set(mechanisms);
    console.log(`✓ Unique humor mechanisms: ${unique.size}/6 (${[...unique].join(', ')})`);

    console.log('STAGE 3 PASSED\n');
  } catch (err) {
    console.error('STAGE 3 FAILED:', (err as Error).message);
    process.exit(1);
  }

  console.log('═══ ALL TESTS PASSED ═══');
  process.exit(0);
}

runTests();

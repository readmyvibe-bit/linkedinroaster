import Anthropic from '@anthropic-ai/sdk';
import { query } from '../db';
import { jsonrepair } from 'jsonrepair';
import { validateResumeData } from './resume-validator';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export interface ResumeInput {
  orderId: string;
  userDetails: {
    name: string; email: string; phone: string;
    location: string; linkedin: string; website?: string;
  };
  targetRole: string;
  targetCompany?: string;
  jobDescription: string;
  additionalAchievements?: string;
  certifications?: string[];
  languages?: string[];
  experienceYears?: string;
  uploadedResumeText?: string;
  templateId?: string;
  pageCount?: number;
}

export async function generateResume(input: ResumeInput): Promise<{ resumeId: string; ats_score: number }> {
  // 1. Fetch order data — check both orders and build_orders tables
  let order: any = null;
  let orderSource: 'rewrite' | 'build' = 'rewrite';

  const orderResult = await query('SELECT * FROM orders WHERE id=$1', [input.orderId]);
  if (orderResult.rows.length) {
    order = orderResult.rows[0];
    orderSource = 'rewrite';
  } else {
    const buildResult = await query('SELECT * FROM build_orders WHERE id=$1', [input.orderId]);
    if (buildResult.rows.length) {
      order = buildResult.rows[0];
      orderSource = 'build';
    }
  }
  if (!order) throw new Error('Order not found');

  // Quota: starter=0, student=1, standard=5, pro=10 (build & rewrite)
  const maxResumes = orderSource === 'build'
    ? (order.plan === 'pro' ? 10 : order.plan === 'standard' ? 5 : order.plan === 'plus' ? 5 : order.plan === 'student' ? 1 : 0)
    : (order.plan === 'pro' ? 10 : 5);
  if (maxResumes === 0) {
    throw new Error('Resume not included in Starter plan. Upgrade to Student, Standard, or Pro.');
  }
  const existingCount = await query('SELECT COUNT(*)::int AS cnt FROM resumes WHERE order_id=$1', [input.orderId]);
  if (existingCount.rows[0].cnt >= maxResumes) {
    throw new Error('Resume limit reached. Upgrade for more resumes.');
  }
  if (order.processing_status !== 'done') throw new Error('Order not completed');

  // For build orders, construct rewrite-like data from generated_profile
  let rewrite: any;
  let analysis: any;
  if (orderSource === 'build') {
    const profile = order.generated_profile;
    if (!profile) throw new Error('Profile not generated yet');
    rewrite = {
      rewritten_headline: profile.headline_variations?.[0]?.text || '',
      rewritten_about: profile.about || '',
      rewritten_experience: (profile.experience || []).map((e: any) => ({
        title: e.role, company: e.company, bullets: e.bullets || [], changes_made: e.changes_made || '',
      })),
      ats_keywords: [...(profile.skills?.technical || []), ...(profile.skills?.tools || [])],
    };
    analysis = {};
  } else {
    rewrite = order.rewrite;
    analysis = order.analysis;
    if (!rewrite) throw new Error('No rewrite data found');
  }

  // 2. Gather all data sources
  const parsed = orderSource === 'build'
    ? {
        experience: (order.generated_profile?.experience || []).map((e: any) => ({
          title: e.role, company: e.company, duration: e.duration, description: e.bullets?.join('. ') || '',
        })),
        education: order.form_input?.education || [],
        skills: [...(order.generated_profile?.skills?.technical || []), ...(order.generated_profile?.skills?.soft || [])],
      }
    : (order.parsed_profile || {});
  // Check for uploaded resume data in the resumes table (previous upload)
  const uploadedCheck = await query(
    'SELECT uploaded_resume_text FROM resumes WHERE order_id=$1 AND uploaded_resume_text IS NOT NULL ORDER BY created_at DESC LIMIT 1',
    [input.orderId],
  );
  const uploadedResumeText = input.uploadedResumeText || uploadedCheck.rows[0]?.uploaded_resume_text || '';

  // 2b. Build prompt with ALL data sources
  const prompt = `Build a complete ATS optimized resume by MERGING these data sources.

TARGET ROLE: ${input.targetRole}
${input.targetCompany ? `TARGET COMPANY: ${input.targetCompany}` : ''}

═══ SOURCE 1: LINKEDIN REWRITE (AI-optimized bullets — use these for top 2 roles) ═══
Headline: ${rewrite.rewritten_headline || ''}
About: ${rewrite.rewritten_about || ''}
Experience: ${JSON.stringify(rewrite.rewritten_experience || [])}
ATS Keywords: ${JSON.stringify(rewrite.ats_keywords || [])}

═══ SOURCE 2: ORIGINAL LINKEDIN PROFILE (has education + full career history) ═══
Education: ${JSON.stringify(parsed.education || [])}
Full Experience: ${JSON.stringify(parsed.experience || [])}
Skills: ${JSON.stringify(parsed.skills || [])}
Achievements / honors (if present in profile): ${JSON.stringify((parsed as any).achievements || [])}

═══ SOURCE 3: UPLOADED RESUME (user's own resume — most accurate personal data) ═══
${uploadedResumeText ? uploadedResumeText.slice(0, 4000) : 'No uploaded resume.'}

═══ MERGE RULES (CRITICAL) ═══
1. EDUCATION: Use EXACT education from Source 2 or Source 3. NEVER invent education. Copy degree name, institution name, and dates exactly as stated.
2. EXPERIENCE: Use AI-rewritten bullets from Source 1 for top roles. For older roles not in Source 1, use Source 2 or Source 3 data.
3. INCLUDE ALL JOBS: If Source 3 has more jobs than Source 1, include them all. Do not skip any employment.
4. PERSONAL INFO: Use Source 3 for name, phone, email if available. Fall back to user-provided details.
5. SKILLS: ONLY include skills that the user actually has — from Source 1, Source 2, or Source 3. NEVER add skills from the job description that the user has not listed. If the JD mentions "API Management" but the user has never listed it, do NOT add it. This is critical — fabricating skills the user doesn't have is dishonest and will fail in interviews.
6. ACHIEVEMENTS (CRITICAL): You MUST populate the JSON "achievements" array with every distinct award, honor, recognition, certification milestone, or key win stated in Source 2, Source 3, or Additional Achievements below — unless that exact text is already duplicated verbatim in a work bullet. If no such items exist in any source, use []. Never drop a real achievement to save space; shorten bullets elsewhere first.
7. NEVER FABRICATE: Do not invent any degree, institution, company, achievement, certification, or SKILL not explicitly stated in any source. If no certifications exist in any source, return an empty certifications array. Do NOT guess or generate certifications. Do NOT add technical skills from the JD that the user doesn't have.

CONTACT INFO:
Name: ${input.userDetails.name}
Email: ${input.userDetails.email}
Phone: ${input.userDetails.phone}
Location: ${input.userDetails.location}
LinkedIn: ${input.userDetails.linkedin}
${input.userDetails.website ? `Website: ${input.userDetails.website}` : ''}
${input.additionalAchievements ? `Additional Achievements: ${input.additionalAchievements}` : ''}
${input.certifications?.length ? `Certifications: ${input.certifications.join(', ')}` : ''}
${input.languages?.length ? `Languages: ${input.languages.join(', ')}` : ''}
${input.experienceYears ? `Total Experience: ${input.experienceYears}` : ''}

JOB DESCRIPTION:
${input.jobDescription}

STRICT ATS RULES:
1. No tables, no columns, no text boxes, no graphics
2. Standard section headers: PROFESSIONAL SUMMARY, WORK EXPERIENCE, EDUCATION, SKILLS, and KEY ACHIEVEMENTS (or ACHIEVEMENTS) when any awards, honors, or standout wins exist in any source. KEY ACHIEVEMENTS is mandatory whenever Source 2, Source 3, or Additional Achievements lists items not already fully covered by experience bullets.
3. All dates in MMM YYYY format (e.g., Jan 2020 - Present)
4. Every bullet starts with a strong action verb
5. Every bullet must include a metric, number, or measurable outcome
6. Keywords from JD may appear naturally in summary and bullets WHERE the user has relevant experience — but NEVER add JD keywords as skills the user doesn't actually have. Only match JD keywords to skills the user already listed.
7. Summary is 3-4 sentences maximum
8. Skills grouped by category
9. PAGE LENGTH RULES (CRITICAL):
   - 2 or fewer jobs: MUST fit on 1 page. Use 3 bullets per job max. Summary: 2 sentences. Be very concise.
   - 3 jobs: MUST fit on 1 page. Use 3 bullets per job. Summary: 2-3 sentences. Cut older role to 2 bullets if needed.
   - 4+ jobs: Use 2 pages. Most recent 2 roles: 4 bullets. Older roles: 2 bullets max.
   - NEVER let 1-3 lines spill to a second page. Either cut content to fit 1 page or add enough for a proper 2nd page.
   - Skills section: comma-separated on 1-2 lines, not one skill per line.
   - WORD LIMIT: For 1-page resumes, target 500-650 words total. Hard cap 750 words. Count everything: summary, bullets, skills, education.
   - Each bullet: max 1.5 lines when printed (roughly 15-20 words). No 3-line bullets.
   - Education: 1 line per entry (degree — institution — year). No descriptions unless PhD/research.
10. Use exact company names and job titles from the LinkedIn data

FRESHER / STUDENT RULES (when candidate has 0-1 work experience entries):
- CAREER OBJECTIVE: Add a "CAREER OBJECTIVE" section at the very top (before summary). Write 2-3 sentences about what the fresher wants to achieve in their target role/industry. Make it specific to the target role, not generic.
- Summary: 3-4 sentences (not 2). Highlight education, skills, projects, and career objective.
- Projects section: MANDATORY. Expand each project with 4-5 bullets including tech stack, what was built, impact/outcome.
- If only 1 project exists, generate 5-6 DETAILED bullets covering: (a) what was built and its purpose, (b) full tech stack used, (c) who it was built for or what audience, (d) what problem it solved, (e) measurable outcome or result, (f) any deployment or real-world usage.
- Education: EXPANDED format — include degree, institution, year, GPA/percentage, AND a "Relevant Coursework" subsection listing 4-6 subjects directly relevant to the target role.
- Skills section: display in 2-COLUMN CATEGORY FORMAT — "Technical Skills" category on one side (programming languages, frameworks, databases) and "Soft Skills" category on the other (communication, teamwork, leadership). List tools separately.
- Add a "RELEVANT COURSEWORK" or "ACADEMIC PROJECTS" section if needed to fill the page.
- Skills: list ALL skills with categories (Technical, Tools, Soft Skills, Languages).
- Target 400-550 words to fill the page properly. Do NOT make it sparse.
- Use section headers: CAREER OBJECTIVE, PROFESSIONAL SUMMARY, EDUCATION, PROJECTS, SKILLS, ACHIEVEMENTS (if any).
- Do NOT use "WORK EXPERIENCE" header if there's no real work — use "PROJECTS & EXPERIENCE" instead.
- If NO job description is provided (general resume): use the target role to infer relevant keywords, typical requirements, and structure the resume around that role's common expectations. For example, if target role is "Frontend Developer", emphasize HTML/CSS/JS projects, UI/UX skills, and responsive design even if not explicitly in a JD.

FRESHER RESUME MUST LOOK PROFESSIONAL AND COMPLETE:
- The resume MUST fill the ENTIRE A4 page. A half-empty or 60% filled resume is UNACCEPTABLE.
- Target word count: 450-600 words minimum. Count everything.
- ALWAYS include ALL of these sections even if data is limited:
  a) CAREER OBJECTIVE (3 sentences: what role, what value you bring, what you want to learn)
  b) EDUCATION with Relevant Coursework (list 6 subjects, not just degree name)
  c) PROJECTS section with 5-6 bullets per project (tech stack, problem, solution, outcome)
  d) TECHNICAL SKILLS in categories: Programming Languages, Frameworks, Databases, Tools, Operating Systems
  e) SOFT SKILLS: list 5-6 with brief context (e.g., "Team Collaboration — worked in 4-member project team")
  f) CERTIFICATIONS / ONLINE COURSES (if any mentioned in profile)
  g) EXTRACURRICULAR ACTIVITIES (if any mentioned)
  h) LANGUAGES KNOWN

- For the SKILLS section specifically:
  Generate TWO skill subsections: "Technical Skills" and "Soft Skills"
  CRITICAL: ONLY list skills that appear in the candidate's profile data (Source 1, 2, or 3).
  If the candidate listed "Java, OOP, Database Management" — list ONLY those.
  Do NOT add Eclipse, NetBeans, Git, Backend Development, or ANY skill not explicitly stated by the candidate.
  If the candidate has very few skills, that is OK — list only what they have. Do NOT pad with guessed skills.

- For EDUCATION:
  Format: "B.Tech in Information Technology | SVPCET, Puttur | 2009-2013 | CGPA: 6.9/10"
  Below: "Relevant Coursework: Data Structures, Object-Oriented Programming, Database Management Systems, Software Engineering, Computer Networks, Operating Systems"

- The overall structure for a fresher resume should be:
  1. CAREER OBJECTIVE
  2. EDUCATION (with coursework)
  3. PROJECTS & EXPERIENCE (detailed bullets)
  4. TECHNICAL SKILLS
  5. SOFT SKILLS
  6. ACHIEVEMENTS (if any)
  7. CERTIFICATIONS (if any)
  8. LANGUAGES KNOWN

KEYWORD ANALYSIS:
Extract ALL important keywords from the job description.
For each, note whether it appears in the resume content.
Provide 3-5 specific recommendations to improve the score.

Before returning JSON: fill "achievements" with every honor, award, recognition, or standout win from Sources 1–3 and Additional Achievements that is not already fully repeated as an experience bullet. Use [] only when no such items exist in any source.

Return ONLY valid JSON with this exact structure:
{
  "contact": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "website": "" },
  "summary": "3-4 sentence professional summary",
  "experience": [
    { "id": "exp-1", "company": "", "role": "", "location": "", "start_date": "", "end_date": "", "current": false, "bullets": [] }
  ],
  "education": [
    { "id": "edu-1", "institution": "", "degree": "", "field": "", "year": "", "gpa": "" }
  ],
  "skills": { "technical": [], "soft": [], "languages": [], "certifications": [] },
  "achievements": [],
  "custom_sections": [],
  "ats_analysis": {
    "score": 0,
    "keywords_matched": [],
    "keywords_missing": [],
    "recommendations": []
  }
}`;

  // 3. Call Claude
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [
      { role: 'user', content: prompt },
    ],
    system: 'You are an expert ATS resume writer with 15 years experience. Return ONLY valid JSON. No markdown. No explanation.',
  });

  let text = (response.content[0] as any).text || '';
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let resumeData: any;
  try {
    resumeData = JSON.parse(text);
  } catch {
    resumeData = JSON.parse(jsonrepair(text));
  }

  // Merge achievements from sources if the model omitted them
  const parsedAch = Array.isArray((parsed as any).achievements)
    ? (parsed as any).achievements.map((x: any) => (typeof x === 'string' ? x : String(x))).filter(Boolean)
    : [];
  const fromAdditional = input.additionalAchievements
    ? input.additionalAchievements.split(/\n|•|;/).map(s => s.trim()).filter(Boolean)
    : [];
  const aiAch = Array.isArray(resumeData.achievements)
    ? resumeData.achievements.map((x: any) => String(x).trim()).filter(Boolean)
    : [];
  const mergedAch = [...new Set([...aiAch, ...parsedAch, ...fromAdditional])];
  if (mergedAch.length) resumeData.achievements = mergedAch;

  // 4. Extract ATS analysis
  const atsAnalysis = resumeData.ats_analysis || { score: 0, keywords_matched: [], keywords_missing: [], recommendations: [] };
  delete resumeData.ats_analysis;

  // 5. Generate cover letter (only if JD provided)
  const hasJobDescription = input.jobDescription && input.jobDescription.trim().length > 20;
  let coverLetter = '';

  if (hasJobDescription) {
    const coverLetterResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Write a professional cover letter for this job application.

APPLICANT: ${input.userDetails.name}
TARGET ROLE: ${input.targetRole}
${input.targetCompany ? `TARGET COMPANY: ${input.targetCompany}` : ''}

APPLICANT BACKGROUND (from LinkedIn):
${rewrite.rewritten_headline || ''}
${rewrite.rewritten_about || ''}

JOB DESCRIPTION:
${input.jobDescription}

CRITICAL RULES:
- 3-4 paragraphs: Opening hook → Why this role → Proof of impact → Call to action
- Reference specific requirements from the JD
- ONLY use achievements and metrics that appear in the applicant background above. Do NOT invent numbers, percentages, revenue figures, or any metrics not explicitly stated.
- If background lacks specific numbers, describe impact qualitatively instead of fabricating metrics.
- Professional but confident tone — not generic
- Do NOT start with "I am writing to apply for"
- Do NOT use "Dear Hiring Manager" — use "Dear ${input.targetCompany || 'Hiring'} Team"
- Maximum 350 words
- End with a specific call to action

Return ONLY the cover letter text. No JSON. No formatting markers.`,
      }],
      system: 'You are an expert career coach who writes compelling cover letters. NEVER fabricate achievements, numbers, or metrics. Only use facts from the provided background.',
    });

    coverLetter = ((coverLetterResponse.content[0] as any).text || '').trim();
  }

  // 6. Validate AI output
  const validation = validateResumeData(resumeData);
  if (!validation.valid) {
    console.warn(`[resume-generator] Validation failed for order ${input.orderId}: ${validation.errors.join('; ')}`);
    // Don't block — save with warnings logged. Resume data is still usable.
  }
  if (validation.warnings.length > 0) {
    console.log(`[resume-generator] Warnings for order ${input.orderId}: ${validation.warnings.join('; ')}`);
  }

  // 7. Save to DB
  const result = await query(
    `INSERT INTO resumes (order_id, email, job_description, target_role, target_company, template_id, page_count, resume_data, ats_score, keywords_matched, keywords_missing, recommendations, cover_letter, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'generated')
     RETURNING id`,
    [
      input.orderId, input.userDetails.email, input.jobDescription,
      input.targetRole, input.targetCompany || null,
      input.templateId || 'classic', input.pageCount || 2,
      JSON.stringify(resumeData), atsAnalysis.score,
      JSON.stringify(atsAnalysis.keywords_matched),
      JSON.stringify(atsAnalysis.keywords_missing),
      JSON.stringify(atsAnalysis.recommendations),
      coverLetter,
    ],
  );

  return { resumeId: result.rows[0].id, ats_score: atsAnalysis.score };
}

// ─── Parse uploaded resume text into structured data ───
export async function parseUploadedResume(text: string): Promise<any> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Extract structured data from this resume text. Return ONLY valid JSON.

RESUME TEXT:
${text.slice(0, 8000)}

Return this exact JSON structure:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin": "",
  "website": "",
  "summary": "",
  "experience": [
    { "role": "", "company": "", "location": "", "start_date": "", "end_date": "", "bullets": [] }
  ],
  "education": [
    { "institution": "", "degree": "", "field": "", "year": "" }
  ],
  "skills": [],
  "certifications": [],
  "languages": [],
  "achievements": []
}`,
    }],
    system: 'You are a resume parser. Extract all information accurately. Return ONLY valid JSON.',
  });

  let rText = ((response.content[0] as any).text || '').trim();
  if (rText.startsWith('```')) {
    rText = rText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  try {
    return JSON.parse(rText);
  } catch {
    return JSON.parse(jsonrepair(rText));
  }
}

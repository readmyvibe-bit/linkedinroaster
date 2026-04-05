/**
 * Test fixtures for interview prep unit tests.
 * Each fixture simulates a different candidate profile scenario.
 */

// ─── Resume Data Fixtures (what comes from resume_data JSONB) ───

export const FRESHER_RESUME = {
  contact: { name: 'Priya Sharma', email: 'priya@gmail.com', phone: '9876543210' },
  experience: [],
  skills: ['Python', 'JavaScript', 'React', 'SQL', 'Git'],
  education: [
    { degree: 'B.Tech', field: 'Computer Science', institution: 'IIT Delhi', year: '2024' },
  ],
  summary: 'Recent computer science graduate with strong foundation in web development and data structures.',
};

export const SINGLE_JOB_10YR = {
  contact: { name: 'Rajesh Kumar', email: 'rajesh@company.com' },
  experience: [
    {
      title: 'Software Engineer',
      company: 'Infosys',
      start_date: 'January 2014',
      end_date: 'Present',
      bullets: [
        'Built microservices serving 2M+ requests daily',
        'Led migration from monolith to microservices architecture',
        'Mentored team of 5 junior developers',
        'Reduced deployment time by 60% with CI/CD pipeline',
      ],
    },
  ],
  skills: [
    { category: 'Backend', skills: ['Java', 'Spring Boot', 'Kubernetes'] },
    { category: 'Frontend', skills: ['React', 'TypeScript'] },
  ],
  education: [
    { degree: 'B.E.', field: 'IT', institution: 'VJTI Mumbai', year: '2013' },
  ],
  summary: 'Experienced software engineer with 10 years at Infosys specializing in microservices and cloud.',
};

export const MANY_SHORT_JOBS = {
  contact: { name: 'Amit Patel' },
  experience: [
    { title: 'Frontend Developer', company: 'Startup A', start_date: 'Jan 2023', end_date: 'Jun 2023', bullets: ['Built dashboard with React'] },
    { title: 'React Developer', company: 'Startup B', start_date: 'Jul 2022', end_date: 'Dec 2022', bullets: ['Implemented UI components'] },
    { title: 'Junior Developer', company: 'Startup C', start_date: 'Jan 2022', end_date: 'Jun 2022', bullets: ['Fixed bugs and wrote tests'] },
    { title: 'Intern', company: 'TCS', start_date: 'Jul 2021', end_date: 'Dec 2021', bullets: ['Learned Java and Spring Boot'] },
  ],
  skills: ['React', 'JavaScript', 'CSS', 'HTML'],
  education: [{ degree: 'BCA', institution: 'Mumbai University', year: '2021' }],
  summary: '',
};

export const SENIOR_TITLES = {
  contact: { name: 'Deepika Verma', email: 'deepika@tech.com' },
  experience: [
    { title: 'Senior Engineering Manager', company: 'Google', start_date: 'March 2020', end_date: 'Present', bullets: ['Managed 3 teams (25 engineers)', 'Delivered search quality improvements (+3% relevance)', 'Drove $4M cost optimization initiative'] },
    { title: 'Engineering Manager', company: 'Flipkart', start_date: 'June 2016', end_date: 'February 2020', bullets: ['Scaled platform to 100M+ users', 'Hired and grew team from 5 to 18'] },
    { title: 'Senior Software Engineer', company: 'Amazon', start_date: 'August 2012', end_date: 'May 2016', bullets: ['Built distributed order processing system', 'Reduced latency by 40%'] },
  ],
  skills: { 'Technical': ['System Design', 'Java', 'Python', 'AWS', 'Kubernetes'], 'Leadership': ['People Management', 'Strategy', 'P&L'] },
  education: [
    { degree: 'M.Tech', field: 'CS', institution: 'IISc Bangalore', year: '2012' },
    { degree: 'B.Tech', field: 'CS', institution: 'NIT Trichy', year: '2010' },
  ],
  summary: 'Engineering leader with 12+ years across Google, Flipkart, Amazon. Expertise in scaling platforms and building high-performance teams.',
};

export const INTERN_PROFILE = {
  contact: { name: 'Rohan Jain' },
  experience: [
    { title: 'Summer Intern', company: 'Wipro', dates: 'May 2024 - Jul 2024', bullets: ['Assisted in testing web application'] },
  ],
  skills: 'Java, HTML, CSS',  // string instead of array — edge case
  education: [{ degree: 'B.Tech', field: 'CSE', school: 'VIT Vellore', dates: '2021-2025' }],
  summary: 'Aspiring software developer currently in final year.',
};

export const EMPTY_RESUME = {
  contact: {},
  experience: [],
  skills: [],
  education: [],
  summary: '',
};

export const MISSING_DATES_RESUME = {
  contact: { name: 'Unknown Candidate' },
  experience: [
    { title: 'Developer', company: 'SomeCompany', bullets: ['Did some work'] },
    { role: 'Analyst', company: 'OtherCompany', start_date: '', end_date: '', bullets: [] },
  ],
  skills: [],
  education: [],
  summary: 'A developer',
};

export const NESTED_SKILLS_RESUME = {
  contact: { name: 'Nested Skills Person' },
  experience: [
    { title: 'Full Stack Developer', company: 'TechCorp', start_date: 'Jan 2020', end_date: 'Dec 2023', bullets: ['Built APIs', 'Managed databases'] },
  ],
  skills: [
    { label: 'Programming', items: ['Python', 'Go', 'Rust'] },
    { category: 'Cloud', skills: ['AWS', 'GCP'] },
    { label: 'Tools' },  // no skills/items array
  ],
  education: [],
  summary: 'Full stack developer with cloud expertise.',
};

// ─── Resume Row Fixtures (what comes from resumes table) ───

export const RESUME_WITH_JD = {
  id: '00000000-0000-0000-0000-000000000001',
  order_id: 'order-001',
  target_role: 'Senior Software Engineer',
  target_company: 'Google India',
  job_description: `Senior Software Engineer - Google India

We are looking for a Senior Software Engineer with 5+ years of experience in distributed systems.

Requirements:
- 5+ years of experience in software engineering
- Strong proficiency in Java, Python, or Go
- Experience with distributed systems and microservices
- Experience leading technical projects and mentoring junior engineers
- Strong problem-solving and system design skills

Nice to have:
- Experience with Kubernetes and cloud platforms (GCP preferred)
- Published papers or open source contributions
- M.Tech or PhD in Computer Science

This is a senior individual contributor role with leadership expectations.
Compensation: competitive + RSUs + benefits`,
};

export const RESUME_NO_JD = {
  id: '00000000-0000-0000-0000-000000000002',
  order_id: 'order-002',
  target_role: 'Frontend Developer',
  target_company: '',
  job_description: '',
};

export const RESUME_SHORT_JD = {
  id: '00000000-0000-0000-0000-000000000003',
  order_id: 'order-003',
  target_role: 'Data Analyst',
  target_company: 'Flipkart',
  job_description: 'Looking for a data analyst with SQL skills.',  // < 50 chars
};

export const RESUME_INVALID_COMPANY = {
  id: '00000000-0000-0000-0000-000000000004',
  order_id: 'order-004',
  target_role: 'Developer',
  target_company: 'Company name must be at least 2 characters',
  job_description: '',
};

export const RESUME_INTERN_JD = {
  id: '00000000-0000-0000-0000-000000000005',
  order_id: 'order-005',
  target_role: 'Software Intern',
  target_company: 'TCS',
  job_description: `Software Engineering Intern Position - TCS

We are hiring freshers and final year students for our entry-level internship program.
No prior experience required. Training will be provided.
Duration: 6 months with possibility of full-time conversion.
Stipend: Rs 15,000/month`,
};

export const RESUME_LEAD_JD = {
  id: '00000000-0000-0000-0000-000000000006',
  order_id: 'order-006',
  target_role: 'VP of Engineering',
  target_company: 'Razorpay',
  job_description: `Vice President of Engineering - Razorpay

We are looking for a VP of Engineering to lead our payments infrastructure org.
10+ years of experience required with at least 5 years in senior leadership roles.
Must have experience managing 50+ engineers and multiple directors.
P&L ownership experience preferred.
Strong background in fintech, payments, or banking technology.
Must have experience with board-level presentations and strategic planning.`,
};

// ─── Order Fixtures ───

export const ORDER_WITH_JD = {
  id: 'order-001',
  job_description: 'Fallback JD from order — should not be used when resume has JD',
};

export const ORDER_NO_JD = {
  id: 'order-002',
  job_description: '',
};

// ─── Prep Data Fixtures (for validatePrepData) ───

function makeQuestion(id: number, category: string, valid = true, withJd = false): any {
  if (!valid) return { id, category, question: '...' };
  return {
    id,
    category,
    question: `Tell me about a time you demonstrated ${category} skills in a challenging project situation?`,
    why_they_ask: 'To assess your problem-solving approach',
    ...(withJd ? {
      jd_themes: ['distributed systems', 'problem-solving'],
      why_for_this_role: 'This role requires handling production incidents in a distributed microservices environment, making crisis management experience critical.',
    } : {}),
    suggested_answer: {
      situation: 'At my previous company, we faced a critical production outage that affected 10K users during peak hours.',
      task: 'I was responsible for identifying the root cause and coordinating the fix across three teams.',
      action: 'I set up a war room, analyzed logs, identified a database connection pool leak, and deployed a hotfix within 2 hours.',
      result: 'Successfully resolved the outage, implemented connection pool monitoring, and reduced similar incidents by 90%.',
    },
    common_mistakes: ['Being too vague about your specific contribution', 'Not mentioning measurable outcomes'],
    follow_ups: ['How did you prevent this from happening again?', 'What would you do differently?'],
  };
}

function makeMCQ(valid = true): any {
  if (!valid) return { question: '...', options: ['A'], correct: 0 };
  return {
    question: 'In a microservices architecture, what is the primary purpose of an API gateway?',
    options: [
      'To route requests and handle cross-cutting concerns',
      'To store data in a distributed cache',
      'To compile source code into executables',
      'To manage version control repositories',
    ],
    correct: 0,
    explanation: 'API gateways handle routing, authentication, rate limiting, and other cross-cutting concerns.',
    jd_link: 'Relevant to distributed systems design',
  };
}

export const PERFECT_PREP_DATA = {
  company_brief: {
    what_jd_emphasizes: ['distributed systems', 'leadership', 'problem-solving'],
    interview_style: 'mixed',
    what_they_value: ['ownership', 'technical depth', 'mentoring'],
    red_flags: ['job hopping', 'no system design experience'],
  },
  questions: [
    ...Array.from({ length: 5 }, (_, i) => makeQuestion(i + 1, 'behavioral')),
    ...Array.from({ length: 5 }, (_, i) => makeQuestion(i + 6, 'role_specific')),
    ...Array.from({ length: 3 }, (_, i) => makeQuestion(i + 11, 'situational')),
    ...Array.from({ length: 2 }, (_, i) => makeQuestion(i + 14, 'culture')),
  ],
  ask_them: [
    { question: 'What does a typical sprint look like here?', why_it_matters: 'Understand team cadence' },
    { question: 'How is engineering success measured?', why_it_matters: 'Understand culture' },
    { question: 'What are the biggest challenges for the team right now?', why_it_matters: 'Shows interest' },
    { question: 'How does the team handle tech debt?', why_it_matters: 'Engineering maturity signal' },
    { question: 'What growth paths exist for engineers?', why_it_matters: 'Career development' },
  ],
  cheat_sheet: {
    key_numbers: ['10K daily users', '40% latency reduction', '3 teams managed'],
    power_stories: [
      { title: 'Production Outage Resolution', hook: 'Fixed critical outage affecting 10K users in 2 hours', jd_theme: 'problem-solving' },
      { title: 'Microservices Migration', hook: 'Led monolith to microservices migration over 6 months', jd_theme: 'system design' },
    ],
    jd_keywords: ['distributed systems', 'microservices', 'Java', 'leadership', 'mentoring'],
    avoid_phrases: [
      { avoid: 'I was just following orders', use_instead: 'I identified the need and took initiative' },
      { avoid: 'We did everything together', use_instead: 'My specific contribution was...' },
    ],
  },
  mcq: Array.from({ length: 10 }, () => makeMCQ()),
};

export const DEGRADED_PREP_DATA = {
  ...PERFECT_PREP_DATA,
  questions: PERFECT_PREP_DATA.questions.slice(0, 11),  // 11 valid (passes >=10, but <12)
  mcq: PERFECT_PREP_DATA.mcq.slice(0, 7),  // 7 valid (passes >=6, but <8)
};

export const INVALID_PREP_DATA_TOO_FEW = {
  ...PERFECT_PREP_DATA,
  questions: PERFECT_PREP_DATA.questions.slice(0, 5),  // only 5 — fails even degraded
  mcq: PERFECT_PREP_DATA.mcq.slice(0, 3),  // only 3 — fails even degraded
};

export const PREP_DATA_WITH_PLACEHOLDERS = {
  ...PERFECT_PREP_DATA,
  questions: [
    ...PERFECT_PREP_DATA.questions.slice(0, 8),
    makeQuestion(9, 'behavioral', false),  // "..." question
    makeQuestion(10, 'behavioral', false),
    makeQuestion(11, 'behavioral', false),
    makeQuestion(12, 'behavioral', false),
    makeQuestion(13, 'behavioral', false),
    makeQuestion(14, 'behavioral', false),
    makeQuestion(15, 'behavioral', false),
  ],
};

export const PREP_DATA_NO_BRIEF = {
  ...PERFECT_PREP_DATA,
  company_brief: undefined,
};

export const PREP_DATA_BAD_MCQS = {
  ...PERFECT_PREP_DATA,
  mcq: [
    ...Array.from({ length: 4 }, () => makeMCQ()),
    { question: 'Short?', options: ['A', 'B'], correct: 0 },  // only 2 options
    { question: '...', options: ['A', 'B', 'C', 'D'], correct: 0 },  // placeholder
    { question: 'Valid question here for MCQ test purposes?', options: ['A', 'B', 'C', '...'], correct: 0 },  // "..." option
    makeMCQ(false),
    makeMCQ(false),
    makeMCQ(false),
  ],
};

export const PREP_DATA_SHORT_STAR = {
  ...PERFECT_PREP_DATA,
  questions: PERFECT_PREP_DATA.questions.map((q, i) => {
    if (i < 5) return q;
    // Short STAR fields — should fail validation
    return {
      ...q,
      suggested_answer: {
        situation: 'short',  // < 10 chars
        task: 'task',
        action: 'action',
        result: 'result',
      },
    };
  }),
};

// ─── JD-Specific Prep Data Fixtures ───

export const JD_ANALYSIS_FIXTURE: any = {
  must_have_skills: ['Java', 'distributed systems', 'microservices'],
  nice_to_have: ['Kubernetes', 'GCP'],
  tools: ['AWS', 'Kubernetes', 'Jenkins'],
  responsibilities: ['Build scalable systems', 'Mentor junior engineers', 'Lead technical design'],
  seniority_signals: ['5+ years', 'senior individual contributor'],
  themes: ['distributed systems', 'microservices', 'leadership', 'system design', 'performance optimization'],
  red_flags: ['no system design experience', 'job hopping'],
};

export const GAP_MAP_FIXTURE: any[] = [
  { jd_theme: 'distributed systems', resume_evidence: 'Software Engineer at Infosys: "Built microservices serving 2M+ requests daily"', bridge_talking_point: '', status: 'strong' },
  { jd_theme: 'microservices', resume_evidence: 'Listed in skills: Kubernetes', bridge_talking_point: '', status: 'strong' },
  { jd_theme: 'leadership', resume_evidence: 'Software Engineer at Infosys: "Mentored team of 5 junior developers"', bridge_talking_point: '', status: 'partial' },
  { jd_theme: 'system design', resume_evidence: null, bridge_talking_point: 'Led monolith-to-microservices migration which required extensive system design decisions.', status: 'partial' },
  { jd_theme: 'performance optimization', resume_evidence: null, bridge_talking_point: 'Reduced deployment time by 60% through CI/CD pipeline optimization, demonstrating performance mindset.', status: 'gap' },
];

export const PERFECT_JD_PREP_DATA = {
  ...PERFECT_PREP_DATA,
  jd_analysis: JD_ANALYSIS_FIXTURE,
  gap_map: GAP_MAP_FIXTURE,
  company_context: {
    summary: 'Based on the job description, this team builds distributed backend systems at scale.',
    inferred_from: 'jd_only' as const,
    interview_style_guess: 'technical',
  },
  questions: [
    ...Array.from({ length: 5 }, (_, i) => makeQuestion(i + 1, 'behavioral', true, true)),
    ...Array.from({ length: 5 }, (_, i) => makeQuestion(i + 6, 'role_specific', true, true)),
    ...Array.from({ length: 3 }, (_, i) => makeQuestion(i + 11, 'situational', true, true)),
    ...Array.from({ length: 2 }, (_, i) => makeQuestion(i + 14, 'culture', true, true)),
  ],
};

export const JD_PREP_NO_LINKAGE = {
  ...PERFECT_JD_PREP_DATA,
  // Questions without jd_themes / why_for_this_role — should flag in JD validation
  questions: PERFECT_PREP_DATA.questions,  // no JD fields
};

export const JD_PREP_FEW_GAPS = {
  ...PERFECT_JD_PREP_DATA,
  gap_map: [{ jd_theme: 'only one', resume_evidence: null, bridge_talking_point: '', status: 'gap' as const }],
};

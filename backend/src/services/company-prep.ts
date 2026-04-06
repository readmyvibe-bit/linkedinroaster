import { GoogleGenerativeAI } from '@google/generative-ai';
import { jsonrepair } from 'jsonrepair';
import { query } from '../db';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Top campus recruiters in India (all degrees)
export const CAMPUS_COMPANIES = [
  // IT/Software
  'TCS', 'Infosys', 'Wipro', 'HCLTech', 'Tech Mahindra', 'Cognizant', 'Accenture', 'Capgemini',
  'LTIMindtree', 'Mphasis', 'Persistent Systems', 'Zoho', 'Freshworks', 'Razorpay',
  // Product
  'Amazon', 'Google', 'Microsoft', 'Flipkart', 'Swiggy', 'Zomato', 'PhonePe', 'Paytm',
  'Ola', 'CRED', 'Meesho', 'Myntra', 'Jio', 'Samsung', 'Intel', 'Qualcomm',
  // Consulting/Finance
  'Deloitte', 'EY', 'KPMG', 'PwC', 'McKinsey', 'BCG', 'Bain',
  'Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'ICICI Bank', 'HDFC Bank', 'Axis Bank',
  // FMCG/Core
  'Hindustan Unilever', 'ITC', 'Nestle', 'P&G', 'Tata Motors', 'L&T', 'Mahindra',
  'Reliance', 'Adani', 'Vedanta', 'ONGC', 'BHEL', 'ISRO',
];

export interface CompanyPrepResult {
  company_name: string;
  role: string;
  technical_questions: Array<{
    question: string;
    answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
  }>;
  project_questions: Array<{
    question: string;
    answer: string;
  }>;
  hr_questions: Array<{
    question: string;
    answer: string;
    tip: string;
  }>;
  tell_me_about_yourself: string;
  why_should_we_hire_you: string;
  company_tips: {
    expected_ctc: string;
    interview_process: string;
    common_mistakes: string;
    culture_fit: string;
  };
}

export async function generateCompanyPrep(
  orderId: string,
  companyName: string,
  jobDescription: string | null,
  studentData: {
    name: string;
    college: string;
    degree: string;
    branch: string;
    target_role: string;
    skills: string[];
    projects: string;
    internships: string;
    achievements: string;
    experience: any[];
  },
): Promise<CompanyPrepResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { temperature: 0.35, maxOutputTokens: 10000 },
  });

  const prompt = `You are a senior placement officer and interview coach at a top Indian college. You have 15+ years of experience preparing students for campus placements at ${companyName}.

STUDENT PROFILE:
- Name: ${studentData.name}
- College: ${studentData.college}
- Degree: ${studentData.degree} ${studentData.branch}
- Target Role: ${studentData.target_role}
- Skills: ${studentData.skills.join(', ')}
- Projects: ${studentData.projects || 'None mentioned'}
- Internships: ${studentData.internships || 'None'}
- Achievements: ${studentData.achievements || 'None mentioned'}

COMPANY: ${companyName}
TARGET ROLE: ${studentData.target_role}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ''}

Generate a COMPREHENSIVE interview preparation kit for this student interviewing at ${companyName}.

SECTION 1 — TECHNICAL QUESTIONS (exactly 5)
Rules:
- Questions MUST be what ${companyName} actually asks for ${studentData.target_role} roles in campus placements
- Match difficulty to fresher level (mix of easy + medium, 1 hard)
- Cover: data structures, algorithms, DBMS, OS, OOPs, or domain-specific based on role
- For non-CS roles (MBA/B.Com/BBA): ask domain fundamentals instead (marketing frameworks, accounting principles, financial analysis)
- Each answer: 4-6 sentences, with code snippet or example where relevant
- Include topic tag (e.g., "Arrays", "DBMS", "Marketing Mix")
- If JD provided, tailor 2 questions to JD requirements

SECTION 2 — PROJECT-BASED QUESTIONS (exactly 3)
Rules:
- Based on student's ACTUAL projects/internships
- "Walk me through your [project]" style
- "Why did you choose [tech]?" style
- "How would you improve this?" style
- Answers must reference their actual tech stack and project details
- If no projects: ask about academic assignments or self-learning

SECTION 3 — HR & BEHAVIORAL QUESTIONS (exactly 5)
Rules:
- Q1: "Why do you want to join ${companyName}?" — answer MUST reference specific things about ${companyName} (products, values, recent news, market position)
- Q2: "Where do you see yourself in 5 years?" — realistic growth path at ${companyName}
- Q3: "Tell me about a time you worked in a team" — use project/college experience
- Q4: "How do you handle failure/rejection?" — genuine example with learning
- Q5: "What makes you different from other candidates?" — unique selling point from their background
- Each answer: STAR format, 4-5 sentences
- Include a TIP for each (body language, what NOT to say, recruiter expectation)

SECTION 4 — TELL ME ABOUT YOURSELF (for ${companyName})
- Customized opener mentioning why ${companyName} specifically
- 60-second version
- Reference their strongest project + skill match for this company
- End with enthusiasm about ${companyName}'s specific work

SECTION 5 — WHY SHOULD WE HIRE YOU (for ${companyName})
- 3-4 sentences
- Connect their skills → company's needs
- Mention 1 specific project as evidence
- End with cultural fit statement

SECTION 6 — COMPANY TIPS
- expected_ctc: Fresher CTC range at ${companyName} for ${studentData.target_role} (in LPA, India 2024-25 data)
- interview_process: Typical campus placement process at ${companyName} (rounds, duration, online/offline)
- common_mistakes: Top 3 mistakes candidates make at ${companyName} interviews
- culture_fit: What ${companyName} values in candidates (with specific examples)

OUTPUT FORMAT (strict JSON):
{
  "company_name": "${companyName}",
  "role": "${studentData.target_role}",
  "technical_questions": [
    { "question": "", "answer": "", "difficulty": "easy|medium|hard", "topic": "" }
  ],
  "project_questions": [
    { "question": "", "answer": "" }
  ],
  "hr_questions": [
    { "question": "", "answer": "", "tip": "" }
  ],
  "tell_me_about_yourself": "",
  "why_should_we_hire_you": "",
  "company_tips": {
    "expected_ctc": "",
    "interview_process": "",
    "common_mistakes": "",
    "culture_fit": ""
  }
}

Return ONLY valid JSON.`;

  const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
  const text = result.response.text();

  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(jsonrepair(cleaned));
  }
}

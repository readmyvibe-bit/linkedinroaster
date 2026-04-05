/**
 * QA Fixtures for resume template visual testing.
 *
 * Usage: Import a fixture, pass to renderResumeHTML(fixture, templateId)
 * or generatePrintHTML(fixture, templateId) and visually compare output.
 *
 * To generate print HTML for all templates:
 *   node -e "
 *     const fs = require('fs');
 *     const { TEMPLATES, generatePrintHTML } = require('./dist/components/resume/ResumeTemplates');
 *     const fixtures = require('./dist/components/resume/__fixtures__/resume-data');
 *     Object.entries(fixtures).forEach(([name, data]) => {
 *       TEMPLATES.forEach(t => {
 *         const html = generatePrintHTML(data, t.id);
 *         fs.writeFileSync(`qa-output/${name}-${t.id}.html`, html);
 *       });
 *     });
 *   "
 */

// 1. SPARSE — Fresher with minimal data
export const SPARSE = {
  contact: { name: 'Priya Sharma', email: 'priya@gmail.com', phone: '9876543210' },
  summary: 'Recent graduate seeking opportunities in software development.',
  experience: [],
  education: [
    { degree: 'B.Tech', field: 'Computer Science', institution: 'IIT Delhi', year: '2024' },
  ],
  skills: ['Python', 'JavaScript', 'SQL'],
  achievements: [],
};

// 2. DENSE — Senior with many roles, long bullets, multiple skill categories
export const DENSE = {
  contact: {
    name: 'Rajesh Kumar Venkataraman',
    email: 'rajesh.v@company.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    linkedin: 'linkedin.com/in/rajeshv',
    website: 'rajeshv.dev',
  },
  summary: 'Senior Engineering Manager with 12+ years of experience building and scaling distributed systems at Google, Flipkart, and Amazon. Led teams of 25+ engineers across 3 geographies. Drove $4M in cost optimization and 3% search relevance improvement. Passionate about mentoring, system design, and building high-performance engineering cultures.',
  experience: [
    {
      title: 'Senior Engineering Manager',
      company: 'Google India',
      location: 'Bangalore',
      start_date: 'March 2020',
      end_date: 'Present',
      bullets: [
        'Managed 3 teams (25 engineers) across Bangalore, Hyderabad, and Mountain View, delivering search quality improvements (+3% relevance)',
        'Drove $4M annual cost optimization by migrating legacy services to containerized microservices on GKE',
        'Established engineering standards and code review processes, reducing production incidents by 60%',
        'Led hiring initiatives, growing team from 12 to 25 engineers with 95% offer acceptance rate',
      ],
    },
    {
      title: 'Engineering Manager',
      company: 'Flipkart',
      location: 'Bangalore',
      start_date: 'June 2016',
      end_date: 'February 2020',
      bullets: [
        'Scaled platform from 50M to 100M+ monthly active users during Big Billion Days sale events',
        'Built and grew payments team from 5 to 18 engineers, establishing on-call and SRE practices',
        'Designed distributed order processing system handling 500K concurrent transactions',
      ],
    },
    {
      title: 'Senior Software Engineer',
      company: 'Amazon',
      location: 'Hyderabad',
      start_date: 'August 2012',
      end_date: 'May 2016',
      bullets: [
        'Built distributed order fulfillment system processing 2M+ orders daily across 15 warehouses',
        'Reduced API latency by 40% through Redis caching and connection pooling optimization',
        'Mentored 8 junior engineers, 3 of whom were promoted to senior roles within 2 years',
      ],
    },
    {
      title: 'Software Engineer',
      company: 'Infosys',
      location: 'Pune',
      start_date: 'July 2010',
      end_date: 'July 2012',
      bullets: [
        'Developed RESTful APIs for banking module serving 500K daily transactions',
        'Implemented automated testing framework reducing regression testing time by 70%',
      ],
    },
  ],
  education: [
    { degree: 'M.Tech', field: 'Computer Science', institution: 'IISc Bangalore', year: '2010' },
    { degree: 'B.Tech', field: 'Information Technology', institution: 'NIT Trichy', year: '2008' },
  ],
  skills: {
    technical: ['Java', 'Python', 'Go', 'Kubernetes', 'AWS', 'GCP', 'Terraform', 'Redis', 'PostgreSQL', 'Kafka'],
    soft: ['People Management', 'Strategic Planning', 'Stakeholder Communication', 'Mentoring'],
    languages: ['English', 'Hindi', 'Tamil'],
    certifications: ['AWS Solutions Architect Professional', 'Google Cloud Professional Data Engineer'],
  },
  achievements: [
    'Google Spot Bonus for search quality improvements (2022)',
    'Flipkart Big Billion Days Engineering Excellence Award (2019)',
    'Patent filed: Distributed cache invalidation system (US Patent Pending)',
    'Speaker at GopherCon India 2021 on "Scaling Go Services at Google"',
  ],
};

// 3. FRESHER — Student with projects, no work experience
export const FRESHER = {
  contact: {
    name: 'Ananya Gupta',
    email: 'ananya.gupta@vit.ac.in',
    phone: '8765432109',
    location: 'Vellore, Tamil Nadu',
  },
  photo: 'https://via.placeholder.com/100x120',
  personal: {
    dob: '15 March 2002',
    gender: 'Female',
    nationality: 'Indian',
    father_name: 'Suresh Gupta',
  },
  summary: 'Final year B.Tech student at VIT Vellore with strong foundation in web development, machine learning, and competitive programming. Seeking entry-level software engineering roles.',
  experience: [
    {
      title: 'Summer Intern',
      company: 'Wipro Technologies',
      start_date: 'May 2024',
      end_date: 'July 2024',
      bullets: [
        'Developed automated testing scripts for web application reducing manual testing by 40%',
        'Built internal dashboard using React and Node.js for tracking project metrics',
      ],
    },
  ],
  education: [
    { degree: 'B.Tech', field: 'Computer Science', institution: 'VIT Vellore', dates: '2021 - 2025', gpa: '8.7/10' },
    { degree: '12th CBSE', institution: 'DPS Noida', year: '2021', gpa: '95.2%' },
  ],
  skills: ['Python', 'JavaScript', 'React', 'Node.js', 'MongoDB', 'Git', 'Machine Learning', 'TensorFlow'],
  achievements: [
    'Winner, Smart India Hackathon 2023 (Team Lead)',
    'Codeforces Rating: 1450 (Specialist)',
    'Published paper on ML-based crop disease detection in IJCSIT',
  ],
};

// 4. LONG_BULLETS — Resume with very long bullet points that test wrapping
export const LONG_BULLETS = {
  contact: {
    name: 'Vikram Mehta',
    email: 'vikram.mehta@gmail.com',
    phone: '+91 99887 76655',
    location: 'Mumbai, Maharashtra',
    linkedin: 'linkedin.com/in/vikrammehta',
  },
  summary: 'Product Manager with 6 years of experience in B2B SaaS, fintech, and e-commerce platforms. Led cross-functional teams of 15+ across engineering, design, and analytics to deliver products generating $2M+ ARR.',
  experience: [
    {
      title: 'Senior Product Manager',
      company: 'Razorpay',
      start_date: 'January 2022',
      end_date: 'Present',
      bullets: [
        'Led the development and launch of Razorpay Route, an automated split payment solution that processes $500M+ monthly transaction volume across 5,000+ marketplace sellers, reducing settlement time from T+3 to T+0 for premium merchants',
        'Defined and executed the product roadmap for international payments expansion into Southeast Asia (Singapore, Malaysia, Indonesia), achieving 120% of Year 1 revenue targets within 9 months of launch through strategic partnerships with local payment processors',
        'Collaborated with engineering, compliance, and legal teams to implement PCI DSS Level 1 compliance framework, resulting in zero security incidents and enabling Razorpay to process payments for regulated industries including healthcare and government',
        'Introduced data-driven decision framework using Mixpanel and internal analytics, reducing feature discovery-to-ship time by 35% and increasing A/B test velocity from 2 to 8 experiments per quarter',
      ],
    },
  ],
  education: [
    { degree: 'MBA', field: 'Product Management', institution: 'ISB Hyderabad', year: '2020' },
    { degree: 'B.E.', field: 'Computer Science', institution: 'BITS Pilani', year: '2017' },
  ],
  skills: ['Product Strategy', 'SQL', 'Mixpanel', 'Figma', 'Jira', 'A/B Testing', 'Data Analysis'],
  achievements: [
    'Razorpay Product Excellence Award 2023',
  ],
};

// 5. SKILLS_AS_OBJECT — Skills in the SkillsObject format (technical/soft/languages/certifications)
export const SKILLS_AS_OBJECT = {
  contact: {
    name: 'Neha Patel',
    email: 'neha@gmail.com',
    location: 'Ahmedabad',
  },
  summary: 'Full stack developer with 4 years experience.',
  experience: [
    {
      title: 'Full Stack Developer',
      company: 'TechStartup',
      start_date: 'Jan 2021',
      end_date: 'Present',
      bullets: ['Built React + Node.js web applications', 'Deployed services on AWS ECS'],
    },
  ],
  education: [
    { degree: 'B.Tech', field: 'IT', institution: 'GTU', year: '2020' },
  ],
  skills: {
    technical: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    soft: ['Team Leadership', 'Agile/Scrum', 'Technical Writing'],
    languages: ['English', 'Hindi', 'Gujarati'],
    certifications: ['AWS Developer Associate', 'MongoDB Certified Developer'],
  },
  achievements: ['Best Developer Award 2023'],
  custom_sections: [
    {
      title: 'Open Source Contributions',
      items: [
        'Core contributor to next-auth (500+ GitHub stars gained)',
        'Maintainer of react-query-devtools extension',
      ],
    },
    {
      title: 'Volunteer Work',
      items: [
        'Taught coding to 200+ underprivileged students through Code.org India chapter',
      ],
    },
  ],
};

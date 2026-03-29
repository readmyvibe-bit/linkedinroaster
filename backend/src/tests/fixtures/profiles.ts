export const testProfiles = {
  empty: {
    name: 'Empty Profile',
    data: {
      headline: 'Software Developer',
      about: '',
      experience: '',
      raw_paste: null,
    },
  },

  buzzword_heavy: {
    name: 'Buzzword Heavy',
    data: {
      headline: 'Passionate | Synergistic Thought Leader | Results-Driven Professional | Dedicated Team Player',
      about: 'I am a passionate and dedicated professional with a proven track record of excellence. I am a synergistic thought leader who thrives in fast-paced environments. I bring a results-driven approach to everything I do. I am committed to leveraging my skills to drive innovation and create value. A team player with excellent communication skills.',
      experience: 'Senior Professional - BigCorp (3 years)\n- Responsible for driving synergistic outcomes\n- Tasked with leveraging cross-functional partnerships\n- Dedicated to fostering innovation\n- Committed to excellence in all endeavors',
      raw_paste: null,
    },
  },

  good_no_metrics: {
    name: 'Good But No Metrics',
    data: {
      headline: 'Product Manager at Stripe | Building Developer Tools',
      about: 'I build developer-facing products that simplify complex financial infrastructure.\n\nAt Stripe, I lead the Billing team where we ship features used by startups and enterprises globally. Before that, I was at Shopify working on merchant tools.\n\nMy approach: talk to users weekly, prototype fast, measure everything.\n\nLooking to connect with other PMs working on developer experience.',
      experience: 'Product Manager - Stripe (2 years)\n- Led Billing product team, shipped subscription management features\n- Ran user research sessions to identify pain points in checkout\n- Coordinated with engineering to reduce technical debt\n\nAssociate PM - Shopify (1.5 years)\n- Managed merchant onboarding flow\n- Conducted A/B tests on signup conversion',
      raw_paste: null,
    },
  },

  excellent: {
    name: 'Excellent Profile',
    data: {
      headline: 'Senior Data Engineer | Building Real-Time Pipelines at Scale | Reduced Processing Costs by 40%',
      about: 'Every day, 50M+ events flow through pipelines I built from scratch.\n\nI help fast-growing startups turn chaotic data into reliable, real-time systems that actually work at 3 AM when the on-call phone rings.\n\nOver 8 years, I have:\n- Architected event-driven systems processing 2B+ events/month\n- Reduced infrastructure costs by 40% through smart partitioning\n- Led migration from batch to streaming for 3 Fortune 500 clients\n\nMy stack: Apache Kafka, Spark, Flink, dbt, Snowflake, AWS.\n\nCurrently exploring how LLMs can automate data quality checks.\n\nLet us talk if you need someone who treats data infrastructure like a product.\nDM me or email: data.eng@example.com',
      experience: 'Senior Data Engineer - ScaleUp Inc (3 years)\n- Architected event-driven pipelines processing 2B+ events/month with 99.99% uptime\n- Reduced cloud costs by 40% through partition optimization and spot instance strategy\n- Led team of 4 engineers building real-time fraud detection system\n\nData Engineer - DataFlow Corp (3 years)\n- Built real-time ETL pipelines achieving 99.9% uptime across 15TB data warehouse\n- Migrated legacy batch system to Snowflake in 6 weeks, improving query speed 10x\n\nJunior Engineer - StartupXYZ (2 years)\n- Developed automated reporting saving 20+ hours/week for analytics team',
      raw_paste: null,
    },
  },

  student: {
    name: 'Student/Fresher',
    data: {
      headline: 'Computer Science Student | Class of 2025',
      about: 'I am a computer science student passionate about building things. Currently learning React and Python. Looking for internship opportunities.',
      experience: '',
      raw_paste: 'Education: B.Tech Computer Science, State University, 2025\nSkills: Python, Java, HTML, CSS\nProjects: Built a to-do app',
    },
  },

  career_switcher: {
    name: 'Career Switcher',
    data: {
      headline: 'Former High School Teacher | Transitioning to Software Development',
      about: 'After 8 years of teaching mathematics, I am making the leap into tech. Completed a full-stack bootcamp and building projects in React and Node.js. My teaching experience gives me unique skills in communication, breaking down complex problems, and working with diverse groups.',
      experience: 'Mathematics Teacher - Lincoln High School (8 years)\n- Taught algebra and calculus to 150+ students per year\n- Developed curriculum that improved test scores by 15%\n- Mentored 20+ students for math competitions\n\nFull-Stack Developer (Bootcamp) - General Assembly (6 months)\n- Built 3 full-stack applications using React, Node.js, PostgreSQL\n- Collaborated in agile teams of 4 developers',
      raw_paste: null,
    },
  },

  senior_executive: {
    name: 'Senior Executive',
    data: {
      headline: 'VP of Engineering at Fortune 500 FinTech | 15 Years Building High-Performance Teams',
      about: 'I build engineering organizations that ship great products.\n\nCurrently leading 200+ engineers at PayScale, responsible for platform reliability, developer experience, and AI/ML initiatives.\n\nTrack record:\n- Scaled engineering from 40 to 200 in 3 years\n- Reduced deployment frequency from monthly to daily (30x improvement)\n- Led SOC 2 Type II certification, opening enterprise sales pipeline worth $50M\n- Built ML team from scratch, now generating $12M ARR\n\nPreviously: Director of Engineering at Razorpay, Senior Manager at Amazon.\n\nI write about engineering leadership at blog.example.com\nOpen to board advisory roles in B2B SaaS.',
      experience: 'VP of Engineering - PayScale (4 years)\n- Lead 200+ engineers across 8 product teams with $150M platform responsibility\n- Scaled organization from 40 to 200 engineers while maintaining <10% attrition\n- Reduced deployment cycle from monthly to daily, improving release velocity 30x\n- Led SOC 2 Type II certification enabling $50M enterprise pipeline\n\nDirector of Engineering - Razorpay (3 years)\n- Managed payment gateway processing $20B+ annually\n- Built and led 60-person engineering team across 4 verticals\n- Reduced system downtime from 99.9% to 99.99% SLA\n\nSenior Engineering Manager - Amazon (5 years)\n- Owned Alexa Skills Kit developer platform serving 500K+ developers\n- Shipped 12 major features in 18 months with zero P0 incidents',
      raw_paste: null,
    },
  },

  hinglish: {
    name: 'Hinglish Profile',
    data: {
      headline: 'Marketing Manager | Brand Building Expert | Digital Marketing Specialist',
      about: 'Main ek marketing professional hoon with 6 years of experience in brand management and digital marketing. Maine multiple brands ko grow kiya hai from scratch. Currently working at a D2C startup jahan pe main handle karta hoon full marketing strategy.\n\nMy expertise includes social media marketing, content strategy, aur performance marketing.',
      experience: 'Marketing Manager - D2C Startup (2 years)\n- Handled complete marketing strategy for brand growth\n- Managed team of 5 people for social media campaigns\n- Grew Instagram following from 10K to 100K\n\nDigital Marketing Executive - Agency (4 years)\n- Ran Facebook and Google ads for 20+ clients\n- Monthly ad spend management of 50 lakhs',
      raw_paste: null,
    },
  },

  very_long: {
    name: 'Very Long Profile',
    data: {
      headline: 'Full-Stack Developer | React, Node.js, Python, AWS, Docker, Kubernetes | 10+ Years',
      about: 'I have been building software for over a decade. My journey started with PHP and jQuery, evolved through Angular and Express, and now I specialize in React, Node.js, and cloud-native architectures.\n\nI have worked with startups, mid-size companies, and Fortune 500 enterprises. Each taught me something different about building software that matters.\n\nSkills: React, Next.js, Node.js, Express, Python, Django, PostgreSQL, MongoDB, Redis, AWS, GCP, Docker, Kubernetes, Terraform, CI/CD, GraphQL, REST APIs, Microservices.',
      experience: 'Senior Developer - TechCorp (2 years)\n- Built microservices architecture serving 1M+ users\n- Reduced API response time by 60%\n\nFull-Stack Developer - StartupA (2 years)\n- Led frontend rewrite from Angular to React\n- Implemented real-time features using WebSocket\n\nBackend Developer - MidCo (2 years)\n- Designed and built REST API used by 50+ clients\n- Migrated legacy monolith to microservices\n\nJunior Developer - Agency (2 years)\n- Built 30+ client websites\n- Learned agile development practices\n\nIntern - SmallTech (1 year)\n- Built internal tools using Python and Flask',
      raw_paste: null,
    },
  },

  gibberish: {
    name: 'Gibberish Input',
    data: {
      headline: 'asdflkjhasd fkjhasdkfjh askdjfhaskdjfh askdjhf aksdjhf',
      about: 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua',
      experience: '',
      raw_paste: null,
    },
  },
};

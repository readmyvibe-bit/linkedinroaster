'use client';

import { useState } from 'react';

export default function BuildLandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'LinkedIn Starter',
      price: 199,
      popular: false,
      features: [
        'AI-generated headline (3 variations)',
        'Professional About section (300+ words)',
        'Experience bullets with action verbs & metrics',
        'Skills list ranked by industry relevance',
        'Step-by-step LinkedIn setup guide (10 steps)',
        'Copy-paste ready — build profile in 10 minutes',
      ],
      notIncluded: ['ATS Resume', 'Cover Letter', 'Premium templates'],
    },
    {
      id: 'plus',
      name: 'LinkedIn + Resume',
      price: 399,
      popular: true,
      features: [
        'Everything in Starter',
        '1 ATS-optimized resume',
        '1 tailored cover letter',
        '12 professional resume templates',
        'PDF + DOCX download',
        'Job description targeting',
      ],
      notIncluded: [],
    },
    {
      id: 'pro',
      name: 'LinkedIn Pro',
      price: 699,
      popular: false,
      features: [
        'Everything in LinkedIn + Resume',
        '3 ATS resumes for different roles',
        '3 tailored cover letters',
        'All 20 premium resume templates',
        'Priority AI processing',
        'Multiple job targeting',
      ],
      notIncluded: [],
    },
  ];

  const steps = [
    { num: '1', title: 'Tell us about yourself', desc: 'Fill a simple form — your education, experience, skills, and target role. Have a resume? Upload it to auto-fill.', time: '5 min' },
    { num: '2', title: 'AI builds your profile', desc: 'Claude AI generates your complete LinkedIn profile — headline, about, experience bullets — optimized for Indian recruiters.', time: '60 sec' },
    { num: '3', title: 'Copy-paste to LinkedIn', desc: 'Follow our step-by-step guide. Your profile is ready in 10 minutes. Start getting recruiter messages.', time: '10 min' },
  ];

  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E0E0E0', padding: '12px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#191919' }}>Roaster</span>
          </a>
          <a href="/" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>
            Already have LinkedIn? Get Roasted &rarr;
          </a>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #004182 0%, #0A66C2 100%)', color: 'white', padding: '60px 20px 50px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 16px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            No LinkedIn? No Problem.
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2, margin: '0 0 16px' }}>
            Build a Job-Winning LinkedIn<br />Profile in 60 Seconds
          </h1>
          <p style={{ fontSize: 17, opacity: 0.9, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 28px' }}>
            AI builds your complete LinkedIn profile from scratch — headline, about section, experience bullets — ready to copy-paste. Optimized for Indian recruiters.
          </p>
          <a href="#pricing" style={{ display: 'inline-block', background: 'white', color: '#0A66C2', padding: '14px 36px', borderRadius: 50, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
            Build My Profile &rarr;
          </a>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 12 }}>500+ profiles built &bull; Takes 5 minutes &bull; No LinkedIn login needed</p>
        </div>
      </section>

      {/* Perfect For */}
      <section style={{ background: 'white', padding: '48px 20px', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', marginBottom: 8 }}>Perfect for</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>Built specifically for people starting their LinkedIn journey</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, textAlign: 'left' }}>
            {[
              { icon: '🎓', text: 'Final year students' },
              { icon: '🚀', text: 'Recent graduates (0-1 year)' },
              { icon: '💼', text: 'Professionals creating LinkedIn for first time' },
              { icon: '🔄', text: 'Career changers starting fresh' },
              { icon: '😅', text: 'Anyone who has been avoiding LinkedIn' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0F7FF', borderRadius: 10, padding: '14px 16px' }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Example */}
      <section style={{ padding: '48px 20px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', textAlign: 'center', marginBottom: 8 }}>See the Transformation</h2>
          <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 }}>From raw details to recruiter-ready profile</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Before */}
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#CC1016', letterSpacing: 2, marginBottom: 12 }}>WHAT YOU TELL US</div>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                &ldquo;B.Tech CSE 2024, TCS internship 2 months, know Python and SQL, want data analyst job in Bangalore&rdquo;
              </p>
            </div>
            {/* After */}
            <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#057642', letterSpacing: 2, marginBottom: 12 }}>WHAT AI GENERATES</div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#057642', marginBottom: 4 }}>HEADLINE</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#191919', margin: 0 }}>
                  Data Analyst | Python & SQL | TCS Intern | B.Tech CSE 2024 | Open to Opportunities in Bangalore
                </p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#057642', marginBottom: 4 }}>ABOUT (PREVIEW)</div>
                <p style={{ fontSize: 13, color: '#444', margin: 0, lineHeight: 1.6 }}>
                  Data analyst with hands-on experience building ETL pipelines and dashboards during my internship at TCS. Skilled in Python, SQL, and data visualization...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: 'white', padding: '48px 20px', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', marginBottom: 32 }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {steps.map((s) => (
              <div key={s.num} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0A66C2', color: 'white', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{s.num}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 6 }}>{s.title}</div>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
                <div style={{ fontSize: 12, color: '#0A66C2', fontWeight: 600, marginTop: 8 }}>{s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upload CTA */}
      <section style={{ padding: '36px 20px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 14, padding: '24px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>&#128196;</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1E40AF', marginBottom: 6 }}>Have a resume already?</div>
          <p style={{ fontSize: 14, color: '#555', margin: '0 0 4px', lineHeight: 1.6 }}>
            Upload your PDF or DOCX and we auto-fill the form for you. Takes 10 seconds.
          </p>
          <p style={{ fontSize: 12, color: '#888' }}>You can upload on the next page after selecting a plan.</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '48px 20px 60px', background: 'white', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', marginBottom: 8 }}>Choose Your Plan</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 32 }}>One-time payment. No subscription. Results in 60 seconds.</p>

          {!selectedPlan ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 900, margin: '0 auto' }}>
              {plans.map((p) => (
                <div
                  key={p.id}
                  style={{
                    background: p.popular ? 'linear-gradient(135deg, #004182, #0A66C2)' : 'white',
                    color: p.popular ? 'white' : '#191919',
                    border: p.popular ? 'none' : '1px solid #E0E0E0',
                    borderRadius: 16,
                    padding: '28px 24px',
                    position: 'relative',
                    textAlign: 'left',
                  }}
                >
                  {p.popular && (
                    <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#057642', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 12 }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 32, fontWeight: 800 }}>&#8377;{p.price}</span>
                    <span style={{ fontSize: 13, opacity: 0.7 }}> one-time</span>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                    {p.features.map((f, i) => (
                      <li key={i} style={{ fontSize: 13, lineHeight: 1.5, padding: '4px 0', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: p.popular ? '#BBF7D0' : '#057642', fontWeight: 700 }}>&#10003;</span>
                        {f}
                      </li>
                    ))}
                    {p.notIncluded.map((f, i) => (
                      <li key={`no-${i}`} style={{ fontSize: 13, lineHeight: 1.5, padding: '4px 0', display: 'flex', gap: 8, opacity: 0.5 }}>
                        <span>&#10007;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setSelectedPlan(p.id)}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 50, border: 'none', cursor: 'pointer',
                      fontSize: 14, fontWeight: 700,
                      background: p.popular ? 'white' : '#0A66C2',
                      color: p.popular ? '#0A66C2' : 'white',
                    }}
                  >
                    Get Started &rarr;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ maxWidth: 440, margin: '0 auto', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#057642', marginBottom: 12 }}>
                {plans.find(p => p.id === selectedPlan)?.name} — &#8377;{plans.find(p => p.id === selectedPlan)?.price} selected
              </div>
              <a
                href={`/build/form?plan=${selectedPlan}`}
                style={{ display: 'inline-block', background: '#0A66C2', color: 'white', padding: '12px 32px', borderRadius: 50, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
              >
                Continue to Form &rarr;
              </a>
              <button onClick={() => setSelectedPlan(null)} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer' }}>
                Change plan
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '48px 20px', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', textAlign: 'center', marginBottom: 32 }}>Frequently Asked Questions</h2>
          {[
            { q: 'I have zero work experience. Will this work?', a: 'Yes! Our AI specializes in fresher profiles. It turns your education, projects, internships, and skills into a professional LinkedIn profile that stands out.' },
            { q: 'How do I set up LinkedIn after getting the profile?', a: 'Every plan includes a detailed 10-step setup guide with exact menu paths, screenshots descriptions, and common mistakes to avoid. You can set up LinkedIn in 10 minutes.' },
            { q: 'Can I edit the profile after generation?', a: 'Absolutely. The generated text is yours to copy-paste and edit as needed. We provide 3 headline variations so you can pick the one you like most.' },
            { q: 'What if I already have a basic resume?', a: 'Upload it on the form page and we auto-fill all your details. Saves 5 minutes of typing.' },
            { q: 'Is this different from the Profile Roast?', a: 'Yes. The Roast is for people who already have a LinkedIn profile and want to improve it. Build is for people who don\'t have LinkedIn yet and want to create one from scratch.' },
            { q: 'Do I need to share my LinkedIn login?', a: 'No. We never ask for your LinkedIn password. You fill a simple form, we generate the text, and you paste it yourself.' },
          ].map((faq, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 12, padding: '18px 22px', marginBottom: 10, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 6 }}>{faq.q}</div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E0E0E0', background: 'white', padding: '20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <a href="/terms" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>Terms</a>
            <a href="/privacy" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>Privacy</a>
            <a href="/refund" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>Refund Policy</a>
            <span style={{ fontSize: 13, color: '#666' }}>support@profileroaster.in</span>
          </div>
          <p style={{ fontSize: 12, color: '#999', margin: 0 }}>&copy; 2026 Profile Roaster. Not affiliated with LinkedIn.</p>
        </div>
      </footer>
    </main>
  );
}

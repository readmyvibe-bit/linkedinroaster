'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function ReferralCodeRedeemer() {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [redeemEmail, setRedeemEmail] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');

  async function handleRedeem() {
    if (!code.trim() || !redeemEmail.trim()) {
      setError('Please enter both code and email.');
      return;
    }
    setRedeeming(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/redeem-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          email: redeemEmail.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to redeem code');
        return;
      }
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setRedeeming(false);
    }
  }

  if (!showForm) {
    return (
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Have a referral code?
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '16px auto 0', padding: '16px 20px', background: '#F8FAFC', border: '1px solid #E0E7F0', borderRadius: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 10 }}>Redeem Referral Code</div>
      {error && <div style={{ fontSize: 12, color: '#CC1016', marginBottom: 8 }}>{error}</div>}
      <input
        type="email"
        value={redeemEmail}
        onChange={(e) => setRedeemEmail(e.target.value)}
        placeholder="Your email *"
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' as const }}
      />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter code (e.g. BUILD-PLU-XXXXX)"
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, fontFamily: 'monospace', boxSizing: 'border-box' as const }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleRedeem}
          disabled={redeeming}
          style={{
            flex: 1, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: '#0A66C2', color: 'white', fontSize: 13, fontWeight: 600,
            opacity: redeeming ? 0.6 : 1,
          }}
        >
          {redeeming ? 'Redeeming...' : 'Redeem'}
        </button>
        <button
          onClick={() => setShowForm(false)}
          style={{ padding: '8px 16px', borderRadius: 20, border: '1px solid #E0E0E0', background: 'white', fontSize: 13, cursor: 'pointer', color: '#666' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function BuildLandingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'starter',
      name: 'Profile Starter',
      price: 199,
      popular: false,
      features: [
        'AI-generated headline (3 variations)',
        'Professional About section',
        'Experience bullets from projects & internships',
        'Skills list ranked by industry',
        '10-step LinkedIn setup guide',
        'Connection request templates',
        'Free rescore anytime',
      ],
      notIncluded: ['ATS Resume', 'Cover Letter', 'Premium templates'],
    },
    {
      id: 'plus',
      name: 'Profile + Resume',
      price: 399,
      popular: true,
      features: [
        'Everything in Starter',
        'ATS Resume Builder (any job, 15 templates, PDF + TXT)',
        '1 Cover Letter',
        'Job description targeting',
        'Best for: Students applying to internships',
      ],
      notIncluded: [],
    },
    {
      id: 'pro',
      name: 'Profile Pro',
      price: 699,
      popular: false,
      features: [
        'Everything in Profile + Resume',
        '3 Cover Letters (one per target job)',
        'All 25 premium templates',
        'Priority processing',
        'Best for: Targeting multiple companies strategically',
      ],
      notIncluded: [],
    },
  ];

  const steps = [
    { num: '1', title: 'Tell us about yourself', desc: 'Fill a simple form — education, projects, skills, target role. Have a resume? Upload it to auto-fill.', time: '~5 min' },
    { num: '2', title: 'AI builds your profile', desc: 'AI generates your complete LinkedIn profile — 3 headline variations, about section, experience bullets — optimized for Indian recruiters.', time: '~60 sec' },
    { num: '3', title: 'Copy-paste to LinkedIn', desc: 'Follow our step-by-step setup guide with exact menu paths. Start getting recruiter messages and internship DMs.', time: '~10 min' },
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
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <a href="/" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>
              Get Roasted &rarr;
            </a>
            <a href="/dashboard" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 600 }}>
              Dashboard
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #004182 0%, #0A66C2 100%)', color: 'white', padding: '60px 20px 50px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 16px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            No LinkedIn? No Problem.
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.2, margin: '0 0 16px' }}>
            Build a Recruiter-Ready LinkedIn<br />Profile in ~15 Minutes
          </h1>
          <p style={{ fontSize: 17, opacity: 0.9, lineHeight: 1.6, maxWidth: 620, margin: '0 auto 12px' }}>
            Perfect for placement season, internship applications, and building your first professional network. AI turns your projects, education, and skills into a profile recruiters actually find.
          </p>
          <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 24 }}>5-min form &rarr; AI generates in ~60 sec &rarr; paste with our guide in ~10 min</p>
          <a href="#pricing" style={{ display: 'inline-block', background: 'white', color: '#0A66C2', padding: '14px 36px', borderRadius: 50, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
            See Plans — From &#8377;199 &rarr;
          </a>
          <p style={{ fontSize: 13, opacity: 0.7, marginTop: 12 }}>500+ profiles built &bull; One-time payment &bull; No LinkedIn login needed</p>
        </div>
      </section>

      {/* Perfect For */}
      <section style={{ background: 'white', padding: '48px 20px', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', marginBottom: 8 }}>Perfect for</h2>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>Built specifically for students, freshers, and anyone starting their LinkedIn journey</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, textAlign: 'left' }}>
            {[
              { icon: '🎓', text: 'Final year students (placement season)' },
              { icon: '☀️', text: 'Summer internship applicants' },
              { icon: '🚀', text: 'Recent graduates (0-1 year)' },
              { icon: '💼', text: 'First-time LinkedIn users' },
              { icon: '🔄', text: 'Career changers starting fresh' },
              { icon: '📝', text: 'Internshala / Unstop / campus portal applicants' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0F7FF', borderRadius: 10, padding: '14px 16px' }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Campus Reality */}
      <section style={{ background: '#F8FAFC', padding: '40px 20px', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#191919', textAlign: 'center', marginBottom: 8 }}>Built for Campus Reality</h2>
          <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 }}>We turn what you already have into a profile that gets noticed</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {[
              { icon: '🔬', title: 'No internship yet?', desc: 'Your projects, coursework, hackathons, and club activities become compelling experience bullets. AI knows how to frame academic work for recruiters.' },
              { icon: '📅', title: '2-month summer intern?', desc: 'Short internships get framed with impact and metrics. "Assisted with testing" becomes "Executed 200+ test cases reducing bug escape rate by 15%."' },
              { icon: '🎯', title: 'Placement season prep?', desc: 'Headline + skills aligned to campus drives — SDE, analyst, product, consulting. One LinkedIn profile works for Easy Apply, company portals, and referrals.' },
              { icon: '📱', title: 'Internshala / Unstop ready?', desc: 'Same LinkedIn profile works across all platforms. Recruiters on Internshala, Unstop, and LinkedIn search the same keywords.' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>{item.title}</span>
                </div>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
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
          <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>One-time payment. No subscription. AI generates in ~60 seconds after form submission.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28, fontSize: 13, color: '#666' }}>
            <span>&#128274; Secure UPI/Card payment via Razorpay</span>
            <span>&bull;</span>
            <a href="/refund" style={{ color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>Refund policy</a>
            <span>&bull;</span>
            <span>Your data is never shared</span>
          </div>

          {!selectedPlan ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 900, margin: '0 auto' }}>
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
                    display: 'flex',
                    flexDirection: 'column',
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
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
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

          {/* Referral Code */}
          <ReferralCodeRedeemer />
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '48px 20px', borderTop: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', textAlign: 'center', marginBottom: 32 }}>Frequently Asked Questions</h2>
          {[
            { q: 'I have zero work experience. Will this work?', a: 'Yes! Our AI specializes in fresher profiles. It turns your projects, coursework, hackathons, clubs, and skills into professional experience bullets that recruiters value.' },
            { q: 'I\'m preparing for placement season. When should I do this?', a: 'Ideally 2-4 weeks before campus drives start. Build your LinkedIn, start connecting with alumni and recruiters, and apply on company portals with the same profile.' },
            { q: 'Does this work for internship applications?', a: 'Absolutely. Whether you\'re applying on Internshala, Unstop, LinkedIn, or college portals — the same headline and about section works everywhere. One profile, all platforms.' },
            { q: 'How is this different from just writing my own profile?', a: 'AI knows what recruiters search for. It uses the right keywords, action verbs, and metrics format that gets you found in LinkedIn search. Most student profiles score below 30/100 — ours score 70+.' },
            { q: 'How do I set up LinkedIn after getting the profile?', a: 'Every plan includes a 10-step setup guide with exact menu paths and common mistakes. You\'ll also get connection request templates for alumni, recruiters, and hiring managers.' },
            { q: 'Can I edit the profile after generation?', a: 'Yes. The generated text is yours to copy-paste and customize. We provide 3 headline variations so you can pick the style that fits you.' },
            { q: 'What if I already have a basic resume?', a: 'Upload it on the form page and we auto-fill all your details. Saves 5 minutes of typing.' },
            { q: 'Is this different from the Profile Roast?', a: 'Yes. The Roast is for people who already have a LinkedIn profile and want to improve it. Build is for creating a profile from scratch.' },
            { q: 'Do I need to share my LinkedIn login?', a: 'No. We never ask for your LinkedIn password. You fill a form, we generate the text, you paste it yourself.' },
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

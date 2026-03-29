'use client';

import { useState, useRef, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const BETA_BASELINE = 25;

// ─── Types ───
interface TeaserResult {
  score: number;
  issues: string[];
  teaser_roast: string;
  teaser_id: string | null;
}

// ─── Score Badge ───
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'var(--li-green)' :
    score >= 40 ? 'var(--li-orange)' :
    'var(--li-red)';
  return (
    <div className="flex items-center gap-3">
      <div className="text-4xl font-extrabold" style={{ color }}>{score}</div>
      <div className="text-sm" style={{ color: 'var(--li-text-secondary)' }}>/ 100</div>
    </div>
  );
}

// ─── LiveCounter ───
function LiveCounter() {
  const [count, setCount] = useState<number | null>(null);

  useState(() => {
    fetch(`${API_URL}/api/stats`)
      .then(r => r.json())
      .then(d => setCount(d.total ?? 0))
      .catch(() => setCount(0));
  });

  if (count === null) return null;

  return (
    <p className="text-sm text-center mt-4" style={{ color: 'var(--li-text-secondary)' }}>
      {BETA_BASELINE + count}+ professionals improved their LinkedIn
    </p>
  );
}

// ─── Pricing Card ───
function PricingCard({
  plan,
  price,
  features,
  highlighted,
  onSelect,
}: {
  plan: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className="relative flex flex-col p-6 rounded-lg w-full"
      style={{
        background: 'var(--li-card)',
        border: highlighted ? '2px solid var(--li-blue)' : '1px solid var(--li-border)',
        borderRadius: 'var(--li-radius)',
        boxShadow: 'var(--li-shadow)',
      }}
    >
      {highlighted && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-white rounded-full"
          style={{ background: 'var(--li-blue)' }}
        >
          Most Popular
        </div>
      )}
      <div
        className="text-xs font-semibold tracking-widest uppercase mb-2"
        style={{ color: highlighted ? 'var(--li-blue)' : 'var(--li-text-secondary)' }}
      >
        {plan}
      </div>
      <div className="text-3xl font-bold mb-4" style={{ color: 'var(--li-text-primary)' }}>
        {price}
      </div>
      <ul className="flex-1 space-y-2 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--li-text-primary)' }}>
            <span style={{ color: 'var(--li-green)' }}>&#10003;</span>
            {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        className="w-full py-3 rounded-full text-white font-semibold text-base cursor-pointer"
        style={{ background: 'var(--li-blue)', minHeight: '48px' }}
      >
        Get {plan} &rarr;
      </button>
      <p className="text-xs text-center mt-3" style={{ color: 'var(--li-text-secondary)' }}>
        One-time payment. 100% private &mdash; results in 60-90 seconds.
      </p>
    </div>
  );
}

// ─── Avatar Helper ───
function avatarUrl(name: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(/\s/g, '').replace('.', '')}`;
}

// ─── RoastCardSmall (floating) ───
function RoastCardSmall({ name, title, roast, score_before, score_after, originalHeadline }: {
  name: string; title: string; roast: string; score_before: number; score_after: number; originalHeadline?: string;
}) {
  return (
    <div className="w-[260px] min-h-[150px] bg-white border border-[#e5e7eb] rounded-lg shadow-md p-4 text-left">
      <div className="flex items-center gap-2">
        <img
          src={avatarUrl(name)}
          alt={name}
          className="w-9 h-9 rounded-full flex-shrink-0 bg-gray-200 object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div>
          <div className="text-[14px] font-semibold text-[#191919]">{name}</div>
          <div className="text-[12px] text-gray-500">{title}</div>
        </div>
      </div>
      {originalHeadline && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 6, padding: '6px 10px', marginTop: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#CC1016', marginBottom: 3 }}>&#10007; Their Headline</div>
          <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{originalHeadline}</div>
        </div>
      )}
      <div className="mt-3 bg-[rgba(232,82,10,0.08)] border-l-4 border-[#E16B00] p-3 rounded-r-md">
        <div className="text-[13px] font-semibold text-[#E16B00] mb-1">&#128293; AI Roast</div>
        <div className="text-[13px] leading-snug break-words text-gray-800">{roast}</div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[13px] text-red-600 font-semibold">{score_before}</span>
        <span className="text-[12px]">&rarr;</span>
        <span className="text-[15px] text-green-700 font-bold">{score_after}</span>
        <span className="bg-[#DCFCE7] text-[#057642] text-[12px] font-bold px-2 py-[2px] rounded-full">
          +{score_after - score_before} pts
        </span>
      </div>
    </div>
  );
}

// ─── RewriteCardSmall (floating) ───
function RewriteCardSmall({ name, location, before, after, score_before, score_after }: {
  name: string; location: string; before: string; after: string; score_before: number; score_after: number;
}) {
  return (
    <div className="w-[260px] bg-white border border-[#e5e7eb] rounded-lg shadow-md overflow-hidden">
      <div className="bg-[#004182] px-3 py-2">
        <span className="text-[12px] font-bold text-white">&#9997;&#65039; Profile Rewrite</span>
      </div>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1">
        <img
          src={avatarUrl(name)}
          alt={name}
          className="w-8 h-8 rounded-full flex-shrink-0 bg-[#E5E7EB] object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div>
          <div className="text-[14px] font-semibold text-[#191919] leading-tight">{name}</div>
          <div className="text-[12px] text-gray-500 leading-tight">{location}</div>
        </div>
      </div>
      <div className="mx-4 mt-2 mb-1 bg-[#FEE2E2] border-l-[3px] border-[#CC1016] rounded-r px-2 py-1">
        <div className="text-[10px] font-bold text-[#CC1016] mb-[2px]">&#10007; Before</div>
        <div className="text-[12px] text-gray-500 line-through leading-snug break-words">
          {before}
        </div>
      </div>
      <div className="mx-4 mb-2 bg-[#DCFCE7] border-l-[3px] border-[#057642] rounded-r px-2 py-1">
        <div className="text-[10px] font-bold text-[#057642] mb-[2px]">&#10003; After</div>
        <div className="text-[13px] font-semibold text-[#191919] leading-snug break-words">
          {after}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap px-4 pb-3">
        <span className="text-[12px] text-[#666]">Score:</span>
        <span className="text-[13px] font-bold text-[#CC1016]">{score_before}</span>
        <span className="text-[12px] text-[#666]">&rarr;</span>
        <span className="text-[15px] font-bold text-[#057642]">{score_after}</span>
        <span className="bg-[#DCFCE7] text-[#057642] text-[12px] font-bold px-2 py-[1px] rounded-full ml-1">
          +{score_after - score_before} pts
        </span>
      </div>
    </div>
  );
}

// ─── FloatingCards ───
function FloatingCards() {
  return (
    <>
      {/* TOP LEFT — Roast */}
      <div className="hidden xl:block absolute top-[60px] left-[-140px] z-0 rotate-[-3deg] opacity-85 pointer-events-none transition-all duration-300 hover:opacity-100 hover:rotate-0 hover:scale-[1.03] hover:z-20 hover:pointer-events-auto">
        <RoastCardSmall
          name="Priya M."
          title="Software Engineer · Bangalore"
          roast="Your headline lists every skill you have ever googled but forgets what you actually do."
          score_before={28}
          score_after={76}
          originalHeadline="Software Engineer | Python | Java | AWS | Docker | React | Node.js | Seeking new opportunities"
        />
      </div>
      {/* BOTTOM LEFT — Roast */}
      <div className="hidden xl:block absolute top-[380px] left-[-160px] z-0 rotate-[-1deg] opacity-85 pointer-events-none transition-all duration-300 hover:opacity-100 hover:rotate-0 hover:scale-[1.03] hover:z-20 hover:pointer-events-auto">
        <RoastCardSmall
          name="Rahul S."
          title="MBA Graduate · Delhi"
          roast="Aspiring Professional is the career equivalent of a menu that says food — completely useless."
          score_before={22}
          score_after={71}
          originalHeadline="Aspiring Professional | Hardworking | Passionate | MBA Graduate | Open to work | Delhi NCR"
        />
      </div>
      {/* TOP RIGHT — Rewrite */}
      <div className="hidden xl:block absolute top-[50px] right-[-140px] z-0 rotate-[3deg] opacity-85 pointer-events-none transition-all duration-300 hover:opacity-100 hover:rotate-0 hover:scale-[1.03] hover:z-20 hover:pointer-events-auto">
        <RewriteCardSmall
          name="Sneha R."
          location="HR Executive · Mumbai"
          before="HR Executive | Talent Acquisition | HR Operations | Onboarding"
          after="HR Executive | Built Hiring for 500+ Employees | Cut Time-to-Hire 40%"
          score_before={38}
          score_after={84}
        />
      </div>
      {/* BOTTOM RIGHT — Rewrite */}
      <div className="hidden xl:block absolute top-[400px] right-[-160px] z-0 rotate-[1deg] opacity-85 pointer-events-none transition-all duration-300 hover:opacity-100 hover:rotate-0 hover:scale-[1.03] hover:z-20 hover:pointer-events-auto">
        <RewriteCardSmall
          name="Arjun T."
          location="BDM · Pune"
          before="Business Development Manager | Results-driven | Passionate about growth"
          after={"BDM | Generated \u20b92.4Cr Pipeline in FY24 | EdTech & SaaS Specialist"}
          score_before={31}
          score_after={78}
        />
      </div>
    </>
  );
}

// ─── StatsRow ───
function StatsRow() {
  const [profileCount, setProfileCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const target = 500;
    const steps = 60;
    const increment = target / steps;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setProfileCount(Math.round(current));
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #E0E0E0',
        padding: '12px 0',
        margin: '20px 0',
        display: 'flex',
        justifyContent: 'center',
        gap: 40,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#191919' }}>{profileCount}+</div>
        <div style={{ fontSize: 12, color: '#888' }}>Profiles Roasted</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#191919' }}>+42 pts</div>
        <div style={{ fontSize: 12, color: '#888' }}>Avg Improvement</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#191919' }}>60s</div>
        <div style={{ fontSize: 12, color: '#888' }}>To Get Results</div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function Home() {
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [teaser, setTeaser] = useState<TeaserResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);

  const pricingRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<HTMLDivElement>(null);
  const heroInputRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);

  // Live activity indicator — initialize on client only to avoid hydration mismatch
  const [recentCount, setRecentCount] = useState(12);
  useEffect(() => {
    setRecentCount(Math.floor(Math.random() * 8) + 8);
    const interval = setInterval(() => {
      setRecentCount(Math.floor(Math.random() * 8) + 8);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const [rateLimited, setRateLimited] = useState(false);

  // Auto scroll to result when teaser loads
  useEffect(() => {
    if (teaser && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [teaser]);

  // ── Teaser submit ──
  async function handleTeaserSubmit() {
    const trimmed = headline.trim();
    if (!trimmed || trimmed.length < 10) {
      alert('Please paste your complete LinkedIn headline. It should be at least a few words.');
      return;
    }
    if (trimmed.length > 500) {
      alert('Headline is too long. Please paste only your LinkedIn headline, not your full profile.');
      return;
    }
    if (!/[a-zA-Z\u0900-\u097F]/.test(trimmed)) {
      alert('Please paste your actual LinkedIn headline.');
      return;
    }

    // Frontend rate limit (localStorage)
    const today = new Date().toISOString().split('T')[0];
    const lsKey = `teaser_count_${today}`;
    const count = parseInt(localStorage.getItem(lsKey) || '0', 10);
    if (count >= 5) {
      setRateLimited(true);
      return;
    }

    setLoading(true);
    setSubmitted(true);
    try {
      const res = await fetch(`${API_URL}/api/teaser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: headline.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeaser(data);
        localStorage.setItem(lsKey, String(count + 1));
      } else if (res.status === 429) {
        setRateLimited(true);
      } else {
        alert(data.errors?.[0] || data.error || 'Something went wrong');
      }
    } catch {
      alert('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Email submit ──
  async function handleEmailSubmit() {
    if (!email.trim() || !teaser?.teaser_id) return;
    try {
      await fetch(`${API_URL}/api/teaser/${teaser.teaser_id}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      setEmailSaved(true);
    } catch { /* ignore */ }
    scrollToPricing();
  }

  function scrollToPricing() {
    setShowPricing(true);
    setTimeout(() => pricingRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function handlePlanSelect(plan: 'standard' | 'pro') {
    setSelectedPlan(plan);
    setShowPricing(true);
    setTimeout(() => inputFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  function scrollToHeroInput() {
    heroInputRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen pb-16">
      {/* ─── Top Bar ─── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <a href="/recover" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          Already got roasted? Find your burn report &rarr;
        </a>
      </div>
      {/* ─── Hero with Floating Cards ─── */}
      <div className="relative max-w-5xl mx-auto overflow-visible px-6">
        <FloatingCards />

        <section className="relative z-10 max-w-2xl mx-auto text-center px-4 pt-12 pb-8">
          {/* CHANGE 1 — Headline */}
          <h1 className="leading-tight mb-1" style={{ fontSize: 36, fontWeight: 900, color: '#191919' }}>
            Your LinkedIn Profile is Costing You
          </h1>
          <div className="mb-3" style={{ fontSize: 40, fontWeight: 900, color: '#0A66C2' }}>
            &#8377;10 Lakhs Every Year.
          </div>
          <p className="mb-4" style={{ fontSize: 18, color: '#666' }}>
            AI shows exactly why recruiters skip you. Fix it in 60 seconds.
          </p>

          {/* CHANGE 2 — Stats Row */}
          <StatsRow />

          {/* Curiosity hook */}
          <p className="text-center text-[14px] italic text-[#666666] mb-3">
            Most LinkedIn profiles score below 40. What is yours?
          </p>

          {/* ─── LinkedIn-style composer ─── */}
          <div ref={heroInputRef}>
            {/* CHANGE 3 — Label above composer */}
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0A66C2', letterSpacing: 1, textTransform: 'uppercase' as const, marginBottom: 8, textAlign: 'left' }}>
              Step 1 — Paste your LinkedIn headline
            </div>
            <div
              className="flex items-start gap-3 p-6 rounded-xl text-left bg-white shadow-lg"
              style={{
                border: inputFocused ? '2px solid #0A66C2' : '1px solid var(--li-border)',
                boxShadow: inputFocused ? '0 0 0 4px rgba(10,102,194,0.12), 0 4px 12px rgba(0,0,0,0.08)' : undefined,
                transition: 'border 0.2s, box-shadow 0.2s',
              }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg mt-1">
                &#128100;
              </div>
              <div className="flex-1">
                <textarea
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={"Paste your headline here...\ne.g. Senior Manager | B2B Sales | 6+ Years | Fortune 500 Clients"}
                  rows={2}
                  maxLength={500}
                  className="w-full resize-none border-none outline-none bg-transparent text-base"
                  style={{ color: 'var(--li-text-primary)' }}
                />
                {/* CHANGE 4 — CTA Button */}
                <button
                  onClick={handleTeaserSubmit}
                  disabled={loading || headline.trim().length < 10}
                  onMouseEnter={() => setCtaHovered(true)}
                  onMouseLeave={() => setCtaHovered(false)}
                  className="mt-2 w-full rounded-full text-white cursor-pointer disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #0A66C2, #004182)',
                    fontSize: 16,
                    fontWeight: 700,
                    padding: '16px 32px',
                    borderRadius: 50,
                    boxShadow: '0 4px 16px rgba(10,102,194,0.4)',
                    border: 'none',
                    transform: ctaHovered ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'transform 0.2s',
                  }}
                >
                  {loading ? 'Analyzing...' : 'Reveal What\u2019s Wrong With Your Profile \u2192'}
                </button>
              </div>
            </div>
            {headline.length > 0 && headline.trim().length < 10 && (
              <p className="mt-2 text-center" style={{ fontSize: 13, color: '#CC1016' }}>
                Please paste your complete LinkedIn headline — at least a few words.
              </p>
            )}
            {headline.trim().length > 220 && (
              <p className="mt-2 text-center" style={{ fontSize: 12, color: '#E16B00' }}>
                This looks longer than a typical headline (220 chars). Make sure you{"'"}re pasting only your headline, not your About section.
              </p>
            )}
          </div>
          {rateLimited && (
            <div className="mt-3 p-4 rounded-lg text-sm" style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}>
              <p className="font-semibold mb-1" style={{ color: '#92400E' }}>
                You{"'"}ve used your 5 free previews today.
              </p>
              <p className="mb-3" style={{ color: '#92400E' }}>
                Come back tomorrow or get your full roast + rewrite for just &#8377;299.
              </p>
              <button
                onClick={() => { setRateLimited(false); scrollToPricing(); }}
                className="px-5 py-2.5 rounded-full text-white font-semibold text-sm"
                style={{ background: '#0A66C2' }}
              >
                Get Full Roast for &#8377;299 &rarr;
              </button>
            </div>
          )}
          {/* CHANGE 5 — Trust line */}
          {!rateLimited && (
            <p className="text-center mt-3" style={{ fontSize: 12, color: '#888' }}>
              No login &#8226; 60-90 sec &#8226; Used by 500+ professionals
            </p>
          )}

          {!submitted && <LiveCounter />}

          {!submitted && (
            <p className="text-[13px] font-medium text-[#E16B00] text-center mt-1">
              &#128293; {recentCount} people got roasted in the last 10 minutes
            </p>
          )}

          {/* Fix 4 — Loading indicator */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 24, marginTop: 16 }}>
              <div style={{ fontSize: 14, color: '#0A66C2', fontWeight: 600, marginBottom: 8 }}>
                Analyzing your headline...
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                This takes 3-5 seconds
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ─── CHANGE 6 — Value Cards ─── */}
      {!submitted && <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(232,82,10,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>
              &#128293;
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 4 }}>Brutal Roast</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>See exactly what makes recruiters ignore your profile.</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(10,102,194,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>
              &#9997;&#65039;
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 4 }}>Full Rewrite</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>Turn your profile into something recruiters actually respond to.</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: 20, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(5,118,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 22 }}>
              &#128200;
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 4 }}>Score Improvement</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>Track how much stronger your profile becomes instantly.</div>
          </div>
        </div>
      </div>}

      {/* ─── Teaser Result ─── */}
      {teaser && (
        <section ref={resultRef} className="max-w-2xl mx-auto px-4 pb-8" style={{ animation: 'resultAppear 0.5s ease forwards' }}>
          {/* Score card */}
          <div
            className="p-6 rounded-lg mb-4"
            style={{
              background: 'var(--li-card)',
              border: '1px solid var(--li-border)',
              borderRadius: 'var(--li-radius)',
              boxShadow: 'var(--li-shadow)',
            }}
          >
            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--li-text-secondary)' }}>
              Your Headline Score
            </p>
            <ScoreBadge score={teaser.score} />

            <p className="text-xs mt-3" style={{ color: 'var(--li-text-secondary)' }}>
              Headline only. Your full profile score is usually 30-40 points lower.
            </p>

            <p className="text-xs mt-2 font-medium" style={{ color: teaser.score < 70 ? 'var(--li-red)' : 'var(--li-green)' }}>
              {teaser.score < 50
                ? 'Your headline scores lower than 80% of profiles that land interviews.'
                : teaser.score < 70
                ? 'Your headline scores lower than 72% of profiles that land interviews.'
                : teaser.score < 85
                ? 'Your headline is above average. But top candidates score above 90 on their FULL profile — not just headline.'
                : 'Your headline scores higher than 78% of profiles we have analyzed. But top candidates score above 90 on their FULL profile — not just headline.'}
            </p>
          </div>

          {/* Roastmaster card */}
          {teaser.teaser_roast && (
            <div
              className="p-4 rounded-lg mb-4"
              style={{
                background: 'var(--li-card)',
                borderLeft: '3px solid #E16B00',
                borderRadius: 'var(--li-radius)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                padding: 16,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: 'var(--li-blue)', color: 'white' }}>
                  AI
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--li-text-primary)' }}>
                    &#128293; The LinkedIn Roastmaster
                  </p>
                  <p className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>
                    AI Career Critic
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed italic" style={{ color: 'var(--li-text-primary)' }}>
                {teaser.teaser_roast}
              </p>
            </div>
          )}

          {/* Locked hidden issues */}
          <div
            className="p-4 rounded-lg mb-4"
            style={{
              background: 'var(--li-card)',
              border: '1px solid var(--li-border)',
              borderRadius: 'var(--li-radius)',
              boxShadow: 'var(--li-shadow)',
            }}
          >
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--li-text-primary)' }}>
              What we found beyond your headline:
            </p>
            <div className="space-y-2">
              {['2 critical profile issues hidden', 'ATS keyword gaps hidden', 'Experience section assessment hidden'].map((item, i) => (
                <p key={i} className="text-sm" style={{ color: '#AAAAAA', filter: 'blur(0.5px)' }}>
                  &#128274; {item}
                </p>
              ))}
            </div>
          </div>

          {/* Dynamic CTA based on score (4 tiers) */}
          <div
            className="p-6 rounded-lg mb-4"
            style={{
              background: 'var(--li-card)',
              border: '1px solid var(--li-border)',
              borderRadius: 'var(--li-radius)',
              boxShadow: 'var(--li-shadow)',
            }}
          >
            {teaser.score < 50 ? (
              <>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
                  Your headline needs work &mdash; and that is just the start.
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--li-text-secondary)' }}>
                  A weak headline means recruiters never even get to your About or Experience sections.
                  Your full profile likely has even bigger gaps holding you back.
                </p>
                <button
                  onClick={scrollToPricing}
                  className="w-full py-3 rounded-full text-white text-sm font-semibold cursor-pointer border-none"
                  style={{ background: 'var(--li-blue)', minHeight: '48px' }}
                >
                  See the full picture &mdash; &#8377;299
                </button>
              </>
            ) : teaser.score < 70 ? (
              <>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
                  Your headline has potential. Your full profile likely has bigger gaps.
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--li-text-secondary)' }}>
                  A decent headline gets you noticed, but what happens next depends on your About and
                  Experience sections. Most profiles in this range have 3-5 fixable issues hiding below the headline.
                </p>
                <button
                  onClick={scrollToPricing}
                  className="w-full py-3 rounded-full text-white text-sm font-semibold cursor-pointer border-none"
                  style={{ background: 'var(--li-blue)', minHeight: '48px' }}
                >
                  Find out what is holding you back &mdash; &#8377;299
                </button>
              </>
            ) : teaser.score < 85 ? (
              <>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
                  Your headline is decent. But recruiters read further than the headline.
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--li-text-secondary)' }}>
                  A good headline gets you 6 seconds of recruiter attention. What happens next depends
                  entirely on your About and Experience sections. 60% of decent-headline profiles still
                  lose out because of weak supporting sections.
                </p>
                <button
                  onClick={scrollToPricing}
                  className="w-full py-3 rounded-full text-white text-sm font-semibold cursor-pointer border-none"
                  style={{ background: 'var(--li-blue)', minHeight: '48px' }}
                >
                  Find out if your full profile matches your headline &mdash; &#8377;299
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
                  Your headline is strong. Your full profile might not be.
                </p>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--li-text-secondary)' }}>
                  A strong headline gets you 6 seconds of recruiter attention. What happens next depends
                  entirely on your About and Experience sections. 75% of strong-headline profiles still
                  fail ATS screening because of keyword gaps.
                </p>
                <button
                  onClick={scrollToPricing}
                  className="w-full py-3 rounded-full text-white text-sm font-semibold cursor-pointer border-none"
                  style={{ background: 'var(--li-blue)', minHeight: '48px' }}
                >
                  Find out if your full profile matches your headline &mdash; &#8377;299
                </button>
              </>
            )}

            <LiveCounter />
          </div>

          {/* ─── Soft Email Capture ─── */}
          {!showPricing && (
            <div
              className="p-6 rounded-lg"
              style={{
                background: 'var(--li-card)',
                border: '1px solid var(--li-border)',
                borderRadius: 'var(--li-radius)',
                boxShadow: 'var(--li-shadow)',
              }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--li-text-primary)' }}>
                Enter your email to see your full breakdown (optional)
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
                  style={{
                    border: '1px solid var(--li-border)',
                    color: 'var(--li-text-primary)',
                    minHeight: '48px',
                  }}
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={!email.trim()}
                  className="px-6 py-3 rounded-full text-white font-semibold text-sm cursor-pointer disabled:opacity-50"
                  style={{ background: 'var(--li-blue)', minHeight: '48px' }}
                >
                  Get Full Report
                </button>
              </div>
              <button
                onClick={scrollToPricing}
                className="mt-3 text-sm font-medium cursor-pointer bg-transparent border-none"
                style={{ color: 'var(--li-blue)' }}
              >
                Skip &rarr;
              </button>
            </div>
          )}
        </section>
      )}

      {/* ─── Pricing ─── */}
      {(showPricing || teaser) && (
        <section ref={pricingRef} className="max-w-3xl mx-auto px-4 py-12">
          <h2
            className="text-2xl font-bold text-center mb-2"
            style={{ color: 'var(--li-text-primary)' }}
          >
            Get Your Full Roast + Rewrite
          </h2>
          <p className="text-center text-sm mb-8" style={{ color: 'var(--li-text-secondary)' }}>
            Choose your plan. Results delivered in under 60 seconds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricingCard
              plan="Standard"
              price="&#8377;299"
              features={[
                'Full 6-point roast with humor',
                'Before & After score breakdown',
                'Complete headline rewrite',
                'Complete about section rewrite',
                'Experience bullet rewrites',
                'Shareable roast card image',
              ]}
              onSelect={() => handlePlanSelect('standard')}
            />
            <PricingCard
              plan="Pro"
              price="&#8377;599"
              highlighted
              features={[
                'Everything in Standard',
                '5 headline variations',
                '10-15 ATS-optimized keywords',
                'Job description matcher',
                'Custom cover letter',
                'Shareable roast card image',
                'Priority processing',
              ]}
              onSelect={() => handlePlanSelect('pro')}
            />
          </div>
        </section>
      )}

      {/* ─── Profile Input Form (after plan selection) ─── */}
      {selectedPlan && (
        <section ref={inputFormRef} className="max-w-2xl mx-auto px-4 pb-12">
          <ProfileInputForm
            plan={selectedPlan}
            teaserId={teaser?.teaser_id || null}
            email={email}
          />
        </section>
      )}

      {/* ─── CHANGE 8 — Bottom Urgency Section ─── */}
      <section style={{ maxWidth: 700, margin: '32px auto', padding: '0 16px' }}>
        <div
          style={{
            background: '#0A66C2',
            borderRadius: 16,
            padding: '40px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 8 }}>
            Stop losing opportunities.
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 24 }}>
            Every day with a weak profile is another recruiter who scrolled past you.
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>3x</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>More recruiter views</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>70%</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Fewer views if score &lt; 40</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>&#8377;299</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>One time, no subscription</div>
            </div>
          </div>
          <button
            onClick={scrollToHeroInput}
            style={{
              background: 'white',
              color: '#0A66C2',
              fontSize: 15,
              fontWeight: 700,
              padding: '14px 32px',
              borderRadius: 50,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Get My Score Free &#8594;
          </button>
        </div>
      </section>

      {/* ─── Trust Badges ─── */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '\uD83D\uDD12', text: 'We never access your LinkedIn account' },
            { icon: '\uD83D\uDDD1\uFE0F', text: 'Your profile data is deleted after 30 days' },
            { icon: '\uD83D\uDC41\uFE0F', text: '100% AI — no humans read your profile' },
            { icon: '\u23F1\uFE0F', text: '100% private — results in 60-90 seconds' },
          ].map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg text-sm"
              style={{
                background: 'var(--li-card)',
                border: '1px solid var(--li-border)',
                borderRadius: 'var(--li-radius)',
                color: 'var(--li-text-secondary)',
              }}
            >
              <span className="text-lg">{badge.icon}</span>
              {badge.text}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

// ─── Profile Input Form ───
function ProfileInputForm({
  plan,
  teaserId,
  email: initialEmail,
}: {
  plan: 'standard' | 'pro';
  teaserId: string | null;
  email: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [rawPaste, setRawPaste] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !rawPaste.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          plan,
          profile_data: {
            raw_paste: rawPaste.trim(),
          },
          job_description: plan === 'pro' ? jobDescription.trim() || undefined : undefined,
          teaser_id: teaserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.errors?.[0] || data.error || 'Failed to create order');
        return;
      }
      if (data.cached) {
        window.location.href = `/results/${data.order_id}`;
        return;
      }
      if (data.razorpay_order_id) {
        openRazorpay(data, email.trim());
      }
    } catch {
      alert('Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  }

  function openRazorpay(orderData: any, userEmail: string) {
    const options = {
      key: orderData.razorpay_key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Profile Roaster',
      description: `${plan === 'pro' ? 'Pro' : 'Standard'} LinkedIn Roast`,
      order_id: orderData.razorpay_order_id,
      prefill: { email: userEmail },
      theme: { color: '#0A66C2' },
      handler: function () {
        window.location.href = `/results/${orderData.order_id}`;
      },
      modal: {
        ondismiss: function () {
          alert('Payment cancelled. Your profile is saved — complete payment when ready.');
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        background: 'var(--li-card)',
        border: '1px solid var(--li-border)',
        borderRadius: 'var(--li-radius)',
        boxShadow: 'var(--li-shadow)',
      }}
    >
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Paste Your LinkedIn Profile
      </h3>
      <p className="text-xs mb-1" style={{ color: 'var(--li-text-secondary)' }}>
        {plan === 'pro' ? 'Pro Plan — \u20b9599' : 'Standard Plan — \u20b9299'}
        {teaserId && <span className="ml-2 opacity-60">(teaser linked)</span>}
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--li-text-secondary)' }}>
        Go to your LinkedIn profile &rarr; Select all (Ctrl+A) &rarr; Copy (Ctrl+C) &rarr; Paste below (Ctrl+V)
      </p>

      <div className="space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address *"
          className="w-full px-4 py-3 rounded-lg text-sm outline-none"
          style={{ border: '1px solid var(--li-border)', minHeight: '48px' }}
        />
        <textarea
          value={rawPaste}
          onChange={(e) => setRawPaste(e.target.value)}
          placeholder="Paste your entire LinkedIn profile here — headline, about, experience, everything. Our AI will parse it automatically. *"
          rows={10}
          className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
          style={{ border: '1px solid var(--li-border)' }}
        />
        {rawPaste.trim().length > 0 && (
          <p className="text-xs" style={{ color: rawPaste.trim().length > 100 ? 'var(--li-green)' : 'var(--li-orange)' }}>
            {rawPaste.trim().length} characters pasted
            {rawPaste.trim().length < 100 && ' — paste more for better results (include About + Experience)'}
          </p>
        )}
        {plan === 'pro' && (
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Job description to match against (optional — Pro feature)"
            rows={3}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
            style={{ border: '1px solid var(--li-border)' }}
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !email.trim() || !rawPaste.trim()}
          className="w-full py-3 rounded-full text-white font-semibold text-base cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--li-blue)', minHeight: '48px' }}
        >
          {submitting ? 'Creating order...' : `Pay \u20b9${plan === 'pro' ? '599' : '299'} & Get Roasted`}
        </button>
      </div>
    </div>
  );
}

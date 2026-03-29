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
function RoastCardSmall({ name, title, roast, score_before, score_after }: {
  name: string; title: string; roast: string; score_before: number; score_after: number;
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
      <div className="mt-3 bg-[rgba(232,82,10,0.08)] border-l-4 border-[#E16B00] p-3 rounded-r-md">
        <div className="text-[13px] font-semibold text-[#E16B00] mb-1">🔥 Brutal Truth</div>
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

// ─── Main Page ───
export default function Home() {
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [teaser, setTeaser] = useState<TeaserResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | null>(null);

  const pricingRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<HTMLDivElement>(null);

  // Live activity indicator — initialize on client only to avoid hydration mismatch
  const [recentCount, setRecentCount] = useState(12);
  useEffect(() => {
    setRecentCount(Math.floor(Math.random() * 8) + 8);
    const interval = setInterval(() => {
      setRecentCount(Math.floor(Math.random() * 8) + 8);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Teaser submit ──
  async function handleTeaserSubmit() {
    if (!headline.trim() || headline.trim().length < 10) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/teaser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: headline.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeaser(data);
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

  return (
    <main className="min-h-screen pb-16">
      {/* ─── Hero with Floating Cards ─── */}
      <div className="relative max-w-5xl mx-auto overflow-visible px-6">
        <FloatingCards />

        <section className="relative z-10 max-w-2xl mx-auto text-center px-4 pt-12 pb-8">
          <h1
            className="text-3xl md:text-4xl font-extrabold leading-tight mb-3"
            style={{ color: 'var(--li-text-primary)' }}
          >
            Your LinkedIn Profile is Invisible to Recruiters.
          </h1>
          <p className="text-base md:text-lg mb-8" style={{ color: 'var(--li-text-secondary)' }}>
            Get brutally roasted by AI &mdash; then get a complete rewrite.<br />
            Average improvement: 34&rarr;84. Takes 60 seconds.
          </p>

          {/* Curiosity hook */}
          <p className="text-center text-[14px] italic text-[#666666] mb-3">
            Most LinkedIn profiles score below 40. What is yours?
          </p>

          {/* ─── LinkedIn-style composer ─── */}
          <div
            className="flex items-start gap-3 p-6 rounded-xl text-left bg-white shadow-lg"
            style={{
              border: '1px solid var(--li-border)',
            }}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-lg mt-1">
              &#128100;
            </div>
            <div className="flex-1">
              <textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Paste your LinkedIn headline here..."
                rows={2}
                className="w-full resize-none border-none outline-none bg-transparent text-base"
                style={{ color: 'var(--li-text-primary)' }}
              />
              <button
                onClick={handleTeaserSubmit}
                disabled={loading || headline.trim().length < 10}
                className="mt-2 w-full md:w-auto px-6 py-3 rounded-full text-white font-semibold text-[15px] cursor-pointer disabled:opacity-50"
                style={{ background: 'var(--li-blue)', minHeight: '48px' }}
              >
                {loading ? 'Analyzing...' : 'See What\u2019s Wrong With Your Profile \u2192'}
              </button>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--li-text-secondary)' }}>
            No LinkedIn login. No credit card.
          </p>

          <LiveCounter />

          {/* Live activity indicator */}
          <p className="text-[13px] font-medium text-[#E16B00] text-center mt-1">
            🔥 {recentCount} people got roasted in the last 10 minutes
          </p>
        </section>
      </div>

      {/* ─── What You Get badges ─── */}
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto px-4 py-6">
        {[
          { emoji: '🔥', label: 'Brutal Roast' },
          { emoji: '✍️', label: 'Full Rewrite' },
          { emoji: '📈', label: 'Score Boost' },
          { emoji: '💡', label: 'Hidden Strengths' },
          { emoji: '🎯', label: 'ATS Keywords' },
        ].map((b) => (
          <span
            key={b.label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium"
            style={{
              background: 'var(--li-card)',
              border: '1px solid var(--li-border)',
              color: 'var(--li-text-secondary)',
            }}
          >
            {b.emoji} {b.label}
          </span>
        ))}
      </div>

      {/* ─── Teaser Result ─── */}
      {teaser && (
        <section className="max-w-2xl mx-auto px-4 pb-8">
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
                ? 'Your headline is above average. But top candidates score above 90 on their FULL profile \u2014 not just headline.'
                : 'Your headline scores higher than 78% of profiles we have analyzed. But top candidates score above 90 on their FULL profile \u2014 not just headline.'}
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
                    🔥 The LinkedIn Roastmaster
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
                  🔒 {item}
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

      {/* ─── Trust Badges ─── */}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '\uD83D\uDD12', text: 'We never access your LinkedIn account' },
            { icon: '\uD83D\uDDD1\uFE0F', text: 'Your profile data is deleted after 30 days' },
            { icon: '\uD83D\uDC41\uFE0F', text: '100% AI \u2014 no humans read your profile' },
            { icon: '\u23F1\uFE0F', text: '100% private \u2014 results in 60-90 seconds' },
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
          alert('Payment cancelled. Your profile is saved \u2014 complete payment when ready.');
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
        {plan === 'pro' ? 'Pro Plan \u2014 \u20b9599' : 'Standard Plan \u2014 \u20b9299'}
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
          placeholder="Paste your entire LinkedIn profile here \u2014 headline, about, experience, everything. Our AI will parse it automatically. *"
          rows={10}
          className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
          style={{ border: '1px solid var(--li-border)' }}
        />
        {rawPaste.trim().length > 0 && (
          <p className="text-xs" style={{ color: rawPaste.trim().length > 100 ? 'var(--li-green)' : 'var(--li-orange)' }}>
            {rawPaste.trim().length} characters pasted
            {rawPaste.trim().length < 100 && ' \u2014 paste more for better results (include About + Experience)'}
          </p>
        )}
        {plan === 'pro' && (
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Job description to match against (optional \u2014 Pro feature)"
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

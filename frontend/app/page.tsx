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

  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then(r => r.json())
      .then(d => setCount(d.total ?? 0))
      .catch(() => setCount(0));
  }, []);

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

// ─── ResumeCardSmall (floating) ───
function ResumeCardSmall({ name, role, atsScore, keywords }: {
  name: string; role: string; atsScore: number; keywords: string[];
}) {
  const color = atsScore >= 80 ? '#057642' : atsScore >= 60 ? '#0A66C2' : '#E16B00';
  return (
    <div className="w-[260px] bg-white border border-[#e5e7eb] rounded-lg shadow-md overflow-hidden">
      <div className="bg-[#004182] px-3 py-2 flex justify-between items-center">
        <span className="text-[12px] font-bold text-white">ATS Resume</span>
        <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: color, color: 'white' }}>{atsScore}%</span>
      </div>
      <div className="px-4 pt-3 pb-1">
        <div className="text-[14px] font-semibold text-[#191919]">{name}</div>
        <div className="text-[11px] text-gray-500">{role}</div>
      </div>
      <div className="px-4 py-2">
        <div className="text-[9px] font-bold text-[#374151] tracking-widest uppercase mb-1">Keywords Matched</div>
        <div className="flex flex-wrap gap-1">
          {keywords.map((kw, i) => (
            <span key={i} className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: '#DCFCE7', color: '#057642' }}>{kw}</span>
          ))}
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="h-1.5 rounded-full bg-gray-200">
          <div className="h-1.5 rounded-full" style={{ width: `${atsScore}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

// ─── FeatureCardSmall (floating) ───
function FeatureCardSmall({ icon, title, stat, desc }: {
  icon: string; title: string; stat: string; desc: string;
}) {
  return (
    <div className="w-[220px] bg-white border border-[#e5e7eb] rounded-lg shadow-md p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[18px]" dangerouslySetInnerHTML={{ __html: icon }} />
        <span className="text-[13px] font-bold text-[#191919]">{title}</span>
      </div>
      <div className="text-[24px] font-extrabold mb-1" style={{ color: '#0A66C2' }}>{stat}</div>
      <div className="text-[11px] text-gray-500 leading-snug">{desc}</div>
    </div>
  );
}

// ─── Transformation Showcase (hero right column) ───
function TransformationShowcase() {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E0E7F0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(10,102,194,0.08)' }}>
      {/* Header */}
      <div style={{ background: '#0F172A', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white', letterSpacing: 0.5 }}>Real Profile Transformation</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Priya M. &bull; Bangalore</span>
      </div>
      {/* Before */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ background: '#FEE2E2', color: '#CC1016', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>BEFORE</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#CC1016' }}>28<span style={{ fontSize: 13, fontWeight: 400, color: '#999' }}>/100</span></div>
        </div>
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#666', fontStyle: 'italic', lineHeight: 1.5 }}>
          &ldquo;Software Engineer | Python | Java | AWS | Docker | React | Node.js | Seeking new opportunities&rdquo;
        </div>
      </div>
      {/* Roast */}
      <div style={{ padding: '14px 20px', background: '#FFFBEB', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#E16B00', letterSpacing: 1, marginBottom: 6 }}>&#128293; AI ROAST</div>
        <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, fontStyle: 'italic' }}>
          &ldquo;Your headline lists every skill you have ever googled but forgets what you actually do. Recruiters see a grocery list, not a professional.&rdquo;
        </div>
      </div>
      {/* After */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ background: '#DCFCE7', color: '#057642', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>AFTER</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#057642' }}>76<span style={{ fontSize: 13, fontWeight: 400, color: '#999' }}>/100</span></div>
          <div style={{ background: '#057642', color: 'white', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>+48 pts</div>
        </div>
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#057642', fontWeight: 600, lineHeight: 1.5 }}>
          &ldquo;Full-Stack Engineer | Built 5 Production Apps Serving 50K+ Users | React + Node.js + AWS&rdquo;
        </div>
      </div>
      {/* Footer stats */}
      <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
        <div style={{ fontSize: 12, color: '#64748B' }}>500+ profiles improved</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0A66C2' }}>Avg +42 pts &uarr;</div>
      </div>
    </div>
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

// ─── Referral Code Redeemer ───
function ReferralCodeRedeemer({ product }: { product: 'roast' | 'build' }) {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [redeemEmail, setRedeemEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');

  async function handleRedeem() {
    if (!code.trim() || !redeemEmail.trim()) {
      setError('Please enter both code and email.');
      return;
    }
    if (product === 'roast' && (!headline.trim() || headline.trim().length < 10)) {
      setError('Please paste your LinkedIn headline (at least 10 characters).');
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
          headline: product === 'roast' ? headline.trim() : undefined,
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
          style={{ background: 'none', border: 'none', color: 'var(--li-text-secondary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
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
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }}
      />
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter code (e.g. ROAST-STD-XXXXX)"
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, fontFamily: 'monospace', boxSizing: 'border-box' }}
      />
      {product === 'roast' && (
        <textarea
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Paste your LinkedIn headline or full profile *"
          rows={3}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, resize: 'none', boxSizing: 'border-box' }}
        />
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleRedeem}
          disabled={redeeming}
          style={{
            flex: 1, padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: 'var(--li-blue)', color: 'white', fontSize: 13, fontWeight: 600,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const [rateLimited, setRateLimited] = useState(false);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const MAX_HEIGHT = 180;
      if (scrollHeight > MAX_HEIGHT) {
        textareaRef.current.style.height = MAX_HEIGHT + 'px';
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.height = scrollHeight + 'px';
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [headline]);

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
      <div style={{ background: 'white', borderBottom: '1px solid #E8E8E8', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#191919' }}>Roaster</span>
            </a>
            <a href="/dashboard" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 600 }}>Dashboard</a>
          </div>
          <a href="/recover" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>
            Lost results? Recover &rarr;
          </a>
        </div>
      </div>
      {/* ─── Hero (full-bleed gradient) ─── */}
      <div style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 40%, #F0F7FF 100%)', borderBottom: '1px solid #E0E7F0' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', paddingTop: 32, paddingBottom: 32, flexWrap: 'wrap' }}>
          {/* Left — primary conversion */}
          <div style={{ flex: '1 1 480px', minWidth: 0 }}>

        <section className="text-left">
          {/* CHANGE 1 — Headline */}
          <h1 className="leading-tight mb-1" style={{ fontSize: 38, fontWeight: 900, color: '#0F172A' }}>
            Your LinkedIn Profile is Costing You
          </h1>
          <div className="mb-3" style={{ fontSize: 42, fontWeight: 900, color: '#0A66C2' }}>
            &#8377;10 Lakhs Every Year.
          </div>
          <p className="mb-4" style={{ fontSize: 18, color: '#475569' }}>
            AI shows exactly why recruiters skip you. Fix it in 60 seconds.
          </p>

          {/* Curiosity hook */}
          <p className="text-[14px] italic text-[#666666] mb-3">
            Most LinkedIn profiles score below 40. What is yours?
          </p>

          {/* ─── LinkedIn-style composer ─── */}
          <div ref={heroInputRef}>
            {/* CHANGE 3 — Label above composer */}
            <div style={{ fontSize: 18, fontWeight: 700, color: '#0A66C2', marginBottom: 10, textAlign: 'left' }}>
              Step 1 of 2 — Paste your LinkedIn headline (free preview)
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
                  ref={textareaRef}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder={"Paste your headline here...\ne.g. Senior Manager | B2B Sales | 6+ Years | Fortune 500 Clients"}
                  rows={1}
                  maxLength={500}
                  className="w-full resize-none border-none outline-none bg-transparent text-[15px]"
                  style={{ color: 'var(--li-text-primary)', minHeight: 60, overflow: 'hidden', lineHeight: '1.6', padding: '8px 0' }}
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

          {/* Don't have LinkedIn CTA */}
          <div style={{ textAlign: 'center', marginTop: 18, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/build" target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#0B69C7', fontWeight: 700, textDecoration: 'none' }}>
              No LinkedIn? Build profile from scratch &rarr;
            </a>
            <a href="/pricing" style={{ fontSize: 14, color: '#057642', fontWeight: 700, textDecoration: 'none' }}>
              Just need a resume? See plans &rarr;
            </a>
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
          {!submitted && <LiveCounter />}

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
          {/* Right — transformation showcase (desktop only) */}
          <div className="hidden lg:block" style={{ flex: '1 1 340px', minWidth: 0 }}>
            <TransformationShowcase />
          </div>
        </div>
      </div>
      </div>

      {/* ─── Credibility Strip (full width) ─── */}
      <div style={{ background: 'white', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', padding: '16px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', fontSize: 13, color: '#666', fontWeight: 600 }}>
          <span>&#128274; No LinkedIn login needed</span>
          <span>&#9889; Results in 60-90 seconds</span>
          <span>&#128179; Secure UPI/Card via Razorpay</span>
          <span>&#128272; 100% private — data deleted in 30 days</span>
        </div>
      </div>

      {/* ─── CHANGE 6 — Value Cards ─── */}
      {!submitted && <div style={{ background: '#F8FAFC', padding: '28px 16px', borderBottom: '1px solid #E8E8E8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Row 1: Two main product cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 16 }}>
            {/* LinkedIn Roast + Rewrite */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E0E0E0', padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>&#128293;</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#191919' }}>LinkedIn Roast + Rewrite</div>
              </div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.65, marginBottom: 16, flex: 1 }}>
                AI scores your profile, roasts what{"'"}s wrong, and rewrites everything — headline, about section, experience bullets. Copy-paste into LinkedIn.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Before/After Score', 'AI Roast Points', 'Full Rewrite', 'Copy-Paste Ready'].map((t, i) => (
                  <span key={i} style={{ background: '#FEF2F2', color: '#CC1016', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 12 }}>From &#8377;299</div>
            </div>
            {/* ATS Resume Builder */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E0E0E0', padding: '24px 28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E0E7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>&#128196;</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#191919' }}>ATS Resume Builder</div>
              </div>
              <div style={{ fontSize: 14, color: '#555', lineHeight: 1.65, marginBottom: 16, flex: 1 }}>
                Turn your LinkedIn rewrite into an ATS-optimized resume. Match keywords to any job description. Download as PDF + TXT.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['25 Templates', 'ATS Score Match', 'PDF + TXT', 'Live Editor'].map((t, i) => (
                  <span key={i} style={{ background: '#E8F0FE', color: '#0A66C2', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6 }}>{t}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 12 }}>Included in all paid plans</div>
            </div>
          </div>
          {/* Row 2: Three feature chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '&#9997;&#65039;', title: '5 Headline Variations', desc: 'Pro plan includes multiple headline styles' },
              { icon: '&#128200;', title: 'Before/After Score', desc: 'Track exactly how much your profile improved' },
              { icon: '&#128274;', title: '100% Private', desc: 'No LinkedIn login. AI only. Data deleted in 30 days' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 10, border: '1px solid #E5E7EB', padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* ─── Teaser Result ─── */}
      {teaser && (
        <section ref={resultRef} style={{ background: '#F8FAFC', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8', padding: '28px 16px', animation: 'resultAppear 0.5s ease forwards' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
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
        </div>
        </section>
      )}

      {/* ─── Pricing ─── */}
      {(showPricing || teaser) && !selectedPlan && (
        <section ref={pricingRef} style={{ background: 'white', padding: '40px 16px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
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
                'Complete LinkedIn Roast + Rewrite',
                'ATS Resume Builder (any job, 15 templates, PDF + TXT)',
                '1 Cover Letter',
                'Free rescore anytime',
                'Shareable roast card',
              ]}
              onSelect={() => handlePlanSelect('standard')}
            />
            <PricingCard
              plan="Pro"
              price="&#8377;799"
              highlighted
              features={[
                'Everything in Standard',
                '5 Headline Variations',
                'All 25 premium templates',
                '3 Cover Letters (one per target job)',
                'Advanced ATS keyword matching',
                'Priority processing',
              ]}
              onSelect={() => handlePlanSelect('pro')}
            />
          </div>
          <p className="text-center text-sm mt-6" style={{ color: 'var(--li-text-secondary)', maxWidth: 600, margin: '24px auto 0' }}>
            Resume writers charge &#8377;3,000–15,000 and take days. We do roast + rewrite + resume in 90 seconds for &#8377;299.
          </p>
          <ReferralCodeRedeemer product="roast" />
        </div>
        </section>
      )}

      {/* ─── Profile Input Form (after plan selection) ─── */}
      {selectedPlan && (
        <section ref={inputFormRef} style={{ background: '#F8FAFC', padding: '28px 16px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Left — Form */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <ProfileInputForm
                plan={selectedPlan}
                teaserId={teaser?.teaser_id || null}
                email={email}
              />
            </div>
            {/* Right — Sticky sidebar (desktop) */}
            <div className="hidden lg:block" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 24 }}>
              <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 14, padding: '20px', marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 12 }}>What happens next</div>
                {[
                  { icon: '1', text: 'Paste your full LinkedIn profile (Ctrl+A)' },
                  { icon: '2', text: 'Pay securely via UPI/Card' },
                  { icon: '3', text: 'AI roasts + rewrites in ~60 seconds' },
                  { icon: '4', text: 'Copy-paste your new profile + download resume' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0A66C2', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{s.text}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: '16px', fontSize: 12, color: '#057642', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Secure & Private</div>
                Your data is processed by AI only. No humans read your profile. Deleted after 30 days.
              </div>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <a href="mailto:support@profileroaster.in" style={{ fontSize: 12, color: '#888', textDecoration: 'none' }}>Need help? support@profileroaster.in</a>
              </div>
            </div>
          </div>
        </div>
        </section>
      )}

      {/* ─── How It Works (full-width dark) ─── */}
      <section style={{ background: '#0F172A', padding: '40px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white', textAlign: 'center', marginBottom: 32 }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { num: '1', title: 'Get Roasted', desc: 'Paste your headline. AI tells you exactly what is wrong.', color: '#CC1016' },
              { num: '2', title: 'Get Rewritten', desc: 'AI rewrites your headline, about, and experience.', color: '#0A66C2' },
              { num: '3', title: 'See Your Score', desc: 'Before/after score shows exactly how much you improved.', color: '#057642' },
              { num: '4', title: 'Build Resume', desc: 'Turn your rewrite into an ATS resume for any job.', color: '#E16B00' },
            ].map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '24px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: step.color, color: 'white', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{step.num}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ATS Resume Showcase (full-width grey) ─── */}
      <section style={{ background: '#F3F2EF', padding: '40px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#191919', textAlign: 'center', marginBottom: 8 }}>ATS Resume Builder</h2>
          <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 28 }}>Included in all paid plans. Your LinkedIn rewrite becomes a resume in 60 seconds.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Left — Mock resume */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 14, padding: 20, overflow: 'hidden' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Priya Mehta</div>
              <div style={{ fontSize: 10, color: '#888', marginBottom: 10 }}>priya@email.com &bull; Mumbai</div>
              <div style={{ height: 1, background: '#E5E7EB', marginBottom: 10 }} />
              <div style={{ fontSize: 9, fontWeight: 700, color: '#374151', letterSpacing: 2, marginBottom: 6 }}>PROFESSIONAL SUMMARY</div>
              <div style={{ fontSize: 10, color: '#555', lineHeight: 1.5, marginBottom: 10 }}>Full-stack engineer with 5+ years building scalable React/Node applications. Led migration of monolith to microservices reducing deploy time by 73%...</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#374151', letterSpacing: 2, marginBottom: 6 }}>WORK EXPERIENCE</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#111', marginBottom: 2 }}>Senior Software Engineer — TechCorp</div>
              <div style={{ fontSize: 10, color: '#555', paddingLeft: 12 }}>&bull; Built React component library used by 12 teams<br />&bull; Reduced API response time by 45%</div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['React', 'Node.js', 'TypeScript', 'AWS'].map((kw, i) => (
                  <span key={i} style={{ background: '#DCFCE7', color: '#057642', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>{kw}</span>
                ))}
              </div>
            </div>
            {/* Right — Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, justifyContent: 'center' }}>
              {[
                { icon: '&#128196;', title: '25 Professional Templates', desc: 'ATS-friendly, modern, executive, creative — pick your style' },
                { icon: '&#127919;', title: 'ATS Score & Keywords', desc: 'Real-time keyword matching against job descriptions' },
                { icon: '&#9997;&#65039;', title: 'Live Editor', desc: 'Edit sections, drag to reorder, auto-save' },
                { icon: '&#128229;', title: 'PDF + TXT Download', desc: 'Download in both formats, ready for any application' },
              ].map((f, i) => (
                <div key={i} style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 2 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials (full-width white) ─── */}
      <section style={{ background: 'white', borderTop: '1px solid #E8E8E8', padding: '40px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#191919', textAlign: 'center', marginBottom: 32 }}>Real Results From Real Professionals</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { name: 'Arjun T.', role: 'BDM, Pune', quote: 'My score went from 31 to 78. Got 3 recruiter messages within a week of updating my profile.', before: 31, after: 78 },
              { name: 'Sneha R.', role: 'HR Executive, Mumbai', quote: 'The roast was painfully accurate. The rewrite was worth every rupee. Best Rs 299 I spent on my career.', before: 38, after: 84 },
              { name: 'Rahul S.', role: 'MBA Graduate, Delhi', quote: 'Used the ATS resume builder for 3 different job applications. Got interview calls for 2 of them.', before: 22, after: 71 },
            ].map((t, i) => (
              <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 14, padding: '24px 20px' }}>
                <div style={{ fontSize: 14, color: '#333', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>&ldquo;{t.quote}&rdquo;</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0A66C2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>{t.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: '#888' }}>{t.role}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#CC1016' }}>{t.before}</span>
                    <span style={{ color: '#ccc' }}>&rarr;</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#057642' }}>{t.after}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Urgency CTA (full-width blue) ─── */}
      <section style={{ background: 'linear-gradient(135deg, #004182 0%, #0A66C2 100%)', padding: '48px 16px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>Stop losing opportunities.</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Every day with a weak profile is another recruiter who scrolled past you.</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', marginBottom: 28 }}>
            {[
              { stat: '3x', label: 'More recruiter views' },
              { stat: '70%', label: 'Fewer views if score < 40' },
              { stat: '\u20B9299', label: 'One time, no subscription' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'white' }}>{s.stat}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={scrollToHeroInput} style={{ background: 'white', color: '#0A66C2', fontSize: 16, fontWeight: 700, padding: '16px 40px', borderRadius: 50, border: 'none', cursor: 'pointer' }}>
            Get My Score Free &#8594;
          </button>
        </div>
      </section>

      {/* ─── Trust Badges (full-width grey) ─── */}
      <section style={{ background: '#F3F2EF', padding: '32px 16px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '\uD83D\uDD12', text: 'We never access your LinkedIn account' },
              { icon: '\uD83D\uDDD1\uFE0F', text: 'Your profile data is deleted after 30 days' },
              { icon: '\uD83D\uDC41\uFE0F', text: '100% AI — no humans read your profile' },
              { icon: '\u23F1\uFE0F', text: '100% private — results in 60-90 seconds' },
            ].map((badge, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #E0E0E0', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#555' }}>
                <span style={{ fontSize: 18 }}>{badge.icon}</span>
                {badge.text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Roast Quotes Column (Left side of form) ───
function RoastQuotesColumn() {
  const [activeIndex, setActiveIndex] = useState(0);
  const quotes = [
    { text: '"Passionate about growth" likhne se growth nahi hoti. Numbers dikha bhai.', persona: 'The AI Roaster', avatar: 'AI' },
    { text: 'HR ne tera profile dekha. 3 second mein scroll kar diya. Ab samjha kyu call nahi aati?', persona: 'The Recruiter', avatar: 'HR' },
    { text: '"Open to work" badge laga diya but profile mein kuch kaam ka nahi likha.', persona: 'Your LinkedIn', avatar: 'LI' },
    { text: 'Bhai "Results-driven" toh sabhi likhte hain. Konsa result? Kitna revenue?', persona: 'The AI Roaster', avatar: 'AI' },
    { text: 'About section mein apni life story likh di. Novel nahi padna recruiter ko.', persona: 'The Recruiter', avatar: 'HR' },
    { text: '47 skills add kiye but ek bhi project mention nahi. LinkedIn hai, Quora nahi.', persona: 'The AI Roaster', avatar: 'AI' },
    { text: '"Aspiring Professional" — yeh LinkedIn ka "unemployed" bolne ka classy tarika hai.', persona: 'Your LinkedIn', avatar: 'LI' },
    { text: 'Experience section mein sirf company name aur date. Secret mission tha kya?', persona: 'The Recruiter', avatar: 'HR' },
  ];

  useEffect(() => {
    const timer = setInterval(() => setActiveIndex(prev => (prev + 1) % quotes.length), 8000);
    return () => clearInterval(timer);
  }, []);

  const visible = [quotes[activeIndex], quotes[(activeIndex + 1) % quotes.length]];
  const avatarColors: Record<string, string> = { AI: '#E16B00', HR: '#0A66C2', LI: '#057642' };

  return (
    <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>While you paste...</div>
      {visible.map((q, i) => (
        <div key={`${activeIndex}-${i}`} style={{
          background: 'white', borderRadius: 16, padding: '16px 18px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          animation: 'resultAppear 0.6s ease forwards',
          position: 'relative',
        }}>
          {/* Speech bubble tail */}
          <div style={{ position: 'absolute', bottom: -6, left: 24, width: 12, height: 12, background: 'white', transform: 'rotate(45deg)', boxShadow: '2px 2px 4px rgba(0,0,0,0.04)' }} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: avatarColors[q.avatar] || '#E16B00', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
            }}>{q.avatar}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: avatarColors[q.avatar] || '#E16B00', marginBottom: 4 }}>{q.persona}</div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.55, fontStyle: 'italic' }}>{q.text}</div>
            </div>
          </div>
        </div>
      ))}
      <div style={{ background: '#FFF8F0', border: '1px solid #FDE8CD', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#E16B00', fontWeight: 600 }}>Your profile is next...</div>
        <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Paste your LinkedIn content above</div>
      </div>

      {/* Did You Know cards */}
      <DidYouKnowCards />
    </div>
  );
}

// ─── Did You Know Cards ───
function DidYouKnowCards() {
  const facts = [
    { stat: '7.4s', text: 'Average time a recruiter spends looking at your profile', icon: '&#9201;' },
    { stat: '85%', text: 'Jobs are filled through networking. LinkedIn IS your network.', icon: '&#128101;' },
    { stat: '40%', text: 'More profile views with a strong headline vs generic one', icon: '&#128200;' },
    { stat: '6x', text: 'More likely to get messages with a complete profile', icon: '&#128172;' },
    { stat: '71%', text: 'Recruiters reject profiles in under 10 seconds', icon: '&#9888;&#65039;' },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(p => (p + 1) % facts.length), 10000);
    return () => clearInterval(t);
  }, []);
  const f = facts[idx];

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#bbb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>Did you know?</div>
      <div key={idx} style={{
        background: 'white', borderRadius: 14, padding: '18px 16px', textAlign: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        animation: 'resultAppear 0.5s ease forwards',
      }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: '#0A66C2', lineHeight: 1 }} dangerouslySetInnerHTML={{ __html: f.stat }} />
        <div style={{ fontSize: 11, color: '#555', lineHeight: 1.5, marginTop: 8 }}>{f.text}</div>
        <div style={{ width: 30, height: 2, background: '#E5E7EB', margin: '10px auto 0', borderRadius: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
          {facts.map((_, i) => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === idx ? '#0A66C2' : '#E0E0E0', transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Score Transform Column (Right side of form) ───
function ScoreTransformColumn() {
  const profiles = [
    { name: 'Rahul S.', role: 'MBA Graduate', city: 'Delhi', before: 22, after: 71, quote: '3 recruiter messages in 1 week' },
    { name: 'Priya M.', role: 'Software Engineer', city: 'Bangalore', before: 28, after: 76, quote: 'Got shortlisted at 2 MNCs' },
    { name: 'Sneha R.', role: 'HR Executive', city: 'Mumbai', before: 38, after: 84, quote: 'Best ₹299 on my career' },
    { name: 'Arjun T.', role: 'BDM', city: 'Pune', before: 31, after: 78, quote: 'Profile views jumped 4x' },
  ];

  return (
    <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 2, textTransform: 'uppercase' }}>Recent results</div>
      {profiles.map((p, i) => (
        <div key={i} style={{
          background: 'white', borderRadius: 16, padding: '16px 18px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {/* Mini profile header */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#666',
            }}>{p.name.charAt(0)}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#191919' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#888' }}>{p.role} &bull; {p.city}</div>
            </div>
          </div>
          {/* Score transformation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#CC1016', lineHeight: 1 }}>{p.before}</div>
              <div style={{ fontSize: 8, color: '#CC1016', fontWeight: 700, letterSpacing: 1 }}>BEFORE</div>
            </div>
            <div style={{ fontSize: 16, color: '#ddd' }}>&rarr;</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#057642', lineHeight: 1 }}>{p.after}</div>
              <div style={{ fontSize: 8, color: '#057642', fontWeight: 700, letterSpacing: 1 }}>AFTER</div>
            </div>
            <div style={{
              marginLeft: 'auto', background: '#DCFCE7', color: '#057642',
              fontSize: 12, fontWeight: 800, padding: '4px 12px', borderRadius: 20,
            }}>+{p.after - p.before}</div>
          </div>
          {/* Quote */}
          <div style={{ fontSize: 11, color: '#666', fontStyle: 'italic', borderTop: '1px solid #F3F2EF', paddingTop: 8 }}>
            &ldquo;{p.quote}&rdquo;
          </div>
        </div>
      ))}
      {/* Stats */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '14px 18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center',
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#0A66C2' }}>500+</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Professionals improved their LinkedIn</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= 4 ? '#057642' : '#E5E7EB' }} />)}
        </div>
        <div style={{ fontSize: 10, color: '#057642', fontWeight: 600, marginTop: 4 }}>4.8 avg rating</div>
      </div>
    </div>
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
        {plan === 'pro' ? 'Pro Plan — \u20b9799' : 'Standard Plan — \u20b9299'}
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
          {submitting ? 'Creating order...' : `Pay \u20b9${plan === 'pro' ? '799' : '299'} & Get Roasted`}
        </button>
      </div>
    </div>
  );
}

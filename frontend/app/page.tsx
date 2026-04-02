'use client';

import { useState, useRef, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
      {25 + count}+ professionals improved their LinkedIn
    </p>
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
      setError('Please enter your email and referral code.');
      return;
    }
    if (product === 'roast' && !headline.trim()) {
      setError('Please paste your LinkedIn headline or profile.');
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
          product,
          profile_data: product === 'roast' ? { raw_paste: headline.trim() } : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to redeem code');
        return;
      }
      if (data.order_id) {
        window.location.href = product === 'roast'
          ? `/results/${data.order_id}`
          : `/build/results/${data.order_id}`;
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setRedeeming(false);
    }
  }

  if (!showForm) {
    return (
      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <button
          onClick={() => setShowForm(true)}
          style={{ fontSize: 13, color: '#0A66C2', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
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

// ─── Profile Input Form ───
function ProfileInputForm({
  plan,
  teaserId,
  email: initialEmail,
  initialRawPaste,
}: {
  plan: 'standard' | 'pro';
  teaserId: string | null;
  email: string;
  initialRawPaste?: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [rawPaste, setRawPaste] = useState(initialRawPaste || '');
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
          profile_data: { raw_paste: rawPaste.trim() },
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
    <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: 28 }}>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#191919', marginBottom: 4 }}>
        {initialRawPaste ? 'Your LinkedIn Profile (from PDF)' : 'Paste Your LinkedIn Profile'}
      </h3>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
        {plan === 'pro' ? 'Pro Plan \u2014 \u20b9799' : 'Standard Plan \u2014 \u20b9299'}
        {teaserId && <span style={{ opacity: 0.6, marginLeft: 8 }}>(teaser linked)</span>}
      </p>
      {initialRawPaste ? (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#057642', fontWeight: 600 }}>
          &#9989; Profile data auto-filled from your LinkedIn PDF. Review and edit below if needed.
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
          Go to your LinkedIn profile &rarr; Select all (Ctrl+A) &rarr; Copy (Ctrl+C) &rarr; Paste below
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address *"
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        <textarea
          value={rawPaste}
          onChange={(e) => setRawPaste(e.target.value)}
          placeholder="Paste your entire LinkedIn profile here \u2014 headline, about, experience, everything. *"
          rows={10}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
        />
        {rawPaste.trim().length > 0 && (
          <p style={{ fontSize: 12, color: rawPaste.trim().length > 100 ? '#057642' : '#E16B00' }}>
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
            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
          />
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !email.trim() || !rawPaste.trim()}
          style={{
            width: '100%', padding: '14px 24px', borderRadius: 50, border: 'none',
            background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            opacity: submitting || !email.trim() || !rawPaste.trim() ? 0.5 : 1,
            boxShadow: '0 4px 16px rgba(10,102,194,0.35)',
          }}
        >
          {submitting ? 'Creating order...' : `Pay \u20b9${plan === 'pro' ? '799' : '299'} & Get Roasted`}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════
export default function Home() {
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [teaser, setTeaser] = useState<TeaserResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | null>(null);
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [showPdfGuide, setShowPdfGuide] = useState(false);

  // PDF upload state
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfParsed, setPdfParsed] = useState<any>(null);
  const [pdfError, setPdfError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfRawPaste, setPdfRawPaste] = useState(''); // extracted text for order creation
  const [dragOver, setDragOver] = useState(false);

  const pricingRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const MAX = 180;
      if (scrollHeight > MAX) {
        textareaRef.current.style.height = MAX + 'px';
        textareaRef.current.style.overflowY = 'auto';
      } else {
        textareaRef.current.style.height = scrollHeight + 'px';
        textareaRef.current.style.overflowY = 'hidden';
      }
    }
  }, [headline]);

  // Scroll to result
  useEffect(() => {
    if (teaser && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [teaser]);

  // Handle ?plan= query param from pricing page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam === 'standard' || planParam === 'pro') {
      setShowPasteInput(true);
      // Scroll to hero input after a short delay
      setTimeout(() => heroRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
  }, []);

  // ── Core teaser runner (reusable for paste + PDF) ──
  async function runTeaser(headlineText: string) {
    const today = new Date().toISOString().split('T')[0];
    const lsKey = `teaser_count_${today}`;
    const count = parseInt(localStorage.getItem(lsKey) || '0', 10);
    if (count >= 5) { setRateLimited(true); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/teaser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: headlineText.slice(0, 500) }),
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

  // ── Teaser submit (from paste input) ──
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
    await runTeaser(trimmed);
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

  function handlePdfClick() {
    pdfInputRef.current?.click();
  }

  async function uploadAndParsePdf(file: File) {
    if (file.type !== 'application/pdf') {
      setPdfError('Please upload a PDF file. On LinkedIn, click "More" \u2192 "Save to PDF".');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setPdfError('File too large. Maximum 10MB.');
      return;
    }

    setPdfUploading(true);
    setPdfError('');
    setPdfFileName(file.name);
    setPdfParsed(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/linkedin-pdf/parse`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setPdfError(data.error || 'Failed to parse PDF. Try pasting your profile text instead.');
        return;
      }

      setPdfParsed(data.parsed);
      setPdfRawPaste(data.raw_paste || '');

      // Auto-set headline for teaser
      if (data.headline) {
        setHeadline(data.headline);
      }

      // Auto-run teaser with extracted headline
      if (data.headline && data.headline.trim().length >= 10) {
        await runTeaser(data.headline.trim());
      }
    } catch {
      setPdfError('Could not reach the server. Please try again or paste your profile text.');
    } finally {
      setPdfUploading(false);
    }
  }

  function handlePdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadAndParsePdf(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAndParsePdf(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  return (
    <main className="min-h-screen">
      {/* ─── NAV ─── */}
      <nav style={{ background: 'white', borderBottom: '1px solid #E8E8E8', padding: '12px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#191919' }}>Roaster</span>
          </a>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a href="/dashboard" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 600 }}>Dashboard</a>
            <a href="/pricing" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 600 }}>Pricing</a>
            <a href="/recover" style={{ fontSize: 13, color: '#666', textDecoration: 'none', fontWeight: 500 }}>Lost results?</a>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════ */}
      {/* HERO — Two Paths                   */}
      {/* ═══════════════════════════════════ */}
      <section ref={heroRef} style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 40%, #F0F7FF 100%)', borderBottom: '1px solid #E0E7F0', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#0F172A', marginBottom: 6, lineHeight: 1.15 }}>
            Your Profile Is <span style={{ color: '#CC1016' }}>Costing You Interviews</span>
          </h1>
          <h2 style={{ fontSize: 42, fontWeight: 900, color: '#0A66C2', marginTop: 0, marginBottom: 16, lineHeight: 1.15 }}>
            Fix It in 2 Minutes
          </h2>
          <p style={{ fontSize: 18, color: '#475569', marginBottom: 12, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            Upload your LinkedIn PDF. AI scores your profile, rewrites it, builds your resume, and preps you for interviews.
          </p>
          <div style={{ marginBottom: 36 }}>
            <span style={{ background: '#DCFCE7', color: '#057642', fontSize: 14, fontWeight: 600, padding: '4px 14px', borderRadius: 20 }}>
              Used by 2,000+ job seekers across India
            </span>
          </div>

          {/* FREE HOOK */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 20px', maxWidth: 560, margin: '0 auto 32px', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>&#127873;</span>
            <div style={{ fontSize: 14, color: '#92400E', fontWeight: 600 }}>
              <strong style={{ color: '#B45309' }}>Upload your PDF &rarr; Get your Profile Score & AI Roast FREE.</strong><br />
              No payment needed. See exactly what{"'"}s wrong before you pay to fix it.
            </div>
          </div>

          {/* TWO PATH CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24, maxWidth: 880, margin: '0 auto' }}>

            {/* PATH A: Have LinkedIn */}
            <div style={{ background: 'white', borderRadius: 16, border: '2px solid #E0E7F0', padding: '32px 28px', textAlign: 'left', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0A66C2'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(10,102,194,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0E7F0'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#E8F0FE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14 }}>&#128196;</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#191919', marginBottom: 6 }}>I have a LinkedIn profile</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
                Upload your LinkedIn PDF. AI extracts everything automatically.
              </div>

              {/* Upload Area with drag-and-drop */}
              <div
                onClick={handlePdfClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: `2px dashed ${dragOver ? '#0A66C2' : pdfParsed ? '#057642' : '#94B8DB'}`,
                  borderRadius: 12, padding: 24, textAlign: 'center', marginBottom: 8,
                  background: dragOver ? '#E8F0FE' : pdfParsed ? '#F0FDF4' : '#F0F7FF',
                  cursor: pdfUploading ? 'wait' : 'pointer', transition: 'all 0.2s',
                }}
              >
                <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfChange} style={{ display: 'none' }} />

                {pdfUploading ? (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8, animation: 'spin 1s linear infinite' }}>&#9881;</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0A66C2' }}>Parsing your LinkedIn PDF...</div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>Extracting profile data with AI &bull; 5-10 seconds</div>
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  </>
                ) : pdfParsed ? (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>&#9989;</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#057642' }}>
                      {pdfParsed.full_name ? `${pdfParsed.full_name}'s profile parsed!` : 'LinkedIn PDF parsed!'}
                    </div>
                    <div style={{ fontSize: 12, color: '#057642', marginTop: 4 }}>
                      {pdfParsed.headline && <span>{pdfParsed.headline.slice(0, 80)}{pdfParsed.headline.length > 80 ? '...' : ''}</span>}
                    </div>
                    {pdfParsed.experience?.length > 0 && (
                      <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                        {pdfParsed.experience.length} experience{pdfParsed.experience.length > 1 ? 's' : ''} &bull;
                        {pdfParsed.education?.length || 0} education &bull;
                        {pdfParsed.skills?.length || 0} skills extracted
                      </div>
                    )}
                    <div
                      onClick={(e) => { e.stopPropagation(); setPdfParsed(null); setPdfFileName(''); setPdfRawPaste(''); setHeadline(''); setTeaser(null); }}
                      style={{ fontSize: 12, color: '#0A66C2', marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Upload a different PDF
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>&#128228;</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0A66C2' }}>
                      {dragOver ? 'Drop your PDF here!' : 'Drop your LinkedIn PDF here'}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>or click to browse &bull; .pdf only</div>
                  </>
                )}
              </div>

              {/* PDF error */}
              {pdfError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#DC2626' }}>
                  {pdfError}
                  <span
                    onClick={() => { setPdfError(''); setShowPasteInput(true); }}
                    style={{ color: '#0A66C2', cursor: 'pointer', marginLeft: 8, textDecoration: 'underline' }}
                  >
                    Paste text instead
                  </span>
                </div>
              )}

              {/* Paste fallback */}
              {!pdfParsed && !pdfUploading && (
                <>
                  {!showPasteInput ? (
                    <div
                      onClick={() => setShowPasteInput(true)}
                      style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 16, cursor: 'pointer' }}
                    >
                      Don{"'"}t have your PDF? <u>Paste profile text instead</u>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 6 }}>Paste your LinkedIn headline:</div>
                      <textarea
                        ref={textareaRef}
                        value={headline}
                        onChange={e => setHeadline(e.target.value)}
                        placeholder={"Paste your headline here...\ne.g. Senior Manager | B2B Sales | 6+ Years | Fortune 500 Clients"}
                        rows={2}
                        maxLength={500}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                      />
                      {headline.length > 0 && headline.trim().length < 10 && (
                        <p style={{ fontSize: 12, color: '#CC1016', marginTop: 4 }}>
                          Please paste your complete headline &mdash; at least a few words.
                        </p>
                      )}
                    </div>
                  )}

                  {showPasteInput && (
                    <button
                      onClick={handleTeaserSubmit}
                      disabled={loading || headline.trim().length < 10}
                      style={{
                        width: '100%', padding: '14px 24px', borderRadius: 50, border: 'none',
                        background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white',
                        fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        opacity: loading || headline.trim().length < 10 ? 0.5 : 1,
                        boxShadow: '0 4px 16px rgba(10,102,194,0.35)',
                      }}
                    >
                      {loading ? 'Analyzing...' : 'Get Free Score \u2192'}
                    </button>
                  )}
                </>
              )}

              {/* Loading state for PDF auto-teaser */}
              {loading && pdfParsed && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ fontSize: 14, color: '#0A66C2', fontWeight: 600 }}>Analyzing your profile...</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Generating your free score</div>
                </div>
              )}

              <div style={{ fontSize: 12, color: '#057642', textAlign: 'center', marginTop: 10, fontWeight: 600 }}>
                &#9889; Free profile score in seconds
              </div>

              {rateLimited && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: '#FEF3C7', border: '1px solid #F59E0B', fontSize: 13, color: '#92400E' }}>
                  <strong>5 free previews used today.</strong> Come back tomorrow or get your full roast + resume for &#8377;299.
                </div>
              )}
            </div>

            {/* PATH B: Starting Fresh */}
            <div style={{ background: 'white', borderRadius: 16, border: '2px solid #E0E7F0', padding: '32px 28px', textAlign: 'left', transition: 'border-color 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#057642'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(5,118,66,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0E7F0'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14 }}>&#128221;</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#191919', marginBottom: 6 }}>I{"'"}m starting fresh</div>
              <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
                No LinkedIn? No problem. Upload an old resume or fill a quick form.
              </div>

              {/* Resume upload area */}
              <div style={{ border: '2px dashed #86EFAC', borderRadius: 12, padding: 20, textAlign: 'center', marginBottom: 12, background: '#F0FDF4', cursor: 'pointer' }}
                onClick={() => window.open('/build', '_blank')}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>&#128195;</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#057642' }}>Upload your existing resume</div>
                <div style={{ fontSize: 11, color: '#86EFAC', marginTop: 2 }}>.pdf or .docx &bull; We{"'"}ll extract everything</div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', fontWeight: 600, margin: '10px 0' }}>&mdash; or &mdash;</div>

              <a
                href="/build"
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', textAlign: 'center', fontSize: 13, color: '#057642', fontWeight: 600, textDecoration: 'none', marginBottom: 16, cursor: 'pointer' }}
              >
                Fill a quick 3-minute form instead &rarr;
              </a>

              <a
                href="/build"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', width: '100%', padding: '14px 24px', borderRadius: 50, border: 'none',
                  background: 'linear-gradient(135deg, #057642, #034A2A)', color: 'white',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer', textAlign: 'center', textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(5,118,66,0.35)', boxSizing: 'border-box',
                }}
              >
                Build My Profile &rarr;
              </a>
              <div style={{ fontSize: 12, color: '#666', textAlign: 'center', marginTop: 10 }}>
                &#127891; Perfect for students & freshers
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* SOCIAL PROOF BAR                    */}
      {/* ═══════════════════════════════════ */}
      <div style={{ background: 'white', borderBottom: '1px solid #E8E8E8', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', marginBottom: 16 }}>
            {[
              { num: '2,000+', label: 'Profiles Improved' },
              { num: '+42 pts', label: 'Avg Score Increase' },
              { num: '87%', label: 'Avg ATS Score' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0A66C2' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, flexWrap: 'wrap', opacity: 0.5 }}>
            {['IIT', 'NIT', 'VIT', 'SRM', 'BITS', 'DTU'].map((name, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 700, color: '#666', padding: '6px 14px', border: '1px solid #E0E0E0', borderRadius: 6, background: '#F8FAFC' }}>{name}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#999', marginTop: 10 }}>Students from these colleges use ProfileRoaster for placements</div>
        </div>
      </div>

      {/* ═══════════════════════════════════ */}
      {/* TRUST STRIP                         */}
      {/* ═══════════════════════════════════ */}
      <div style={{ background: '#F8FAFC', borderBottom: '1px solid #E8E8E8', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', fontSize: 12, color: '#666', fontWeight: 600 }}>
          <span>&#128274; No LinkedIn login needed</span>
          <span>&#9889; Results in under 3 minutes</span>
          <span>&#128179; Secure UPI/Card via Razorpay</span>
          <span>&#128272; Your data is encrypted & never sold</span>
        </div>
      </div>

      {/* ═══════════════════════════════════ */}
      {/* TEASER RESULT                       */}
      {/* ═══════════════════════════════════ */}
      {teaser && (
        <section ref={resultRef} style={{ background: '#F8FAFC', borderBottom: '1px solid #E8E8E8', padding: '28px 16px', animation: 'resultAppear 0.5s ease forwards' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            {/* Score card */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 24, marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 8 }}>Your Headline Score</p>
              <ScoreBadge score={teaser.score} />
              <p style={{ fontSize: 12, color: '#666', marginTop: 12 }}>
                Headline only. Your full profile score is usually 30-40 points lower.
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, marginTop: 8, color: teaser.score < 70 ? '#CC1016' : '#057642' }}>
                {teaser.score < 50
                  ? 'Your headline scores lower than 80% of profiles that land interviews.'
                  : teaser.score < 70
                  ? 'Your headline scores lower than 72% of profiles that land interviews.'
                  : teaser.score < 85
                  ? 'Your headline is above average. But top candidates score above 90 on their FULL profile.'
                  : 'Your headline scores higher than 78% of profiles we analyzed. But top candidates score 90+ on their full profile.'}
              </p>
            </div>

            {/* Roast card */}
            {teaser.teaser_roast && (
              <div style={{ background: 'white', borderLeft: '3px solid #E16B00', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 16, marginBottom: 16 }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0A66C2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>AI</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>&#128293; The LinkedIn Roastmaster</p>
                    <p style={{ fontSize: 12, color: '#666' }}>AI Career Critic</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, fontStyle: 'italic', color: '#191919' }}>{teaser.teaser_roast}</p>
              </div>
            )}

            {/* Locked issues */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 12 }}>What we found beyond your headline:</p>
              {['2 critical profile issues hidden', 'ATS keyword gaps hidden', 'Experience section assessment hidden'].map((item, i) => (
                <p key={i} style={{ fontSize: 13, color: '#aaa', filter: 'blur(0.5px)', marginBottom: 6 }}>&#128274; {item}</p>
              ))}
            </div>

            {/* CTA to pricing */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 24, marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 8 }}>
                {teaser.score < 50
                  ? 'Your headline needs work \u2014 and that\u2019s just the start.'
                  : teaser.score < 70
                  ? 'Your headline has potential. Your full profile likely has bigger gaps.'
                  : 'Your headline is decent. But recruiters read further than the headline.'}
              </p>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
                {teaser.score < 50
                  ? 'A weak headline means recruiters never even get to your About or Experience. Your full profile likely has even bigger gaps.'
                  : teaser.score < 70
                  ? 'A decent headline gets you noticed, but what happens next depends on your About and Experience. Most profiles in this range have 3-5 fixable issues.'
                  : 'A good headline gets you 6 seconds of recruiter attention. What happens next depends entirely on your About and Experience sections.'}
              </p>
              <button
                onClick={scrollToPricing}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: 50, border: 'none',
                  background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white',
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(10,102,194,0.35)',
                }}
              >
                Get Full Roast + Resume + Interview Prep &rarr;
              </button>
              <LiveCounter />
            </div>

            {/* Soft email capture */}
            {!showPricing && (
              <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 24 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#191919', marginBottom: 12 }}>
                  Enter your email to see your full breakdown (optional)
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none' }}
                  />
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!email.trim()}
                    style={{
                      padding: '12px 24px', borderRadius: 50, border: 'none',
                      background: '#0A66C2', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      opacity: !email.trim() ? 0.5 : 1,
                    }}
                  >
                    Get Full Report
                  </button>
                </div>
                <button onClick={scrollToPricing} style={{ marginTop: 8, fontSize: 13, fontWeight: 500, color: '#0A66C2', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Skip &rarr;
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ */}
      {/* PRICING                             */}
      {/* ═══════════════════════════════════ */}
      {(showPricing || teaser) && !selectedPlan && (
        <section ref={pricingRef} style={{ padding: '48px 24px', background: 'white' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Simple Pricing</h2>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>Profile score is free. Pay only when you{"'"}re ready.</p>

            {/* Standard Plan */}
            <div style={{ background: 'white', border: '2px solid #0A66C2', borderRadius: 20, padding: '36px 32px', position: 'relative', marginBottom: 16 }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0A66C2', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                Most Popular
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8, marginTop: 8 }}>Standard</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#191919', marginBottom: 4 }}>
                &#8377;299 <span style={{ fontSize: 18, fontWeight: 500, color: '#999' }}>one-time</span>
              </div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>Pay once. Download forever.</div>
              <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, padding: 0 }}>
                {[
                  { text: 'AI Profile Score', free: true },
                  { text: 'AI Roast + Complete Profile Rewrite', free: true },
                  { text: 'ATS Resume (18 templates)', free: false },
                  { text: 'Cover Letter Generator', free: false },
                  { text: 'Interview Prep (15 questions + quiz)', free: false },
                  { text: 'Shareable Profile Card', free: false },
                  { text: 'PDF + TXT Export', free: false },
                ].map((f, i) => (
                  <li key={i} style={{ fontSize: 14, color: '#333', padding: '8px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#057642', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>&#10003;</span>
                    {f.text}
                    {f.free && <span style={{ fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#057642', padding: '1px 6px', borderRadius: 3, marginLeft: 4 }}>FREE</span>}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePlanSelect('standard')}
                style={{
                  width: '100%', padding: '16px 32px', borderRadius: 50, border: 'none',
                  background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white',
                  fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(10,102,194,0.35)',
                }}
              >
                Get Everything for &#8377;299 &rarr;
              </button>
              <div style={{ fontSize: 12, color: '#999', marginTop: 12 }}>Secure payment via Razorpay (UPI / Card / Net Banking)</div>
            </div>

            {/* Pro Plan */}
            <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>Want Pro Features?</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#191919', margin: '4px 0' }}>&#8377;799</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>5 headline variations + all 28 templates + 3 cover letters + priority processing</div>
              <button
                onClick={() => handlePlanSelect('pro')}
                style={{ padding: '10px 24px', borderRadius: 50, border: '2px solid #0A66C2', background: 'white', color: '#0A66C2', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Get Pro &rarr;
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#666', marginTop: 24 }}>
              Resume writers charge &#8377;3,000&ndash;15,000 and take days. We do everything in under 3 minutes for &#8377;299.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16, padding: '10px 16px', background: '#F0FDF4', borderRadius: 8 }}>
              <span>&#128274;</span>
              <span style={{ fontSize: 13, color: '#057642', fontWeight: 600 }}>Your data is encrypted, never shared, and you can delete it anytime</span>
            </div>

            <ReferralCodeRedeemer product="roast" />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ */}
      {/* PROFILE INPUT FORM                  */}
      {/* ═══════════════════════════════════ */}
      {selectedPlan && (
        <section ref={inputFormRef} style={{ background: '#F8FAFC', padding: '28px 16px 40px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 500px', minWidth: 0 }}>
                <ProfileInputForm
                  plan={selectedPlan}
                  teaserId={teaser?.teaser_id || null}
                  email={email}
                  initialRawPaste={pdfRawPaste}
                />
              </div>
              {/* Sidebar */}
              <div className="hidden lg:block" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 80 }}>
                <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 14, padding: 20, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 12 }}>What happens next</div>
                  {[
                    { num: '1', text: 'Paste your full LinkedIn profile (Ctrl+A)' },
                    { num: '2', text: 'Pay securely via UPI/Card' },
                    { num: '3', text: 'AI roasts + rewrites in ~90 seconds' },
                    { num: '4', text: 'Copy-paste your new profile + download resume' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0A66C2', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</div>
                      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{s.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 14, padding: 16, fontSize: 12, color: '#057642', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Secure & Private</div>
                  Your data is processed by AI only. No humans read your profile. You can delete anytime.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ */}
      {/* WHAT YOU GET (outcome-focused)      */}
      {/* ═══════════════════════════════════ */}
      {!teaser && (
        <>
          <section style={{ padding: '56px 24px', background: 'white', borderBottom: '1px solid #E8E8E8' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>Everything You Need to Land Interviews</h2>
              <p style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 }}>One payment. Four powerful tools. Zero subscriptions.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {[
                  { icon: '&#128293;', title: 'Fix What\u2019s Blocking Your Profile', desc: 'AI scores your profile, roasts what\u2019s wrong, and rewrites your headline, about, and experience.', free: true },
                  { icon: '&#128196;', title: 'Get Past ATS Filters', desc: 'Professional resume matched to your job description. ATS-optimized templates. PDF + TXT download.', free: false },
                  { icon: '&#9993;&#65039;', title: 'Stand Out in Applications', desc: 'Personalized cover letter for every application. Ready to copy-paste.', free: false },
                  { icon: '&#127919;', title: 'Answer Like a Top Candidate', desc: '15 likely interview questions based on YOUR resume. Cheat sheet + practice quiz included.', free: false },
                ].map((f, i) => (
                  <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 14, padding: '24px 20px', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{f.desc}</div>
                    {f.free && <div style={{ display: 'inline-block', background: '#DCFCE7', color: '#057642', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, marginTop: 8 }}>FREE PREVIEW</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════ */}
          {/* HOW IT WORKS                        */}
          {/* ═══════════════════════════════════ */}
          <section style={{ padding: '56px 24px', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F7FF 100%)', borderBottom: '1px solid #E0E7F0' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>How It Works</h2>
              <p style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 }}>Three steps. That{"'"}s it.</p>
              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { num: '1', title: 'Share Your Profile', desc: 'Upload LinkedIn PDF, old resume, or fill a quick form' },
                  { num: '2', title: 'AI Analyzes & Builds', desc: 'Scores your profile, rewrites it, generates resume + interview prep' },
                  { num: '3', title: 'Download & Apply', desc: 'Everything ready. Start applying with confidence today.' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: '1 1 200px', textAlign: 'center', padding: '0 16px', position: 'relative', minWidth: 200 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0A66C2', color: 'white', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{s.num}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>{s.desc}</div>
                    {i < 2 && <span className="hidden md:block" style={{ position: 'absolute', right: -12, top: 24, fontSize: 20, color: '#CBD5E1' }}>&rarr;</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════ */}
          {/* REAL OUTPUT SHOWCASE                */}
          {/* ═══════════════════════════════════ */}
          <section style={{ padding: '56px 24px', background: 'white', borderBottom: '1px solid #E8E8E8' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>See Real Results</h2>
              <p style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 32 }}>Actual output from ProfileRoaster.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                {/* Roast Before/After */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #DC2626, #B91C1C)' }}>&#128293; AI Roast + Rewrite</div>
                  <div style={{ padding: 16 }}>
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>&#10007; BEFORE</div>
                      <div style={{ fontSize: 12, color: '#666', fontStyle: 'italic', lineHeight: 1.5 }}>&ldquo;Software Engineer | Python | Java | AWS | Docker | Seeking opportunities&rdquo;</div>
                    </div>
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#057642', marginBottom: 4 }}>&#10003; AFTER</div>
                      <div style={{ fontSize: 12, color: '#057642', fontWeight: 600, lineHeight: 1.5 }}>&ldquo;Full-Stack Engineer | Built 5 Apps Serving 50K+ Users | React + AWS&rdquo;</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>28</span>
                      <span style={{ fontSize: 14, color: '#999' }}>&rarr;</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#057642' }}>76</span>
                      <span style={{ background: '#DCFCE7', color: '#057642', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>+48 pts</span>
                    </div>
                  </div>
                </div>

                {/* Resume Preview */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #0A66C2, #004182)' }}>&#128196; ATS Resume</div>
                  <div style={{ padding: 0 }}>
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', margin: 12, borderRadius: 4, padding: 14, fontSize: 11 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 2 }}>Priya Mehta</div>
                      <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Full-Stack Engineer &bull; Bangalore</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Experience</div>
                      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginBottom: 4 }} />
                      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginBottom: 4, width: '60%' }} />
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Education</div>
                      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Skills</div>
                      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 3, width: '100%' }} />
                    </div>
                    <div style={{ margin: '0 12px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#191919', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>ATS Score</span><span style={{ color: '#057642', fontWeight: 700 }}>87%</span>
                      </div>
                      <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3 }}>
                        <div style={{ height: 6, background: '#057642', borderRadius: 3, width: '87%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Prep Preview */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, #057642, #034A2A)' }}>&#127919; Interview Prep</div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      {['Questions', 'Cheat Sheet', 'Quiz'].map((t, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: i === 0 ? '#0A66C2' : '#E8F0FE', color: i === 0 ? 'white' : '#0A66C2' }}>{t}</span>
                      ))}
                    </div>
                    {[
                      { type: 'Behavioral', q: 'Tell me about a time you handled a tight deadline on a project.' },
                      { type: 'Role Specific', q: 'How would you optimize a slow database query in production?' },
                      { type: 'Situational', q: 'Your team disagrees on the tech stack. How do you resolve it?' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px 12px', marginBottom: 8, fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>{item.type}</div>
                        {item.q}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════ */}
          {/* PRICING (non-teaser flow)           */}
          {/* ═══════════════════════════════════ */}
          <section style={{ padding: '56px 24px', background: '#F8FAFC', borderBottom: '1px solid #E8E8E8' }}>
            <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', marginBottom: 8 }}>Simple Pricing</h2>
              <p style={{ fontSize: 16, color: '#666', marginBottom: 32 }}>Profile score is free. Pay only when you{"'"}re ready.</p>

              <div style={{ background: 'white', border: '2px solid #0A66C2', borderRadius: 20, padding: '36px 32px', position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#0A66C2', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 20, whiteSpace: 'nowrap' }}>Most Popular</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8, marginTop: 8 }}>Standard</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#191919', marginBottom: 4 }}>&#8377;299 <span style={{ fontSize: 18, fontWeight: 500, color: '#999' }}>one-time</span></div>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>Pay once. Download forever.</div>
                <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, padding: 0 }}>
                  {[
                    'AI Profile Score + Roast',
                    'Complete Profile Rewrite',
                    'ATS Resume (18 templates)',
                    'Cover Letter Generator',
                    'Interview Prep (15 questions + quiz)',
                    'PDF + TXT Export',
                  ].map((f, i) => (
                    <li key={i} style={{ fontSize: 14, color: '#333', padding: '8px 0', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#057642', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>&#10003;</span>{f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                  style={{
                    width: '100%', padding: '16px 32px', borderRadius: 50, border: 'none',
                    background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white',
                    fontSize: 16, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(10,102,194,0.35)',
                  }}
                >
                  Get Started &mdash; &#8377;299 &rarr;
                </button>
                <div style={{ fontSize: 12, color: '#999', marginTop: 12 }}>Secure payment via Razorpay</div>
              </div>

              <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 16, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#191919' }}>Want Pro Features?</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#191919', margin: '4px 0' }}>&#8377;799</div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>5 headline variations + all 28 templates + 3 cover letters + priority</div>
                <button
                  onClick={() => { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                  style={{ padding: '10px 24px', borderRadius: 50, border: '2px solid #0A66C2', background: 'white', color: '#0A66C2', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                >
                  Get Pro &rarr;
                </button>
              </div>

              <p style={{ fontSize: 13, color: '#666', marginTop: 24 }}>
                Resume writers charge &#8377;3,000&ndash;15,000 and take days. We do everything in under 3 minutes for &#8377;299.
              </p>
            </div>
          </section>

          {/* ═══════════════════════════════════ */}
          {/* PDF GUIDE (collapsible)             */}
          {/* ═══════════════════════════════════ */}
          <div style={{ padding: '24px 24px', background: 'white', borderBottom: '1px solid #E8E8E8', textAlign: 'center' }}>
            <button
              onClick={() => setShowPdfGuide(!showPdfGuide)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#0A66C2', cursor: 'pointer', padding: '10px 20px', border: '1px solid #0A66C2', borderRadius: 8, background: 'white' }}
            >
              &#128196; Don{"'"}t know how to download your LinkedIn PDF? Click here {showPdfGuide ? '\u25B2' : '\u25BC'}
            </button>
            {showPdfGuide && (
              <div style={{ maxWidth: 900, margin: '24px auto 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[
                    { num: 'Step 1', title: 'Go to your LinkedIn profile', desc: 'Open LinkedIn \u2192 Click your photo \u2192 "View Profile"' },
                    { num: 'Step 2', title: 'Click "More" \u2192 "Save to PDF"', desc: 'Below your headline, click the "More..." button, then "Save to PDF"' },
                    { num: 'Step 3', title: 'Upload the downloaded PDF', desc: 'Drop it into the upload box on this page. Done!' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ background: '#E2E8F0', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8', fontWeight: 600, borderBottom: '1px solid #E5E7EB' }}>
                        [ Screenshot placeholder ]
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#0A66C2', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 3 }}>{s.num}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#191919', marginBottom: 3 }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════ */}
          {/* VIRAL / SHARE                       */}
          {/* ═══════════════════════════════════ */}
          <section style={{ padding: '32px 24px', background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', borderBottom: '1px solid #FDE68A', textAlign: 'center' }}>
            <div style={{ maxWidth: 500, margin: '0 auto' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#191919', marginBottom: 6 }}>Share Your Score, Save &#8377;50</div>
              <div style={{ fontSize: 14, color: '#92400E', marginBottom: 16 }}>Share your profile score card on LinkedIn or WhatsApp. Get &#8377;50 off your order.</div>
              <button
                onClick={() => { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 50, border: '2px solid #B45309', background: 'white', color: '#B45309', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                &#128640; Get Your Free Score First &rarr;
              </button>
            </div>
          </section>

          {/* ═══════════════════════════════════ */}
          {/* REFERRAL CODE                       */}
          {/* ═══════════════════════════════════ */}
          <section style={{ padding: '28px 24px', background: '#F8FAFC', borderBottom: '1px solid #E8E8E8', textAlign: 'center' }}>
            <div style={{ maxWidth: 440, margin: '0 auto' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>Have a referral code?</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>From your college placement cell or career coach</div>
              <ReferralCodeRedeemer product="roast" />
            </div>
          </section>

          {/* ═══════════════════════════════════ */}
          {/* URGENCY CTA                         */}
          {/* ═══════════════════════════════════ */}
          <section style={{ background: 'linear-gradient(135deg, #004182 0%, #0A66C2 100%)', padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>Stop losing interviews.</div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 28 }}>Every day with a weak profile is another recruiter who scrolled past you.</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', marginBottom: 28 }}>
                {[
                  { stat: '2,000+', label: 'Profiles improved' },
                  { stat: '+42 pts', label: 'Average score increase' },
                  { stat: '\u20b9299', label: 'One time, no subscription' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'white' }}>{s.stat}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ background: 'white', color: '#0A66C2', fontSize: 16, fontWeight: 700, padding: '16px 40px', borderRadius: 50, border: 'none', cursor: 'pointer' }}
              >
                Get My Free Score &rarr;
              </button>
            </div>
          </section>
        </>
      )}

      {/* ═══════════════════════════════════ */}
      {/* FOOTER                              */}
      {/* ═══════════════════════════════════ */}
      <footer style={{ padding: '28px 24px', background: '#0F172A', color: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}><span style={{ color: '#60A5FA' }}>Profile</span>Roaster</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>AI-powered career tools for Indian job seekers</div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'Pricing', href: '/pricing' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ].map((l, i) => (
              <a key={i} href={l.href} style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none' }}>{l.label}</a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#64748B' }}>&copy; 2026 ProfileRoaster. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}

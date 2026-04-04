'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { TEMPLATES, renderResumeHTML, getRecommendedTemplates } from '../components/resume/ResumeTemplates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───
interface TeaserResult {
  score: number;
  issues: string[];
  teaser_roast: string;
  teaser_id: string | null;
  suggested_headline?: string;
  sample_interview_question?: string;
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
  return null; // Removed — will enable when we have real user data
}

// ─── Referral Code Redeemer ───
function ReferralCodeRedeemer({ product }: { product: 'roast' | 'build' }) {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [redeemEmail, setRedeemEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [refPdfUploading, setRefPdfUploading] = useState(false);
  const [refPdfName, setRefPdfName] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const refPdfInputRef = useRef<HTMLInputElement>(null);

  async function handleRefPdf(file: File) {
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file.'); return; }
    setRefPdfUploading(true);
    setRefPdfName(file.name);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/api/linkedin-pdf/parse`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to parse PDF'); return; }
      setHeadline(data.raw_paste || data.headline || '');
    } catch {
      setError('Could not parse PDF. Please paste your profile text instead.');
      setShowPaste(true);
    } finally {
      setRefPdfUploading(false);
    }
  }

  async function handleRedeem() {
    if (!code.trim() || !redeemEmail.trim()) {
      setError('Please enter your email and referral code.');
      return;
    }
    if (product === 'roast' && !headline.trim()) {
      setError('Please upload your LinkedIn PDF or paste your profile.');
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
        placeholder="Enter code (e.g. PR-STD-XXXXX)"
        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, fontFamily: 'monospace', boxSizing: 'border-box' }}
      />
      {product === 'roast' && (
        <>
          {/* PDF Upload for referral */}
          <div
            onClick={() => refPdfInputRef.current?.click()}
            style={{ border: '2px dashed #94B8DB', borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 6, background: headline && !showPaste ? '#F0FDF4' : '#F0F7FF', cursor: refPdfUploading ? 'wait' : 'pointer', fontSize: 12 }}
          >
            <input ref={refPdfInputRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleRefPdf(f); }} style={{ display: 'none' }} />
            {refPdfUploading ? (
              <span style={{ color: '#0A66C2', fontWeight: 600 }}>&#9881; Parsing PDF...</span>
            ) : headline && !showPaste ? (
              <span style={{ color: '#057642', fontWeight: 600 }}>&#9989; LinkedIn PDF loaded ({refPdfName})</span>
            ) : (
              <span style={{ color: '#0A66C2', fontWeight: 600 }}>&#128228; Upload LinkedIn PDF</span>
            )}
          </div>
          {!showPaste && !headline ? (
            <div onClick={() => setShowPaste(true)} style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', marginBottom: 8, cursor: 'pointer' }}>
              or <u>paste profile text instead</u>
            </div>
          ) : null}
          {(showPaste || (!refPdfName && headline)) && (
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Paste your LinkedIn headline or full profile *"
              rows={3}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E0E0E0', fontSize: 13, marginBottom: 8, resize: 'none', boxSizing: 'border-box' }}
            />
          )}
        </>
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
      description: `${plan === 'pro' ? 'Pro' : 'Standard'} LinkedIn Rewrite`,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#666' }}>
          {plan === 'pro' ? 'Pro Plan \u2014 \u20b9999' : 'Standard Plan \u2014 \u20b9499'}
        </span>
        {teaserId && <span style={{ fontSize: 12, opacity: 0.6 }}>(teaser linked)</span>}
      </div>
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
            placeholder="Paste the job description you're targeting (optional, Pro feature)"
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
          {submitting ? 'Creating order...' : `Pay \u20b9${plan === 'pro' ? '999' : '499'} & Get Rewrite`}
        </button>
      </div>
    </div>
  );
}

// ─── PDF to Resume Data Mapper (advanced) ───
function truncateSummary(text: string, maxLen = 200): string {
  if (!text || text.length <= maxLen) return text;
  // Find sentence boundary near maxLen
  const slice = text.slice(0, maxLen + 50);
  const lastSentence = slice.search(/[.!?]\s/);
  if (lastSentence > 80) return slice.slice(0, lastSentence + 1).trim();
  return text.slice(0, maxLen).trim() + '...';
}

function descriptionToBullets(desc: string): string[] {
  if (!desc) return [];
  // Split on common bullet/newline delimiters
  let parts = desc.split(/\n|•|·|–|—|\*|^\d+[.)]\s*/m)
    .map(s => s.trim())
    .filter(s => s.length > 15);
  // If still one big blob, split on sentences
  if (parts.length <= 1 && desc.length > 100) {
    parts = desc.split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
  }
  // Cap each bullet at 200 chars, max 5 bullets per role
  return parts
    .map(b => b.length > 200 ? b.slice(0, 197) + '...' : b)
    .slice(0, 5);
}

function groupSkills(skills: string[]): Array<{ category: string; skills: string[] }> {
  if (!skills || skills.length === 0) return [];
  const techKeywords = /python|java|sql|react|node|aws|azure|docker|kubernetes|html|css|api|git|linux|excel|tableau|power bi|machine learning|ai|data|cloud|devops|networking|security|vmware|sap|salesforce/i;
  const tech = skills.filter(s => techKeywords.test(s));
  const other = skills.filter(s => !techKeywords.test(s));
  const result: Array<{ category: string; skills: string[] }> = [];
  if (tech.length > 0) result.push({ category: 'Technical Skills', skills: tech });
  if (other.length > 0) result.push({ category: 'Professional Skills', skills: other });
  return result.length > 0 ? result : [{ category: 'Skills', skills }];
}

function pdfToResumeData(parsed: any): any {
  if (!parsed) return null;
  const aboutText = parsed.about || '';
  return {
    contact: {
      name: parsed.full_name || '',
      location: parsed.location || '',
      linkedin: parsed.linkedin || '',
    },
    summary: truncateSummary(aboutText) || parsed.headline || '',
    experience: (parsed.experience || []).slice(0, 6).map((e: any) => ({
      title: e.title || '',
      company: e.company || '',
      dates: e.duration || '',
      bullets: descriptionToBullets(e.description || ''),
    })),
    education: (parsed.education || []).map((e: any) => ({
      institution: e.institution || '',
      degree: e.degree || '',
      field: e.field || '',
      year: e.year || '',
    })),
    skills: groupSkills(parsed.skills || []),
    achievements: [
      ...(parsed.honors_awards || []),
      ...(parsed.certifications || []).slice(0, 3).map((c: string) => `Certified: ${c}`),
    ].slice(0, 5),
  };
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

  // Multi-section paste state
  const [pasteAbout, setPasteAbout] = useState('');
  const [pasteExperience, setPasteExperience] = useState('');
  const [pasteEducation, setPasteEducation] = useState('');
  const [pasteSkills, setPasteSkills] = useState('');

  // PDF upload state
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfParsed, setPdfParsed] = useState<any>(null);
  const [pdfError, setPdfError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfRawPaste, setPdfRawPaste] = useState(''); // extracted text for order creation
  const [dragOver, setDragOver] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ state
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

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
    // Combine all paste sections into raw_paste for the order flow
    const sections = [
      `Headline: ${trimmed}`,
      pasteAbout.trim() && `About:\n${pasteAbout.trim()}`,
      pasteExperience.trim() && `Experience:\n${pasteExperience.trim()}`,
      pasteEducation.trim() && `Education:\n${pasteEducation.trim()}`,
      pasteSkills.trim() && `Skills: ${pasteSkills.trim()}`,
    ].filter(Boolean).join('\n\n');
    setPdfRawPaste(sections);
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
    } catch (err: any) {
      console.error('PDF upload error:', err);
      setPdfError('Could not reach the server. Please check your internet connection and try again, or paste your profile text.');
      setShowPasteInput(true);
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

  // ── Pricing section (rendered once, referenced by multiple flows) ──
  const pricingSection = (
    <section ref={pricingRef} style={{ padding: '56px 24px', background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-default)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>Simple Pricing</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>One interview can change your career.</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 36 }}>Profile score is free. Pay only when you{"'"}re ready.</p>

        {/* Two cards side by side */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* Standard */}
          <div className="saas-card" style={{ flex: '1 1 340px', maxWidth: 420, border: '2px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: '32px 28px', position: 'relative', textAlign: 'center' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 'var(--radius-pill)', whiteSpace: 'nowrap' }}>
              Most Popular
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8, marginTop: 8 }}>Standard</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
              &#8377;499 <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>one-time</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Pay once. Download forever.</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, padding: 0 }}>
              {[
                { text: 'AI Profile Score + Analysis', free: true },
                { text: 'Complete Profile Rewrite', free: false },
                { text: 'ATS Resume Builder', free: false },
                { text: 'Cover Letter Generator', free: false },
                { text: 'Interview Prep + Quiz', free: false },
                { text: 'AI Enhance Editor', free: false },
                { text: 'PDF + TXT Export', free: false },
              ].map((f, i) => (
                <li key={i} style={{ fontSize: 14, color: '#333', padding: '8px 0', borderBottom: '1px solid var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>&#10003;</span>
                  {f.text}
                  {f.free && <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--success-subtle)', color: 'var(--success)', padding: '1px 6px', borderRadius: 3, marginLeft: 4 }}>FREE</span>}
                </li>
              ))}
            </ul>
            <button
              className="saas-btn saas-btn-primary"
              onClick={() => { if (teaser) { handlePlanSelect('standard'); } else { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
              style={{ width: '100%', padding: '16px 32px', borderRadius: 'var(--radius-pill)', fontSize: 16, fontWeight: 700, boxShadow: 'var(--shadow-md)' }}
            >
              {teaser ? 'Get Everything for \u20b9499 \u2192' : 'Get Started \u2014 \u20b9499 \u2192'}
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>Secure payment via Razorpay (UPI / Card / Net Banking)</div>
          </div>

          {/* Pro */}
          <div className="saas-card" style={{ flex: '1 1 340px', maxWidth: 420, borderRadius: 'var(--radius-lg)', padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8, marginTop: 8 }}>Pro</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>
              &#8377;999 <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)' }}>one-time</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Everything in Standard, plus more.</div>
            <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 28, padding: 0 }}>
              {[
                'Everything in Standard',
                'All premium resume templates',
                'Priority AI processing',
                'Job-description-tailored rewrite',
                'Targeted cover letter',
                'Advanced interview coaching',
              ].map((f, i) => (
                <li key={i} style={{ fontSize: 14, color: '#333', padding: '8px 0', borderBottom: '1px solid var(--bg-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="saas-btn saas-btn-ghost"
              onClick={() => { if (teaser) { handlePlanSelect('pro'); } else { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); } }}
              style={{ width: '100%', padding: '16px 32px', borderRadius: 'var(--radius-pill)', fontSize: 16, fontWeight: 700, border: '2px solid var(--accent)', color: 'var(--accent)' }}
            >
              Get Pro &#8594;
            </button>
          </div>
        </div>

        <ReferralCodeRedeemer product="roast" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20, padding: '10px 16px', background: 'var(--success-subtle)', borderRadius: 'var(--radius-sm)' }}>
          <span>&#128274;</span>
          <span style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Your data is encrypted, never shared, and you can delete it anytime</span>
        </div>
      </div>
    </section>
  );

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-canvas)' }}>
      {/* ─── NAV ─── */}
      <nav style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', padding: '10px 16px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>Profile</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>Roaster</span>
          </a>
          {/* Desktop nav */}
          <div className="hidden sm:flex" style={{ gap: 14, alignItems: 'center' }}>
            <a href="/dashboard" className="saas-btn saas-btn-ghost" style={{ fontSize: 13, padding: '6px 12px', textDecoration: 'none' }}>Dashboard</a>
            <a href="/pricing" className="saas-btn saas-btn-ghost" style={{ fontSize: 13, padding: '6px 12px', textDecoration: 'none' }}>Pricing</a>
            <button
              className="saas-btn saas-btn-primary"
              onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontSize: 13, padding: '8px 18px', borderRadius: 'var(--radius-pill)' }}
            >
              Get Free Score
            </button>
          </div>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}
            aria-label="Menu"
          >
            <span style={{ display: 'block', width: 20, height: 2, background: 'var(--text-primary)', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ display: 'block', width: 20, height: 2, background: 'var(--text-primary)', borderRadius: 1, transition: 'all 0.2s', opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 20, height: 2, background: 'var(--text-primary)', borderRadius: 1, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        </div>
        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden" style={{ borderTop: '1px solid var(--bg-subtle)', marginTop: 8, paddingTop: 8 }}>
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '10px 8px', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Dashboard</a>
            <a href="/pricing" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '10px 8px', fontSize: 14, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Pricing</a>
            <a href="/build" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '10px 8px', fontSize: 14, color: 'var(--success)', textDecoration: 'none', fontWeight: 600 }}>Build Profile</a>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════ */}
      {/* HERO — Two Columns                  */}
      {/* ═══════════════════════════════════ */}
      <section ref={heroRef} style={{ background: 'linear-gradient(135deg, #F8FAFF 0%, #EEF2FF 40%, #F0F7FF 100%)', borderBottom: '1px solid var(--border-default)', padding: '48px 24px 56px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* LEFT (55%) — Value Proposition */}
            <div style={{ flex: '1.2 1 420px', minWidth: 0 }}>
              <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.15 }}>
                Recruiters Scroll Past Your Profile <span style={{ color: '#CC1016' }}>in 3 Seconds</span>
              </h1>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', marginTop: 0, marginBottom: 16, lineHeight: 1.2 }}>
                Fix It in 2 Minutes with AI
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
                Upload your LinkedIn PDF. See your score, get a complete rewrite, ATS resume, and interview prep &mdash; instantly.
              </p>

              {/* 4 bullet points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {[
                  { icon: '&#127919;', text: 'Profile score + AI-suggested headline' },
                  { icon: '&#127908;', text: 'Personalized interview questions + STAR answers' },
                  { icon: '&#128196;', text: 'ATS resume in multiple templates' },
                  { icon: '&#9993;&#65039;', text: 'Cover letter matched to your target role' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: item.icon }} />
                    <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Before / After score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ background: '#FEF2F2', borderRadius: 'var(--radius-sm)', padding: '8px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#CC1016', letterSpacing: 1 }}>BEFORE</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#CC1016' }}>42</div>
                </div>
                <div style={{ fontSize: 18, color: '#CBD5E1' }}>&rarr;</div>
                <div style={{ background: 'var(--success-subtle)', borderRadius: 'var(--radius-sm)', padding: '8px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--success)', letterSpacing: 1 }}>AFTER</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>87</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>+45 points</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Average improvement</div>
                </div>
              </div>

              {/* Trust microcopy */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                <span>&#128274; No signup</span>
                <span>&#9889; Instant results</span>
                <span>&#127873; 100% free analysis</span>
              </div>

              {/* Build link */}
              <div style={{ marginTop: 16 }}>
                <a href="/build" style={{ fontSize: 13, color: 'var(--success)', fontWeight: 600, textDecoration: 'none' }}>
                  No LinkedIn? <u>Build your profile from scratch</u> &rarr;
                </a>
              </div>
            </div>

            {/* RIGHT (45%) — Upload Card */}
            <div style={{ flex: '1 1 380px', minWidth: 0, maxWidth: 480 }}>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '2px solid var(--accent)', padding: '28px 24px', boxShadow: '0 8px 32px rgba(10,102,194,0.1)' }}>

                {/* Free hook banner */}
                <div style={{ background: 'var(--warning-subtle)', border: '1px solid #FDE68A', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>&#127873;</span>
                  <div style={{ fontSize: 13, color: '#92400E', fontWeight: 600, lineHeight: 1.4 }}>
                    <strong style={{ color: '#B45309' }}>See why recruiters ignore your profile &mdash; FREE</strong>
                  </div>
                </div>

                {/* Upload Area */}
                <div
                  onClick={handlePdfClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--accent)' : pdfParsed ? 'var(--success)' : '#94B8DB'}`,
                    borderRadius: 'var(--radius-md)', padding: 20, textAlign: 'center', marginBottom: 8,
                    background: dragOver ? '#E8F0FE' : pdfParsed ? 'var(--success-subtle)' : '#F0F7FF',
                    cursor: pdfUploading ? 'wait' : 'pointer', transition: 'all var(--transition)',
                  }}
                >
                  <input ref={pdfInputRef} type="file" accept=".pdf" onChange={handlePdfChange} style={{ display: 'none' }} />
                  {pdfUploading ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6, animation: 'spin 1s linear infinite' }}>&#9881;</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Parsing your LinkedIn PDF...</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Extracting profile data &bull; 5-10 seconds</div>
                      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                    </>
                  ) : pdfParsed ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>&#9989;</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)' }}>
                        {pdfParsed.full_name ? `${pdfParsed.full_name}'s profile parsed!` : 'LinkedIn PDF parsed!'}
                      </div>
                      {pdfParsed.headline && <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 4 }}>{pdfParsed.headline.slice(0, 70)}{pdfParsed.headline.length > 70 ? '...' : ''}</div>}
                      {(pdfParsed.experience?.length > 0 || pdfParsed.education?.length > 0) && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                          {pdfParsed.experience?.length || 0} experiences &bull; {pdfParsed.education?.length || 0} education &bull; {pdfParsed.skills?.length || 0} skills
                        </div>
                      )}
                      <div onClick={(e) => { e.stopPropagation(); setPdfParsed(null); setPdfFileName(''); setPdfRawPaste(''); setHeadline(''); setTeaser(null); }} style={{ fontSize: 11, color: 'var(--accent)', marginTop: 6, cursor: 'pointer', textDecoration: 'underline' }}>Upload a different PDF</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 6 }}>&#128228;</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>{dragOver ? 'Drop your PDF here!' : 'Drop your LinkedIn PDF here'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>or click to browse &bull; .pdf only</div>
                    </>
                  )}
                </div>

                {/* PDF error */}
                {pdfError && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#DC2626' }}>
                    {pdfError}
                    <span onClick={() => { setPdfError(''); setShowPasteInput(true); }} style={{ color: 'var(--accent)', cursor: 'pointer', marginLeft: 8, textDecoration: 'underline' }}>Paste text instead</span>
                  </div>
                )}

                {/* Paste fallback + PDF guide + CTA */}
                {!pdfParsed && !pdfUploading && (
                  <>
                    {!showPasteInput ? (
                      <div onClick={() => setShowPasteInput(true)} style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 10, cursor: 'pointer' }}>
                        Don{"'"}t have your PDF? <u>Paste your profile sections instead</u>
                      </div>
                    ) : (
                      <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginBottom: 2 }}>
                          &#128241; On mobile? Paste your profile sections below
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
                          Open LinkedIn app &rarr; Go to your profile &rarr; Long-press each section to copy &rarr; Paste here
                        </div>

                        {/* Headline (required) */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Headline <span style={{ color: '#DC2626' }}>*</span></label>
                          <textarea ref={textareaRef} value={headline} onChange={e => setHeadline(e.target.value)}
                            placeholder="e.g. Senior Manager | B2B Sales | 6+ Years" rows={2} maxLength={500}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }}
                          />
                          {headline.length > 0 && headline.trim().length < 10 && (
                            <p style={{ fontSize: 11, color: '#CC1016', marginTop: 2 }}>Please paste your complete headline.</p>
                          )}
                        </div>

                        {/* About (optional) */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>About <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>optional</span></label>
                          <textarea value={pasteAbout} onChange={e => setPasteAbout(e.target.value)}
                            placeholder="Paste your LinkedIn About section here..." rows={3}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                          />
                        </div>

                        {/* Experience (optional) */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Experience <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>optional</span></label>
                          <textarea value={pasteExperience} onChange={e => setPasteExperience(e.target.value)}
                            placeholder="Paste all your experience entries..." rows={3}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                          />
                        </div>

                        {/* Education (optional) */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Education <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>optional</span></label>
                          <textarea value={pasteEducation} onChange={e => setPasteEducation(e.target.value)}
                            placeholder="Paste your education details..." rows={2}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                          />
                        </div>

                        {/* Skills (optional) */}
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Skills <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>optional</span></label>
                          <textarea value={pasteSkills} onChange={e => setPasteSkills(e.target.value)}
                            placeholder="e.g. Python, React, Project Management, AWS..." rows={2}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }}
                          />
                        </div>

                        {/* Section count indicator */}
                        {(() => {
                          const filled = [headline.trim(), pasteAbout.trim(), pasteExperience.trim(), pasteEducation.trim(), pasteSkills.trim()].filter(s => s.length > 0).length;
                          return filled > 0 ? (
                            <div style={{ fontSize: 11, color: filled >= 3 ? 'var(--success)' : 'var(--text-secondary)', textAlign: 'center' }}>
                              {filled}/5 sections filled {filled < 3 ? '— paste more for a deeper analysis' : '— great, enough for a full rewrite!'}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Collapsible "How to download LinkedIn PDF" */}
                    <div style={{ marginBottom: 10 }}>
                      <button
                        onClick={() => setShowPdfGuide(!showPdfGuide)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', padding: 0, border: 'none', background: 'none', width: '100%' }}
                      >
                        &#128196; How to download your LinkedIn PDF {showPdfGuide ? '\u25B2' : '\u25BC'}
                      </button>
                      {showPdfGuide && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', padding: '4px 0' }}>&#128187; On Desktop / Laptop:</div>
                          {[
                            { step: '1', title: 'Go to your LinkedIn profile', desc: 'Open LinkedIn \u2192 Click your photo \u2192 "View Profile"' },
                            { step: '2', title: 'Click "More" \u2192 "Save to PDF"', desc: 'Below your headline, click the "More..." button, then "Save to PDF"' },
                            { step: '3', title: 'Upload the downloaded PDF here', desc: 'Drop it into the upload box above. Done!' },
                          ].map((s) => (
                            <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                              </div>
                            </div>
                          ))}
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', padding: '8px 0 4px' }}>&#128241; On Mobile (no PDF option in app):</div>
                          {[
                            { step: '1', title: 'Open browser, not the app', desc: 'Open Chrome or Safari \u2192 go to linkedin.com \u2192 log in' },
                            { step: '2', title: 'Request Desktop Site', desc: 'Chrome: tap \u22ee \u2192 "Desktop site" &bull; Safari: tap aA \u2192 "Request Desktop Website"' },
                            { step: '3', title: 'Save to PDF', desc: 'Go to your profile \u2192 "More" \u2192 "Save to PDF" \u2192 upload here' },
                          ].map((s) => (
                            <div key={`m${s.step}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#FEF3C7', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#D97706', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.step}</div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                              </div>
                            </div>
                          ))}
                          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textAlign: 'center', padding: '4px 0' }}>
                            &#128161; Easier option: Just paste your profile sections above!
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={() => { if (!showPasteInput) { setShowPasteInput(true); return; } handleTeaserSubmit(); }}
                      disabled={loading || (showPasteInput && headline.trim().length < 10)}
                      className="saas-btn saas-btn-primary"
                      style={{
                        width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-pill)', border: 'none',
                        fontSize: 15, fontWeight: 700, cursor: 'pointer',
                        opacity: loading || (showPasteInput && headline.trim().length < 10) ? 0.5 : 1,
                        boxShadow: 'var(--shadow-md)',
                      }}
                    >
                      {loading ? 'Analyzing...' : 'Get My Free Score \u2192'}
                    </button>
                  </>
                )}

                {/* Loading (PDF path) */}
                {loading && pdfParsed && (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 600 }}>Analyzing your profile...</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Generating your free score</div>
                  </div>
                )}

                {/* Rate limited — with PDF parsed */}
                {pdfParsed && rateLimited && !teaser && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--success-subtle)', border: '1px solid #BBF7D0', marginBottom: 12 }}>
                      <div style={{ fontSize: 13, color: 'var(--success)', fontWeight: 700 }}>&#9989; Profile parsed! Free preview limit reached for today.</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Get the full AI rewrite + resume + interview prep:</div>
                    </div>
                    {/* Resume previews */}
                    {(() => {
                      const resumeData = pdfToResumeData(pdfParsed);
                      const recIds = ['classic', 'salesbd', 'headline'];
                      if (!resumeData) return null;
                      return (
                        <div style={{ marginBottom: 12 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Your resume would look like this:</p>
                          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
                            {recIds.map(tid => (
                              <div key={tid} style={{ flexShrink: 0, width: 220, position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', cursor: 'pointer' }}
                                onClick={scrollToPricing}>
                                <div style={{ height: 280, overflow: 'hidden' }}>
                                  <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', width: '312%', pointerEvents: 'none' }}>
                                    {renderResumeHTML(resumeData, tid)}
                                  </div>
                                </div>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(transparent, white)', zIndex: 2 }} />
                                <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', zIndex: 3 }}>
                                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}>Unlock &rarr;</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    <button onClick={scrollToPricing} className="saas-btn saas-btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-pill)', fontSize: 14, fontWeight: 700 }}>Get Full Rewrite + Resume &#8377;499 &rarr;</button>
                  </div>
                )}
                {/* Rate limited — no PDF */}
                {rateLimited && !pdfParsed && (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--warning-subtle)', border: '1px solid var(--warning)' }}>
                    <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>5 free previews used today.</div>
                    <button onClick={scrollToPricing} className="saas-btn saas-btn-primary" style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700 }}>Get Full Report &#8377;499 &rarr;</button>
                  </div>
                )}

                {/* Trust line */}
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginTop: 10 }}>
                  &#9889; Free &bull; No signup &bull; Results in seconds
                </div>

                {/* Referral code link */}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <ReferralCodeRedeemer product="roast" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════ */}
      {/* TEASER RESULT                       */}
      {/* ═══════════════════════════════════ */}
      {teaser && (
        <section ref={resultRef} style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-default)', padding: '28px 16px', animation: 'resultAppear 0.5s ease forwards' }}>
          <div style={{ maxWidth: 700, margin: '0 auto', width: '100%', boxSizing: 'border-box' as const }}>
            {/* Score card */}
            <div className="saas-card" style={{ padding: '20px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Your Profile Score</p>
              <ScoreBadge score={teaser.score} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.5 }}>
                Based on headline analysis. Full profile score is typically 30-40 points lower.
              </p>
            </div>

            {/* AI-Suggested Headline (green) */}
            {teaser.suggested_headline && (
              <div style={{ background: 'var(--bg-surface)', border: '2px solid var(--success)', borderRadius: 'var(--radius-md)', boxShadow: '0 2px 12px rgba(5,118,66,0.08)', padding: '18px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>&#10003;</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>AI-Suggested Headline</p>
                </div>
                <div style={{ background: 'var(--success-subtle)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 15, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{teaser.suggested_headline}</p>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>This is 1 of many variations you get with the full rewrite.</p>
              </div>
            )}

            {/* Interview Question (teal) */}
            {teaser.sample_interview_question && (
              <div style={{ background: 'var(--bg-surface)', border: '2px solid #0891B2', borderRadius: 'var(--radius-md)', boxShadow: '0 2px 12px rgba(8,145,178,0.08)', padding: '18px 16px', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#0891B2', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>?</div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0891B2' }}>A Recruiter Would Ask You</p>
                </div>
                <div style={{ background: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: 'var(--radius-sm)', padding: '14px 16px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>&#8220;{teaser.sample_interview_question}&#8221;</p>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>Unlock 15 personalized questions + STAR-format answers + cheat sheet</p>
              </div>
            )}

            {/* 3 Resume Previews (horizontal scroll) */}
            {pdfParsed && (() => {
              const resumeData = pdfToResumeData(pdfParsed);
              const recIds = ['classic', 'salesbd', 'headline'];
              if (!resumeData) return null;
              return (
                <div style={{ marginBottom: 12 }}>
                  <div className="saas-card" style={{ padding: '18px 16px' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Your Resume &mdash; Built From Your LinkedIn</p>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Real data from your profile. Unlock to download.</p>
                    <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 8 }}>
                      {recIds.map(tid => {
                        const tmpl = TEMPLATES.find(t => t.id === tid);
                        return (
                          <div key={tid} style={{ flexShrink: 0, width: 280, position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-default)', background: 'var(--bg-surface)', cursor: 'pointer' }}
                            onClick={scrollToPricing}>
                            <div style={{ height: 360, overflow: 'hidden' }}>
                              <div style={{ transform: 'scale(0.4)', transformOrigin: 'top left', width: '250%', pointerEvents: 'none' }}>
                                {renderResumeHTML(resumeData, tid)}
                              </div>
                            </div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(transparent, rgba(255,255,255,0.7) 30%, white 70%)', zIndex: 2 }} />
                            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%,-50%) rotate(-30deg)', fontSize: 16, fontWeight: 800, color: 'rgba(10,102,194,0.06)', whiteSpace: 'nowrap', pointerEvents: 'none', letterSpacing: 4, zIndex: 1 }}>
                              ProfileRoaster
                            </div>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px', background: 'var(--bg-surface)', borderTop: '1px solid var(--bg-subtle)', zIndex: 3, textAlign: 'center' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{tmpl?.name}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', color: 'white', padding: '6px 16px', borderRadius: 'var(--radius-pill)', display: 'inline-block' }}>
                                Unlock Full Resume &rarr;
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3 Locked items */}
            <div className="saas-card" style={{ padding: '18px 16px', marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>What we found beyond your headline:</p>
              {[
                { icon: '\uD83D\uDD12', text: '2 critical profile issues hidden' },
                { icon: '\uD83D\uDD12', text: 'ATS keyword gaps hidden' },
                { icon: '\uD83D\uDD12', text: '5 interview questions tailored to your profile hidden' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', marginBottom: 8, border: '1px solid var(--border-default)' }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Blue gradient CTA */}
            <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))', borderRadius: 'var(--radius-md)', padding: '22px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                Get Full Rewrite + Interview Prep + Resume
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.5 }}>
                Complete profile rewrite + interview prep + ATS resume
              </p>
              <button
                onClick={scrollToPricing}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 'var(--radius-pill)', border: 'none',
                  background: 'white', color: 'var(--accent)',
                  fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                Get Full Rewrite + Interview Prep + Resume &rarr;
              </button>
              <LiveCounter />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ */}
      {/* PRICING (single section — appears   */}
      {/* after teaser CTA or in marketing)   */}
      {/* ═══════════════════════════════════ */}
      {(showPricing || teaser) && !selectedPlan && pricingSection}

      {/* ═══════════════════════════════════ */}
      {/* PROFILE INPUT FORM                  */}
      {/* ═══════════════════════════════════ */}
      {selectedPlan && (
        <section ref={inputFormRef} style={{ background: 'var(--bg-canvas)', padding: '28px 16px 40px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            {/* Plan switcher */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
              <button
                onClick={() => setSelectedPlan('standard')}
                style={{
                  flex: '1 1 200px', maxWidth: 240, padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: selectedPlan === 'standard' ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                  background: selectedPlan === 'standard' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: selectedPlan === 'standard' ? 'var(--accent)' : 'var(--text-primary)' }}>&#8377;499</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedPlan === 'standard' ? 'var(--accent)' : 'var(--text-secondary)' }}>Standard</div>
              </button>
              <button
                onClick={() => setSelectedPlan('pro')}
                style={{
                  flex: '1 1 200px', maxWidth: 240, padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  border: selectedPlan === 'pro' ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                  background: selectedPlan === 'pro' ? 'var(--accent-subtle)' : 'var(--bg-surface)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: selectedPlan === 'pro' ? 'var(--accent)' : 'var(--text-primary)' }}>&#8377;999</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedPlan === 'pro' ? 'var(--accent)' : 'var(--text-secondary)' }}>Pro</div>
              </button>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 500px', minWidth: 0 }}>
                <ProfileInputForm
                  plan={selectedPlan}
                  teaserId={teaser?.teaser_id || null}
                  email={email}
                  initialRawPaste={pdfRawPaste}
                />
              </div>
              {/* Sidebar (desktop only) */}
              <div className="hidden lg:block" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 80 }}>
                <div className="saas-card" style={{ padding: 20, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>What happens next</div>
                  {[
                    { num: '1', text: pdfRawPaste ? 'Your profile is loaded \u2014 review below' : 'Paste your full LinkedIn profile' },
                    { num: '2', text: 'Pay securely via UPI/Card' },
                    { num: '3', text: 'AI rewrites your profile in ~90 seconds' },
                    { num: '4', text: 'Copy-paste your new profile + download resume' },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.num}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.text}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--success-subtle)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-md)', padding: 16, fontSize: 12, color: 'var(--success)', lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Secure &amp; Private</div>
                  Your data is processed by AI only. No humans read your profile. You can delete anytime.
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ */}
      {/* MARKETING STACK (only when !teaser) */}
      {/* ═══════════════════════════════════ */}
      {!teaser && (
        <>
          {/* ── Everything You Need ── */}
          <section style={{ padding: '56px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8 }}>Everything You Need to Land Interviews</h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 40 }}>One payment. Four powerful tools. Zero subscriptions.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                {[
                  { icon: '&#128293;', title: 'Fix What\u2019s Blocking Your Profile', desc: 'AI scores your profile, identifies issues, and rewrites your headline, about, and experience.', free: true },
                  { icon: '&#127919;', title: 'Answer Like a Top Candidate', desc: 'Personalized interview questions based on YOUR resume + target JD. STAR-format answers + cheat sheet + quiz.', free: false },
                  { icon: '&#128196;', title: 'Get Past ATS Filters', desc: 'Professional resume matched to your job description. ATS-optimized templates. PDF + TXT download.', free: false },
                  { icon: '&#9993;&#65039;', title: 'Stand Out in Applications', desc: 'Personalized cover letter for every application. Ready to copy-paste.', free: false },
                ].map((f, i) => (
                  <div key={i} className="saas-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }} dangerouslySetInnerHTML={{ __html: f.icon }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</div>
                    {f.free && <div style={{ display: 'inline-block', background: 'var(--success)', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 'var(--radius-pill)', marginTop: 12, letterSpacing: 0.5 }}>FREE &mdash; Try Now</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How It Works ── */}
          <section style={{ padding: '56px 24px', background: 'linear-gradient(135deg, #F8FAFF 0%, #F0F7FF 100%)', borderBottom: '1px solid var(--border-default)' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8 }}>How It Works</h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 40 }}>Three steps. That{"'"}s it.</p>
              <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                {[
                  { num: '1', title: 'Share Your Profile', desc: 'Upload LinkedIn PDF, old resume, or fill a quick form' },
                  { num: '2', title: 'AI Analyzes & Builds', desc: 'Scores your profile, rewrites it, generates resume + interview prep' },
                  { num: '3', title: 'Download & Apply', desc: 'Everything ready. Start applying with confidence today.' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: '1 1 200px', textAlign: 'center', padding: '0 16px', position: 'relative', minWidth: 200 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{s.num}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                    {i < 2 && <span className="hidden md:block" style={{ position: 'absolute', right: -12, top: 24, fontSize: 20, color: '#CBD5E1' }}>&rarr;</span>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── See Real Results ── */}
          <section style={{ padding: '56px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 8 }}>See Real Results</h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 32 }}>Actual output from ProfileRoaster.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                {/* Rewrite Before/After */}
                <div className="saas-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}>&#9997;&#65039; AI Profile Rewrite</div>
                  <div style={{ padding: 16 }}>
                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>&#10007; BEFORE</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>&ldquo;Software Engineer | Python | Java | AWS | Docker | Seeking opportunities&rdquo;</div>
                    </div>
                    <div style={{ background: 'var(--success-subtle)', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>&#10003; AFTER</div>
                      <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, lineHeight: 1.5 }}>&ldquo;Full-Stack Engineer | Built 5 Apps Serving 50K+ Users | React + AWS&rdquo;</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>28</span>
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>&rarr;</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>76</span>
                      <span style={{ background: 'var(--success-subtle)', color: 'var(--success)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>+48 pts</span>
                    </div>
                  </div>
                </div>

                {/* Resume Preview */}
                <div className="saas-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))' }}>&#128196; ATS Resume</div>
                  <div style={{ padding: 0 }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', margin: 12, borderRadius: 4, padding: 14, fontSize: 11 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Priya Mehta</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Full-Stack Engineer &bull; Bangalore</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Experience</div>
                      <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, marginBottom: 4 }} />
                      <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                      <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, marginBottom: 4, width: '60%' }} />
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Education</div>
                      <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, marginBottom: 4, width: '80%' }} />
                      <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 1, margin: '8px 0 4px' }}>Skills</div>
                      <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, width: '100%' }} />
                    </div>
                    <div style={{ margin: '0 12px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>ATS Score</span><span style={{ color: 'var(--success)', fontWeight: 700 }}>87%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--border-default)', borderRadius: 3 }}>
                        <div style={{ height: 6, background: 'var(--success)', borderRadius: 3, width: '87%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview Prep Preview */}
                <div className="saas-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'linear-gradient(135deg, var(--success), #034A2A)' }}>&#127919; Interview Prep</div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      {['Questions', 'Cheat Sheet', 'Quiz'].map((t, i) => (
                        <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 4, background: i === 0 ? 'var(--accent)' : 'var(--accent-subtle)', color: i === 0 ? 'white' : 'var(--accent)' }}>{t}</span>
                      ))}
                    </div>
                    {[
                      { type: 'Behavioral', q: 'Tell me about a time you handled a tight deadline on a project.' },
                      { type: 'Role Specific', q: 'How would you optimize a slow database query in production?' },
                      { type: 'Situational', q: 'Your team disagrees on the tech stack. How do you resolve it?' },
                    ].map((item, i) => (
                      <div key={i} style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginBottom: 8, fontSize: 12, color: '#333', lineHeight: 1.5 }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 3 }}>{item.type}</div>
                        {item.q}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Pricing (in marketing stack, NOT duplicated) ── */}
          {!showPricing && !selectedPlan && pricingSection}

          {/* ── FAQ ── */}
          <section style={{ padding: '56px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 32 }}>Frequently Asked Questions</h2>
              {[
                { q: 'Is the profile score really free?', a: 'Yes! Upload your LinkedIn PDF or paste your headline and get an instant AI score with a suggested headline \u2014 completely free, no signup required.' },
                { q: 'What do I get with the paid plan?', a: 'A complete profile rewrite (headline, about, experience), ATS-optimized resume in multiple templates, personalized cover letter, and interview prep with questions, STAR-format answers, cheat sheet, and quiz.' },
                { q: 'How is this different from ChatGPT?', a: 'ProfileRoaster is purpose-built for LinkedIn optimization. It understands ATS algorithms, recruiter behavior, and Indian job market nuances. You get structured, ready-to-use output \u2014 not generic paragraphs.' },
                { q: 'How long does it take?', a: 'The free score is instant. The full rewrite + resume + interview prep is generated in about 90 seconds after payment.' },
                { q: 'Is my data safe?', a: 'Your data is encrypted in transit and at rest. Only AI processes your profile \u2014 no humans read it. You can delete your data anytime from your dashboard.' },
                { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, and wallets via Razorpay \u2014 India\'s most trusted payment gateway.' },
                { q: 'Can I get a refund?', a: 'Since the AI output is generated instantly and delivered immediately, we do not offer refunds. However, if there is a technical issue, contact us and we will make it right.' },
                { q: 'Do I need a LinkedIn account?', a: 'Not necessarily. You can paste your headline or profile text manually. If you want resume + full rewrite, uploading a LinkedIn PDF gives the best results. We also have a "Build Profile" tool if you\'re starting from scratch.' },
              ].map((item, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', paddingRight: 16 }}>{item.q}</span>
                    <span style={{ fontSize: 18, color: 'var(--text-secondary)', flexShrink: 0, transition: 'transform 0.2s', transform: faqOpen === i ? 'rotate(180deg)' : 'none' }}>&#9660;</span>
                  </button>
                  {faqOpen === i && (
                    <div style={{ padding: '0 0 16px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Final CTA ── */}
          <section style={{ background: 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent) 100%)', padding: '48px 16px', textAlign: 'center' }}>
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>Stop losing interviews.</div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 12, lineHeight: 1.6 }}>Every day with a weak profile is another recruiter who scrolled past you.</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 28, lineHeight: 1.6 }}>
                Resume writers charge &#8377;3,000&ndash;15,000 and take days.<br />
                We do everything in under 3 minutes for &#8377;499. One time. No subscription.
              </div>
              <button
                onClick={() => { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ background: 'white', color: 'var(--accent)', fontSize: 16, fontWeight: 700, padding: '16px 40px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
              >
                Upload Your PDF &mdash; Free Score &rarr;
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
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>AI-powered career tools for Indian job seekers</div>
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
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>&copy; 2026 ProfileRoaster. All rights reserved.</div>
        </div>
      </footer>
    </main>
  );
}

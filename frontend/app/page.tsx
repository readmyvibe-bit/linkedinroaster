'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { TEMPLATES, renderResumeHTML, getRecommendedTemplates } from '../components/resume/ResumeTemplates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───
interface TeaserResult {
  score: number;
  issues: string[];
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
function ReferralCodeRedeemer() {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [redeemEmail, setRedeemEmail] = useState('');
  const [profileData, setProfileData] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [fileUploading, setFileUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [refInputMode, setRefInputMode] = useState<'resume' | 'linkedin' | 'paste'>('resume');
  const refFileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    setFileUploading(true);
    setFileName(file.name);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const isLinkedIn = refInputMode === 'linkedin';
      const endpoint = isLinkedIn ? `${API_URL}/api/linkedin-pdf/parse` : `${API_URL}/api/resume/upload-parse`;
      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to parse file'); return; }
      setProfileData(data.raw_paste || data.rawText || data.raw_text || JSON.stringify(data.parsed || ''));
    } catch {
      setError('Could not parse file. Try pasting your profile text instead.');
      setRefInputMode('paste');
    } finally {
      setFileUploading(false);
    }
  }

  async function handleRedeem() {
    if (!code.trim() || !redeemEmail.trim()) {
      setError('Please enter your email and referral code.');
      return;
    }
    if (!profileData.trim()) {
      setError('Please upload a file or paste your profile data.');
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
          profile_data: profileData.trim() ? { raw_paste: profileData.trim() } : undefined,
          input_source: refInputMode === 'paste' ? 'questionnaire' : refInputMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to redeem code');
        return;
      }
      if (data.order_id) {
        window.location.href = `/results/${data.order_id}`;
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
      {/* Input mode tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[
          { key: 'resume' as const, label: 'Resume' },
          { key: 'linkedin' as const, label: 'LinkedIn PDF' },
          { key: 'paste' as const, label: 'Paste' },
        ].map(t => (
          <button key={t.key} onClick={() => { setRefInputMode(t.key); setProfileData(''); setFileName(''); }}
            style={{ flex: 1, padding: '6px 8px', fontSize: 11, fontWeight: refInputMode === t.key ? 700 : 500, borderRadius: 6, border: 'none', cursor: 'pointer', background: refInputMode === t.key ? '#E8F0FE' : '#F3F4F6', color: refInputMode === t.key ? '#0A66C2' : '#666' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* File upload (resume or linkedin) */}
      {(refInputMode === 'resume' || refInputMode === 'linkedin') && (
        <div
          onClick={() => refFileInputRef.current?.click()}
          style={{ border: '2px dashed #94B8DB', borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginBottom: 8, background: profileData ? '#F0FDF4' : '#F0F7FF', cursor: fileUploading ? 'wait' : 'pointer', fontSize: 12 }}
        >
          <input ref={refFileInputRef} type="file" accept={refInputMode === 'resume' ? '.pdf,.docx' : '.pdf'} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} style={{ display: 'none' }} />
          {fileUploading ? (
            <span style={{ color: '#0A66C2', fontWeight: 600 }}>Parsing...</span>
          ) : profileData ? (
            <span style={{ color: '#057642', fontWeight: 600 }}>{'\u2705'} {fileName} loaded</span>
          ) : (
            <span style={{ color: '#0A66C2', fontWeight: 600 }}>
              {refInputMode === 'resume' ? '\uD83D\uDCC4 Upload Resume (PDF/DOCX)' : '\uD83D\uDCBC Upload LinkedIn PDF'}
            </span>
          )}
        </div>
      )}

      {/* Paste input */}
      {refInputMode === 'paste' && (
        <textarea
          value={profileData}
          onChange={(e) => setProfileData(e.target.value)}
          placeholder="Paste your headline, experience, or profile text *"
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

// ─── Profile Input Form (Payment) ───
function ProfileInputForm({
  plan,
  teaserId,
  email: initialEmail,
  initialRawPaste,
  inputSource,
  targetRole,
}: {
  plan: 'standard' | 'pro';
  teaserId: string | null;
  email: string;
  initialRawPaste?: string;
  inputSource: 'resume' | 'linkedin' | 'questionnaire' | 'student';
  targetRole: string;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [rawPaste, setRawPaste] = useState(initialRawPaste || '');
  const [jobDescription, setJobDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sparseWarning, setSparseWarning] = useState(false);

  const sourceLabel = inputSource === 'resume' ? 'Your Resume Data' : inputSource === 'linkedin' ? 'Your LinkedIn Profile (from PDF)' : 'Your Profile Data';

  // Check if questionnaire data is sparse (only headline, no experience/skills)
  const isSparseQuestionnaire = inputSource === 'questionnaire' && rawPaste.trim().length > 0 && (() => {
    const text = rawPaste.trim().toLowerCase();
    const hasExperience = text.includes('experience:') && text.split('experience:')[1]?.trim().length > 20;
    const hasSkills = text.includes('skills:') && text.split('skills:')[1]?.trim().length > 5;
    return !hasExperience && !hasSkills;
  })();

  async function handleSubmit() {
    if (!email.trim() || !rawPaste.trim()) return;
    // Show sparse warning on first click for questionnaire users with minimal data
    if (isSparseQuestionnaire && !sparseWarning) {
      setSparseWarning(true);
      return; // Show warning, don't block — next click proceeds
    }
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
          input_source: inputSource,
          target_role: targetRole || undefined,
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
      name: 'ProfileRoaster',
      description: `${plan === 'pro' ? 'Pro' : 'Standard'} Career Transformation`,
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
        {sourceLabel}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#666' }}>
          {plan === 'pro' ? 'Pro Plan \u2014 \u20b9999' : 'Standard Plan \u2014 \u20b9499'}
        </span>
        {teaserId && <span style={{ fontSize: 12, opacity: 0.6 }}>(teaser linked)</span>}
      </div>
      {initialRawPaste ? (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: '#057642', fontWeight: 600 }}>
          &#9989; Data auto-filled from your {inputSource === 'resume' ? 'resume' : inputSource === 'linkedin' ? 'LinkedIn PDF' : 'profile'}. Review and edit below if needed.
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#999', marginBottom: 20 }}>
          Paste your profile data below or go back to upload a file.
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
          placeholder="Your profile data *"
          rows={10}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #E0E0E0', fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }}
        />
        {rawPaste.trim().length > 0 && (
          <p style={{ fontSize: 12, color: rawPaste.trim().length > 100 ? '#057642' : '#E16B00' }}>
            {rawPaste.trim().length} characters
            {rawPaste.trim().length < 100 && ' \u2014 add more data for better results'}
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
        {sparseWarning && isSparseQuestionnaire && (
          <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>
              Limited data notice
            </div>
            <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
              You only provided a headline. Your results will be less detailed. You can still proceed, or go back to add more info for better results.
            </div>
          </div>
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
          {submitting ? 'Creating order...' : sparseWarning && isSparseQuestionnaire ? `Proceed Anyway \u2014 \u20b9${plan === 'pro' ? '999' : '499'}` : `Pay \u20b9${plan === 'pro' ? '999' : '499'} & Get Full Rewrite`}
        </button>
      </div>
    </div>
  );
}

// ─── PDF to Resume Data Mapper (advanced) ───
function truncateSummary(text: string, maxLen = 200): string {
  if (!text || text.length <= maxLen) return text;
  const slice = text.slice(0, maxLen + 50);
  const lastSentence = slice.search(/[.!?]\s/);
  if (lastSentence > 80) return slice.slice(0, lastSentence + 1).trim();
  return text.slice(0, maxLen).trim() + '...';
}

function descriptionToBullets(desc: string): string[] {
  if (!desc) return [];
  let parts = desc.split(/\n|•|·|–|—|\*|^\d+[.)]\s*/m)
    .map(s => s.trim())
    .filter(s => s.length > 15);
  if (parts.length <= 1 && desc.length > 100) {
    parts = desc.split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 15);
  }
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
  const aboutText = parsed.about || parsed.summary || '';
  return {
    contact: {
      name: parsed.full_name || parsed.name || '',
      location: parsed.location || '',
      linkedin: parsed.linkedin || '',
    },
    summary: truncateSummary(aboutText) || parsed.headline || '',
    experience: (parsed.experience || []).slice(0, 6).map((e: any) => ({
      title: e.title || e.role || '',
      company: e.company || '',
      dates: e.duration || e.dates || (e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : ''),
      bullets: descriptionToBullets(e.description || (e.bullets || []).join('\n') || ''),
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
// ─── Student Pay Button ───
function StudentPayButton({ formData, email }: { formData: any; email: string }) {
  const [paying, setPaying] = useState(false);

  async function handlePay() {
    setPaying(true);
    try {
      const res = await fetch(`${API_URL}/api/build/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan: 'student', form_input: formData }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed to create order'); return; }

      const rzp = new (window as any).Razorpay({
        key: data.razorpay_key,
        amount: data.amount,
        currency: data.currency,
        name: 'ProfileRoaster',
        description: 'Student Plan — Resume + LinkedIn + Interview Prep',
        order_id: data.razorpay_order_id,
        prefill: { email },
        handler: () => { window.location.href = `/build/results/${data.order_id}`; },
        theme: { color: '#057642' },
      });
      rzp.open();
    } catch {
      alert('Payment failed. Please try again.');
    } finally {
      setPaying(false);
    }
  }

  return (
    <button onClick={handlePay} disabled={paying} style={{ width: '100%', padding: '14px', background: 'white', color: '#057642', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: paying ? 0.6 : 1 }}>
      {paying ? 'Processing...' : 'Pay \u20b999 & Build My Resume'}
    </button>
  );
}

export default function Home() {
  // Input source tracking
  const [inputSource, setInputSource] = useState<'resume' | 'linkedin' | 'questionnaire' | 'student'>('resume');
  const [activeInputTab, setActiveInputTab] = useState<'resume' | 'linkedin' | 'questionnaire' | 'student'>('resume');

  // Core state
  const [headline, setHeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [teaser, setTeaser] = useState<TeaserResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'pro' | null>(null);
  const [rateLimited, setRateLimited] = useState(false);

  // Resume upload state
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeParsed, setResumeParsed] = useState<any>(null);
  const [resumeError, setResumeError] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeRawText, setResumeRawText] = useState('');
  const [resumeDragOver, setResumeDragOver] = useState(false);

  // LinkedIn PDF upload state
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfParsed, setPdfParsed] = useState<any>(null);
  const [pdfError, setPdfError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfRawPaste, setPdfRawPaste] = useState('');
  const [pdfDragOver, setPdfDragOver] = useState(false);

  // Confirmation screen
  const [showConfirmScreen, setShowConfirmScreen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmHeadline, setConfirmHeadline] = useState('');
  const [confirmExperience, setConfirmExperience] = useState('');
  const [confirmEducation, setConfirmEducation] = useState('');
  const [confirmSkills, setConfirmSkills] = useState('');
  const [targetRole, setTargetRole] = useState('');

  // Questionnaire state
  const [qName, setQName] = useState('');
  const [qHeadline, setQHeadline] = useState('');
  const [qExperience, setQExperience] = useState('');
  const [qEducation, setQEducation] = useState('');
  const [qSkills, setQSkills] = useState('');
  const [qTargetRole, setQTargetRole] = useState('');

  // Student form
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentCollege, setStudentCollege] = useState('');
  const [studentDegree, setStudentDegree] = useState('');
  const [studentBranch, setStudentBranch] = useState('');
  const [studentGradYear, setStudentGradYear] = useState('2025');
  const [studentLocation, setStudentLocation] = useState('');
  const [studentTargetRole, setStudentTargetRole] = useState('');
  const [studentInternships, setStudentInternships] = useState('');
  const [studentProjects, setStudentProjects] = useState('');
  const [studentSkills, setStudentSkills] = useState('');
  const [studentAchievements, setStudentAchievements] = useState('');
  const [studentCertifications, setStudentCertifications] = useState('');
  const [studentStep, setStudentStep] = useState(1);
  const [studentFormData, setStudentFormData] = useState<any>(null);

  // FAQ & misc
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pricingRef = useRef<HTMLDivElement>(null);
  const inputFormRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Scroll to result
  useEffect(() => {
    if (teaser && resultRef.current) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, [teaser]);

  // Handle ?plan= and ?tab= query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const planParam = params.get('plan');
    if (planParam === 'standard' || planParam === 'pro') {
      setTimeout(() => heroRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
    const tabParam = params.get('tab');
    if (tabParam === 'questionnaire') {
      setActiveInputTab('questionnaire');
      setInputSource('questionnaire');
    } else if (tabParam === 'linkedin') {
      setActiveInputTab('linkedin');
      setInputSource('linkedin');
    }
  }, []);

  // ── Core teaser runner ──
  async function runTeaser(headlineText: string) {
    const today = new Date().toISOString().split('T')[0];
    const lsKey = `teaser_count_${today}`;
    const count = parseInt(localStorage.getItem(lsKey) || '0', 10);
    if (count >= 5) { setRateLimited(true); return; }

    setLoading(true);
    setLoadingStage('Parsing your profile...');
    setLoadingProgress(20);
    const stageTimer = setTimeout(() => { setLoadingStage('Analyzing headline & keywords...'); setLoadingProgress(50); }, 2000);
    const stageTimer2 = setTimeout(() => { setLoadingStage('Generating your score...'); setLoadingProgress(80); }, 4000);
    try {
      const res = await fetch(`${API_URL}/api/teaser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headlineText.slice(0, 500),
          input_source: inputSource,
          target_role: targetRole || qTargetRole || undefined,
        }),
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
      clearTimeout(stageTimer);
      clearTimeout(stageTimer2);
      setLoadingProgress(0);
      setLoadingStage('');
      setLoading(false);
    }
  }

  // ── Resume upload ──
  async function uploadAndParseResume(file: File) {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setResumeError('Please upload a PDF or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeError('File too large. Maximum 10MB.');
      return;
    }

    setResumeUploading(true);
    setResumeError('');
    setResumeFileName(file.name);
    setResumeParsed(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/resume/upload-parse`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setResumeError(data.error || 'Failed to parse resume. Try a different file.');
        return;
      }

      setResumeParsed(data.parsed || data);
      setResumeRawText(data.rawText || data.raw_text || data.raw_paste || JSON.stringify(data.parsed || data));
      setInputSource('resume');

      // Populate confirmation screen — handle field name differences between endpoints
      const p = data.parsed || data;
      setConfirmName(p.full_name || p.name || '');
      setConfirmHeadline(p.headline || p.summary || p.title || '');
      setConfirmExperience(
        (p.experience || []).map((e: any) => {
          const title = e.title || e.role || '';
          const company = e.company || '';
          const dates = e.duration || e.dates || (e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : '');
          return `${title} at ${company}${dates ? ` (${dates})` : ''}`;
        }).join('\n') || ''
      );
      setConfirmEducation(
        (p.education || []).map((e: any) => `${e.degree || ''} ${e.field || ''} - ${e.institution || ''}`).join('\n') || ''
      );
      setConfirmSkills((p.skills || []).join(', '));
      setShowConfirmScreen(true);
    } catch (err: any) {
      // Resume upload error — user sees error message below
      setResumeError('Could not reach the server. Please check your internet connection.');
    } finally {
      setResumeUploading(false);
    }
  }

  // ── LinkedIn PDF upload ──
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
        setPdfError(data.error || 'Failed to parse PDF. Try a different file.');
        return;
      }

      setPdfParsed(data.parsed);
      setPdfRawPaste(data.raw_paste || '');
      setInputSource('linkedin');

      // Populate confirmation screen
      const p = data.parsed || {};
      setConfirmName(p.full_name || p.name || '');
      setConfirmHeadline(p.headline || p.summary || '');
      setConfirmExperience(
        (p.experience || []).map((e: any) => {
          const title = e.title || e.role || '';
          const company = e.company || '';
          const dates = e.duration || (e.start_date ? `${e.start_date} - ${e.end_date || 'Present'}` : '');
          return `${title} at ${company}${dates ? ` (${dates})` : ''}`;
        }).join('\n') || ''
      );
      setConfirmEducation(
        (p.education || []).map((e: any) => `${e.degree || ''} ${e.field || ''} - ${e.institution || ''}`).join('\n') || ''
      );
      setConfirmSkills((p.skills || []).join(', '));
      setShowConfirmScreen(true);
    } catch (err: any) {
      // PDF upload error — user sees error message below
      setPdfError('Could not reach the server. Please check your internet connection.');
    } finally {
      setPdfUploading(false);
    }
  }

  // ── Confirm & run teaser ──
  function handleConfirmAndScore() {
    const h = confirmHeadline.trim();
    if (!h || h.length < 10) {
      alert('Please add a headline with at least 10 characters.');
      return;
    }
    setHeadline(h);

    // Build raw paste from confirmed data
    const sections = [
      confirmName.trim() && `Name: ${confirmName.trim()}`,
      `Headline: ${h}`,
      confirmExperience.trim() && `Experience:\n${confirmExperience.trim()}`,
      confirmEducation.trim() && `Education:\n${confirmEducation.trim()}`,
      confirmSkills.trim() && `Skills: ${confirmSkills.trim()}`,
      targetRole.trim() && `Target Role: ${targetRole.trim()}`,
    ].filter(Boolean).join('\n\n');

    if (inputSource === 'resume') {
      setResumeRawText(sections);
    } else {
      setPdfRawPaste(sections);
    }

    setShowConfirmScreen(false);
    runTeaser(h);
  }

  // ── Questionnaire submit ──
  function handleQuestionnaireSubmit() {
    const h = qHeadline.trim();
    if (!h || h.length < 10) {
      alert('Please enter your current headline or job title (at least 10 characters).');
      return;
    }
    setInputSource('questionnaire');
    setHeadline(h);
    setTargetRole(qTargetRole);

    const sections = [
      qName.trim() && `Name: ${qName.trim()}`,
      `Headline: ${h}`,
      qExperience.trim() && `Experience:\n${qExperience.trim()}`,
      qEducation.trim() && `Education:\n${qEducation.trim()}`,
      qSkills.trim() && `Skills: ${qSkills.trim()}`,
      qTargetRole.trim() && `Target Role: ${qTargetRole.trim()}`,
    ].filter(Boolean).join('\n\n');

    setPdfRawPaste(sections);
    runTeaser(h);
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

  function resetUpload() {
    setResumeParsed(null); setResumeFileName(''); setResumeRawText(''); setResumeError('');
    setPdfParsed(null); setPdfFileName(''); setPdfRawPaste(''); setPdfError('');
    setShowConfirmScreen(false); setTeaser(null); setHeadline('');
    setConfirmName(''); setConfirmHeadline(''); setConfirmExperience(''); setConfirmEducation(''); setConfirmSkills(''); setTargetRole('');
  }

  // Get current raw paste based on input source
  const currentRawPaste = inputSource === 'resume' ? resumeRawText : inputSource === 'linkedin' ? pdfRawPaste : pdfRawPaste;
  const currentParsed = inputSource === 'resume' ? resumeParsed : pdfParsed;

  // ── Tab style helper ──
  function tabStyle(tab: 'resume' | 'linkedin' | 'questionnaire') {
    const isActive = activeInputTab === tab;
    return {
      flex: '1 1 0',
      padding: '10px 8px',
      fontSize: 13,
      fontWeight: isActive ? 700 : 500,
      color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
      background: isActive ? 'var(--accent-subtle)' : 'transparent',
      border: 'none',
      borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
      cursor: 'pointer',
      transition: 'all 150ms ease',
      textAlign: 'center' as const,
      whiteSpace: 'nowrap' as const,
    };
  }

  // ── Pricing section ──
  const pricingSection = (
    <section ref={pricingRef} style={{ padding: '56px 24px', background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-default)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 4 }}>Simple Pricing</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>One interview can change your career.</p>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 36 }}>Profile score is free. Pay only when you{"'"}re ready.</p>

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
            {inputSource === 'questionnaire' && !qExperience.trim() && (
              <div style={{ fontSize: 11, color: '#92400E', marginTop: 6 }}>
                Tip: Add experience details above for better results
              </div>
            )}
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

        <ReferralCodeRedeemer />

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
      <nav className="landing-nav">
        <div className="landing-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56 }}>
          <a href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>Profile</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Roaster</span>
          </a>
          <div className="hidden sm:flex" style={{ gap: 8, alignItems: 'center' }}>
            <a href="/dashboard" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '6px 12px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)' }}>Dashboard</a>
            <a href="/pricing" style={{ fontSize: 14, color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, padding: '6px 12px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)' }}>Pricing</a>
            <button
              onClick={() => heroRef.current?.scrollIntoView({ behavior: 'smooth' })}
              style={{ fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: 'var(--accent)', color: 'white', transition: 'all var(--transition)' }}
            >
              Get Free Score
            </button>
          </div>
          <button
            className="sm:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', flexDirection: 'column', gap: 5, borderRadius: 'var(--radius-sm)' }}
            aria-label="Menu"
          >
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text-primary)', borderRadius: 2, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text-primary)', borderRadius: 2, transition: 'all 0.2s', opacity: mobileMenuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 18, height: 2, background: 'var(--text-primary)', borderRadius: 2, transition: 'all 0.2s', transform: mobileMenuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="sm:hidden" style={{ borderTop: '1px solid var(--border-default)', padding: '8px 24px 12px' }}>
            <a href="/dashboard" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '10px 0', fontSize: 15, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Dashboard</a>
            <a href="/pricing" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '10px 0', fontSize: 15, color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 600 }}>Pricing</a>
            <button
              onClick={() => { setMobileMenuOpen(false); heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
              style={{ display: 'block', width: '100%', marginTop: 8, padding: '12px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >Get Free Score</button>
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════ */}
      {/* HERO — Two Columns                  */}
      {/* ═══════════════════════════════════ */}
      <section ref={heroRef} style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-default)', padding: '64px 0 72px' }}>
        <div className="landing-section">
          <div style={{ display: 'flex', gap: 48, alignItems: 'center', flexWrap: 'wrap' }}>

            {/* LEFT — Value Proposition */}
            <div style={{ flex: '1.2 1 420px', minWidth: 0 }}>
              <div className="saas-eyebrow" style={{ marginBottom: 12 }}>Free profile score</div>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Not getting calls from HR?<br />
                <span style={{ color: 'var(--accent)' }}>Your resume might be the problem.</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7, maxWidth: 520 }}>
                Upload your resume or LinkedIn PDF. AI scores it, rewrites your profile, builds an ATS resume, and preps you for interviews — in minutes.
              </p>

              {/* Value bullets with icon tiles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
                {[
                  { bg: 'var(--accent-subtle)', color: 'var(--accent)', icon: '📄', title: 'Instant ATS analysis', desc: 'Upload resume or LinkedIn PDF' },
                  { bg: 'var(--success-subtle)', color: 'var(--success)', icon: '✍️', title: 'AI-powered rewrite', desc: 'Headline, about, experience bullets' },
                  { bg: '#F5F3FF', color: '#7C3AED', icon: '🎯', title: 'Interview prep kit', desc: '15 STAR-format questions + cheat sheet' },
                  { bg: '#FFF7ED', color: '#EA580C', icon: '📋', title: 'ATS resume builder', desc: '11 templates, instant PDF download' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="icon-tile" style={{ background: item.bg, color: item.color, fontSize: 18 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Before / After comparison strip */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '10px 20px', boxShadow: 'var(--shadow-xs)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', letterSpacing: 1, textTransform: 'uppercase' }}>Before</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>42</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--success)', letterSpacing: 1, textTransform: 'uppercase' }}>After</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--success)' }}>87</div>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-default)', paddingLeft: 12, marginLeft: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>+45 pts</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>avg improvement</div>
                </div>
              </div>
            </div>

            {/* RIGHT (45%) — Upload Card with Tabs */}
            <div style={{ flex: '1 1 380px', minWidth: 0, maxWidth: 500 }}>
              <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-default)', boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

                {/* Tab navigation — clean pills */}
                <div style={{ padding: '16px 20px 0', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'inline-flex', gap: 4, padding: 4, background: 'var(--bg-canvas)', borderRadius: 10, width: '100%' }}>
                    <button onClick={() => { setActiveInputTab('resume'); setInputSource('resume'); }}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: activeInputTab === 'resume' ? 700 : 500, borderRadius: 8, border: 'none', cursor: 'pointer', background: activeInputTab === 'resume' ? 'var(--bg-surface)' : 'transparent', color: activeInputTab === 'resume' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeInputTab === 'resume' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                      Resume
                    </button>
                    <button onClick={() => { setActiveInputTab('linkedin'); setInputSource('linkedin'); }}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: activeInputTab === 'linkedin' ? 700 : 500, borderRadius: 8, border: 'none', cursor: 'pointer', background: activeInputTab === 'linkedin' ? 'var(--bg-surface)' : 'transparent', color: activeInputTab === 'linkedin' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeInputTab === 'linkedin' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                      LinkedIn
                    </button>
                    <button onClick={() => { setActiveInputTab('questionnaire'); setInputSource('questionnaire'); }}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: activeInputTab === 'questionnaire' ? 700 : 500, borderRadius: 8, border: 'none', cursor: 'pointer', background: activeInputTab === 'questionnaire' ? 'var(--bg-surface)' : 'transparent', color: activeInputTab === 'questionnaire' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeInputTab === 'questionnaire' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                      No File
                    </button>
                    <button onClick={() => { setActiveInputTab('student'); setInputSource('student'); }}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, fontWeight: activeInputTab === 'student' ? 700 : 500, borderRadius: 8, border: 'none', cursor: 'pointer', background: activeInputTab === 'student' ? 'var(--bg-surface)' : 'transparent', color: activeInputTab === 'student' ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: activeInputTab === 'student' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.15s' }}>
                      Student
                    </button>
                  </div>
                </div>

                <div style={{ padding: '20px 20px 16px' }}>

                  {/* ═══ CONFIRMATION SCREEN ═══ */}
                  {showConfirmScreen ? (
                    <div style={{ animation: 'slideUp 0.3s ease' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>&#10003;</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--success)' }}>
                            {inputSource === 'resume' ? 'Resume Parsed!' : 'LinkedIn PDF Parsed!'}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {inputSource === 'resume' ? resumeFileName : pdfFileName} &mdash; Review and confirm your details
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Name</label>
                          <input value={confirmName} onChange={e => setConfirmName(e.target.value)} placeholder="Your name"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                            Headline / Job Title <span style={{ color: '#DC2626' }}>*</span>
                          </label>
                          <input value={confirmHeadline} onChange={e => setConfirmHeadline(e.target.value)} placeholder="e.g. Senior Manager | B2B Sales | 6+ Years"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                          {confirmHeadline.length > 0 && confirmHeadline.trim().length < 10 && (
                            <p style={{ fontSize: 11, color: '#CC1016', marginTop: 2 }}>Please add a complete headline.</p>
                          )}
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Experience</label>
                          <textarea value={confirmExperience} onChange={e => setConfirmExperience(e.target.value)} placeholder="Your work experience..." rows={3}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Education</label>
                          <textarea value={confirmEducation} onChange={e => setConfirmEducation(e.target.value)} placeholder="Your education..." rows={2}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Skills</label>
                          <input value={confirmSkills} onChange={e => setConfirmSkills(e.target.value)} placeholder="Python, React, Project Management..."
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                        </div>
                        <div style={{ background: 'var(--accent-subtle)', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 4, display: 'block' }}>What role are you targeting?</label>
                          <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="e.g. Product Manager at a Series B startup"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box', background: 'white' }} />
                        </div>
                      </div>

                      <button
                        onClick={handleConfirmAndScore}
                        disabled={loading || confirmHeadline.trim().length < 10}
                        className="saas-btn saas-btn-primary"
                        style={{
                          width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-pill)', border: 'none',
                          fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 14,
                          opacity: loading || confirmHeadline.trim().length < 10 ? 0.5 : 1,
                          boxShadow: 'var(--shadow-md)',
                        }}
                      >
                        {loading ? (
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                            Analyzing...
                          </span>
                        ) : 'Get My Free Score \u2192'}
                      </button>
                      <div onClick={resetUpload} style={{ fontSize: 12, color: 'var(--accent)', textAlign: 'center', marginTop: 8, cursor: 'pointer', textDecoration: 'underline' }}>
                        Upload a different file
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ═══ TAB 1: RESUME UPLOAD ═══ */}
                      {activeInputTab === 'resume' && (
                        <div>
                          <div
                            onClick={() => resumeInputRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); setResumeDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadAndParseResume(f); }}
                            onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setResumeDragOver(false); }}
                            style={{
                              border: `1.5px dashed ${resumeDragOver ? 'var(--accent)' : resumeParsed ? 'var(--success)' : '#CBD5E1'}`,
                              borderRadius: 12, padding: 28, textAlign: 'center', marginBottom: 12,
                              background: resumeDragOver ? '#F0F7FF' : resumeParsed ? '#F0FDF4' : '#FAFBFC',
                              cursor: resumeUploading ? 'wait' : 'pointer', transition: 'all 0.2s',
                            }}
                          >
                            <input ref={resumeInputRef} type="file" accept=".pdf,.docx" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndParseResume(f); }} style={{ display: 'none' }} />
                            {resumeUploading ? (
                              <>
                                <div style={{ fontSize: 28, marginBottom: 6, animation: 'spin 1s linear infinite' }}>&#9881;</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Parsing your resume...</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Extracting your data &bull; 5-10 seconds</div>
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                              </>
                            ) : (
                              <>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 20 }}>&#128196;</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{resumeDragOver ? 'Drop here' : 'Upload your resume'}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>PDF or DOCX &bull; click or drag</div>
                              </>
                            )}
                          </div>

                          {resumeError && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#DC2626' }}>
                              {resumeError}
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                            <span>&#128274; Encrypted</span>
                            <span>&#9889; Instant</span>
                            <span>&#127873; Free</span>
                          </div>
                        </div>
                      )}

                      {/* ═══ TAB 2: LINKEDIN PDF ═══ */}
                      {activeInputTab === 'linkedin' && (
                        <div>
                          <div
                            onClick={() => pdfInputRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); setPdfDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadAndParsePdf(f); }}
                            onDragOver={(e) => { e.preventDefault(); setPdfDragOver(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setPdfDragOver(false); }}
                            style={{
                              border: `2px dashed ${pdfDragOver ? 'var(--accent)' : pdfParsed ? 'var(--success)' : '#94B8DB'}`,
                              borderRadius: 'var(--radius-md)', padding: 24, textAlign: 'center', marginBottom: 10,
                              background: pdfDragOver ? '#E8F0FE' : pdfParsed ? 'var(--success-subtle)' : '#F0F7FF',
                              cursor: pdfUploading ? 'wait' : 'pointer', transition: 'all var(--transition)',
                            }}
                          >
                            <input ref={pdfInputRef} type="file" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f) uploadAndParsePdf(f); }} style={{ display: 'none' }} />
                            {pdfUploading ? (
                              <>
                                <div style={{ fontSize: 28, marginBottom: 6, animation: 'spin 1s linear infinite' }}>&#9881;</div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>Parsing your LinkedIn PDF...</div>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Extracting profile data &bull; 5-10 seconds</div>
                                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                              </>
                            ) : (
                              <>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>&#128188;</div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{pdfDragOver ? 'Drop your PDF here!' : 'Drop your LinkedIn PDF here'}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>or click to browse &bull; .pdf only</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
                                  LinkedIn &rarr; Your Profile &rarr; More &rarr; Save to PDF
                                </div>
                              </>
                            )}
                          </div>

                          {pdfError && (
                            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#DC2626' }}>
                              {pdfError}
                            </div>
                          )}

                          {/* How to get LinkedIn PDF guide */}
                          <details style={{ marginTop: 8 }}>
                            <summary style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                              &#128161; How to download your LinkedIn PDF
                            </summary>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>&#128187; Desktop:</div>
                              {['Go to your LinkedIn profile', 'Click "More" \u2192 "Save to PDF"', 'Upload the downloaded file here'].map((s, i) => (
                                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 11 }}>
                                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                                  <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                                </div>
                              ))}
                              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>&#128241; Mobile:</div>
                              {['Open Chrome/Safari (not the app)', 'Request Desktop Site', 'Profile \u2192 More \u2192 Save to PDF'].map((s, i) => (
                                <div key={`m${i}`} style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#FEF3C7', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 11 }}>
                                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#D97706', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                                  <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
                                </div>
                              ))}
                              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textAlign: 'center', marginTop: 4 }}>
                                Easier: Switch to the Resume tab and upload your resume instead!
                              </div>
                            </div>
                          </details>
                        </div>
                      )}

                      {/* ═══ TAB 3: QUESTIONNAIRE ═══ */}
                      {activeInputTab === 'questionnaire' && (
                        <div>
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                            No resume or LinkedIn PDF? No problem. Tell us about yourself and we{"'"}ll build your profile.
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Full Name</label>
                              <input value={qName} onChange={e => setQName(e.target.value)} placeholder="Your full name"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                                Current Job Title / Headline <span style={{ color: '#DC2626' }}>*</span>
                              </label>
                              <input value={qHeadline} onChange={e => setQHeadline(e.target.value)} placeholder="e.g. Final Year B.Tech Student | Aspiring Data Analyst"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                                Target Role <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>what job are you applying for?</span>
                              </label>
                              <input value={qTargetRole} onChange={e => setQTargetRole(e.target.value)} placeholder="e.g. Data Analyst at a tech company"
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>
                                Experience <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 400 }}>internships, jobs, projects</span>
                              </label>
                              <textarea value={qExperience} onChange={e => setQExperience(e.target.value)} placeholder="List your work experience, internships, or key projects..." rows={3}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Education</label>
                              <textarea value={qEducation} onChange={e => setQEducation(e.target.value)} placeholder="e.g. B.Tech Computer Science, XYZ University, 2024" rows={2}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 12, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.5 }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'block' }}>Skills</label>
                              <input value={qSkills} onChange={e => setQSkills(e.target.value)} placeholder="Python, SQL, Excel, Communication..."
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: 13, boxSizing: 'border-box' }} />
                            </div>
                          </div>

                          <button
                            onClick={handleQuestionnaireSubmit}
                            disabled={loading || qHeadline.trim().length < 10}
                            className="saas-btn saas-btn-primary"
                            style={{
                              width: '100%', padding: '14px 24px', borderRadius: 'var(--radius-pill)', border: 'none',
                              fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 14,
                              opacity: loading || qHeadline.trim().length < 10 ? 0.5 : 1,
                              boxShadow: 'var(--shadow-md)',
                            }}
                          >
                            {loading ? 'Analyzing...' : 'Get My Free Score \u2192'}
                          </button>
                        </div>
                      )}

                      {/* ═══ TAB 4: STUDENT / FRESHER ═══ */}
                      {activeInputTab === 'student' && (
                        <div style={{ padding: '16px 0' }}>
                          {/* Step indicator */}
                          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                            {[1, 2, 3, 4].map(s => (
                              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: studentStep >= s ? '#0B69C7' : '#E0E0E0', transition: 'background 0.3s' }} />
                            ))}
                          </div>

                          {studentStep === 1 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 4 }}>Basic Info</div>
                              <input placeholder="Full Name *" value={studentName} onChange={e => setStudentName(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <input placeholder="College / University *" value={studentCollege} onChange={e => setStudentCollege(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                                <input placeholder="Degree (B.Tech, BCA, MBA...)" value={studentDegree} onChange={e => setStudentDegree(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <input placeholder="Branch / Major (CSE, ECE...)" value={studentBranch} onChange={e => setStudentBranch(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                                <select value={studentGradYear} onChange={e => setStudentGradYear(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: 'white' }}>
                                  {[2024, 2025, 2026, 2027, 2028].map(y => <option key={y} value={String(y)}>{y}</option>)}
                                </select>
                              </div>
                              <input placeholder="City (e.g., Hyderabad)" value={studentLocation} onChange={e => setStudentLocation(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <button disabled={!studentName.trim() || !studentCollege.trim()} onClick={() => setStudentStep(2)} style={{ padding: '12px', background: !studentName.trim() || !studentCollege.trim() ? '#D1D5DB' : '#0B69C7', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Next &rarr;</button>
                            </div>
                          )}

                          {studentStep === 2 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919', marginBottom: 4 }}>What Job Are You Looking For?</div>
                              <input placeholder="Target Role * (e.g., Software Developer)" value={studentTargetRole} onChange={e => setStudentTargetRole(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <div style={{ fontSize: 12, color: '#666', marginTop: -4 }}>Not sure? Common roles for {studentBranch || 'your branch'}:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {(studentBranch.toLowerCase().includes('cs') || studentBranch.toLowerCase().includes('it') || studentBranch.toLowerCase().includes('computer')
                                  ? ['Software Developer', 'Data Analyst', 'Web Developer', 'QA Engineer', 'DevOps']
                                  : studentBranch.toLowerCase().includes('ec') || studentBranch.toLowerCase().includes('electronics')
                                  ? ['Embedded Engineer', 'VLSI Designer', 'Network Engineer', 'IoT Developer']
                                  : studentBranch.toLowerCase().includes('mba') || studentBranch.toLowerCase().includes('business')
                                  ? ['Business Analyst', 'Marketing Manager', 'HR Executive', 'Product Manager']
                                  : ['Software Developer', 'Data Analyst', 'Business Analyst', 'Consultant', 'Marketing']
                                ).map(r => (
                                  <button key={r} onClick={() => setStudentTargetRole(r)} style={{ padding: '4px 12px', borderRadius: 16, border: studentTargetRole === r ? '2px solid #0B69C7' : '1px solid #D1D5DB', background: studentTargetRole === r ? '#EFF6FF' : 'white', fontSize: 12, cursor: 'pointer', color: '#191919' }}>{r}</button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <button onClick={() => setStudentStep(1)} style={{ flex: 1, padding: '12px', background: 'white', color: '#666', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>&larr; Back</button>
                                <button disabled={!studentTargetRole.trim()} onClick={() => setStudentStep(3)} style={{ flex: 2, padding: '12px', background: !studentTargetRole.trim() ? '#D1D5DB' : '#0B69C7', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Next &rarr;</button>
                              </div>
                            </div>
                          )}

                          {studentStep === 3 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>Experience &amp; Projects</div>
                              <div style={{ fontSize: 12, color: '#666', marginTop: -8 }}>Don{"'"}t worry if you don{"'"}t have much — most freshers don{"'"}t</div>
                              <textarea placeholder={"Internships (if any)\ne.g., Web Dev Intern at TCS, 3 months\nBuilt a dashboard using React..."} value={studentInternships} onChange={e => setStudentInternships(e.target.value)} rows={3} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                              <textarea placeholder={"Projects\ne.g., E-commerce app using React + Node\nChat app with Socket.io..."} value={studentProjects} onChange={e => setStudentProjects(e.target.value)} rows={3} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setStudentStep(2)} style={{ flex: 1, padding: '12px', background: 'white', color: '#666', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>&larr; Back</button>
                                <button onClick={() => setStudentStep(4)} style={{ flex: 2, padding: '12px', background: '#0B69C7', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Next &rarr;</button>
                              </div>
                            </div>
                          )}

                          {studentStep === 4 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>Skills &amp; Extras</div>
                              <input placeholder="Skills (comma-separated) * e.g., Python, Java, SQL, React, Git" value={studentSkills} onChange={e => setStudentSkills(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <input placeholder="Certifications (optional) e.g., AWS Cloud, Google Analytics" value={studentCertifications} onChange={e => setStudentCertifications(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <textarea placeholder={"Achievements (optional)\ne.g., Won Smart India Hackathon, NSS Volunteer, Class Rep"} value={studentAchievements} onChange={e => setStudentAchievements(e.target.value)} rows={2} style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }} />
                              <input placeholder="Email *" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} type="email" style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />
                              <input placeholder="Phone (optional)" value={studentPhone} onChange={e => setStudentPhone(e.target.value)} type="tel" style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14 }} />

                              {/* Summary */}
                              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 14px', marginTop: 4 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#057642', marginBottom: 4 }}>{studentName} — {studentDegree} {studentBranch}, {studentCollege}</div>
                                <div style={{ fontSize: 12, color: '#666' }}>Target: {studentTargetRole} | Grad: {studentGradYear} | {studentSkills ? studentSkills.split(',').length + ' skills' : '0 skills'}{studentInternships ? ' | Has internship' : ''}{studentProjects ? ' | Has projects' : ''}</div>
                              </div>

                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setStudentStep(3)} style={{ flex: 1, padding: '12px', background: 'white', color: '#666', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>&larr; Back</button>
                                <button
                                  disabled={!studentSkills.trim() || !studentEmail.trim()}
                                  onClick={async () => {
                                    const formInput = {
                                      full_name: studentName,
                                      email: studentEmail,
                                      phone: studentPhone,
                                      location: studentLocation,
                                      career_stage: 'student',
                                      education: [{
                                        institution: studentCollege,
                                        degree: studentDegree,
                                        field: studentBranch,
                                        year: studentGradYear,
                                        coursework: '',
                                      }],
                                      experience: [],
                                      skills: studentSkills.split(',').map((s: string) => s.trim()).filter(Boolean),
                                      certifications: studentCertifications.split(',').map((s: string) => s.trim()).filter(Boolean),
                                      achievements: studentAchievements,
                                      projects: studentProjects,
                                      target_role: studentTargetRole,
                                      target_industry: '',
                                      tone: 'professional',
                                      internships: studentInternships,
                                    };
                                    setStudentFormData(formInput);
                                    document.getElementById('student-pricing')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                  style={{ flex: 2, padding: '12px', background: !studentSkills.trim() || !studentEmail.trim() ? '#D1D5DB' : '#057642', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Build My Resume — &#8377;99 &rarr;
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Shimmer loading indicator */}
                      {loading && !teaser && (
                        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: '20px 24px', marginTop: 16 }}>
                          <style>{`
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
                          `}</style>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0B69C7', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{loadingStage}</span>
                          </div>
                          {/* Progress bar */}
                          <div style={{ height: 4, borderRadius: 2, background: '#F3F4F6', overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #0B69C7, #057642)', transition: 'width 1s ease', width: `${loadingProgress}%` }} />
                          </div>
                          {/* Skeleton lines */}
                          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                            {[75, 60, 45].map((w, i) => (
                              <div key={i} style={{ height: 12, borderRadius: 6, width: `${w}%`, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rate limited */}
                      {rateLimited && !teaser && (
                        <div style={{ marginTop: 10, padding: 12, borderRadius: 'var(--radius-sm)', background: 'var(--warning-subtle)', border: '1px solid var(--warning)' }}>
                          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>5 free previews used today.</div>
                          <button onClick={scrollToPricing} className="saas-btn saas-btn-primary" style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 'var(--radius-pill)', fontSize: 13, fontWeight: 700 }}>Get Full Report &#8377;499 &rarr;</button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Trust line — hide when rate limited */}
                  {!rateLimited && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <span>Free score</span>
                        <span style={{ color: 'var(--border-strong)' }}>·</span>
                        <span>No signup</span>
                        <span style={{ color: 'var(--border-strong)' }}>·</span>
                        <span>Results in seconds</span>
                      </span>
                    </div>
                  )}

                  {/* Referral code link */}
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <ReferralCodeRedeemer />
                  </div>
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
        <section ref={resultRef} style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', padding: '48px 0', animation: 'fadeInUp 0.5s ease forwards' }}>
          <div className="landing-section">
            <div style={{ marginBottom: 24 }}>
              <div className="saas-eyebrow" style={{ marginBottom: 8 }}>Your free preview</div>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Here{"'"}s what we found</h2>
            </div>

            {/* ═══ 3-COLUMN GRID ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>

              {/* BOX 1: Score */}
              <div className="saas-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 12 }}>
                  {inputSource === 'resume' ? 'ATS Score' : 'Profile Score'}
                </p>
                <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 12 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={teaser.score >= 70 ? 'var(--success)' : teaser.score >= 40 ? '#D97706' : '#DC2626'} strokeWidth="6" strokeDasharray={`${teaser.score * 2.64} 264`} strokeLinecap="round" transform="rotate(-90 50 50)" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color: teaser.score >= 70 ? 'var(--success)' : teaser.score >= 40 ? '#D97706' : '#DC2626' }}>{teaser.score}</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {teaser.score >= 70 ? 'Strong foundation — AI can still optimize further.'
                    : teaser.score >= 50 ? 'Decent start. Optimization can boost 20-30 points.'
                    : 'Needs work. AI rewrite typically adds 30-40 points.'}
                </p>
              </div>

              {/* BOX 2: Headline */}
              <div className="saas-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>&#10003;</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AI-Suggested Headline</p>
                </div>
                {teaser.suggested_headline ? (
                  <>
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '14px 16px', flex: 1 }}>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>{teaser.suggested_headline}</p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>1 of many variations in full rewrite</p>
                  </>
                ) : (
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '20px 16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unlock with full analysis</p>
                  </div>
                )}
              </div>

              {/* BOX 3: Interview Question */}
              <div className="saas-card" style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: '#0891B2' }}>?</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>A Recruiter Would Ask</p>
                </div>
                {teaser.sample_interview_question ? (
                  <>
                    <div style={{ background: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 10, padding: '14px 16px', flex: 1 }}>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>&#8220;{teaser.sample_interview_question}&#8221;</p>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>15 questions + STAR answers in full kit</p>
                  </>
                ) : (
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '20px 16px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Unlock with full analysis</p>
                  </div>
                )}
              </div>

            </div>

            {/* Sparse profile warning for questionnaire users */}
            {teaser && inputSource === 'questionnaire' && !qExperience.trim() && !qSkills.trim() && (
              <div style={{ background: '#FFFBEB', border: '1px solid #F59E0B', borderRadius: 10, padding: '14px 18px', marginTop: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>
                  Limited data detected
                </div>
                <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.6 }}>
                  You only provided a headline. For a more accurate score and better results, add your experience and skills above.
                  Or upload your resume for the best results.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => { setActiveInputTab('questionnaire'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '6px 14px', background: '#F59E0B', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Add More Details
                  </button>
                  <button onClick={() => { setActiveInputTab('resume'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ padding: '6px 14px', background: 'white', color: '#92400E', border: '1px solid #F59E0B', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Upload Resume Instead
                  </button>
                </div>
              </div>
            )}

            {/* 3 Resume Previews */}
            {currentParsed && (() => {
              const resumeData = pdfToResumeData(currentParsed);
              const recIds = ['classic', 'salesbd', 'headline'];
              if (!resumeData) return null;
              return (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {inputSource === 'resume' ? 'Your Resume' : 'Resume From Your LinkedIn'}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>Built from your data. 11 templates available.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    {recIds.map(tid => {
                      const tmpl = TEMPLATES.find(t => t.id === tid);
                      return (
                        <div key={tid} style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                          onClick={scrollToPricing}>
                          <div style={{ height: 320, overflow: 'hidden' }}>
                            <div style={{ transform: 'scale(0.38)', transformOrigin: 'top left', width: '263%', pointerEvents: 'none' }}>
                              {renderResumeHTML(resumeData, tid)}
                            </div>
                          </div>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(transparent, white)', zIndex: 2 }} />
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px', background: 'var(--bg-surface)', borderTop: '1px solid #F0F0F0', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{tmpl?.name}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: 'white', padding: '5px 14px', borderRadius: 20 }}>
                              Unlock &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Locked insights */}
            <div className="saas-card" style={{ padding: '24px', marginBottom: 20 }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Unlock your full analysis
              </p>
              {[
                { text: inputSource === 'resume' ? 'ATS keyword gaps + optimization tips' : '2 critical profile issues identified' },
                { text: inputSource === 'resume' ? 'AI-generated LinkedIn profile content' : 'ATS keyword gap analysis' },
                { text: '15 personalized interview questions + STAR answers' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1a4 4 0 00-4 4v3H3a1 1 0 00-1 1v5a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V5a4 4 0 00-4-4zm-2 4a2 2 0 114 0v3H6V5z" fill="var(--text-muted)"/></svg>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* CTA strip */}
            <div style={{ background: 'var(--accent)', borderRadius: 'var(--radius-lg)', padding: '28px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 8 }}>
                {inputSource === 'resume'
                  ? 'Get Full Resume Rewrite + LinkedIn Profile + Interview Prep'
                  : 'Get Full Rewrite + Interview Prep + Resume'}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 20, lineHeight: 1.5 }}>
                {inputSource === 'resume'
                  ? 'ATS-optimized resume + AI-generated LinkedIn content + interview prep'
                  : 'Complete profile rewrite + ATS resume + interview prep'}
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
                Unlock Everything &rarr;
              </button>
              <LiveCounter />
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════ */}
      {/* PRICING                             */}
      {/* ═══════════════════════════════════ */}
      {(showPricing || teaser) && !selectedPlan && pricingSection}

      {/* Student Plan */}
      {inputSource === 'student' && studentFormData && (
        <div id="student-pricing" style={{ maxWidth: 440, margin: '24px auto 0', background: 'linear-gradient(135deg, #057642, #16A34A)', borderRadius: 14, padding: '28px', color: 'white', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, opacity: 0.8, marginBottom: 8 }}>STUDENT PLAN</div>
          <div style={{ fontSize: 40, fontWeight: 800, marginBottom: 4 }}>&#8377;99</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 20 }}>One-time payment &middot; Results in 90 seconds</div>
          <div style={{ textAlign: 'left', fontSize: 13, lineHeight: 2, marginBottom: 20 }}>
            &#10003; ATS resume (11 professional templates)<br/>
            &#10003; LinkedIn profile content (headline + about + experience)<br/>
            &#10003; 10-step LinkedIn account setup guide<br/>
            &#10003; 5 interview questions with STAR answers<br/>
            &#10003; PDF + TXT download
          </div>
          <StudentPayButton formData={studentFormData} email={studentEmail} />
          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 12 }}>Need more? Upgrade to Standard (&#8377;400 more) anytime</div>
        </div>
      )}

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
                  initialRawPaste={currentRawPaste}
                  inputSource={inputSource}
                  targetRole={targetRole || qTargetRole}
                />
              </div>
              {/* Sidebar (desktop only) */}
              <div className="hidden lg:block" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 80 }}>
                <div className="saas-card" style={{ padding: 20, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>What happens next</div>
                  {[
                    { num: '1', text: currentRawPaste ? 'Your data is loaded \u2014 review below' : 'Add your profile data' },
                    { num: '2', text: 'Pay securely via UPI/Card' },
                    { num: '3', text: 'AI rewrites your profile in ~90 seconds' },
                    { num: '4', text: inputSource === 'resume' ? 'Download improved resume + LinkedIn content' : 'Copy-paste your new profile + download resume' },
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
          <section style={{ padding: 'var(--section-py) 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
            <div className="landing-section">
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div className="saas-eyebrow" style={{ marginBottom: 8 }}>Complete career toolkit</div>
                <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Everything you need to land interviews</h2>
                <p style={{ fontSize: 'var(--fs-md)', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>One payment. Four powerful tools. Zero subscriptions.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                {[
                  { bg: 'var(--accent-subtle)', color: 'var(--accent)', icon: '✍️', title: 'Profile Rewrite', desc: 'AI scores your resume & profile, identifies issues, and rewrites everything.', free: true },
                  { bg: '#F5F3FF', color: '#7C3AED', icon: '🎯', title: 'Interview Prep', desc: '15 personalized questions + STAR answers + cheat sheet + MCQ quiz.', free: false },
                  { bg: '#FFF7ED', color: '#EA580C', icon: '📄', title: 'ATS Resume', desc: 'Professional resume matched to your JD. 11 ATS-optimized templates.', free: false },
                  { bg: 'var(--success-subtle)', color: 'var(--success)', icon: '📋', title: 'Cover Letter', desc: 'Personalized cover letter for every application. Ready to use.', free: false },
                ].map((f, i) => (
                  <div key={i} className="saas-card" style={{ padding: '28px 24px' }}>
                    <div className="icon-tile" style={{ background: f.bg, color: f.color, marginBottom: 16 }}>{f.icon}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{f.title}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</div>
                    {f.free && <div style={{ display: 'inline-block', background: 'var(--success)', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 'var(--radius-pill)', marginTop: 14, letterSpacing: 0.5 }}>Free</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── How It Works ── */}
          <section style={{ padding: 'var(--section-py) 0', background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-default)' }}>
            <div className="landing-section">
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <div className="saas-eyebrow" style={{ marginBottom: 8 }}>Simple process</div>
                <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Three steps. That{"'"}s it.</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32, maxWidth: 900, margin: '0 auto' }}>
                {[
                  { num: '1', title: 'Upload your file', desc: 'Resume (PDF/DOCX), LinkedIn PDF, or fill a quick form.' },
                  { num: '2', title: 'AI analyzes & builds', desc: 'Scores your profile, rewrites it, generates resume + interview prep.' },
                  { num: '3', title: 'Download & apply', desc: 'Everything ready. Start applying with confidence today.' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', color: 'white', fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{s.num}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── See Real Results ── */}
          <section style={{ padding: 'var(--section-py) 0', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
            <div className="landing-section" style={{ maxWidth: 1000 }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div className="saas-eyebrow" style={{ marginBottom: 8 }}>Real output</div>
                <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>See what ProfileRoaster generates</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>

                {/* Rewrite Before/After */}
                <div className="saas-card" style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'var(--accent)' }}>&#9997;&#65039; AI Profile Rewrite</div>
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
                  <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: 'white', background: 'var(--accent)' }}>&#128196; ATS Resume</div>
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

          {/* ── Pricing (in marketing stack) ── */}
          {!showPricing && !selectedPlan && pricingSection}

          {/* ── FAQ ── */}
          <section style={{ padding: 'var(--section-py) 0', background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-default)' }}>
            <div className="landing-section" style={{ maxWidth: 720 }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div className="saas-eyebrow" style={{ marginBottom: 8 }}>FAQ</div>
                <h2 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Frequently asked questions</h2>
              </div>
              {[
                { q: 'Is the profile score really free?', a: 'Yes! Upload your resume or LinkedIn PDF and get an instant AI score with a suggested headline \u2014 completely free, no signup required.' },
                { q: 'What do I get with the paid plan?', a: 'A complete profile rewrite (headline, about, experience), ATS-optimized resume in multiple templates, personalized cover letter, and interview prep with questions, STAR-format answers, cheat sheet, and quiz.' },
                { q: 'Can I upload my resume instead of LinkedIn PDF?', a: 'Yes! You can upload your resume (PDF or DOCX) and we will analyze it, improve it, AND generate LinkedIn content from it. This is the easiest option for mobile users.' },
                { q: 'How is this different from ChatGPT?', a: 'ProfileRoaster is purpose-built for LinkedIn optimization. It understands ATS algorithms, recruiter behavior, and Indian job market nuances. You get structured, ready-to-use output \u2014 not generic paragraphs.' },
                { q: 'How long does it take?', a: 'The free score is instant. The full rewrite + resume + interview prep is generated in about 90 seconds after payment.' },
                { q: 'Is my data safe?', a: 'Your data is encrypted in transit and at rest. Only AI processes your profile \u2014 no humans read it. You can delete your data anytime from your dashboard.' },
                { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, net banking, and wallets via Razorpay \u2014 India\'s most trusted payment gateway.' },
                { q: 'Can I get a refund?', a: 'Since the AI output is generated instantly and delivered immediately, we do not offer refunds. However, if there is a technical issue, contact us and we will make it right.' },
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
                    <span style={{ fontSize: 20, color: 'var(--text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: faqOpen === i ? 'rotate(45deg)' : 'none', fontWeight: 300, lineHeight: 1 }}>+</span>
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
          <section style={{ background: 'var(--accent)', padding: '64px 0', textAlign: 'center' }}>
            <div className="landing-section" style={{ maxWidth: 600 }}>
              <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>Stop losing interviews.</div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', marginBottom: 12, lineHeight: 1.7 }}>Every day with a weak profile is another recruiter who scrolled past you.</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 28, lineHeight: 1.6 }}>
                Resume writers charge &#8377;3,000&ndash;15,000 and take days.<br />
                We do everything in under 3 minutes for &#8377;499. One time. No subscription.
              </div>
              <button
                onClick={() => { heroRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                style={{ background: 'white', color: 'var(--accent)', fontSize: 16, fontWeight: 700, padding: '16px 40px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow-md)' }}
              >
                Upload Your Resume &mdash; Free Score &rarr;
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
              { label: 'Refund', href: '/refund' },
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

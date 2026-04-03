'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TEMPLATES, renderResumeHTML, buildPrintHTML } from '../../../components/resume/ResumeTemplates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───
interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  website?: string;
}

interface ExperienceEntry {
  role?: string;
  title?: string;
  company?: string;
  dates?: string;
  location?: string;
  bullets?: string[];
}

interface EducationEntry {
  degree?: string;
  institution?: string;
  school?: string;
  field?: string;
  year?: string;
  dates?: string;
}

interface SkillCategory {
  category?: string;
  skills?: string[];
}

interface ResumeData {
  contact?: ContactInfo;
  summary?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: SkillCategory[] | string[];
  achievements?: string[];
}

interface ResumeResponse {
  id: string;
  resume_data: ResumeData;
  ats_score: number;
  keywords_matched: string[];
  keywords_missing: string[];
  recommendations: string[];
  target_role: string;
  target_company: string;
  template_id: string;
  order_id: string;
  cover_letter?: string;
  page_count?: number;
}

// ─── Score Color Helper ───
function getScoreColor(score: number): string {
  if (score >= 80) return '#057642';
  if (score >= 60) return '#0A66C2';
  if (score >= 40) return '#E67E22';
  return '#CC1016';
}

// ─── Main Page ───
export default function ResumePreviewPage() {
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<ResumeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showKeywords, setShowKeywords] = useState(false);
  const [coverLetterCopied, setCoverLetterCopied] = useState(false);
  const [templateId, setTemplateId] = useState('classic');
  const [printSize, setPrintSize] = useState<'compact' | 'standard' | 'spacious'>('standard');
  const [fitOnePage, setFitOnePage] = useState(true);

  useEffect(() => {
    if (!resumeId) return;
    setLoading(true);
    fetch(`${API_URL}/api/resume/${resumeId}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setResume(data);
        setTemplateId(data.template_id || 'classic');
        setPrintSize(data.resume_data?.printSize || 'standard');
        setFitOnePage(data.resume_data?.fitOnePage !== false);
        setLoading(false);
      })
      .catch(() => {
        setError('Resume not found');
        setLoading(false);
      });
  }, [resumeId]);

  function savePrintSettings(newSize: string, newFit: boolean) {
    if (!resume) return;
    const updated = { ...resume.resume_data, printSize: newSize, fitOnePage: newFit };
    fetch(`${API_URL}/api/resume/${resumeId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume_data: updated }),
    }).catch(() => {});
  }

  const orderPlan = (resume as any)?.order_plan || 'standard';
  const orderSource = (resume as any)?.order_source || 'roast';
  const resultsUrl = orderSource === 'build' ? `/build/results/${resume?.order_id}` : `/results/${resume?.order_id}`;
  const currentTemplate = TEMPLATES.find(t => t.id === templateId);
  const isTemplateLocked = orderPlan !== 'pro' && (currentTemplate as any)?.proOnly;

  function handleDownloadPDF() {
    if (!resume) return;
    if (isTemplateLocked) {
      alert(`"${currentTemplate?.name}" is a Pro template. Upgrade to Pro for ₹500 to unlock all 28 templates.`);
      return;
    }
    let html = buildPrintHTML(resume.resume_data, templateId);
    if (printSize === 'compact') html = html.replace('</style>', 'body{font-size:92%!important;line-height:1.35!important}body div,body p{margin-bottom:2px!important}' + '</style>');
    else if (printSize === 'spacious') html = html.replace('</style>', 'body{font-size:108%!important;line-height:1.65!important}' + '</style>');
    if (fitOnePage) html = html.replace(/@page\s*\{[^}]*\}/, '@page{size:A4;margin:8mm 10mm 8mm 10mm}');
    const win = window.open('', '_blank');
    if (!win) { alert('Please allow popups to download PDF.'); return; }
    win.document.write(html);
    win.document.close();
    win.document.title = ' ';
    setTimeout(() => win.print(), 600);
  }

  function handleDownloadCoverLetterPDF() {
    if (!resume?.cover_letter) return;
    const c = resume.resume_data.contact || {};
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title> </title>
<style>
  @page { margin: 25mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; line-height: 1.8; }
  @media print {
    body { -webkit-print-color-adjust: exact; }
  }
  @page { @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
</style>
</head>
<body style="padding:40px;">
  <div style="margin-bottom:24px;">
    <div style="font-size:20px;font-weight:700;color:#111827;">${c.name || ''}</div>
    <div style="font-size:11px;color:#555;margin-top:4px;">${[c.email, c.phone, c.location].filter(Boolean).join(' | ')}</div>
  </div>
  <hr style="border:none;border-top:1px solid #D1D5DB;margin:0 0 24px;">
  <div style="font-size:12px;color:#374151;line-height:1.8;white-space:pre-wrap;">${resume.cover_letter.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</body>
</html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.document.title = ' ';
    setTimeout(() => {
      win.onafterprint = () => { win.close(); };
      win.print();
    }, 500);
  }

  function handleCopyCoverLetter() {
    if (!resume?.cover_letter) return;
    navigator.clipboard.writeText(resume.cover_letter).then(() => {
      setCoverLetterCopied(true);
      setTimeout(() => setCoverLetterCopied(false), 2000);
    });
  }

  // ─── Loading State ───
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '4px solid #E0E0E0', borderTopColor: '#0A66C2',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 15, color: '#666' }}>Loading your resume...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !resume) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 12, padding: '40px 32px', border: '1px solid #E0E0E0' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>Resume not found</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>The resume you&apos;re looking for doesn&apos;t exist or has expired.</div>
          <a href="/" style={{
            display: 'inline-block', padding: '10px 24px', background: '#0A66C2', color: '#fff',
            borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}>Go Home</a>
        </div>
      </div>
    );
  }

  // ─── Computed Values ───
  const rd = resume.resume_data;
  const matched = resume.keywords_matched?.length || 0;
  const missing = resume.keywords_missing?.length || 0;
  const total = matched + missing;
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;
  const scoreColor = getScoreColor(resume.ats_score);

  const interviewPrepHandler = async () => {
    try {
      const res = await fetch(`${API_URL}/api/interview-prep`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_id: resume.id }),
      });
      const data = await res.json();
      if (data.id) window.open(`/interview-prep/${data.id}`, '_blank');
      else alert(data.error || 'Failed to start interview prep');
    } catch { alert('Failed to start interview prep.'); }
  };

  const upgradeHandler = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${resume.order_id}/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (data.razorpay_order_id) {
        const rzp = new (window as any).Razorpay({
          key: data.razorpay_key, amount: data.amount, currency: data.currency,
          order_id: data.razorpay_order_id, name: 'ProfileRoaster', description: 'Upgrade to Pro',
          theme: { color: '#0A66C2' }, handler: () => window.location.reload(),
        }); rzp.open();
      } else alert(data.error || 'Failed');
    } catch { alert('Failed to initiate upgrade.'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF' }}>
      {/* ─── HEADER ─── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px' }}>
          {/* ATS Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a href={resultsUrl} style={{ fontSize: 13, color: '#64748B', textDecoration: 'none', fontWeight: 500 }}>&larr; Results</a>
              <span style={{ color: '#E2E8F0' }}>|</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: scoreColor }}>{resume.ats_score}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>ATS-Optimized Resume</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    {resume.target_role}{resume.target_company ? ` at ${resume.target_company}` : ''}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleDownloadPDF} style={{ padding: '7px 16px', background: '#0A66C2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>&#128196; Download PDF</button>
              <a href={`/resume/${resume.id}/edit`} style={{ padding: '7px 16px', background: '#057642', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>&#9997;&#65039; Edit</a>
              <a href={`${API_URL}/api/resume/${resume.id}/download/txt`} style={{ padding: '7px 16px', background: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>TXT</a>
              <button onClick={interviewPrepHandler} style={{ padding: '7px 16px', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>&#127908; Interview Prep</button>
              {resume.cover_letter && <button onClick={handleCopyCoverLetter} style={{ padding: '7px 16px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{coverLetterCopied ? '\u2713 Copied!' : '\uD83D\uDCEC Cover Letter'}</button>}
            </div>
          </div>

          {/* Template Switcher */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', padding: '8px 0', borderTop: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginRight: 4 }}>Template:</span>
            {TEMPLATES.map((t) => {
              const locked = orderPlan !== 'pro' && (t as any).proOnly;
              return (
                <button key={t.id} onClick={() => setTemplateId(t.id)}
                  style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: templateId === t.id ? '2px solid #0A66C2' : '1px solid #E2E8F0', background: templateId === t.id ? '#EFF6FF' : locked ? '#F9FAFB' : '#fff', color: templateId === t.id ? '#0A66C2' : locked ? '#94A3B8' : '#64748B' }}>
                  {t.name}{locked ? ' \uD83D\uDD12' : ''}
                </button>
              );
            })}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              {(['compact', 'standard', 'spacious'] as const).map(s => (
                <button key={s} onClick={() => { setPrintSize(s); savePrintSettings(s, fitOnePage); }}
                  style={{ padding: '3px 10px', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', background: printSize === s ? '#0A66C2' : '#fff', color: printSize === s ? '#fff' : '#64748B' }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
              <button onClick={() => { setFitOnePage(true); savePrintSettings(printSize, true); }}
                style={{ padding: '3px 10px', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', background: fitOnePage ? '#0A66C2' : '#fff', color: fitOnePage ? '#fff' : '#64748B' }}>1 pg</button>
              <button onClick={() => { setFitOnePage(false); savePrintSettings(printSize, false); }}
                style={{ padding: '3px 10px', fontSize: 10, fontWeight: 600, border: 'none', cursor: 'pointer', background: !fitOnePage ? '#0A66C2' : '#fff', color: !fitOnePage ? '#fff' : '#64748B' }}>2 pg</button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN: Sidebar + Preview ─── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 40px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* LEFT — ATS Insights Sidebar */}
        <div className="hidden md:block" style={{ width: 280, flexShrink: 0, position: 'sticky', top: 110 }}>
          {/* ATS Score Card */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, marginBottom: 14, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 14 }}>ATS Insights</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', border: `4px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: scoreColor, flexShrink: 0 }}>{resume.ats_score}%</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: resume.ats_score >= 80 ? '#057642' : resume.ats_score >= 60 ? '#0A66C2' : '#EA580C' }}>
                  {resume.ats_score >= 80 ? 'Excellent' : resume.ats_score >= 60 ? 'Good' : 'Needs Work'}
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{matched}/{total} keywords matched</div>
              </div>
            </div>
            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {[
                { check: true, text: 'ATS-friendly formatting' },
                { check: matched > 0, text: `${matched} keywords optimized` },
                { check: true, text: 'Strong action verbs' },
                { check: missing <= 3, text: missing === 0 ? 'All keywords covered' : `${missing} keywords to add` },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: item.check ? '#057642' : '#EA580C', fontWeight: 700 }}>{item.check ? '\u2713' : '\u26A0'}</span>
                  <span style={{ color: item.check ? '#334155' : '#EA580C', fontWeight: item.check ? 400 : 600 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowKeywords(!showKeywords)} style={{ width: '100%', padding: '8px', background: '#F1F5F9', color: '#0A66C2', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {showKeywords ? 'Hide Keywords' : 'View Keywords'}
            </button>
            {showKeywords && (
              <div style={{ marginTop: 12 }}>
                {matched > 0 && (
                  <><div style={{ fontSize: 11, fontWeight: 700, color: '#057642', marginBottom: 4 }}>Matched ({matched})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                    {(resume.keywords_matched || []).map((kw, i) => <span key={i} style={{ background: '#F0FDF4', color: '#057642', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 500 }}>{kw}</span>)}
                  </div></>
                )}
                {missing > 0 && (
                  <><div style={{ fontSize: 11, fontWeight: 700, color: '#CC1016', marginBottom: 4 }}>Missing ({missing})</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(resume.keywords_missing || []).map((kw, i) => <span key={i} style={{ background: '#FEF2F2', color: '#CC1016', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 500 }}>{kw}</span>)}
                  </div></>
                )}
              </div>
            )}
          </div>

          {/* Cover Letter Status */}
          {resume.cover_letter ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Cover Letter</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={handleCopyCoverLetter} style={{ width: '100%', padding: '8px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#0A66C2', cursor: 'pointer' }}>{coverLetterCopied ? '\u2713 Copied!' : '\uD83D\uDCCB Copy Cover Letter'}</button>
                <button onClick={handleDownloadCoverLetterPDF} style={{ width: '100%', padding: '8px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#64748B', cursor: 'pointer' }}>&#128196; Cover Letter PDF</button>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FFFBEB', borderRadius: 14, padding: 16, marginBottom: 14, border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>No Cover Letter</div>
              <div style={{ fontSize: 11, color: '#92400E', lineHeight: 1.5 }}>Add a job description when generating your next resume to get a targeted cover letter.</div>
            </div>
          )}

          {/* Resume Details */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Details</div>
            {[
              { label: 'Role', value: resume.target_role },
              { label: 'Company', value: resume.target_company },
              { label: 'Template', value: currentTemplate?.name || templateId },
            ].filter(d => d.value).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', padding: '4px 0', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: 500 }}>{d.label}</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Resume Preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative' }}>
            {renderResumeHTML(rd, templateId)}
            {isTemplateLocked && (
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, zIndex: 10 }}>
                <div style={{ background: 'white', border: '2px solid #0A66C2', borderRadius: 16, padding: '28px 36px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', maxWidth: 380 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{'\uD83D\uDD12'}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>Pro Template</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 16 }}>
                    &ldquo;{currentTemplate?.name}&rdquo; is a Pro template. Upgrade to unlock all 28 templates.
                  </div>
                  <button onClick={upgradeHandler} style={{ padding: '12px 28px', background: '#0A66C2', color: 'white', borderRadius: 50, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    Upgrade to Pro &mdash; &#8377;500 &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── COVER LETTER FULL-WIDTH ─── */}
      {resume.cover_letter && (
        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E8E8E8', padding: '28px 16px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ background: '#004182', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>Cover Letter</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCopyCoverLetter} style={{ background: 'white', color: '#004182', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{coverLetterCopied ? 'Copied!' : 'Copy'}</button>
                <button onClick={handleDownloadCoverLetterPDF} style={{ background: 'white', color: '#004182', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>PDF</button>
              </div>
            </div>
            <div style={{ padding: '24px', fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{resume.cover_letter}</div>
          </div>
        </div>
      )}

      {/* ─── BOTTOM ACTIONS ─── */}
      <div style={{ background: 'white', borderTop: '1px solid #E8E8E8', padding: '16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a href={`/resume?orderId=${resume.order_id}`} style={{ padding: '10px 24px', background: '#0A66C2', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Generate Another Resume</a>
          <a href={resultsUrl} style={{ padding: '10px 24px', background: '#fff', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Back to Results</a>
          <a href="/dashboard" style={{ padding: '10px 24px', background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Dashboard</a>
        </div>
      </div>
    </div>
  );
}

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
        setLoading(false);
      })
      .catch(() => {
        setError('Resume not found');
        setLoading(false);
      });
  }, [resumeId]);

  const orderPlan = (resume as any)?.order_plan || 'standard';
  const orderSource = (resume as any)?.order_source || 'roast';
  const resultsUrl = orderSource === 'build' ? `/build/results/${resume?.order_id}` : `/results/${resume?.order_id}`;
  const currentTemplate = TEMPLATES.find(t => t.id === templateId);
  const isTemplateLocked = orderPlan !== 'pro' && (currentTemplate as any)?.proOnly;

  function handleDownloadPDF() {
    if (!resume) return;
    if (isTemplateLocked) {
      alert(`"${currentTemplate?.name}" is a Pro template. Upgrade to Pro for ₹500 to unlock all 23 templates.`);
      return;
    }
    const html = buildPrintHTML(resume.resume_data, templateId);
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

  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF' }}>
      {/* ─── TOP BAR ─── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#fff',
        borderBottom: '1px solid #E0E0E0', padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#004182' }}>Resume</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '6px 14px', background: '#0A66C2', color: '#fff', border: 'none',
              borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            PDF
          </button>
          <a
            href={`${API_URL}/api/resume/${resume.id}/download/txt`}
            style={{
              padding: '6px 14px', background: '#F3F2EF', color: '#666', border: '1px solid #D0D0D0',
              borderRadius: 16, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            TXT
          </a>
          <a
            href={`/resume/${resume.id}/edit`}
            style={{
              padding: '6px 14px', background: '#057642', color: '#fff', border: 'none',
              borderRadius: 16, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Edit
          </a>
          <a
            href={resultsUrl}
            style={{
              padding: '6px 14px', background: '#fff', color: '#666', border: '1px solid #ccc',
              borderRadius: 16, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Results
          </a>
        </div>
      </div>

      {/* ─── TEMPLATE SWITCHER (full-width band) ─── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E0E0E0', padding: '10px 16px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#333', marginRight: 4 }}>Template:</span>
          {TEMPLATES.map((t) => {
            const locked = orderPlan !== 'pro' && (t as any).proOnly;
            return (
            <button key={t.id} onClick={() => setTemplateId(t.id)}
              style={{ padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: templateId === t.id ? '2px solid #0A66C2' : '1px solid #D0D0D0', background: templateId === t.id ? '#E8F0FE' : locked ? '#F9FAFB' : '#fff', color: templateId === t.id ? '#0A66C2' : locked ? '#999' : '#666' }}>
              {t.name}{locked ? ' 🔒' : ''}
            </button>
          );})}
        </div>
      </div>

      {/* ─── MAIN CONTENT: Left sidebar + Right preview ─── */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 16px 40px', display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* LEFT SIDEBAR (260px) */}
        <div className="hidden md:block" style={{ width: 260, flexShrink: 0, position: 'sticky', top: 60 }}>
          {/* ATS Score */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: `5px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: scoreColor, flexShrink: 0 }}>{resume.ats_score}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>ATS Score</div>
                <div style={{ fontSize: 11, color: '#666' }}>{matched}/{total} keywords • {matchRate}%</div>
              </div>
            </div>
            <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${matchRate}%`, background: '#057642', borderRadius: 3 }} />
            </div>
            <button onClick={() => setShowKeywords(!showKeywords)} style={{ width: '100%', padding: '6px', background: '#F3F2EF', color: '#0A66C2', border: '1px solid #D0D0D0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {showKeywords ? 'Hide Keywords' : `View ${missing} Missing Keywords`}
            </button>
            {showKeywords && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#057642', marginBottom: 4 }}>Matched</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {(resume.keywords_matched || []).map((kw, i) => <span key={i} style={{ background: '#DCFCE7', color: '#057642', borderRadius: 10, padding: '1px 8px', fontSize: 10 }}>{kw}</span>)}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#CC1016', marginBottom: 4 }}>Missing</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(resume.keywords_missing || []).map((kw, i) => <span key={i} style={{ background: '#FEE2E2', color: '#CC1016', borderRadius: 10, padding: '1px 8px', fontSize: 10 }}>{kw}</span>)}
                </div>
              </div>
            )}
          </div>


          {/* Download Resume */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>Download Resume</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button onClick={handleDownloadPDF} style={{ width: '100%', padding: '8px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>&#128196; Download PDF</button>
              <a href={`${API_URL}/api/resume/${resume.id}/download/txt`}
                style={{ width: '100%', padding: '8px', background: '#F3F2EF', color: '#666', border: '1px solid #D0D0D0', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'block' }}>&#128221; Download TXT (ATS Portals)</a>
            </div>
          </div>

          {/* Cover Letter */}
          {resume.cover_letter && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 }}>Cover Letter</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={handleCopyCoverLetter} style={{ width: '100%', padding: '6px', background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#0A66C2', cursor: 'pointer' }}>{coverLetterCopied ? '✓ Copied!' : '📋 Copy Cover Letter'}</button>
                <button onClick={handleDownloadCoverLetterPDF} style={{ width: '100%', padding: '6px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#666', cursor: 'pointer' }}>&#128196; Cover Letter PDF</button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Resume Preview (fluid) */}
        <div style={{ flex: 1, minWidth: 0 }}>

        {/* ─── RESUME PREVIEW ─── */}
        <div style={{ position: 'relative' }}>
          {renderResumeHTML(rd, templateId)}
          {isTemplateLocked && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, zIndex: 10,
            }}>
              <div style={{ background: 'white', border: '2px solid #0A66C2', borderRadius: 16, padding: '28px 36px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', maxWidth: 380 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>&#128274;</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>Pro Template</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 16 }}>
                  &ldquo;{currentTemplate?.name}&rdquo; is available for Pro users. Upgrade to unlock all 23 templates + 3 resumes.
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/api/orders/${resume.order_id}/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
                      const data = await res.json();
                      if (data.razorpay_order_id) {
                        const opts = {
                          key: data.razorpay_key, amount: data.amount, currency: data.currency,
                          order_id: data.razorpay_order_id, name: 'ProfileRoaster',
                          description: 'Upgrade to Pro', theme: { color: '#0A66C2' },
                          handler: () => { window.location.reload(); },
                          modal: { ondismiss: () => { document.body.style.overflow = ''; document.body.style.position = ''; document.documentElement.style.overflow = ''; } },
                        };
                        const rzp = new (window as any).Razorpay(opts); rzp.open();
                      } else { alert(data.error || 'Failed'); }
                    } catch { alert('Failed to initiate upgrade.'); }
                  }}
                  style={{
                    display: 'inline-block', padding: '12px 28px', background: '#0A66C2',
                    color: 'white', borderRadius: 50, fontSize: 15, fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  Upgrade to Pro — &#8377;500 &rarr;
                </button>
                <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Your &#8377;299 Standard payment will be adjusted</div>
              </div>
            </div>
          )}
        </div>

        </div>
      </div>

      {/* ─── COVER LETTER (full-width band) ─── */}
      {resume.cover_letter && (
        <div style={{ background: '#F8FAFC', borderTop: '1px solid #E8E8E8', padding: '28px 16px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', overflow: 'hidden' }}>
            <div style={{ background: '#004182', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>Cover Letter</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleCopyCoverLetter} style={{ background: 'white', color: '#004182', border: 'none', borderRadius: 16, padding: '4px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{coverLetterCopied ? 'Copied!' : 'Copy'}</button>
                <button onClick={handleDownloadCoverLetterPDF} style={{ background: 'white', color: '#004182', border: 'none', borderRadius: 16, padding: '4px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Download PDF</button>
              </div>
            </div>
            <div style={{ padding: '24px', fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{resume.cover_letter}</div>
          </div>
        </div>
      )}

      {/* ─── BOTTOM ACTIONS (full-width band) ─── */}
      <div style={{ background: 'white', borderTop: '1px solid #E8E8E8', padding: '20px 16px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a href={`/resume?orderId=${resume.order_id}`} style={{ display: 'inline-block', padding: '10px 24px', background: '#0A66C2', color: '#fff', borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Generate Another Resume</a>
          <a href={resultsUrl} style={{ display: 'inline-block', padding: '10px 24px', background: '#fff', color: '#666', border: '1px solid #999', borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Back to Results</a>
          <a href="/dashboard" style={{ display: 'inline-block', padding: '10px 24px', background: '#0A66C2', color: 'white', borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>My Dashboard</a>
        </div>
      </div>
    </div>
  );
}

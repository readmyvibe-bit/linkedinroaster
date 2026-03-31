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
  const currentTemplate = TEMPLATES.find(t => t.id === templateId);
  const isTemplateLocked = orderPlan !== 'pro' && (currentTemplate as any)?.proOnly;

  function handleDownloadPDF() {
    if (!resume) return;
    if (isTemplateLocked) {
      alert(`"${currentTemplate?.name}" is a Pro template. Upgrade to Pro for ₹500 to unlock all 20 templates.`);
      return;
    }
    const html = buildPrintHTML(resume.resume_data, templateId);

    // Smart auto-fit: measure in hidden iframe, adjust if overflows 1 page
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:none;visibility:hidden';
    document.body.appendChild(iframe);
    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iDoc) { document.body.removeChild(iframe); return; }
    iDoc.open(); iDoc.write(html); iDoc.close();

    setTimeout(() => {
      const PAGE_HEIGHT = 1123; // A4 at 96dpi
      const body = iDoc.body;
      const contentHeight = body.scrollHeight;
      const overflow = contentHeight - PAGE_HEIGHT;

      let adjustedHtml = html;

      // If overflow is small (1-5 lines, roughly < 120px), shrink to fit
      if (overflow > 0 && overflow < 150) {
        // Reduce spacing and line-height to fit
        const shrinkCSS = `
          body{line-height:1.3!important}
          div,p,span{line-height:1.3!important}
          .entry{margin-bottom:6px!important}
          [style*="margin-bottom"]{margin-bottom:4px!important}
          [style*="padding"]{padding-top:2px!important;padding-bottom:2px!important}
          [style*="margin-top: 20"],[style*="margin-top:20"]{margin-top:12px!important}
          [style*="margin-top: 28"],[style*="margin-top:28"]{margin-top:16px!important}
          [style*="margin-bottom: 16"],[style*="margin-bottom:16"]{margin-bottom:8px!important}
          [style*="margin-bottom: 18"],[style*="margin-bottom:18"]{margin-bottom:10px!important}
          [style*="padding: 24"],[style*="padding:24"]{padding:16px!important}
          [style*="padding: 32"],[style*="padding:32"]{padding:20px!important}
        `;
        adjustedHtml = html.replace('</style>', shrinkCSS + '</style>');
      }
      // If overflow is large (>150px), let it flow to page 2 naturally
      // No adjustment needed — proper @page margins handle it

      document.body.removeChild(iframe);

      const win = window.open('', '_blank');
      if (!win) return;
      win.document.write(adjustedHtml);
      win.document.close();
      win.document.title = ' ';
      setTimeout(() => {
        win.onafterprint = () => { win.close(); };
        win.print();
      }, 600);
    }, 300);
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
            href={isTemplateLocked ? '#' : `${API_URL}/api/resume/${resume.id}/download/docx`}
            onClick={(e) => { if (isTemplateLocked) { e.preventDefault(); alert(`"${currentTemplate?.name}" is a Pro template. Upgrade to Pro for ₹500.`); } }}
            style={{
              padding: '6px 14px', background: isTemplateLocked ? '#999' : '#374151', color: '#fff', border: 'none',
              borderRadius: 16, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            DOCX
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
            href={`/results/${resume.order_id}`}
            style={{
              padding: '6px 14px', background: '#fff', color: '#666', border: '1px solid #ccc',
              borderRadius: 16, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            Results
          </a>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{ maxWidth: 794, margin: '0 auto', padding: '24px 16px 40px' }}>

        {/* ─── ATS SCORE CARD ─── */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16,
          border: '1px solid #E0E0E0', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
        }}>
          {/* Score Circle */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', border: `6px solid ${scoreColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: scoreColor,
            }}>
              {resume.ats_score}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>ATS Score</div>
          </div>

          {/* Keyword Stats */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 6 }}>
              {matched} of {total} keywords matched
            </div>
            <div style={{ height: 8, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${matchRate}%`, background: '#057642', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>{matchRate}% match rate</div>
          </div>

          {/* Quick Stats */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>{missing} missing keywords</div>
            <button
              onClick={() => setShowKeywords(!showKeywords)}
              style={{
                padding: '6px 14px', background: '#F3F2EF', color: '#0A66C2', border: '1px solid #D0D0D0',
                borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {showKeywords ? 'Hide Details' : 'View Details'}
            </button>
          </div>
        </div>

        {/* ─── EXPANDABLE KEYWORD SECTION ─── */}
        {showKeywords && (
          <div style={{
            background: '#fff', borderRadius: 12, padding: 20, marginBottom: 16,
            border: '1px solid #E0E0E0',
          }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
              {/* Keywords Found */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>Keywords Found</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(resume.keywords_matched || []).map((kw, i) => (
                    <span key={i} style={{
                      background: '#DCFCE7', color: '#057642', borderRadius: 12,
                      padding: '2px 10px', fontSize: 12,
                    }}>{kw}</span>
                  ))}
                  {!resume.keywords_matched?.length && <span style={{ fontSize: 12, color: '#999' }}>None</span>}
                </div>
              </div>
              {/* Keywords Missing */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 8 }}>Keywords Missing</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(resume.keywords_missing || []).map((kw, i) => (
                    <span key={i} style={{
                      background: '#FEE2E2', color: '#CC1016', borderRadius: 12,
                      padding: '2px 10px', fontSize: 12,
                    }}>{kw}</span>
                  ))}
                  {!resume.keywords_missing?.length && <span style={{ fontSize: 12, color: '#999' }}>None</span>}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {resume.recommendations?.length > 0 && (
              <div>
                {resume.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
                    <span style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TEMPLATE SWITCHER ─── */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          border: '1px solid #E0E0E0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#333', marginRight: 4 }}>Template:</span>
          {TEMPLATES.map((t) => {
            const locked = orderPlan !== 'pro' && (t as any).proOnly;
            return (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              style={{
                padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: templateId === t.id ? '2px solid #0A66C2' : '1px solid #D0D0D0',
                background: templateId === t.id ? '#E8F0FE' : locked ? '#F9FAFB' : '#fff',
                color: templateId === t.id ? '#0A66C2' : locked ? '#999' : '#666',
                transition: 'all 0.15s',
              }}
            >
              {t.name}{locked ? ' 🔒' : ''}
            </button>
          );})}
        </div>

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
                  &ldquo;{currentTemplate?.name}&rdquo; is available for Pro users. Upgrade to unlock all 20 templates + 3 resumes.
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

        {/* ─── COVER LETTER ─── */}
        {resume.cover_letter && (
          <div style={{ maxWidth: 794, margin: '24px auto 0', background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', overflow: 'hidden' }}>
            <div style={{ background: '#004182', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>Cover Letter</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleCopyCoverLetter}
                  style={{ background: 'white', color: '#004182', border: 'none', borderRadius: 16, padding: '4px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {coverLetterCopied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={handleDownloadCoverLetterPDF}
                  style={{ background: 'white', color: '#004182', border: 'none', borderRadius: 16, padding: '4px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Download PDF
                </button>
              </div>
            </div>
            <div style={{ padding: '24px', fontSize: 14, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {resume.cover_letter}
            </div>
          </div>
        )}

        {/* ─── BOTTOM ACTIONS ─── */}
        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <a
            href={`/resume?orderId=${resume.order_id}`}
            style={{
              display: 'inline-block', padding: '10px 24px', background: '#0A66C2', color: '#fff',
              borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Generate Another Resume
          </a>
          <a
            href={`/results/${resume.order_id}`}
            style={{
              display: 'inline-block', padding: '10px 24px', background: '#fff', color: '#666',
              border: '1px solid #999', borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Back to Results
          </a>
          <a
            href="/dashboard"
            style={{
              display: 'inline-block', padding: '10px 24px', background: '#0A66C2', color: 'white',
              borderRadius: 24, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            My Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

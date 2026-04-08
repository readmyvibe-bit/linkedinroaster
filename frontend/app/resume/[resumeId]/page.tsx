'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { TEMPLATES, renderResumeHTML, buildPrintHTML, getRecommendedTemplates, getContentDensity, getAdaptiveSpacingStyle, getAdaptiveSpacingCSS } from '../../../components/resume/ResumeTemplates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───
interface ContactInfo { name?: string; email?: string; phone?: string; location?: string; linkedin?: string; website?: string; }
interface ExperienceEntry { role?: string; title?: string; company?: string; dates?: string; location?: string; bullets?: string[]; }
interface EducationEntry { degree?: string; institution?: string; school?: string; field?: string; year?: string; dates?: string; }
interface SkillCategory { category?: string; skills?: string[]; }
interface ResumeData { contact?: ContactInfo; summary?: string; experience?: ExperienceEntry[]; education?: EducationEntry[]; skills?: SkillCategory[] | string[]; achievements?: string[]; }
interface ResumeResponse { id: string; resume_data: ResumeData; ats_score: number; keywords_matched: string[]; keywords_missing: string[]; recommendations: string[]; target_role: string; target_company: string; template_id: string; order_id: string; cover_letter?: string; page_count?: number; }

function getScoreColor(s: number) { return s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--accent)' : s >= 40 ? 'var(--warning)' : 'var(--danger)'; }

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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    if (!resumeId) return;
    setLoading(true);
    fetch(`${API_URL}/api/resume/${resumeId}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setResume(d); setTemplateId(d.template_id || 'classic'); setPrintSize(d.resume_data?.printSize || 'standard'); setFitOnePage(d.resume_data?.fitOnePage === true); setLoading(false); })
      .catch(() => { setError('Resume not found'); setLoading(false); });
  }, [resumeId]);

  function savePrintSettings(s: string, f: boolean) {
    if (!resume) return;
    fetch(`${API_URL}/api/resume/${resumeId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume_data: { ...resume.resume_data, printSize: s, fitOnePage: f } }) }).catch(() => {});
  }

  const orderPlan = (resume as any)?.order_plan || 'standard';
  const orderSource = (resume as any)?.order_source || 'rewrite';
  const resultsUrl = orderSource === 'build' ? `/build/results/${resume?.order_id}` : `/results/${resume?.order_id}`;
  const currentTemplate = TEMPLATES.find(t => t.id === templateId);
  const isTemplateLocked = orderPlan !== 'pro' && (currentTemplate as any)?.proOnly;

  const [pdfGenerating, setPdfGenerating] = useState(false);

  function buildResumeHTML() {
    if (!resume) return '';
    let html = buildPrintHTML(resume.resume_data, templateId);
    const density = getContentDensity(resume.resume_data);
    const adaptive = getAdaptiveSpacingCSS(density, printSize);
    if (adaptive) html = html.replace('</style>', adaptive + '</style>');
    if (printSize === 'compact') html = html.replace('</style>', 'body{font-size:10px!important;line-height:1.35!important}.print-content-root>div{padding:28px!important}</style>');
    else if (printSize === 'spacious') html = html.replace('</style>', 'body{font-size:12px!important;line-height:1.65!important}.print-content-root>div{padding:40px 44px!important}.print-content-root .entry{margin-bottom:12px!important}</style>');
    if (fitOnePage) {
      html = html.replace(/@page\s*\{[^}]*\}/, '@page{size:A4;margin:8mm 10mm 8mm 10mm}');
      html = html.replace('</style>', 'body{font-size:90%!important;line-height:1.3!important}body div,body p{margin-bottom:1px!important}</style>');
    } else {
      html = html.replace('</style>', '@media print{html,body{width:210mm!important;min-height:auto!important}body{overflow:visible!important}.print-content-root{width:100%!important;transform:none!important}.print-content-root,.print-content-root>div,.resume-body,.two-col,.two-col-left,.two-col-right{min-height:auto!important}}</style>');
    }
    return html;
  }

  async function handleDownloadPDF() {
    if (!resume) return;
    if (isTemplateLocked) { alert(`"${currentTemplate?.name}" is a Pro template. Upgrade for \u20B9500.`); return; }
    const html = buildResumeHTML();
    const name = resume.resume_data?.contact?.name || 'resume';
    const filename = `${name.replace(/[^a-zA-Z0-9]/g, '-')}-resume.pdf`;

    // Try server-side PDF first (ATS-optimized, embedded fonts)
    setPdfGenerating(true);
    try {
      const res = await fetch(`${API_URL}/api/resume/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
        URL.revokeObjectURL(url);
        setPdfGenerating(false);
        return;
      }
    } catch {}
    setPdfGenerating(false);
    // Fallback: browser print dialog
    handleQuickPrint();
  }

  function handleQuickPrint() {
    if (!resume) return;
    if (isTemplateLocked) { alert(`"${currentTemplate?.name}" is a Pro template. Upgrade for \u20B9500.`); return; }
    const html = buildResumeHTML();
    const w = window.open('', '_blank'); if (!w) { alert('Allow popups.'); return; }
    w.document.write(html); w.document.close(); w.document.title = ' '; setTimeout(() => w.print(), 600);
  }

  function handleCLPdf() {
    if (!resume?.cover_letter) return;
    const c = resume.resume_data.contact || {};
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title> </title><style>@page{margin:25mm;size:A4}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111827;line-height:1.8}@media print{body{-webkit-print-color-adjust:exact}}</style></head><body style="padding:40px"><div style="margin-bottom:24px"><div style="font-size:20px;font-weight:700">${c.name||''}</div><div style="font-size:11px;color:#555;margin-top:4px">${[c.email,c.phone,c.location].filter(Boolean).join(' | ')}</div></div><hr style="border:none;border-top:1px solid #D1D5DB;margin:0 0 24px"><div style="font-size:12px;color:#374151;line-height:1.8;white-space:pre-wrap">${resume.cover_letter.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div></body></html>`;
    const w = window.open('', '_blank'); if (!w) return; w.document.write(html); w.document.close(); w.document.title = ' '; setTimeout(() => { w.onafterprint = () => w.close(); w.print(); }, 500);
  }

  function handleCopyCL() { if (!resume?.cover_letter) return; navigator.clipboard.writeText(resume.cover_letter).then(() => { setCoverLetterCopied(true); setTimeout(() => setCoverLetterCopied(false), 2000); }); }

  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [prepLoading, setPrepLoading] = useState(false);

  useEffect(() => {
    if (!showLevelPicker) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest('[data-level-picker-root]')) return;
      setShowLevelPicker(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showLevelPicker]);

  const handleInterview = async (level?: string) => {
    if (prepLoading || !resume?.id) return;
    setPrepLoading(true);
    setShowLevelPicker(false);
    try {
      const body: any = { resume_id: resume.id };
      if (level) body.interview_level = level;
      const r = await fetch(`${API_URL}/api/interview-prep`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.id) window.open(`/interview-prep/${d.id}`, '_blank');
      else alert(d.error || 'Failed');
    } catch {
      alert('Failed.');
    } finally {
      setPrepLoading(false);
    }
  };
  const handleUpgrade = async () => { try { const r = await fetch(`${API_URL}/api/orders/${resume?.order_id}/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); const d = await r.json(); if (d.razorpay_order_id) { const z = new (window as any).Razorpay({ key: d.razorpay_key, amount: d.amount, currency: d.currency, order_id: d.razorpay_order_id, name: 'ProfileRoaster', description: 'Upgrade to Pro', theme: { color: '#0A66C2' }, handler: () => window.location.reload() }); z.open(); } else alert(d.error || 'Failed'); } catch { alert('Failed.'); } };

  // Loading
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="saas-skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
        <div className="saas-skeleton" style={{ width: 200, height: 16, borderRadius: 8, margin: '0 auto 8px' }} />
        <div className="saas-skeleton" style={{ width: 140, height: 12, borderRadius: 6, margin: '0 auto' }} />
      </div>
    </div>
  );

  // Error
  if (error || !resume) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="saas-card" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Resume not found</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>This resume doesn&apos;t exist or has expired.</div>
        <a href="/" className="saas-btn saas-btn-primary" style={{ borderRadius: 'var(--radius-pill)' }}>Go Home</a>
      </div>
    </div>
  );

  const rd = resume.resume_data;
  const matched = resume.keywords_matched?.length || 0;
  const missing = resume.keywords_missing?.length || 0;
  const total = matched + missing;
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;
  const scoreColor = getScoreColor(resume.ats_score);
  const scoreLabel = resume.ats_score >= 80 ? 'Excellent' : resume.ats_score >= 60 ? 'Good match' : 'Needs work';
  const recommended = getRecommendedTemplates(resume.target_role, orderPlan === 'pro');
  const categories = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const filteredTemplates = filterCategory === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === filterCategory);

  return (
    <div style={{ minHeight: '100vh', background: '#F1F3F5', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* HEADER */}
      <header style={{ height: 52, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href={resultsUrl} style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>&larr; Back to Results</a>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0B69C7' }}>Profile</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Roaster</span>
          </a>
        </div>
        <a href="/dashboard" style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>Dashboard</a>
      </header>

      {/* SPLIT PANEL — Desktop */}
      <div className="hidden lg:flex" style={{ height: 'calc(100vh - 52px)' }}>

        {/* LEFT PANEL — Controls */}
        <div style={{ width: 320, flexShrink: 0, background: '#FFFFFF', borderRight: '1px solid #E5E7EB', overflowY: 'auto', padding: '24px 20px' }}>

          {/* ATS Score */}
          <div style={{ background: resume.ats_score >= 80 ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' : resume.ats_score >= 60 ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : 'linear-gradient(135deg, #FFFBEB, #FEF3C7)', border: `1px solid ${resume.ats_score >= 80 ? '#BBF7D0' : resume.ats_score >= 60 ? '#BFDBFE' : '#FDE68A'}`, borderRadius: 12, padding: '20px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase' }}>ATS Score</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{resume.ats_score}%</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: scoreColor, marginTop: 4 }}>{scoreLabel}</div>
            <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB', marginTop: 12 }}>
              <div style={{ height: '100%', borderRadius: 3, background: scoreColor, width: `${resume.ats_score}%`, transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Template Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Template</label>
            <select
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: 'white', cursor: 'pointer' }}
            >
              {TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name} {(t as any).proOnly && orderPlan !== 'pro' ? '\uD83D\uDD12' : ''} {t.ats === 'high' ? '\u2713 ATS' : ''}</option>
              ))}
            </select>
            {currentTemplate && (
              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{currentTemplate.description}</div>
            )}
          </div>

          {/* Primary Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <button onClick={handleDownloadPDF} disabled={pdfGenerating} style={{ width: '100%', padding: '14px', background: pdfGenerating ? '#94A3B8' : '#057642', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              {pdfGenerating ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <a href={`/resume/${resumeId}/edit`} style={{ display: 'block', width: '100%', padding: '12px', background: 'white', color: '#0B69C7', border: '2px solid #0B69C7', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>
              Edit Resume
            </a>
            <button onClick={() => handleInterview()} disabled={prepLoading} style={{ width: '100%', padding: '12px', background: '#0B69C7', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: prepLoading ? 0.6 : 1 }}>
              {prepLoading ? 'Starting...' : 'Interview Prep \u2192'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#E5E7EB', margin: '0 0 16px' }} />

          {/* Advanced Options */}
          <button onClick={() => setAdvancedOpen(!advancedOpen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            Advanced Options
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>{advancedOpen ? '\u25B2' : '\u25BC'}</span>
          </button>

          {advancedOpen && (
            <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Density */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6, display: 'block' }}>Density</label>
                <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                  {(['compact', 'standard', 'spacious'] as const).map(s => (
                    <button key={s} onClick={() => { setPrintSize(s); savePrintSettings(s, fitOnePage); }} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: printSize === s ? 600 : 400, background: printSize === s ? 'white' : 'transparent', color: printSize === s ? '#111827' : '#6B7280', cursor: 'pointer', boxShadow: printSize === s ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pages */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6, display: 'block' }}>Pages</label>
                <div style={{ display: 'flex', gap: 4, background: '#F3F4F6', borderRadius: 8, padding: 3 }}>
                  {[{ v: true, l: '1 Page' }, { v: false, l: '2 Pages' }].map(p => (
                    <button key={String(p.v)} onClick={() => { setFitOnePage(p.v); savePrintSettings(printSize, p.v); }} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: fitOnePage === p.v ? 600 : 400, background: fitOnePage === p.v ? 'white' : 'transparent', color: fitOnePage === p.v ? '#111827' : '#6B7280', cursor: 'pointer', boxShadow: fitOnePage === p.v ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                      {p.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Downloads */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6, display: 'block' }}>Other Downloads</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`${API_URL}/api/resume/${resumeId}/download/txt`} style={{ flex: 1, padding: '8px', background: '#F3F4F6', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', textDecoration: 'none', textAlign: 'center', border: '1px solid #E5E7EB' }}>TXT</a>
                  <a href={`${API_URL}/api/resume/${resumeId}/download/docx`} style={{ flex: 1, padding: '8px', background: '#F3F4F6', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', textDecoration: 'none', textAlign: 'center', border: '1px solid #E5E7EB' }}>DOCX</a>
                  <button onClick={handleQuickPrint} style={{ flex: 1, padding: '8px', background: '#F3F4F6', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', border: '1px solid #E5E7EB', cursor: 'pointer' }}>Print</button>
                </div>
              </div>

              {/* Cover Letter */}
              {resume.cover_letter && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 6, display: 'block' }}>Cover Letter</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleCopyCL} style={{ flex: 1, padding: '8px', background: '#F3F4F6', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', border: '1px solid #E5E7EB', cursor: 'pointer' }}>{coverLetterCopied ? 'Copied!' : 'Copy'}</button>
                    <button onClick={handleCLPdf} style={{ flex: 1, padding: '8px', background: '#F3F4F6', borderRadius: 6, fontSize: 12, fontWeight: 500, color: '#374151', border: '1px solid #E5E7EB', cursor: 'pointer' }}>PDF</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: '#E5E7EB', margin: '16px 0' }} />

          {/* Status Checklist */}
          <div style={{ fontSize: 12, color: '#374151' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Progress</div>
            {[
              { label: 'Resume generated', done: true },
              { label: 'Interview prep', done: false, action: () => handleInterview() },
              { label: 'Applied to jobs', done: false },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: item.action ? 'pointer' : 'default' }} onClick={item.action}>
                <span style={{ fontSize: 14 }}>{item.done ? '\u2705' : '\u2B1C'}</span>
                <span style={{ fontWeight: item.done ? 600 : 400, color: item.done ? '#057642' : '#374151' }}>{item.label}</span>
                {item.action && !item.done && <span style={{ fontSize: 11, color: '#0B69C7', marginLeft: 'auto' }}>Start \u2192</span>}
              </div>
            ))}
          </div>

          {/* Generate Another */}
          <div style={{ marginTop: 20 }}>
            <a href={`/resume?orderId=${resume.order_id}`} style={{ display: 'block', padding: '10px', background: '#F3F4F6', borderRadius: 8, fontSize: 13, fontWeight: 500, color: '#374151', textDecoration: 'none', textAlign: 'center', border: '1px solid #E5E7EB' }}>
              + Generate Another Resume
            </a>
          </div>
        </div>

        {/* RIGHT PANEL — Resume Preview */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 120px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <div style={{ width: '100%', maxWidth: 794, background: 'white', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {resume.resume_data && renderResumeHTML(resume.resume_data, templateId)}
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT — shown only on small screens */}
      <div className="lg:hidden" style={{ padding: '16px', paddingBottom: 140 }}>
        {/* Mobile ATS Score + Template — stacked */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '16px', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{resume.ats_score}%</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: scoreColor, marginTop: 2 }}>{scoreLabel}</div>
            </div>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E5E7EB' }}>
              <div style={{ height: '100%', borderRadius: 3, background: scoreColor, width: `${resume.ats_score}%` }} />
            </div>
          </div>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, background: 'white' }}>
            {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {/* Mobile Resume Preview */}
        <div style={{ background: 'white', borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {resume.resume_data && renderResumeHTML(resume.resume_data, templateId)}
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR — 2 rows */}
      <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #E5E7EB', padding: '8px 16px 12px', zIndex: 50, boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <button onClick={handleDownloadPDF} disabled={pdfGenerating} style={{ flex: 1, padding: '11px', background: '#057642', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {pdfGenerating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={`/resume/${resumeId}/edit`} style={{ flex: 1, padding: '9px', background: 'white', color: '#0B69C7', border: '1.5px solid #0B69C7', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Edit</a>
          <button onClick={() => handleInterview()} disabled={prepLoading} style={{ flex: 1, padding: '9px', background: '#0B69C7', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Interview Prep</button>
          <a href={`${API_URL}/api/resume/${resumeId}/download/txt`} style={{ padding: '9px 14px', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none', textAlign: 'center' }}>TXT</a>
        </div>
      </div>
    </div>
  );
}

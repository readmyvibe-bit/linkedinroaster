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
  const orderSource = (resume as any)?.order_source || 'roast';
  const resultsUrl = orderSource === 'build' ? `/build/results/${resume?.order_id}` : `/results/${resume?.order_id}`;
  const currentTemplate = TEMPLATES.find(t => t.id === templateId);
  const isTemplateLocked = orderPlan !== 'pro' && (currentTemplate as any)?.proOnly;

  function handleDownloadPDF() {
    if (!resume) return;
    if (isTemplateLocked) { alert(`"${currentTemplate?.name}" is a Pro template. Upgrade for \u20B9500.`); return; }
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
      // Multi-page: natural flow; reset forced full-page min-heights so content does not balloon spacing
      html = html.replace('</style>', '@media print{html,body{width:210mm!important;min-height:auto!important}body{overflow:visible!important}.print-content-root{width:100%!important;transform:none!important}.print-content-root,.print-content-root>div,.resume-body,.two-col,.two-col-left,.two-col-right{min-height:auto!important}}</style>');
    }
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
    <div style={{ minHeight: '100vh', background: '#F7F8FA' }}>

      {/* ═══ HEADER ═══ */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          {/* Row 1: Breadcrumb + desktop actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 1 }}>
              <a href={resultsUrl} style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>&larr; Results</a>
              <span className="hidden sm:inline" style={{ color: 'var(--border-default)', fontSize: 12 }}>/</span>
              <span className="hidden sm:inline" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>Resume</span>
              <span className="hidden sm:inline" style={{ background: resume.ats_score >= 80 ? 'rgba(5,150,105,0.08)' : resume.ats_score >= 60 ? 'rgba(10,102,194,0.08)' : 'rgba(217,119,6,0.08)', color: scoreColor, padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>ATS {resume.ats_score}</span>
            </div>
            {/* Desktop actions */}
            <div className="hidden sm:flex" style={{ gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <button onClick={handleDownloadPDF} style={{ fontSize: 13, fontWeight: 600, padding: '7px 20px', borderRadius: 'var(--radius-pill)', border: 'none', cursor: 'pointer', background: 'var(--accent)', color: 'white', transition: 'all var(--transition)' }}>Download PDF</button>
              <a href={`/resume/${resume.id}/edit`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--success)', textDecoration: 'none', padding: '7px 12px', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition)' }}>Edit</a>
              <a href={`${API_URL}/api/resume/${resume.id}/download/txt`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', textDecoration: 'none', padding: '7px 12px' }}>TXT</a>
              <div data-level-picker-root style={{ position: 'relative', display: 'inline-block' }}>
                <button type="button" disabled={prepLoading} onClick={() => !prepLoading && setShowLevelPicker(!showLevelPicker)} className="saas-btn saas-btn-ghost" style={{ color: '#7C3AED', opacity: prepLoading ? 0.6 : 1 }}>{prepLoading ? 'Starting…' : 'Interview Prep'} &#9662;</button>
                {showLevelPicker && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 200, padding: '6px 0', marginTop: 4 }}>
                    <button type="button" disabled={prepLoading} onClick={() => handleInterview()} style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: prepLoading ? 'wait' : 'pointer', fontSize: 13, color: '#333' }}>Auto-detect level</button>
                    {[{ v: 'entry', l: 'Entry (0-2 yrs)' }, { v: 'mid', l: 'Mid (2-5 yrs)' }, { v: 'senior', l: 'Senior (5-10 yrs)' }, { v: 'lead', l: 'Lead (10+ yrs)' }].map(o => (
                      <button type="button" key={o.v} disabled={prepLoading} onClick={() => handleInterview(o.v)} style={{ display: 'block', width: '100%', padding: '8px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: prepLoading ? 'wait' : 'pointer', fontSize: 13, color: '#333' }}>{o.l}</button>
                    ))}
                  </div>
                )}
              </div>
              <a href="/dashboard" target="_blank" rel="noreferrer" className="saas-btn saas-btn-ghost">Dashboard</a>
            </div>
            {/* Mobile: just ATS badge */}
            <span className="sm:hidden saas-metric" style={{ background: resume.ats_score >= 80 ? 'var(--success-subtle)' : resume.ats_score >= 60 ? 'var(--accent-subtle)' : 'var(--warning-subtle)', color: scoreColor, whiteSpace: 'nowrap', fontSize: 12 }}>ATS {resume.ats_score}</span>
          </div>
          {/* Row 2: Role + controls */}
          <div className="hidden sm:flex" style={{ alignItems: 'center', justifyContent: 'space-between', height: 44, gap: 12, borderTop: '1px solid rgba(15,23,42,0.04)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{resume.target_role}</span>
              {resume.target_company && !resume.target_company.toLowerCase().includes('must be at least') && <span> at {resume.target_company}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <button onClick={() => setShowTemplateModal(true)} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentTemplate?.name || 'Template'} <span style={{ fontSize: 10, opacity: 0.5 }}>&#9662;</span>
              </button>
              {/* Density segmented control */}
              <div style={{ display: 'inline-flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                {(['compact', 'standard', 'spacious'] as const).map(s => (
                  <button key={s} onClick={() => { setPrintSize(s); savePrintSettings(s, fitOnePage); }} style={{ fontSize: 11, fontWeight: printSize === s ? 600 : 400, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: printSize === s ? 'var(--bg-surface)' : 'transparent', color: printSize === s ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: printSize === s ? 'var(--shadow-xs)' : 'none', transition: 'all var(--transition)', textTransform: 'capitalize' }}>{s}</button>
                ))}
              </div>
              {/* Pages toggle */}
              <div style={{ display: 'inline-flex', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
                {[{ v: true, l: '1P' }, { v: false, l: '2P' }].map(p => (
                  <button key={String(p.v)} onClick={() => { setFitOnePage(p.v); savePrintSettings(printSize, p.v); }} style={{ fontSize: 11, fontWeight: fitOnePage === p.v ? 600 : 400, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: fitOnePage === p.v ? 'var(--bg-surface)' : 'transparent', color: fitOnePage === p.v ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: fitOnePage === p.v ? 'var(--shadow-xs)' : 'none', transition: 'all var(--transition)' }}>{p.l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ TEMPLATE MODAL ═══ */}
      {showTemplateModal && (
        <div className="template-modal-overlay" onClick={() => setShowTemplateModal(false)}>
          <div className="template-modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>Choose Template</span>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <div style={{ padding: '12px 24px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--bg-subtle)' }}>
              {categories.map(c => (
                <button key={c} onClick={() => setFilterCategory(c)} style={{ padding: '4px 14px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: filterCategory === c ? 'none' : '1px solid var(--border-default)', background: filterCategory === c ? 'var(--accent)' : 'var(--bg-surface)', color: filterCategory === c ? '#fff' : 'var(--text-secondary)', transition: 'all var(--transition)' }}>{c}</button>
              ))}
            </div>
            {filterCategory === 'All' && recommended.length > 0 && (
              <div style={{ padding: '16px 24px 8px' }}>
                <div className="saas-label" style={{ marginBottom: 8 }}>Recommended for {resume.target_role}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {recommended.map(rid => { const t = TEMPLATES.find(x => x.id === rid); return t ? (
                    <button key={rid} onClick={() => { setTemplateId(rid); setShowTemplateModal(false); }} className="saas-card" style={{ padding: 14, textAlign: 'left', cursor: 'pointer', border: templateId === rid ? '2px solid var(--accent)' : undefined }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{t.name} &#9733;</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</div>
                      {t.atsLevel === 'high' && <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, color: 'var(--success)', background: 'var(--success-subtle)', padding: '2px 8px', borderRadius: 4 }}>ATS Safe</span>}
                    </button>
                  ) : null; })}
                </div>
              </div>
            )}
            <div style={{ padding: '16px 24px 24px' }}>
              {filterCategory === 'All' && <div className="saas-label" style={{ marginBottom: 8 }}>All templates</div>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {filteredTemplates.filter(t => !(filterCategory === 'All' && recommended.includes(t.id))).map(t => { const locked = orderPlan !== 'pro' && (t as any).proOnly; return (
                  <button key={t.id} onClick={() => { if (!locked) { setTemplateId(t.id); setShowTemplateModal(false); } }} className="saas-card" style={{ padding: 14, textAlign: 'left', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.6 : 1, border: templateId === t.id ? '2px solid var(--accent)' : undefined }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{t.name}{locked ? ' \uD83D\uDD12' : ''}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{t.description}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {t.atsLevel === 'high' && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--success)', background: 'var(--success-subtle)', padding: '2px 6px', borderRadius: 4 }}>ATS Safe</span>}
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>{t.category}</span>
                    </div>
                  </button>
                ); })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MAIN ═══ */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 24px 48px', display: 'flex', gap: 28, alignItems: 'flex-start' }}>

        {/* LEFT: Sidebar */}
        <div className="hidden md:flex" style={{ width: 300, flexShrink: 0, flexDirection: 'column', gap: 16, position: 'sticky', top: 112 }}>
          {/* ATS Score */}
          <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)', padding: 20 }}>
            <div className="saas-label" style={{ marginBottom: 12 }}>ATS Insights</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', border: `4px solid ${resume.ats_score >= 80 ? 'var(--success)' : resume.ats_score >= 60 ? 'var(--accent)' : 'var(--warning)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: scoreColor, flexShrink: 0 }}>{resume.ats_score}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{scoreLabel}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{matched}/{total} keywords</div>
              </div>
            </div>
            <div style={{ height: 6, background: 'var(--bg-subtle)', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${matchRate}%`, background: scoreColor, borderRadius: 3, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                { ok: true, t: 'ATS-friendly formatting' },
                { ok: matched > 0, t: `${matched} keywords optimized` },
                { ok: true, t: 'Strong action verbs' },
                { ok: missing <= 3, t: missing === 0 ? 'All keywords covered' : `${missing} keywords to add` },
              ].map((i, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: i.ok ? 'var(--success)' : 'var(--warning)', fontSize: 14 }}>{i.ok ? '\u2713' : '\u26A0'}</span>
                  <span style={{ color: i.ok ? 'var(--text-primary)' : 'var(--warning)', fontWeight: i.ok ? 400 : 600 }}>{i.t}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowKeywords(!showKeywords)} className="saas-btn saas-btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>{showKeywords ? 'Hide keywords' : 'View keywords'}</button>
            {showKeywords && (
              <div style={{ marginTop: 12 }}>
                {matched > 0 && <><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>Matched ({matched})</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>{(resume.keywords_matched||[]).map((k,i) => <span key={i} style={{ background: 'var(--success-subtle)', color: 'var(--success)', borderRadius: 6, padding: '2px 8px', fontSize: 10 }}>{k}</span>)}</div></>}
                {missing > 0 && <><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>Missing ({missing})</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(resume.keywords_missing||[]).map((k,i) => <span key={i} style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', borderRadius: 6, padding: '2px 8px', fontSize: 10 }}>{k}</span>)}</div></>}
              </div>
            )}
          </div>

          {/* Cover Letter */}
          {resume.cover_letter ? (
            <div className="saas-card" style={{ padding: 16 }}>
              <div className="saas-label" style={{ marginBottom: 10 }}>Cover Letter</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={handleCopyCL} className="saas-btn saas-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>{coverLetterCopied ? '\u2713 Copied!' : 'Copy Cover Letter'}</button>
                <button onClick={handleCLPdf} className="saas-btn saas-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Cover Letter PDF</button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--warning-subtle)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)' }}>No Cover Letter</div>
              <div style={{ fontSize: 11, color: 'var(--warning)', lineHeight: 1.5, marginTop: 4 }}>Add a job description to generate one.</div>
            </div>
          )}

          {/* Details */}
          <div className="saas-card" style={{ padding: 16 }}>
            <div className="saas-label" style={{ marginBottom: 10 }}>Details</div>
            {[{ l: 'Role', v: resume.target_role }, { l: 'Company', v: resume.target_company && !resume.target_company.toLowerCase().includes('must be at least') ? resume.target_company : undefined }, { l: 'Template', v: currentTemplate?.name }, { l: 'Density', v: printSize.charAt(0).toUpperCase() + printSize.slice(1) }].filter(d => d.v).map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', padding: '5px 0', borderBottom: '1px solid var(--bg-subtle)' }}>
                <span>{d.l}</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Preview Stage */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#F0F2F5', borderRadius: 'var(--radius-xl)', padding: 28, minHeight: 600 }}>
            <div style={{ position: 'relative', background: '#FFFFFF', borderRadius: 'var(--radius-md)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)', overflow: 'hidden', border: '1px solid rgba(15,23,42,0.04)' }}>
              <div style={getAdaptiveSpacingStyle(getContentDensity(rd), printSize)}>
                {renderResumeHTML(rd, templateId)}
              </div>
              {isTemplateLocked && (
                <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <div className="saas-card" style={{ padding: '32px 40px', textAlign: 'center', maxWidth: 380, boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>{'\uD83D\uDD12'}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Pro Template</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>&ldquo;{currentTemplate?.name}&rdquo; requires Pro. Unlock all 11 templates.</div>
                    <button onClick={handleUpgrade} className="saas-btn saas-btn-primary" style={{ borderRadius: 'var(--radius-pill)', padding: '12px 28px', fontSize: 15 }}>Upgrade &mdash; &#8377;500</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ COVER LETTER BAND ═══ */}
      {resume.cover_letter && (
        <div style={{ borderTop: '1px solid rgba(15,23,42,0.06)', padding: '36px 24px', background: '#F7F8FA' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(15,23,42,0.06)', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.04)', overflow: 'hidden', borderLeft: '4px solid var(--accent)' }}>
              <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Cover Letter</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={handleCopyCL} style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition)' }}>{coverLetterCopied ? 'Copied!' : 'Copy'}</button>
                  <button onClick={handleCLPdf} style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition)' }}>PDF</button>
                </div>
              </div>
              <div style={{ padding: '24px 28px', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{resume.cover_letter}</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FOOTER ═══ */}
      <div style={{ background: '#F7F8FA', borderTop: '1px solid rgba(15,23,42,0.06)', padding: '20px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a href={`/resume?orderId=${resume.order_id}`} style={{ fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: 'none', background: 'var(--accent)', color: 'white', textDecoration: 'none', transition: 'all var(--transition)' }}>Generate Another Resume</a>
          <a href={resultsUrl} style={{ fontSize: 13, fontWeight: 500, padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all var(--transition)' }}>Back to Results</a>
          <a href="/dashboard" target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 500, padding: '8px 20px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all var(--transition)' }}>Dashboard</a>
        </div>
      </div>

      {/* ═══ MOBILE STICKY ═══ */}
      <div className="flex sm:!hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)', padding: '10px 16px', zIndex: 50, gap: 8, boxShadow: 'var(--shadow-md)', flexWrap: 'wrap' }}>
        <button onClick={handleDownloadPDF} className="saas-btn saas-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Download PDF</button>
        <a href={`/resume/${resume.id}/edit`} className="saas-btn saas-btn-ghost">Edit</a>
        <div data-level-picker-root style={{ position: 'relative' }}>
          <button type="button" disabled={prepLoading} onClick={() => !prepLoading && setShowLevelPicker(!showLevelPicker)} className="saas-btn saas-btn-ghost" style={{ color: '#7C3AED', opacity: prepLoading ? 0.6 : 1 }}>{prepLoading ? '…' : 'Prep'} &#9662;</button>
          {showLevelPicker && (
            <div style={{ position: 'absolute', bottom: '100%', right: 0, background: '#fff', border: '1px solid #E0E0E0', borderRadius: 8, boxShadow: '0 -4px 12px rgba(0,0,0,0.1)', zIndex: 60, minWidth: 180, padding: '6px 0', marginBottom: 4 }}>
              <button type="button" disabled={prepLoading} onClick={() => handleInterview()} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: prepLoading ? 'wait' : 'pointer', fontSize: 14, color: '#333' }}>Auto-detect</button>
              {[{ v: 'entry', l: 'Entry' }, { v: 'mid', l: 'Mid' }, { v: 'senior', l: 'Senior' }, { v: 'lead', l: 'Lead' }].map(o => (
                <button type="button" key={o.v} disabled={prepLoading} onClick={() => handleInterview(o.v)} style={{ display: 'block', width: '100%', padding: '10px 16px', border: 'none', background: 'none', textAlign: 'left', cursor: prepLoading ? 'wait' : 'pointer', fontSize: 14, color: '#333' }}>{o.l}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

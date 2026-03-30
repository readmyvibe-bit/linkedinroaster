'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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
}

// ─── Score Color Helper ───
function getScoreColor(score: number): string {
  if (score >= 80) return '#057642';
  if (score >= 60) return '#0A66C2';
  if (score >= 40) return '#E67E22';
  return '#CC1016';
}

// ─── Build Resume HTML for Print ───
function buildPrintHTML(data: any, tmpl: string = 'classic'): string {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);

  let experienceHTML = '';
  if (data.experience?.length) {
    experienceHTML = `
      <div class="section-header">WORK EXPERIENCE</div>
      ${data.experience.map((exp: any) => `
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <div style="font-size:12px;font-weight:700;color:#111827;">${exp.role || exp.title || ''}${exp.company ? ' — ' + exp.company : ''}</div>
            <div style="font-size:11px;font-style:italic;color:#666;white-space:nowrap;margin-left:12px;">${exp.dates || (exp.start_date ? exp.start_date + (exp.end_date ? ' - ' + exp.end_date : ' - Present') : '')}</div>
          </div>
          ${exp.location ? `<div style="font-size:11px;color:#888;">${exp.location}</div>` : ''}
          ${exp.bullets?.length ? `<div style="padding-left:16px;margin-top:4px;">${exp.bullets.map((b: any) => `<div style="font-size:11px;color:#374151;line-height:1.5;">• ${b}</div>`).join('')}</div>` : ''}
        </div>
      `).join('')}
    `;
  }

  let educationHTML = '';
  if (data.education?.length) {
    educationHTML = `
      <div class="section-header">EDUCATION</div>
      ${data.education.map((edu: any) => `
        <div style="margin-bottom:8px;">
          <div style="font-size:12px;font-weight:700;color:#111827;">${edu.degree || ''}${edu.institution || edu.school ? ' — ' + (edu.institution || edu.school) : ''}</div>
          <div style="font-size:11px;color:#666;">${[edu.field, edu.year || edu.dates].filter(Boolean).join(' • ')}</div>
        </div>
      `).join('')}
    `;
  }

  let skillsHTML = '';
  if (data.skills?.length) {
    skillsHTML = `
      <div class="section-header">SKILLS</div>
      <div style="font-size:11px;color:#374151;line-height:1.6;">
        ${Array.isArray(data.skills) && typeof data.skills[0] === 'string'
          ? (data.skills as string[]).join(', ')
          : (data.skills as any[]).map((s: any) => `<div><strong>${s.category || ''}:</strong> ${(s.skills || []).join(', ')}</div>`).join('')
        }
      </div>
    `;
  }

  let achievementsHTML = '';
  if (data.achievements?.length) {
    achievementsHTML = `
      <div class="section-header">ACHIEVEMENTS</div>
      <div style="padding-left:16px;">
        ${data.achievements.map((a: any) => `<div style="font-size:11px;color:#374151;line-height:1.5;">• ${a}</div>`).join('')}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title> </title>
<style>
  @page { margin: 20mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111827; ${tmpl === 'modern' ? 'border-left: 4px solid #0A66C2;' : ''} }
  .section-header {
    font-size: ${tmpl === 'minimal' ? '10px' : tmpl === 'modern' ? '12px' : '11px'};
    font-weight: 700;
    color: ${tmpl === 'modern' ? '#0A66C2' : tmpl === 'minimal' ? '#9CA3AF' : '#374151'};
    text-transform: uppercase;
    letter-spacing: ${tmpl === 'minimal' ? '4px' : '2px'};
    border-bottom: ${tmpl === 'modern' ? 'none' : tmpl === 'minimal' ? '0.5px solid #E5E7EB' : '1px solid #E5E7EB'};
    margin-top: ${tmpl === 'minimal' ? '28px' : '20px'}; margin-bottom: 8px; padding-bottom: 4px;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; }
    * { color: #000 !important; background: none !important; }
  }
  @page { margin: 20mm; }
  @page { @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }
</style>
</head>
<body style="padding:40px;">
  <div style="text-align:${tmpl === 'minimal' ? 'center' : 'left'};">
    <div style="font-size:${tmpl === 'minimal' ? '24' : '28'}px;font-weight:700;color:${tmpl === 'modern' ? '#0A66C2' : '#111827'};">${c.name || ''}</div>
    ${contactParts.length ? `<div style="font-size:11px;color:#555;margin-top:4px;text-align:${tmpl === 'minimal' ? 'center' : 'left'};">${contactParts.join(tmpl === 'modern' ? ' | ' : ' • ')}</div>` : ''}
  </div>
  <hr style="border:none;border-top:1px solid #D1D5DB;margin:12px 0;">
  ${data.summary ? `<div class="section-header">PROFESSIONAL SUMMARY</div><div style="font-size:11px;color:#374151;line-height:1.6;">${data.summary}</div>` : ''}
  ${experienceHTML}
  ${educationHTML}
  ${skillsHTML}
  ${achievementsHTML}
</body>
</html>`;
}

// ─── Main Page ───
export default function ResumePreviewPage() {
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resume, setResume] = useState<ResumeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showKeywords, setShowKeywords] = useState(false);

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
        setLoading(false);
      })
      .catch(() => {
        setError('Resume not found');
        setLoading(false);
      });
  }, [resumeId]);

  function handleDownloadPDF() {
    if (!resume) return;
    const html = buildPrintHTML(resume.resume_data, resume.template_id || 'classic');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    // Set empty title to prevent browser showing filename/URL in header
    win.document.title = ' ';
    setTimeout(() => {
      win.print();
      // Close the window after print dialog
      setTimeout(() => win.close(), 1000);
    }, 500);
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
  const contact = rd.contact || {};
  const matched = resume.keywords_matched?.length || 0;
  const missing = resume.keywords_missing?.length || 0;
  const total = matched + missing;
  const matchRate = total > 0 ? Math.round((matched / total) * 100) : 0;
  const scoreColor = getScoreColor(resume.ats_score);
  const contactParts = [contact.email, contact.phone, contact.location, contact.linkedin, contact.website].filter(Boolean);
  const templateId = resume.template_id || 'classic';

  // Template-specific styles
  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: templateId === 'minimal' ? 10 : templateId === 'modern' ? 12 : 11,
    fontWeight: 700,
    color: templateId === 'modern' ? '#0A66C2' : templateId === 'minimal' ? '#9CA3AF' : '#374151',
    textTransform: 'uppercase' as const,
    letterSpacing: templateId === 'minimal' ? 4 : 2,
    borderBottom: templateId === 'modern' ? 'none' : templateId === 'minimal' ? '0.5px solid #E5E7EB' : '1px solid #E5E7EB',
    marginTop: templateId === 'minimal' ? 28 : 20,
    marginBottom: 8,
    paddingBottom: 4,
  };

  const skillTagStyle: React.CSSProperties = templateId === 'modern' ? {
    display: 'inline-block', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 4,
    padding: '2px 8px', fontSize: 10, marginRight: 4, marginBottom: 4,
  } : {};

  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF' }}>
      {/* ─── TOP BAR ─── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#fff',
        borderBottom: '1px solid #E0E0E0', padding: '12px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#004182' }}>ProfileRoaster Resume</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '8px 18px', background: '#0A66C2', color: '#fff', border: 'none',
              borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Download PDF
          </button>
          <a
            href={`/resume/${resume.id}/edit`}
            style={{
              padding: '8px 18px', background: '#057642', color: '#fff', border: 'none',
              borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Edit Resume
          </a>
          <a
            href={`/results/${resume.order_id}`}
            style={{
              padding: '8px 18px', background: '#fff', color: '#666', border: '1px solid #999',
              borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Back to Results
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

        {/* ─── RESUME PREVIEW ─── */}
        <div style={{
          background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: 40, minHeight: 1123, borderRadius: 4,
          borderLeft: templateId === 'modern' ? '4px solid #0A66C2' : 'none',
        }}>
          {/* Header */}
          <div style={{ textAlign: templateId === 'minimal' ? 'center' : 'left' }}>
            <div style={{ fontSize: templateId === 'minimal' ? 24 : 28, fontWeight: 700, color: templateId === 'modern' ? '#0A66C2' : '#111827' }}>{contact.name || ''}</div>
            {contactParts.length > 0 && (
              <div style={{ fontSize: 11, color: '#555', marginTop: 4, textAlign: templateId === 'minimal' ? 'center' : 'left' }}>
                {contactParts.join(templateId === 'modern' ? ' | ' : ' \u2022 ')}
              </div>
            )}
          </div>

          {/* Divider */}
          <hr style={{ border: 'none', borderTop: templateId === 'minimal' ? '0.5px solid #E5E7EB' : '1px solid #D1D5DB', margin: '12px 0' }} />

          {/* Professional Summary */}
          {rd.summary && (
            <>
              <div style={sectionHeaderStyle}>PROFESSIONAL SUMMARY</div>
              <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>{rd.summary}</div>
            </>
          )}

          {/* Work Experience */}
          {(rd.experience?.length ?? 0) > 0 && (
            <>
              <div style={sectionHeaderStyle}>WORK EXPERIENCE</div>
              {rd.experience!.map((exp, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                      {exp.role || exp.title || ''}{exp.company ? ` \u2014 ${exp.company}` : ''}
                    </div>
                    <div style={{ fontSize: 11, fontStyle: 'italic', color: '#666', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      {(exp as any).dates || ((exp as any).start_date ? `${(exp as any).start_date}${(exp as any).end_date ? ' - ' + (exp as any).end_date : ' - Present'}` : '')}
                    </div>
                  </div>
                  {exp.location && <div style={{ fontSize: 11, color: '#888' }}>{exp.location}</div>}
                  {(exp.bullets?.length ?? 0) > 0 && (
                    <div style={{ paddingLeft: 16, marginTop: 4 }}>
                      {exp.bullets!.map((b, j) => (
                        <div key={j} style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{'\u2022'} {b}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Education */}
          {(rd.education?.length ?? 0) > 0 && (
            <>
              <div style={sectionHeaderStyle}>EDUCATION</div>
              {rd.education!.map((edu, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                    {edu.degree || ''}{(edu.institution || edu.school) ? ` \u2014 ${edu.institution || edu.school}` : ''}
                  </div>
                  {(edu.field || edu.year || edu.dates) && (
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {[edu.field, edu.year || edu.dates].filter(Boolean).join(' \u2022 ')}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Skills */}
          {(rd.skills?.length ?? 0) > 0 && (
            <>
              <div style={sectionHeaderStyle}>SKILLS</div>
              <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6, display: 'flex', flexWrap: 'wrap', gap: templateId === 'modern' ? 0 : undefined }}>
                {typeof rd.skills![0] === 'string'
                  ? templateId === 'modern'
                    ? (rd.skills! as string[]).map((sk, i) => <span key={i} style={skillTagStyle}>{sk}</span>)
                    : (rd.skills! as string[]).join(', ')
                  : (rd.skills! as SkillCategory[]).map((s, i) => (
                    templateId === 'modern'
                      ? <div key={i} style={{ width: '100%', marginBottom: 6 }}><strong style={{ fontSize: 11, color: '#0A66C2' }}>{s.category}:</strong> {(s.skills || []).map((sk, j) => <span key={j} style={skillTagStyle}>{sk}</span>)}</div>
                      : <div key={i}><strong>{s.category}:</strong> {(s.skills || []).join(', ')}</div>
                  ))
                }
              </div>
            </>
          )}

          {/* Achievements */}
          {(rd.achievements?.length ?? 0) > 0 && (
            <>
              <div style={sectionHeaderStyle}>ACHIEVEMENTS</div>
              <div style={{ paddingLeft: 16 }}>
                {rd.achievements!.map((a, i) => (
                  <div key={i} style={{ fontSize: 11, color: '#374151', lineHeight: 1.5 }}>{'\u2022'} {a}</div>
                ))}
              </div>
            </>
          )}
        </div>

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
        </div>
      </div>
    </div>
  );
}

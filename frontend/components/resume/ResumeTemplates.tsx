import React from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  location?: string;
  start_date?: string;
  end_date?: string;
  dates?: string;
  current?: boolean;
  bullets?: string[];
}

interface EducationEntry {
  institution?: string;
  school?: string;
  degree?: string;
  field?: string;
  year?: string;
  dates?: string;
  gpa?: string;
}

interface SkillCategory {
  category?: string;
  skills?: string[];
}

interface SkillsObject {
  technical?: string[];
  soft?: string[];
  languages?: string[];
  certifications?: string[];
}

type SkillsData = string[] | SkillsObject | SkillCategory[];

interface ResumeData {
  contact?: ContactInfo;
  summary?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: SkillsData;
  achievements?: string[];
}

interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
}

// ─── Template Definitions ────────────────────────────────────────────────────

export const TEMPLATES: (TemplateDefinition & { proOnly?: boolean })[] = [
  // Standard-accessible (12)
  { id: 'classic', name: 'Classic Professional', description: 'Traditional clean layout. Maximum ATS compatibility.', category: 'ATS-Friendly' },
  { id: 'modern', name: 'Modern Accent', description: 'Blue accent styling with skill tags. ATS safe.', category: 'ATS-Friendly' },
  { id: 'minimal', name: 'Minimalist', description: 'Ultra clean with maximum whitespace.', category: 'ATS-Friendly' },
  { id: 'compact', name: 'Compact Dense', description: 'Maximum content in minimum space. Perfect for 1-page.', category: 'ATS-Friendly' },
  { id: 'technical', name: 'Technical Developer', description: 'Code-inspired design for engineering roles.', category: 'ATS-Friendly' },
  { id: 'bold', name: 'Bold Statement', description: 'High impact with strong visual hierarchy.', category: 'Professional' },
  { id: 'elegant', name: 'Elegant Refined', description: 'Sophisticated design for consulting and finance.', category: 'Professional' },
  { id: 'executive', name: 'Executive Premium', description: 'Refined formal layout for senior professionals.', category: 'Professional' },
  { id: 'monochrome', name: 'Monochrome Prestige', description: 'Pure black and white luxury typography.', category: 'Premium' },
  { id: 'serif', name: 'Professional Serif', description: 'Classic serif typography for consulting and finance.', category: 'Premium' },
  { id: 'headline', name: 'Headline Impact', description: 'Large summary section. Perfect for sales and CS roles.', category: 'Premium' },
  { id: 'divider', name: 'Modern Divider', description: 'Elegant dividers between sections. Minimalist rhythm.', category: 'Premium' },
  // Pro-only (8)
  { id: 'crimson', name: 'Crimson Authority', description: 'Deep red accents. Commanding leadership presence.', category: 'Premium', proOnly: true },
  { id: 'ocean', name: 'Ocean Professional', description: 'Teal accents. Calm and trustworthy.', category: 'Premium', proOnly: true },
  { id: 'slategold', name: 'Slate & Gold', description: 'Dark slate with gold accents. Luxury corporate.', category: 'Premium', proOnly: true },
  { id: 'indigo', name: 'Indigo Modern', description: 'Purple accents for tech and startup roles.', category: 'Premium', proOnly: true },
  { id: 'sidebar', name: 'Modern Sidebar', description: 'Dark sidebar with clean main content area.', category: 'Visual', proOnly: true },
  { id: 'splitmodern', name: 'Split Modern', description: 'Light sidebar with skills and education.', category: 'Visual', proOnly: true },
  { id: 'highlight', name: 'Highlight Sections', description: 'Full-width header with highlighted side panel.', category: 'Visual', proOnly: true },
  { id: 'corporate', name: 'Corporate Formal', description: 'Navy header with structured sidebar layout.', category: 'Visual', proOnly: true },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getExpTitle(exp: ExperienceEntry): string {
  return exp.role || exp.title || '';
}

function getExpDates(exp: ExperienceEntry): string {
  if (exp.dates) return exp.dates;
  const start = exp.start_date || '';
  const end = exp.current ? 'Present' : (exp.end_date || '');
  if (start && end) return `${start} – ${end}`;
  return start || end;
}

function getEduSchool(edu: EducationEntry): string {
  return edu.institution || edu.school || '';
}

function getEduDates(edu: EducationEntry): string {
  return edu.dates || edu.year || '';
}

function getEduDegree(edu: EducationEntry): string {
  const d = edu.degree || '';
  const f = edu.field || '';
  if (d && f) return `${d} in ${f}`;
  return d || f;
}

function isSkillsObject(s: SkillsData): s is SkillsObject {
  if (Array.isArray(s)) return false;
  return typeof s === 'object' && s !== null && ('technical' in s || 'soft' in s || 'languages' in s || 'certifications' in s);
}

function isSkillCategoryArray(s: SkillsData): s is SkillCategory[] {
  if (!Array.isArray(s) || s.length === 0) return false;
  return typeof s[0] === 'object' && s[0] !== null && 'category' in s[0];
}

function normalizeSkills(skills?: SkillsData): { label: string; items: string[] }[] {
  if (!skills) return [];
  if (Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'string') {
    return [{ label: 'Skills', items: skills as string[] }];
  }
  if (isSkillsObject(skills)) {
    const groups: { label: string; items: string[] }[] = [];
    if (skills.technical?.length) groups.push({ label: 'Technical Skills', items: skills.technical });
    if (skills.soft?.length) groups.push({ label: 'Soft Skills', items: skills.soft });
    if (skills.languages?.length) groups.push({ label: 'Languages', items: skills.languages });
    if (skills.certifications?.length) groups.push({ label: 'Certifications', items: skills.certifications });
    return groups;
  }
  if (isSkillCategoryArray(skills)) {
    return skills.filter(c => c.category && c.skills?.length).map(c => ({ label: c.category!, items: c.skills! }));
  }
  return [];
}

function flattenSkills(skills?: SkillsData): string[] {
  const groups = normalizeSkills(skills);
  const all: string[] = [];
  groups.forEach(g => all.push(...g.items));
  return all;
}

// ═══════════════════════════════════════════════════════════════════════════════
// JSX RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Classic Professional ────────────────────────────────────────────────

function renderClassic(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#374151', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#111', textAlign: 'left' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      <div style={{ borderBottom: '1px solid #D1D5DB', marginBottom: '14px' }} />
      {data.summary && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#374151', borderBottom: '1px solid #D1D5DB', paddingBottom: '2px', marginBottom: '6px' }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#374151', borderBottom: '1px solid #D1D5DB', paddingBottom: '2px', marginBottom: '6px' }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#374151', borderBottom: '1px solid #D1D5DB', paddingBottom: '2px', marginBottom: '6px' }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#374151', borderBottom: '1px solid #D1D5DB', paddingBottom: '2px', marginBottom: '6px' }}>Skills</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#374151', borderBottom: '1px solid #D1D5DB', paddingBottom: '2px', marginBottom: '6px' }}>Achievements</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 2. Modern Accent ───────────────────────────────────────────────────────

function renderModern(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const allSkills = flattenSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#374151', padding: '40px', paddingLeft: '44px', maxWidth: '800px', borderLeft: '4px solid #0A66C2' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#0A66C2' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.map((p, i) => <span key={i}>{i > 0 && <span style={{ color: '#0A66C2', margin: '0 6px' }}>|</span>}{p}</span>)}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A66C2', marginBottom: '6px' }}>SUMMARY</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A66C2', marginBottom: '6px' }}>EXPERIENCE</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A66C2', marginBottom: '6px' }}>EDUCATION</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {allSkills.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A66C2', marginBottom: '8px' }}>SKILLS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {allSkills.map((s, i) => (
              <span key={i} style={{ background: '#EFF6FF', color: '#1D4ED8', borderRadius: '4px', padding: '2px 8px', fontSize: '10px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#0A66C2', marginBottom: '6px' }}>ACHIEVEMENTS</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 3. Minimalist ──────────────────────────────────────────────────────────

function renderMinimal(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr: React.CSSProperties = { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#9CA3AF', letterSpacing: '4px', marginBottom: '10px' };
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '11px', lineHeight: 1.6, color: '#374151', padding: '40px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      <div style={{ borderBottom: '0.5px solid #E5E7EB', marginBottom: '32px' }} />
      {data.summary && (
        <div style={{ marginBottom: '32px' }}>
          <div style={hdr}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={hdr}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#888' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '16px', textIndent: '-16px', marginBottom: '3px' }}>— {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={hdr}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#888' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={hdr}>Skills</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={hdr}>Achievements</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '16px', textIndent: '-16px', marginBottom: '3px' }}>— {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 4. Executive Premium ───────────────────────────────────────────────────

function renderExecutive(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr: React.CSSProperties = { fontSize: '13px', fontVariant: 'small-caps', color: '#374151', borderBottom: '3px double #D1D5DB', paddingBottom: '4px', marginBottom: '10px', letterSpacing: '1px' };
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '12px', lineHeight: 1.6, color: '#374151', padding: '48px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '30px', fontWeight: 700, color: '#111827' }}>{c.name || 'Your Name'}</div>
        <div style={{ width: '60px', height: '2px', background: '#D4A574', margin: '8px auto' }} />
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '6px' }}>{contactParts.join('   |   ')}</div>
        )}
      </div>
      <div style={{ height: '20px' }} />
      {data.summary && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Professional Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Professional Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111827' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '3px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Skills &amp; Competencies</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '11px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Key Achievements</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '3px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 5. Compact Dense ───────────────────────────────────────────────────────

function renderCompact(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const allSkills = flattenSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10px', lineHeight: 1.4, color: '#333', padding: '24px 32px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: '6px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '9px', color: '#666', textAlign: 'right' }}>{contactParts.join(' | ')}</div>
        )}
      </div>
      <div style={{ borderBottom: '0.5px solid #D1D5DB', marginBottom: '6px' }} />
      {data.summary && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#555', borderBottom: '0.5px solid #E5E7EB', paddingBottom: '1px', marginBottom: '3px' }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#555', borderBottom: '0.5px solid #E5E7EB', paddingBottom: '1px', marginBottom: '3px' }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span><span style={{ fontWeight: 700 }}>{getExpTitle(exp)}</span>{exp.company ? `, ${exp.company}` : ''}{exp.location ? ` — ${exp.location}` : ''}</span>
                <span style={{ fontSize: '9px', color: '#888', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '2px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '10px', textIndent: '-10px', marginBottom: '1px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#555', borderBottom: '0.5px solid #E5E7EB', paddingBottom: '1px', marginBottom: '3px' }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span><span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span> — {getEduSchool(edu)}{edu.gpa ? ` (GPA: ${edu.gpa})` : ''}</span>
              <span style={{ fontSize: '9px', color: '#888', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
            </div>
          ))}
        </div>
      )}
      {allSkills.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#555', borderBottom: '0.5px solid #E5E7EB', paddingBottom: '1px', marginBottom: '3px' }}>Skills</div>
          <div>{allSkills.join(', ')}</div>
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#555', borderBottom: '0.5px solid #E5E7EB', paddingBottom: '1px', marginBottom: '3px' }}>Achievements</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '10px', textIndent: '-10px', marginBottom: '1px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 6. Bold Statement ──────────────────────────────────────────────────────

function renderBold(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr: React.CSSProperties = { fontSize: '14px', fontWeight: 700, color: '#057642', borderLeft: '4px solid #057642', paddingLeft: '12px', marginBottom: '8px' };
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#333', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '6px' }}>
        <div style={{ fontSize: '34px', fontWeight: 800, color: '#111' }}>{c.name || 'Your Name'}</div>
        <div style={{ width: '100%', height: '4px', background: '#057642', marginTop: '6px', marginBottom: '8px' }} />
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#666' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      <div style={{ height: '16px' }} />
      {data.summary && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>SUMMARY</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>EXPERIENCE</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111', fontSize: '12px' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#111' }}>{exp.company}{exp.location ? ` — ${exp.location}` : ''}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>EDUCATION</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>SKILLS</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>ACHIEVEMENTS</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 7. Elegant Refined ─────────────────────────────────────────────────────

function renderElegant(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr: React.CSSProperties = { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#666', letterSpacing: '3px', background: '#F8F9FA', padding: '6px 12px', borderRadius: '4px', marginBottom: '10px' };
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '11px', lineHeight: 1.6, color: '#444', padding: '40px', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div style={{ fontSize: '24px', fontWeight: 400, color: '#111', letterSpacing: '2px' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#888', marginTop: '8px' }}>
            {contactParts.map((p, i) => <span key={i}>{i > 0 && <span style={{ margin: '0 8px', color: '#CCC' }}>{'\u25C6'}</span>}{p}</span>)}
          </div>
        )}
      </div>
      <div style={{ borderBottom: '0.5px solid #E5E7EB', marginBottom: '20px' }} />
      {data.summary && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#222' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#777', fontStyle: 'italic', fontSize: '10px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#777' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Skills</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={hdr}>Achievements</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 8. Technical Developer ─────────────────────────────────────────────────

function renderTechnical(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr: React.CSSProperties = { fontSize: '12px', fontWeight: 700, color: '#0A66C2', fontFamily: '"Courier New", Courier, monospace', marginBottom: '8px' };
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#333', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#666', fontFamily: '"Courier New", Courier, monospace', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      <div style={{ borderBottom: '1px solid #E5E7EB', marginBottom: '16px' }} />
      {data.summary && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>{'// SUMMARY'}</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>{'// EXPERIENCE'}</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#888', fontFamily: '"Courier New", Courier, monospace' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}>&gt; {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>{'// EDUCATION'}</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#888', fontFamily: '"Courier New", Courier, monospace' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>{'// SKILLS'}</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px', fontFamily: '"Courier New", Courier, monospace', fontSize: '10px' }}>
              <span style={{ color: '#666' }}>{g.label}: </span>
              <span style={{ color: '#111' }}>{'{ '}{g.items.join(', ')}{' }'}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={hdr}>{'// ACHIEVEMENTS'}</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}>&gt; {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 9. Modern Sidebar ──────────────────────────────────────────────────────

function renderSidebar(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [
    c.email && { label: 'Email', value: c.email },
    c.phone && { label: 'Phone', value: c.phone },
    c.location && { label: 'Location', value: c.location },
    c.linkedin && { label: 'LinkedIn', value: c.linkedin },
    c.website && { label: 'Website', value: c.website },
  ].filter(Boolean) as { label: string; value: string }[];
  const skillGroups = normalizeSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, display: 'flex', maxWidth: '800px' }}>
      {/* Sidebar */}
      <div style={{ width: '30%', background: '#1E293B', color: '#fff', padding: '32px 20px', minHeight: '600px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{c.name || 'Your Name'}</div>
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', margin: '12px 0' }} />
        {contactParts.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Contact</div>
            {contactParts.map((p, i) => (
              <div key={i} style={{ marginBottom: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}>{p.value}</div>
            ))}
          </div>
        )}
        {skillGroups.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Skills</div>
            {skillGroups.map((g, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                {skillGroups.length > 1 && <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{g.label}</div>}
                {g.items.map((s, j) => (
                  <div key={j} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.85)', marginBottom: '2px' }}>• {s}</div>
                ))}
              </div>
            ))}
          </div>
        )}
        {data.education && data.education.length > 0 && (
          <div>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Education</div>
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '10px', color: '#fff' }}>{getEduDegree(edu)}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{getEduSchool(edu)}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)' }}>{getEduDates(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Main content */}
      <div style={{ width: '70%', padding: '32px 28px', color: '#333' }}>
        {data.summary && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#1E293B', borderBottom: '2px solid #1E293B', paddingBottom: '3px', marginBottom: '8px' }}>Summary</div>
            <div>{data.summary}</div>
          </div>
        )}
        {data.experience && data.experience.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#1E293B', borderBottom: '2px solid #1E293B', paddingBottom: '3px', marginBottom: '8px' }}>Experience</div>
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                  <span style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
                </div>
                <div style={{ color: '#555', fontStyle: 'italic', fontSize: '10px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {data.achievements && data.achievements.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#1E293B', borderBottom: '2px solid #1E293B', paddingBottom: '3px', marginBottom: '8px' }}>Achievements</div>
            {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 10. Split Modern ───────────────────────────────────────────────────────

function renderSplitModern(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, maxWidth: '800px' }}>
      {/* Name spanning full width */}
      <div style={{ padding: '28px 28px 16px', borderBottom: '2px solid #E2E8F0' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>{c.name || 'Your Name'}</div>
      </div>
      <div style={{ display: 'flex' }}>
        {/* Left panel */}
        <div style={{ width: '35%', background: '#F1F5F9', padding: '24px 20px', minHeight: '500px' }}>
          {contactParts.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '1px', marginBottom: '8px' }}>Contact</div>
              {contactParts.map((p, i) => (
                <div key={i} style={{ fontSize: '10px', color: '#475569', marginBottom: '4px', wordBreak: 'break-all' }}>{p}</div>
              ))}
            </div>
          )}
          {skillGroups.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '1px', marginBottom: '8px' }}>Skills</div>
              {skillGroups.map((g, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  {skillGroups.length > 1 && <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 700, marginBottom: '4px' }}>{g.label}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {g.items.map((s, j) => (
                      <span key={j} style={{ background: '#E2E8F0', color: '#334155', borderRadius: '3px', padding: '2px 6px', fontSize: '9px' }}>{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '1px', marginBottom: '8px' }}>Education</div>
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '10px', color: '#1E293B' }}>{getEduDegree(edu)}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>{getEduSchool(edu)}</div>
                  <div style={{ fontSize: '9px', color: '#94A3B8' }}>{getEduDates(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right panel */}
        <div style={{ width: '65%', padding: '24px 28px', color: '#333' }}>
          {data.summary && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px', marginBottom: '8px' }}>Summary</div>
              <div>{data.summary}</div>
            </div>
          )}
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px', marginBottom: '8px' }}>Experience</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                    <span style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
                  </div>
                  <div style={{ color: '#64748B', fontStyle: 'italic', fontSize: '10px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {data.achievements && data.achievements.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', borderBottom: '1px solid #E2E8F0', paddingBottom: '3px', marginBottom: '8px' }}>Achievements</div>
              {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 11. Highlight Sections ─────────────────────────────────────────────────

function renderHighlight(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, maxWidth: '800px' }}>
      {/* Full-width header */}
      <div style={{ background: '#004182', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '60px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {/* Two-column body */}
      <div style={{ display: 'flex' }}>
        {/* Left main */}
        <div style={{ width: '65%', padding: '24px 24px 24px 28px', color: '#333' }}>
          {data.summary && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#004182', borderBottom: '2px solid #004182', paddingBottom: '3px', marginBottom: '8px' }}>Summary</div>
              <div>{data.summary}</div>
            </div>
          )}
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#004182', borderBottom: '2px solid #004182', paddingBottom: '3px', marginBottom: '8px' }}>Experience</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                    <span style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
                  </div>
                  <div style={{ color: '#555', fontStyle: 'italic', fontSize: '10px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right panel */}
        <div style={{ width: '35%', background: '#F0F7FF', padding: '24px 20px', minHeight: '400px' }}>
          {skillGroups.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#004182', borderBottom: '2px solid #004182', paddingBottom: '3px', marginBottom: '8px' }}>Skills</div>
              {skillGroups.map((g, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  {skillGroups.length > 1 && <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', marginBottom: '2px' }}>{g.label}</div>}
                  {g.items.map((s, j) => (
                    <div key={j} style={{ fontSize: '10px', color: '#333', marginBottom: '2px' }}>• {s}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#004182', borderBottom: '2px solid #004182', paddingBottom: '3px', marginBottom: '8px' }}>Education</div>
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '10px', color: '#111' }}>{getEduDegree(edu)}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{getEduSchool(edu)}</div>
                  <div style={{ fontSize: '9px', color: '#888' }}>{getEduDates(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </div>
          )}
          {data.achievements && data.achievements.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#004182', borderBottom: '2px solid #004182', paddingBottom: '3px', marginBottom: '8px' }}>Achievements</div>
              {data.achievements.map((a, i) => <div key={i} style={{ fontSize: '10px', paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 12. Corporate Formal ───────────────────────────────────────────────────

function renderCorporate(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, maxWidth: '800px' }}>
      {/* Top header band */}
      <div style={{ background: '#0F172A', padding: '20px 28px', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>{contactParts.join('   |   ')}</div>
        )}
      </div>
      {/* Two-column body */}
      <div style={{ display: 'flex' }}>
        {/* Left sidebar */}
        <div style={{ width: '28%', background: '#F8FAFC', padding: '24px 18px', minHeight: '500px', borderRight: '1px solid #E2E8F0' }}>
          {skillGroups.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', letterSpacing: '1px', borderBottom: '1px solid #CBD5E1', paddingBottom: '3px', marginBottom: '8px' }}>Skills</div>
              {skillGroups.map((g, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  {skillGroups.length > 1 && <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>{g.label}</div>}
                  {g.items.map((s, j) => (
                    <div key={j} style={{ fontSize: '10px', color: '#475569', marginBottom: '2px' }}>• {s}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', letterSpacing: '1px', borderBottom: '1px solid #CBD5E1', paddingBottom: '3px', marginBottom: '8px' }}>Education</div>
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  <div style={{ fontWeight: 700, fontSize: '10px', color: '#1E293B' }}>{getEduDegree(edu)}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>{getEduSchool(edu)}</div>
                  <div style={{ fontSize: '9px', color: '#94A3B8' }}>{getEduDates(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right main */}
        <div style={{ width: '72%', padding: '24px 28px', color: '#333' }}>
          {data.summary && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '3px', marginBottom: '8px' }}>Summary</div>
              <div>{data.summary}</div>
            </div>
          )}
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '3px', marginBottom: '8px' }}>Experience</div>
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                    <span style={{ fontSize: '10px', color: '#888', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
                  </div>
                  <div style={{ color: '#64748B', fontStyle: 'italic', fontSize: '10px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {data.achievements && data.achievements.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#0F172A', borderBottom: '1px solid #CBD5E1', paddingBottom: '3px', marginBottom: '8px' }}>Achievements</div>
              {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 13. Monochrome Prestige ───────────────────────────────────────────────

function renderMonochrome(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#333', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '30px', fontWeight: 700, color: '#000', letterSpacing: '1px' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#999', marginTop: '6px', letterSpacing: '0.5px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#000', textTransform: 'uppercase' as const, letterSpacing: '3px', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#000', textTransform: 'uppercase' as const, letterSpacing: '3px', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#000' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#666', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#000', textTransform: 'uppercase' as const, letterSpacing: '3px', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#000' }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#666' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#000', textTransform: 'uppercase' as const, letterSpacing: '3px', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>Skills</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#000', textTransform: 'uppercase' as const, letterSpacing: '3px', borderBottom: '2px solid #000', paddingBottom: '4px', marginBottom: '8px' }}>Achievements</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 14. Professional Serif ────────────────────────────────────────────────

function renderSerif(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '11.5px', lineHeight: 1.7, color: '#333', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a1a' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '6px' }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '6px' }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}>– {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '6px' }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '6px' }}>Skills</div>
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#333', borderBottom: '1px solid #ccc', paddingBottom: '2px', marginBottom: '6px' }}>Achievements</div>
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}>– {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 15. Headline Impact ───────────────────────────────────────────────────

function renderHeadline(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const sectionHdr = (t: string) => (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#374151', borderBottom: '1px solid #D1D5DB', paddingBottom: '2px', marginBottom: '6px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#374151', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '18px', background: '#F8FAFC', borderLeft: '4px solid #0A66C2', padding: '16px' }}>
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#374151' }}>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Skills')}
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Achievements')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 16. Modern Divider ────────────────────────────────────────────────────

function renderDivider(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const divider = (
    <div style={{ textAlign: 'center' as const, margin: '18px 0' }}>
      <span style={{ display: 'inline-block', width: '24px', height: '2px', background: '#D1D5DB', verticalAlign: 'middle' }} />
      <span style={{ display: 'inline-block', margin: '0 6px', color: '#D1D5DB', fontSize: '8px', verticalAlign: 'middle' }}>◆</span>
      <span style={{ display: 'inline-block', width: '24px', height: '2px', background: '#D1D5DB', verticalAlign: 'middle' }} />
    </div>
  );
  const sectionHdr = (t: string) => (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase' as const, marginBottom: '6px' }}>{t}</div>
  );
  const sections: React.ReactNode[] = [];
  if (data.summary) {
    sections.push(
      <div key="summary">
        {sectionHdr('Summary')}
        <div>{data.summary}</div>
      </div>
    );
  }
  if (data.experience && data.experience.length > 0) {
    sections.push(
      <div key="experience">
        {sectionHdr('Experience')}
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
              <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
            </div>
            <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
            {exp.bullets && exp.bullets.length > 0 && (
              <div style={{ marginTop: '4px' }}>
                {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  if (data.education && data.education.length > 0) {
    sections.push(
      <div key="education">
        {sectionHdr('Education')}
        {data.education.map((edu, i) => (
          <div key={i} style={{ marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
              <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
            </div>
            <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
          </div>
        ))}
      </div>
    );
  }
  if (skillGroups.length > 0) {
    sections.push(
      <div key="skills">
        {sectionHdr('Skills')}
        {skillGroups.map((g, i) => (
          <div key={i} style={{ marginBottom: '4px' }}>
            {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
            <span>{g.items.join(', ')}</span>
          </div>
        ))}
      </div>
    );
  }
  if (data.achievements && data.achievements.length > 0) {
    sections.push(
      <div key="achievements">
        {sectionHdr('Achievements')}
        {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
      </div>
    );
  }
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#374151', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {sections.map((s, i) => (
        <React.Fragment key={i}>
          {divider}
          {s}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── 17. Crimson Authority ─────────────────────────────────────────────────

function renderCrimson(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const allSkills = flattenSkills(data.skills);
  const sectionHdr = (t: string) => (
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' as const, borderBottom: '2px solid #991B1B', paddingBottom: '3px', marginBottom: '8px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#374151', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#991B1B' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Summary')}
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {allSkills.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Skills')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {allSkills.map((s, i) => (
              <span key={i} style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: '4px', padding: '2px 8px', fontSize: '10px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Achievements')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 18. Ocean Professional ────────────────────────────────────────────────

function renderOcean(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const allSkills = flattenSkills(data.skills);
  const sectionHdr = (t: string) => (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0D9488', textTransform: 'uppercase' as const, borderBottom: '1px solid #0D9488', paddingBottom: '2px', marginBottom: '6px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#374151', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#0D9488' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join(' \u00A0\u2022\u00A0 ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Summary')}
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}><span style={{ color: '#0D9488' }}>●</span> {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {allSkills.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Skills')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {allSkills.map((s, i) => (
              <span key={i} style={{ background: '#F0FDFA', color: '#0D9488', borderRadius: '4px', padding: '2px 8px', fontSize: '10px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Achievements')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}><span style={{ color: '#0D9488' }}>●</span> {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 19. Slate & Gold ──────────────────────────────────────────────────────

function renderSlateGold(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const sectionHdr = (t: string) => (
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' as const, borderBottom: '1px solid #B8860B', paddingBottom: '3px', marginBottom: '8px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#475569', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#334155' }}>{c.name || 'Your Name'}</div>
        <div style={{ width: '80px', height: '2px', background: '#B8860B', marginTop: '6px' }} />
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#64748B', marginTop: '6px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Summary')}
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#64748B', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#64748B', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#64748B', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#64748B' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Skills')}
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {sectionHdr('Achievements')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── 20. Indigo Modern ─────────────────────────────────────────────────────

function renderIndigo(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const allSkills = flattenSkills(data.skills);
  const sectionHdr = (t: string) => (
    <div style={{ fontSize: '11px', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' as const, marginBottom: '6px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#374151', padding: '40px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: '#4F46E5' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
            {contactParts.map((p, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: '#4F46E5', margin: '0 6px' }}>|</span>}
                <span>{p}</span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Summary')}
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {allSkills.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Skills')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {allSkills.map((s, i) => (
              <span key={i} style={{ background: '#EEF2FF', color: '#4F46E5', borderRadius: '4px', padding: '2px 8px', fontSize: '10px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHdr('Achievements')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER: renderResumeHTML
// ═══════════════════════════════════════════════════════════════════════════════

export function renderResumeHTML(data: ResumeData, templateId: string): React.ReactNode {
  switch (templateId) {
    case 'modern': return renderModern(data);
    case 'minimal': return renderMinimal(data);
    case 'executive': return renderExecutive(data);
    case 'compact': return renderCompact(data);
    case 'bold': return renderBold(data);
    case 'elegant': return renderElegant(data);
    case 'technical': return renderTechnical(data);
    case 'sidebar': return renderSidebar(data);
    case 'splitmodern': return renderSplitModern(data);
    case 'highlight': return renderHighlight(data);
    case 'corporate': return renderCorporate(data);
    case 'monochrome': return renderMonochrome(data);
    case 'serif': return renderSerif(data);
    case 'headline': return renderHeadline(data);
    case 'divider': return renderDivider(data);
    case 'crimson': return renderCrimson(data);
    case 'ocean': return renderOcean(data);
    case 'slategold': return renderSlateGold(data);
    case 'indigo': return renderIndigo(data);
    case 'classic':
    default: return renderClassic(data);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT HTML BUILDERS
// ═══════════════════════════════════════════════════════════════════════════════

function esc(s?: string): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function printPageWrapper(body: string, pageCount?: number): string {
  const onePage = pageCount === 1;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title> </title><style>
@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:210mm;height:297mm;margin:0;padding:0;overflow:${onePage ? 'hidden' : 'visible'}}
body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
.resume-wrapper{width:210mm;min-height:297mm;position:relative;overflow:${onePage ? 'hidden' : 'visible'}}
.two-col{display:flex;width:100%;min-height:297mm}
.two-col-left{flex-shrink:0}
.two-col-right{flex:1}
.sidebar-bg{position:absolute;top:0;bottom:0;left:0;min-height:297mm}
@media print{
  html,body{width:210mm;height:297mm;margin:0;padding:0;overflow:${onePage ? 'hidden' : 'visible'}}
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  .resume-wrapper{width:100%;min-height:297mm}
  .two-col{min-height:297mm}
  .sidebar-bg{min-height:297mm}
  .entry{page-break-inside:avoid;orphans:3;widows:3}
  p,div{orphans:3;widows:3}
  .page-top-margin{margin-top:20mm}
}
</style></head><body style="-webkit-print-color-adjust:exact;print-color-adjust:exact">${body}</body></html>`;
}

// Helper: build experience HTML for single-column templates
function buildExpHTML(data: ResumeData, bullet: string, dateStyle: string, companyStyle: string, titleStyle: string): string {
  if (!data.experience?.length) return '';
  return data.experience.map(exp => {
    const title = esc(getExpTitle(exp));
    const dates = esc(getExpDates(exp));
    const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
    const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">${bullet} ${esc(b)}</div>`).join('');
    return `<div style="margin-bottom:${bullet === '&gt;' ? '12' : '10'}px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleStyle}">${title}</span><span style="${dateStyle}">${dates}</span></div><div style="${companyStyle}">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
  }).join('');
}

function buildEduHTML(data: ResumeData, dateStyle: string): string {
  if (!data.education?.length) return '';
  return data.education.map(edu => {
    const deg = esc(getEduDegree(edu));
    const school = esc(getEduSchool(edu));
    const dates = esc(getEduDates(edu));
    const gpa = edu.gpa ? ` &mdash; GPA: ${esc(edu.gpa)}` : '';
    return `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="font-weight:700">${deg}</span><span style="${dateStyle}">${dates}</span></div><div style="color:#555">${school}${gpa}</div></div>`;
  }).join('');
}

function buildSkillsGroupedHTML(data: ResumeData): string {
  const groups = normalizeSkills(data.skills);
  if (!groups.length) return '';
  return groups.map(g => {
    const label = groups.length > 1 ? `<span style="font-weight:700;font-size:10px">${esc(g.label)}: </span>` : '';
    return `<div style="margin-bottom:4px">${label}<span>${g.items.map(esc).join(', ')}</span></div>`;
  }).join('');
}

function buildAchievementsHTML(data: ResumeData, bullet: string): string {
  if (!data.achievements?.length) return '';
  return data.achievements.map(a => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">${bullet} ${esc(a)}</div>`).join('');
}

// ─── Print: Classic ─────────────────────────────────────────────────────────

function printClassic(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#374151;border-bottom:1px solid #D1D5DB;padding-bottom:2px;margin-bottom:6px">${t}</div>`;
  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:12px"><div style="font-size:26px;font-weight:700;color:#111;text-align:left">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div><div style="border-bottom:1px solid #D1D5DB;margin-bottom:14px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:14px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:14px">${hdr('Experience')}${buildExpHTML(data, '&bull;', dateS, 'color:#555;font-style:italic', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:14px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:14px">${hdr('Skills')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:14px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Modern ──────────────────────────────────────────────────────────

function printModern(data: ResumeData): string {
  const c = data.contact || {};
  const cpArr = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const cp = cpArr.map(esc).join(' <span style="color:#0A66C2;margin:0 6px">|</span> ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:12px;font-weight:700;color:#0A66C2;margin-bottom:6px">${t}</div>`;
  const allSkills = flattenSkills(data.skills);
  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px 40px 40px 44px;max-width:100%;border-left:4px solid #0A66C2">`;
  h += `<div style="margin-bottom:16px"><div style="font-size:28px;font-weight:700;color:#0A66C2">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:24px">${hdr('SUMMARY')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:24px">${hdr('EXPERIENCE')}${buildExpHTML(data, '&bull;', dateS, 'color:#555;font-style:italic', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:24px">${hdr('EDUCATION')}${buildEduHTML(data, dateS)}</div>`;
  if (allSkills.length) {
    const tags = allSkills.map(s => `<span style="background:#EFF6FF;color:#1D4ED8;border-radius:4px;padding:2px 8px;font-size:10px;display:inline-block;margin:2px">${esc(s)}</span>`).join('');
    h += `<div style="margin-bottom:24px">${hdr('SKILLS')}<div style="display:flex;flex-wrap:wrap;gap:6px">${tags}</div></div>`;
  }
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:24px">${hdr('ACHIEVEMENTS')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Minimal ─────────────────────────────────────────────────────────

function printMinimal(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#999;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#9CA3AF;letter-spacing:4px;margin-bottom:10px">${t}</div>`;
  let h = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.6;color:#374151;padding:40px;max-width:100%">`;
  h += `<div style="text-align:center;margin-bottom:24px"><div style="font-size:22px;font-weight:700;color:#111">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#888;margin-top:6px">${cp}</div>`;
  h += `</div><div style="border-bottom:0.5px solid #E5E7EB;margin-bottom:32px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:32px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:32px">${hdr('Experience')}${buildExpHTML(data, '&mdash;', dateS, 'color:#888', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:32px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:32px">${hdr('Skills')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&mdash;');
  if (ach) h += `<div style="margin-bottom:32px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Executive ───────────────────────────────────────────────────────

function printExecutive(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('   |   ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111827';
  const hdr = (t: string) => `<div style="font-size:13px;font-variant:small-caps;color:#374151;border-bottom:3px double #D1D5DB;padding-bottom:4px;margin-bottom:10px;letter-spacing:1px">${t}</div>`;
  let h = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.6;color:#374151;padding:48px;max-width:100%">`;
  h += `<div style="text-align:center;margin-bottom:10px"><div style="font-size:30px;font-weight:700;color:#111827">${esc(c.name) || 'Your Name'}</div><div style="width:60px;height:2px;background:#D4A574;margin:8px auto"></div>`;
  if (cp) h += `<div style="font-size:10px;color:#666;margin-top:6px">${cp}</div>`;
  h += `</div><div style="height:20px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:20px">${hdr('Professional Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:20px">${hdr('Professional Experience')}${buildExpHTML(data, '&bull;', dateS, 'color:#555;font-style:italic', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:20px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:20px">${hdr('Skills &amp; Competencies')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:20px">${hdr('Key Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Compact ─────────────────────────────────────────────────────────

function printCompact(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join(' | ');
  const allSkills = flattenSkills(data.skills);
  const hdr = (t: string) => `<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#555;border-bottom:0.5px solid #E5E7EB;padding-bottom:1px;margin-bottom:3px">${t}</div>`;
  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.4;color:#333;padding:24px 32px;max-width:100%">`;
  h += `<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;margin-bottom:6px"><div style="font-size:20px;font-weight:700;color:#111">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:9px;color:#666;text-align:right">${cp}</div>`;
  h += `</div><div style="border-bottom:0.5px solid #D1D5DB;margin-bottom:6px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:6px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:6px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = exp.company ? `, ${esc(exp.company)}` : '';
      const loc = exp.location ? ` &mdash; ${esc(exp.location)}` : '';
      h += `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span><span style="font-weight:700">${title}</span>${company}${loc}</span><span style="font-size:9px;color:#888;font-style:italic">${dates}</span></div>`;
      if (exp.bullets?.length) {
        h += `<div style="margin-top:2px">`;
        exp.bullets.forEach(b => { h += `<div style="padding-left:10px;text-indent:-10px;margin-bottom:1px">&bull; ${esc(b)}</div>`; });
        h += `</div>`;
      }
      h += `</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) {
    h += `<div style="margin-bottom:6px">${hdr('Education')}`;
    data.education.forEach(edu => {
      const deg = esc(getEduDegree(edu));
      const school = esc(getEduSchool(edu));
      const dates = esc(getEduDates(edu));
      const gpa = edu.gpa ? ` (GPA: ${esc(edu.gpa)})` : '';
      h += `<div style="margin-bottom:4px;display:flex;justify-content:space-between;flex-wrap:wrap"><span><span style="font-weight:700">${deg}</span> &mdash; ${school}${gpa}</span><span style="font-size:9px;color:#888;font-style:italic">${dates}</span></div>`;
    });
    h += `</div>`;
  }
  if (allSkills.length) h += `<div style="margin-bottom:6px">${hdr('Skills')}<div>${allSkills.map(esc).join(', ')}</div></div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:6px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Bold ────────────────────────────────────────────────────────────

function printBold(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111;font-size:12px';
  const hdr = (t: string) => `<div style="font-size:14px;font-weight:700;color:#057642;border-left:4px solid #057642;padding-left:12px;margin-bottom:8px">${t}</div>`;
  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#333;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:6px"><div style="font-size:34px;font-weight:800;color:#111">${esc(c.name) || 'Your Name'}</div><div style="width:100%;height:4px;background:#057642;margin-top:6px;margin-bottom:8px"></div>`;
  if (cp) h += `<div style="font-size:10px;color:#666">${cp}</div>`;
  h += `</div><div style="height:16px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:18px">${hdr('SUMMARY')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:18px">${hdr('EXPERIENCE')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = esc(exp.company || '');
      const loc = exp.location ? ` &mdash; ${esc(exp.location)}` : '';
      h += `<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="font-weight:700;color:#111">${company}${loc}</div>`;
      if (exp.bullets?.length) {
        h += `<div style="margin-top:4px">`;
        exp.bullets.forEach(b => { h += `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">&bull; ${esc(b)}</div>`; });
        h += `</div>`;
      }
      h += `</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:18px">${hdr('EDUCATION')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:18px">${hdr('SKILLS')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:18px">${hdr('ACHIEVEMENTS')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Elegant ─────────────────────────────────────────────────────────

function printElegant(data: ResumeData): string {
  const c = data.contact || {};
  const cpArr = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const cp = cpArr.map(esc).join(' <span style="margin:0 8px;color:#CCC">&#9670;</span> ');
  const dateS = 'font-size:10px;color:#999;font-style:italic';
  const titleS = 'font-weight:700;color:#222';
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#666;letter-spacing:3px;background:#F8F9FA;padding:6px 12px;border-radius:4px;margin-bottom:10px">${t}</div>`;
  let h = `<div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.6;color:#444;padding:40px;max-width:100%">`;
  h += `<div style="text-align:center;margin-bottom:18px"><div style="font-size:24px;font-weight:400;color:#111;letter-spacing:2px">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#888;margin-top:8px">${cp}</div>`;
  h += `</div><div style="border-bottom:0.5px solid #E5E7EB;margin-bottom:20px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:20px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:20px">${hdr('Experience')}${buildExpHTML(data, '&bull;', dateS, 'color:#777;font-style:italic;font-size:10px', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:20px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:20px">${hdr('Skills')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:20px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Technical ───────────────────────────────────────────────────────

function printTechnical(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#888;font-family:"Courier New",Courier,monospace';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:12px;font-weight:700;color:#0A66C2;font-family:'Courier New',Courier,monospace;margin-bottom:8px">// ${t}</div>`;
  const skillGroups = normalizeSkills(data.skills);
  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#333;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:14px"><div style="font-size:24px;font-weight:700;color:#111">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#666;font-family:'Courier New',Courier,monospace;margin-top:4px">${cp}</div>`;
  h += `</div><div style="border-bottom:1px solid #E5E7EB;margin-bottom:16px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:18px">${hdr('SUMMARY')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:18px">${hdr('EXPERIENCE')}${buildExpHTML(data, '&gt;', dateS, 'color:#555', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:18px">${hdr('EDUCATION')}${buildEduHTML(data, dateS)}</div>`;
  if (skillGroups.length) {
    h += `<div style="margin-bottom:18px">${hdr('SKILLS')}`;
    skillGroups.forEach(g => {
      h += `<div style="margin-bottom:4px;font-family:'Courier New',Courier,monospace;font-size:10px"><span style="color:#666">${esc(g.label)}: </span><span style="color:#111">{ ${g.items.map(esc).join(', ')} }</span></div>`;
    });
    h += `</div>`;
  }
  const ach = buildAchievementsHTML(data, '&gt;');
  if (ach) h += `<div style="margin-bottom:18px">${hdr('ACHIEVEMENTS')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Sidebar ─────────────────────────────────────────────────────────

function printSidebar(data: ResumeData): string {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const mainHdr = (t: string) => `<div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#1E293B;border-bottom:2px solid #1E293B;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  const sideHdr = (t: string) => `<div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.5);margin-bottom:8px">${t}</div>`;

  let sidebar = `<div class="two-col-left" style="width:30%;background:#1E293B;color:#fff;padding:24px 16px">`;
  sidebar += `<div style="font-size:18px;font-weight:700;margin-bottom:4px">${esc(c.name) || 'Your Name'}</div>`;
  sidebar += `<div style="border-bottom:1px solid rgba(255,255,255,0.2);margin:10px 0"></div>`;
  if (contactParts.length) {
    sidebar += `<div style="margin-bottom:16px">${sideHdr('Contact')}`;
    contactParts.forEach(p => { sidebar += `<div style="margin-bottom:4px;font-size:9px;color:rgba(255,255,255,0.7);word-break:break-all">${esc(p)}</div>`; });
    sidebar += `</div>`;
  }
  if (skillGroups.length) {
    sidebar += `<div style="margin-bottom:16px">${sideHdr('Skills')}`;
    skillGroups.forEach(g => {
      sidebar += `<div style="margin-bottom:6px">`;
      if (skillGroups.length > 1) sidebar += `<div style="font-size:8px;color:rgba(255,255,255,0.5);margin-bottom:2px">${esc(g.label)}</div>`;
      g.items.forEach(s => { sidebar += `<div style="font-size:9px;color:rgba(255,255,255,0.85);margin-bottom:1px">&bull; ${esc(s)}</div>`; });
      sidebar += `</div>`;
    });
    sidebar += `</div>`;
  }
  if (data.education?.length) {
    sidebar += `<div>${sideHdr('Education')}`;
    data.education.forEach(edu => {
      sidebar += `<div style="margin-bottom:8px"><div style="font-weight:700;font-size:9px;color:#fff">${esc(getEduDegree(edu))}</div><div style="font-size:9px;color:rgba(255,255,255,0.7)">${esc(getEduSchool(edu))}</div></div>`;
    });
    sidebar += `</div>`;
  }
  sidebar += `</div>`;

  let main = `<div class="two-col-right" style="width:70%;padding:24px 24px;color:#333">`;
  if (data.summary) main += `<div style="margin-bottom:16px">${mainHdr('Summary')}<div style="font-size:10px">${esc(data.summary)}</div></div>`;
  if (data.experience?.length) main += `<div style="margin-bottom:16px">${mainHdr('Experience')}${buildExpHTML(data, '&bull;', 'font-size:9px;color:#888;font-style:italic', 'color:#555;font-style:italic;font-size:9px', 'font-weight:700;color:#111;font-size:11px')}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) main += `<div style="margin-bottom:16px">${mainHdr('Achievements')}${ach}</div>`;
  main += `</div>`;

  return printPageWrapper(`<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.4;position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:30%;background:#1E293B;min-height:297mm"></div><div class="two-col" style="position:relative;z-index:1">${sidebar}${main}</div></div>`);
}

// ─── Print: Split Modern ────────────────────────────────────────────────────

function printSplitModern(data: ResumeData): string {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const mainHdr = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#0F172A;border-bottom:1px solid #E2E8F0;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  const sideHdr = (t: string) => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#64748B;letter-spacing:1px;margin-bottom:8px">${t}</div>`;

  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.4">`;
  h += `<div style="padding:16px 24px 10px;border-bottom:2px solid #E2E8F0"><div style="font-size:22px;font-weight:700;color:#0F172A">${esc(c.name) || 'Your Name'}</div></div>`;
  h += `<div style="position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:35%;background:#F1F5F9;min-height:250mm"></div><div class="two-col" style="position:relative;z-index:1">`;

  // Left panel
  h += `<div class="two-col-left" style="width:35%;background:#F1F5F9;padding:16px">`;
  if (contactParts.length) {
    h += `<div style="margin-bottom:20px">${sideHdr('Contact')}`;
    contactParts.forEach(p => { h += `<div style="font-size:10px;color:#475569;margin-bottom:4px;word-break:break-all">${esc(p)}</div>`; });
    h += `</div>`;
  }
  if (skillGroups.length) {
    h += `<div style="margin-bottom:20px">${sideHdr('Skills')}`;
    skillGroups.forEach(g => {
      h += `<div style="margin-bottom:8px">`;
      if (skillGroups.length > 1) h += `<div style="font-size:9px;color:#94A3B8;font-weight:700;margin-bottom:4px">${esc(g.label)}</div>`;
      h += `<div style="display:flex;flex-wrap:wrap;gap:4px">`;
      g.items.forEach(s => { h += `<span style="background:#E2E8F0;color:#334155;border-radius:3px;padding:2px 6px;font-size:9px">${esc(s)}</span>`; });
      h += `</div></div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) {
    h += `<div style="margin-bottom:20px">${sideHdr('Education')}`;
    data.education.forEach(edu => {
      h += `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:10px;color:#1E293B">${esc(getEduDegree(edu))}</div><div style="font-size:10px;color:#64748B">${esc(getEduSchool(edu))}</div><div style="font-size:9px;color:#94A3B8">${esc(getEduDates(edu))}${edu.gpa ? ` &mdash; GPA: ${esc(edu.gpa)}` : ''}</div></div>`;
    });
    h += `</div>`;
  }
  h += `</div>`;

  // Right panel
  h += `<div class="two-col-right" style="width:65%;padding:16px 24px;color:#333">`;
  if (data.summary) h += `<div style="margin-bottom:16px">${mainHdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:16px">${mainHdr('Experience')}${buildExpHTML(data, '&bull;', 'font-size:10px;color:#888;font-style:italic', 'color:#64748B;font-style:italic;font-size:10px', 'font-weight:700;color:#111')}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:16px">${mainHdr('Achievements')}${ach}</div>`;
  h += `</div>`;

  h += `</div></div></div>`;
  return printPageWrapper(h);
}

// ─── Print: Highlight ───────────────────────────────────────────────────────

function printHighlight(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const skillGroups = normalizeSkills(data.skills);
  const mainHdr = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#004182;border-bottom:2px solid #004182;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  const sideHdr = (t: string) => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#004182;border-bottom:2px solid #004182;padding-bottom:3px;margin-bottom:8px">${t}</div>`;

  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.4">`;
  // Header
  h += `<div style="background:#004182;padding:12px 24px"><div style="font-size:20px;font-weight:700;color:#fff">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:9px;color:rgba(255,255,255,0.7);margin-top:3px">${cp}</div>`;
  h += `</div>`;
  // Body
  h += `<div style="position:relative"><div style="position:absolute;top:0;right:0;bottom:0;width:35%;background:#F0F7FF;min-height:250mm"></div><div class="two-col" style="position:relative;z-index:1">`;
  // Left main
  h += `<div class="two-col-left" style="width:65%;padding:16px 16px 16px 24px;color:#333">`;
  if (data.summary) h += `<div style="margin-bottom:18px">${mainHdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:18px">${mainHdr('Experience')}${buildExpHTML(data, '&bull;', 'font-size:10px;color:#888;font-style:italic', 'color:#555;font-style:italic;font-size:10px', 'font-weight:700;color:#111')}</div>`;
  h += `</div>`;
  // Right panel
  h += `<div class="two-col-right" style="width:35%;background:#F0F7FF;padding:16px">`;
  if (skillGroups.length) {
    h += `<div style="margin-bottom:18px">${sideHdr('Skills')}`;
    skillGroups.forEach(g => {
      h += `<div style="margin-bottom:8px">`;
      if (skillGroups.length > 1) h += `<div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:2px">${esc(g.label)}</div>`;
      g.items.forEach(s => { h += `<div style="font-size:10px;color:#333;margin-bottom:2px">&bull; ${esc(s)}</div>`; });
      h += `</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) {
    h += `<div style="margin-bottom:18px">${sideHdr('Education')}`;
    data.education.forEach(edu => {
      h += `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:10px;color:#111">${esc(getEduDegree(edu))}</div><div style="font-size:10px;color:#555">${esc(getEduSchool(edu))}</div><div style="font-size:9px;color:#888">${esc(getEduDates(edu))}${edu.gpa ? ` &mdash; GPA: ${esc(edu.gpa)}` : ''}</div></div>`;
    });
    h += `</div>`;
  }
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:18px">${sideHdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  h += `</div></div></div>`;
  return printPageWrapper(h);
}

// ─── Print: Corporate ───────────────────────────────────────────────────────

function printCorporate(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('   |   ');
  const skillGroups = normalizeSkills(data.skills);
  const mainHdr = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#0F172A;border-bottom:1px solid #CBD5E1;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  const sideHdr = (t: string) => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#0F172A;letter-spacing:1px;border-bottom:1px solid #CBD5E1;padding-bottom:3px;margin-bottom:8px">${t}</div>`;

  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.4">`;
  // Header band
  h += `<div style="background:#0F172A;padding:12px 24px"><div style="font-size:20px;font-weight:700;color:#fff">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:9px;color:rgba(255,255,255,0.6);margin-top:3px">${cp}</div>`;
  h += `</div>`;
  // Body
  h += `<div style="position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:28%;background:#F8FAFC;border-right:1px solid #E2E8F0;min-height:250mm"></div><div class="two-col" style="position:relative;z-index:1">`;
  // Left sidebar
  h += `<div class="two-col-left" style="width:28%;background:#F8FAFC;padding:16px 14px;border-right:1px solid #E2E8F0">`;
  if (skillGroups.length) {
    h += `<div style="margin-bottom:20px">${sideHdr('Skills')}`;
    skillGroups.forEach(g => {
      h += `<div style="margin-bottom:10px">`;
      if (skillGroups.length > 1) h += `<div style="font-size:9px;font-weight:700;color:#64748B;margin-bottom:4px">${esc(g.label)}</div>`;
      g.items.forEach(s => { h += `<div style="font-size:10px;color:#475569;margin-bottom:2px">&bull; ${esc(s)}</div>`; });
      h += `</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) {
    h += `<div style="margin-bottom:20px">${sideHdr('Education')}`;
    data.education.forEach(edu => {
      h += `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:10px;color:#1E293B">${esc(getEduDegree(edu))}</div><div style="font-size:10px;color:#64748B">${esc(getEduSchool(edu))}</div><div style="font-size:9px;color:#94A3B8">${esc(getEduDates(edu))}${edu.gpa ? ` &mdash; GPA: ${esc(edu.gpa)}` : ''}</div></div>`;
    });
    h += `</div>`;
  }
  h += `</div>`;
  // Right main
  h += `<div class="two-col-right" style="width:72%;padding:16px 24px;color:#333">`;
  if (data.summary) h += `<div style="margin-bottom:18px">${mainHdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:18px">${mainHdr('Experience')}${buildExpHTML(data, '&bull;', 'font-size:10px;color:#888;font-style:italic', 'color:#64748B;font-style:italic;font-size:10px', 'font-weight:700;color:#111')}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:18px">${mainHdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  h += `</div></div></div>`;
  return printPageWrapper(h);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTER: buildPrintHTML
// ═══════════════════════════════════════════════════════════════════════════════

// Single-column styled print for visual templates (reliable PDF)
function printVisualAsStyled(data: ResumeData, accentColor: string, headerBg: string, headerText: string): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const skillGroups = normalizeSkills(data.skills);
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:3px;margin:20px 0 8px">${t}</div>`;

  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5">`;
  // Styled header
  h += `<div style="background:${headerBg};padding:20px 32px;margin:-10mm -12mm 16px;width:calc(100% + 24mm)"><div style="font-size:24px;font-weight:700;color:${headerText}">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:${headerText === '#fff' ? 'rgba(255,255,255,0.7)' : '#666'};margin-top:4px">${cp}</div>`;
  h += `</div>`;
  // Summary
  if (data.summary) h += `${hdr('Professional Summary')}<div style="color:#374151">${esc(data.summary)}</div>`;
  // Experience
  if (data.experience?.length) h += `${hdr('Work Experience')}${buildExpHTML(data, '&bull;', 'font-size:10px;color:#888;font-style:italic', 'color:#666;font-style:italic;font-size:10px', 'font-weight:700;color:#111')}`;
  // Skills
  if (skillGroups.length) {
    h += hdr('Skills');
    skillGroups.forEach(g => {
      h += `<div style="margin-bottom:6px">`;
      if (skillGroups.length > 1) h += `<span style="font-weight:700;color:${accentColor}">${esc(g.label)}: </span>`;
      h += `<span style="color:#374151">${g.items.map(esc).join(', ')}</span></div>`;
    });
  }
  // Education
  if (data.education?.length) {
    h += hdr('Education');
    data.education.forEach(edu => {
      h += `<div style="margin-bottom:8px"><div style="font-weight:700;color:#111">${esc(getEduDegree(edu))}${getEduSchool(edu) ? ' — ' + esc(getEduSchool(edu)) : ''}</div><div style="font-size:10px;color:#666">${esc(getEduDates(edu))}${edu.gpa ? ' | GPA: ' + esc(edu.gpa) : ''}</div></div>`;
    });
  }
  // Achievements
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `${hdr('Achievements')}${ach}`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Monochrome Prestige ────────────────────────────────────────────

function printMonochrome(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#000';
  const hdr = (t: string) => `<div style="font-size:12px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:3px;border-bottom:2px solid #000;padding-bottom:4px;margin-bottom:8px">${t}</div>`;
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#333;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:16px"><div style="font-size:30px;font-weight:700;color:#000;letter-spacing:1px">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#999;margin-top:6px;letter-spacing:0.5px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:28px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:28px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">&bull; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#666;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:28px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:28px">${hdr('Skills')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:28px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Professional Serif ─────────────────────────────────────────────

function printSerif(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#1a1a1a';
  const hdr = (t: string) => `<div style="font-size:13px;font-style:italic;color:#333;border-bottom:1px solid #ccc;padding-bottom:2px;margin-bottom:6px">${t}</div>`;
  let h = `<div class="resume-wrapper" style="font-family:Georgia,'Times New Roman',serif;font-size:11.5px;line-height:1.7;color:#333;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:14px"><div style="font-size:26px;font-weight:700;color:#1a1a1a">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:16px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:16px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:14px;text-indent:-14px;margin-bottom:2px">&ndash; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#555;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:16px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:16px">${hdr('Skills')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&ndash;');
  if (ach) h += `<div style="margin-bottom:16px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Headline Impact ────────────────────────────────────────────────

function printHeadline(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;color:#374151;border-bottom:1px solid #D1D5DB;padding-bottom:2px;margin-bottom:6px">${t}</div>`;
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:12px"><div style="font-size:24px;font-weight:700;color:#111">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:18px;background:#F8FAFC;border-left:4px solid #0A66C2;padding:16px"><div style="font-size:13px;line-height:1.6;color:#374151">${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:14px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">&bull; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#555;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:14px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:14px">${hdr('Skills')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:14px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Modern Divider ─────────────────────────────────────────────────

function printDivider(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:6px">${t}</div>`;
  const dividerHTML = `<div style="text-align:center;margin:18px 0"><span style="display:inline-block;width:24px;height:2px;background:#D1D5DB;vertical-align:middle"></span><span style="display:inline-block;margin:0 6px;color:#D1D5DB;font-size:8px;vertical-align:middle">&#9670;</span><span style="display:inline-block;width:24px;height:2px;background:#D1D5DB;vertical-align:middle"></span></div>`;
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:4px"><div style="font-size:26px;font-weight:700;color:#111">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `${dividerHTML}${hdr('Summary')}<div>${esc(data.summary)}</div>`;
  if (data.experience?.length) {
    h += `${dividerHTML}${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">&bull; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#555;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
  }
  if (data.education?.length) h += `${dividerHTML}${hdr('Education')}${buildEduHTML(data, dateS)}`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `${dividerHTML}${hdr('Skills')}${sk}`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `${dividerHTML}${hdr('Achievements')}${ach}`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Crimson Authority ──────────────────────────────────────────────

function printCrimson(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:12px;font-weight:700;color:#991B1B;text-transform:uppercase;border-bottom:2px solid #991B1B;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  const allSkills = flattenSkills(data.skills);
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:14px"><div style="font-size:28px;font-weight:700;color:#991B1B">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#666;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:16px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:16px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">&bull; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#555;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:16px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  if (allSkills.length) {
    const tags = allSkills.map(s => `<span style="background:#FEE2E2;color:#991B1B;border-radius:4px;padding:2px 8px;font-size:10px;display:inline-block;margin:2px">${esc(s)}</span>`).join('');
    h += `<div style="margin-bottom:16px">${hdr('Skills')}<div style="display:flex;flex-wrap:wrap;gap:6px">${tags}</div></div>`;
  }
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:16px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Ocean Professional ─────────────────────────────────────────────

function printOcean(data: ResumeData): string {
  const c = data.contact || {};
  const cpArr = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const cp = cpArr.map(esc).join(' &nbsp;&bull;&nbsp; ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;color:#0D9488;text-transform:uppercase;border-bottom:1px solid #0D9488;padding-bottom:2px;margin-bottom:6px">${t}</div>`;
  const allSkills = flattenSkills(data.skills);
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:14px"><div style="font-size:26px;font-weight:700;color:#0D9488">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:14px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:14px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:14px;text-indent:-14px;margin-bottom:2px"><span style="color:#0D9488">&#9679;</span> ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#555;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:14px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  if (allSkills.length) {
    const tags = allSkills.map(s => `<span style="background:#F0FDFA;color:#0D9488;border-radius:4px;padding:2px 8px;font-size:10px;display:inline-block;margin:2px">${esc(s)}</span>`).join('');
    h += `<div style="margin-bottom:14px">${hdr('Skills')}<div style="display:flex;flex-wrap:wrap;gap:6px">${tags}</div></div>`;
  }
  const ach = buildAchievementsHTML(data, '<span style="color:#0D9488">&#9679;</span>');
  if (ach) h += `<div style="margin-bottom:14px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Slate & Gold ───────────────────────────────────────────────────

function printSlateGold(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const dateS = 'font-size:10px;color:#64748B;font-style:italic';
  const titleS = 'font-weight:700;color:#334155';
  const hdr = (t: string) => `<div style="font-size:12px;font-weight:700;color:#334155;text-transform:uppercase;border-bottom:1px solid #B8860B;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#475569;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:14px"><div style="font-size:28px;font-weight:700;color:#334155">${esc(c.name) || 'Your Name'}</div>`;
  h += `<div style="width:80px;height:2px;background:#B8860B;margin-top:6px"></div>`;
  if (cp) h += `<div style="font-size:10px;color:#64748B;margin-top:6px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:16px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:16px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">&bull; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#64748B;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:16px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:16px">${hdr('Skills')}${sk}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:16px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Indigo Modern ──────────────────────────────────────────────────

function printIndigo(data: ResumeData): string {
  const c = data.contact || {};
  const cpArr = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const cp = cpArr.map(esc).join(' <span style="color:#4F46E5;margin:0 6px">|</span> ');
  const dateS = 'font-size:10px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111';
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;color:#4F46E5;text-transform:uppercase;margin-bottom:6px">${t}</div>`;
  const allSkills = flattenSkills(data.skills);
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px;max-width:100%">`;
  h += `<div style="margin-bottom:14px"><div style="font-size:26px;font-weight:700;color:#4F46E5">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#666;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:14px">${hdr('Summary')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:14px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">&bull; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#555;font-style:italic">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:14px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  if (allSkills.length) {
    const tags = allSkills.map(s => `<span style="background:#EEF2FF;color:#4F46E5;border-radius:4px;padding:2px 8px;font-size:10px;display:inline-block;margin:2px">${esc(s)}</span>`).join('');
    h += `<div style="margin-bottom:14px">${hdr('Skills')}<div style="display:flex;flex-wrap:wrap;gap:6px">${tags}</div></div>`;
  }
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:14px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

export function buildPrintHTML(data: ResumeData, templateId: string, pageCount?: number): string {
  let html: string;
  switch (templateId) {
    case 'modern': html = printModern(data); break;
    case 'minimal': html = printMinimal(data); break;
    case 'executive': html = printExecutive(data); break;
    case 'compact': html = printCompact(data); break;
    case 'bold': html = printBold(data); break;
    case 'elegant': html = printElegant(data); break;
    case 'technical': html = printTechnical(data); break;
    case 'sidebar': html = printSidebar(data); break;
    case 'splitmodern': html = printSplitModern(data); break;
    case 'highlight': html = printHighlight(data); break;
    case 'corporate': html = printCorporate(data); break;
    case 'monochrome': html = printMonochrome(data); break;
    case 'serif': html = printSerif(data); break;
    case 'headline': html = printHeadline(data); break;
    case 'divider': html = printDivider(data); break;
    case 'crimson': html = printCrimson(data); break;
    case 'ocean': html = printOcean(data); break;
    case 'slategold': html = printSlateGold(data); break;
    case 'indigo': html = printIndigo(data); break;
    case 'classic':
    default: html = printClassic(data); break;
  }

  // Enforce 1-page limit if requested
  if (pageCount === 1) {
    html = html.replace('</style>', `
      html,body{max-height:297mm!important;overflow:hidden!important}
      .resume-wrapper{max-height:280mm!important;overflow:hidden!important}
      @page{margin:8mm 10mm!important}
      @media print{html,body{max-height:297mm!important;overflow:hidden!important}}
    </style>`);
  }

  return html;
}

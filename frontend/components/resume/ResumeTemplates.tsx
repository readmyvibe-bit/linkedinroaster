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

export const TEMPLATES: TemplateDefinition[] = [
  { id: 'classic', name: 'Classic Professional', description: 'Traditional clean layout. Maximum ATS compatibility.', category: 'Standard' },
  { id: 'modern', name: 'Modern Blue', description: 'Blue accent border with clean modern styling.', category: 'Standard' },
  { id: 'minimal', name: 'Minimal Clean', description: 'Centered name with light section headers. Ultra clean.', category: 'Standard' },
  { id: 'executive', name: 'Executive', description: 'Conservative centered layout for senior leadership roles.', category: 'Professional' },
  { id: 'compact', name: 'Compact', description: 'Tighter spacing to fit more content on one page.', category: 'Professional' },
  { id: 'bold', name: 'Bold Impact', description: 'Large type and green accents for high visual impact.', category: 'Professional' },
  { id: 'elegant', name: 'Elegant', description: 'Refined thin borders and small-caps headers. Consulting/services.', category: 'Creative' },
  { id: 'technical', name: 'Technical', description: 'Monospace skills section and code-style grouping for engineering.', category: 'Creative' },
  { id: 'creative', name: 'Creative Minimal', description: 'Orange accents and dot-style skill bullets for marketing/design.', category: 'Creative' },
  { id: 'corporate', name: 'Corporate Standard', description: 'Navy headers with formal spacing for banking/finance.', category: 'Professional' },
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

/** Flatten any skills format into { label, items }[] groups */
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

/** Flatten all skills to a single string[] for simple renderers */
function flattenSkills(skills?: SkillsData): string[] {
  const groups = normalizeSkills(skills);
  const all: string[] = [];
  groups.forEach(g => all.push(...g.items));
  return all;
}

// ─── JSX Renderers ───────────────────────────────────────────────────────────

function renderClassic(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#222', maxWidth: '800px' }}>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111', textAlign: 'left' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555', borderBottom: '1px solid #bbb', paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555', borderBottom: '1px solid #bbb', paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#444', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555', borderBottom: '1px solid #bbb', paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#444' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555', borderBottom: '1px solid #bbb', paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Skills</div>
          {normalizeSkills(data.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 600 }}>{g.label}: </span>{g.items.join(', ')}
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555', borderBottom: '1px solid #bbb', paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderModern(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const blue = '#0A66C2';
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Segoe UI, Roboto, Arial, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#222', maxWidth: '800px', borderLeft: `4px solid ${blue}`, paddingLeft: '16px' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: blue }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join('  ·  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: blue, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: blue, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#444' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: blue, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#444' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: blue, marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Skills</div>
          {normalizeSkills(data.skills).map((g, gi) => (
            <div key={gi} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: '3px' }}>{g.label}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {g.items.map((s, si) => (
                  <span key={si} style={{ display: 'inline-block', padding: '2px 8px', fontSize: '10px', borderRadius: '10px', background: '#E8F0FE', color: blue, border: `1px solid ${blue}33` }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: blue, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderMinimal(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const sectionHeader: React.CSSProperties = { fontSize: '9px', fontWeight: 600, color: '#999', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' };
  return (
    <div style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', fontSize: '11px', lineHeight: 1.6, color: '#333', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '26px', fontWeight: 300, color: '#111', letterSpacing: '2px' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#888', marginTop: '6px' }}>{contactParts.join('   |   ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeader}>Summary</div>
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto', color: '#555' }}>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeader}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: '#222' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#999' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#666', fontSize: '10px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0, color: '#444' }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeader}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 600, color: '#222' }}>{getEduDegree(edu)}</div>
              <div style={{ color: '#666', fontSize: '10px' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''} {getEduDates(edu) && `· ${getEduDates(edu)}`}</div>
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeader}>Skills</div>
          <div style={{ textAlign: 'center', color: '#555' }}>
            {flattenSkills(data.skills).join('  ·  ')}
          </div>
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionHeader}>Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0, color: '#444' }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '3px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderExecutive(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: '11px', lineHeight: 1.55, color: '#222', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #bbb' }}>
        <div style={{ fontSize: '32px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '6px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '0.5px solid #ddd' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '4px', textTransform: 'uppercase' as const }}>Executive Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '0.5px solid #ddd' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '6px', textTransform: 'uppercase' as const }}>Professional Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '12px' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ fontStyle: 'italic', color: '#444' }}>{[exp.company, exp.location].filter(Boolean).join(', ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '0.5px solid #ddd' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '6px', textTransform: 'uppercase' as const }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
              {getEduSchool(edu) && <span style={{ color: '#444' }}> — {getEduSchool(edu)}</span>}
              {getEduDates(edu) && <span style={{ color: '#666', fontSize: '10px' }}> ({getEduDates(edu)})</span>}
              {edu.gpa && <span style={{ color: '#666', fontSize: '10px' }}> GPA: {edu.gpa}</span>}
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '12px', paddingBottom: '10px', borderBottom: '0.5px solid #ddd' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '4px', textTransform: 'uppercase' as const }}>Core Competencies</div>
          {normalizeSkills(data.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: '3px' }}><span style={{ fontWeight: 600 }}>{g.label}: </span>{g.items.join(', ')}</div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#333', marginBottom: '4px', textTransform: 'uppercase' as const }}>Key Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderCompact(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', lineHeight: 1.4, color: '#222', maxWidth: '800px' }}>
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{contactParts.join(' | ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#444', borderBottom: '0.5px solid #ccc', paddingBottom: '1px', marginBottom: '3px', textTransform: 'uppercase' as const }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#444', borderBottom: '0.5px solid #ccc', paddingBottom: '1px', marginBottom: '3px', textTransform: 'uppercase' as const }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '10px' }}>{getExpTitle(exp)} — {exp.company || ''}</span>
                <span style={{ fontSize: '9px', color: '#666' }}>{getExpDates(exp)}{exp.location ? ` | ${exp.location}` : ''}</span>
              </div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '2px 0 0 14px', padding: 0 }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '1px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#444', borderBottom: '0.5px solid #ccc', paddingBottom: '1px', marginBottom: '3px', textTransform: 'uppercase' as const }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '3px' }}>
              <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span> — {getEduSchool(edu)} {getEduDates(edu) && `(${getEduDates(edu)})`} {edu.gpa && `GPA: ${edu.gpa}`}
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#444', borderBottom: '0.5px solid #ccc', paddingBottom: '1px', marginBottom: '3px', textTransform: 'uppercase' as const }}>Skills</div>
          {normalizeSkills(data.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: '2px' }}><span style={{ fontWeight: 600 }}>{g.label}: </span>{g.items.join(', ')}</div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#444', borderBottom: '0.5px solid #ccc', paddingBottom: '1px', marginBottom: '3px', textTransform: 'uppercase' as const }}>Achievements</div>
          <ul style={{ margin: '0 0 0 14px', padding: 0 }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '1px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderBold(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const green = '#057642';
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '11px', lineHeight: 1.5, color: '#222', maxWidth: '800px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '36px', fontWeight: 900, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px', fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: green, marginBottom: '4px', textTransform: 'uppercase' as const }}>Summary</div>
          <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: green, marginBottom: '6px', textTransform: 'uppercase' as const }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 900, fontSize: '12px', color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666', fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#333' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0, fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: green, marginBottom: '6px', textTransform: 'uppercase' as const }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 900 }}>{getEduDegree(edu)}</div>
              <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 400, color: '#444' }}>{getEduSchool(edu)}{getEduDates(edu) ? ` · ${getEduDates(edu)}` : ''}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: green, marginBottom: '4px', textTransform: 'uppercase' as const }}>Skills</div>
          {normalizeSkills(data.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: '4px', fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>
              <span style={{ fontWeight: 700 }}>{g.label}: </span>{g.items.join(', ')}
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: 900, color: green, marginBottom: '4px', textTransform: 'uppercase' as const }}>Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0, fontFamily: 'Arial, sans-serif', fontWeight: 400 }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderElegant(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const sectionHeader: React.CSSProperties = {
    fontSize: '10px', fontWeight: 600, color: '#555', letterSpacing: '2px', textTransform: 'uppercase',
    marginBottom: '6px', padding: '4px 8px', background: '#F8F9FA', border: '0.5px solid #E5E7EB',
    fontVariant: 'small-caps',
  };
  return (
    <div style={{ fontFamily: 'Garamond, Georgia, Times New Roman, serif', fontSize: '11px', lineHeight: 1.55, color: '#333', maxWidth: '800px' }}>
      <div style={{ textAlign: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '0.5px solid #ccc' }}>
        <div style={{ fontSize: '26px', fontWeight: 400, color: '#222', letterSpacing: '3px', fontVariant: 'small-caps' as const }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#777', marginTop: '6px', letterSpacing: '0.5px' }}>{contactParts.join('  ·  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionHeader}>Professional Summary</div>
          <div style={{ paddingLeft: '4px' }}>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionHeader}>Professional Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px', paddingLeft: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontStyle: 'italic' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#888' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555' }}>{[exp.company, exp.location].filter(Boolean).join(', ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0, color: '#444' }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionHeader}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px', paddingLeft: '4px' }}>
              <span style={{ fontWeight: 600 }}>{getEduDegree(edu)}</span>
              {getEduSchool(edu) && <span style={{ color: '#555' }}> — {getEduSchool(edu)}</span>}
              {getEduDates(edu) && <span style={{ color: '#888', fontSize: '10px' }}> ({getEduDates(edu)})</span>}
              {edu.gpa && <span style={{ color: '#888', fontSize: '10px' }}> · GPA: {edu.gpa}</span>}
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionHeader}>Skills &amp; Competencies</div>
          {normalizeSkills(data.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: '3px', paddingLeft: '4px' }}><span style={{ fontWeight: 600 }}>{g.label}: </span>{g.items.join(', ')}</div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={sectionHeader}>Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0, color: '#444' }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderTechnical(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const blue = '#0A66C2';
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Consolas, Monaco, Courier New, monospace', fontSize: '10.5px', lineHeight: 1.5, color: '#222', maxWidth: '800px' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#111', fontFamily: 'Segoe UI, Arial, sans-serif' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: blue, marginBottom: '4px', fontFamily: 'Segoe UI, Arial, sans-serif', textTransform: 'uppercase' as const }}>// Summary</div>
          <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '11px' }}>{data.summary}</div>
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: blue, marginBottom: '6px', fontFamily: 'Segoe UI, Arial, sans-serif', textTransform: 'uppercase' as const }}>// Technical Skills</div>
          {normalizeSkills(data.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: '4px', padding: '4px 8px', background: '#F5F7FA', border: '1px solid #E5E7EB' }}>
              <span style={{ color: blue, fontWeight: 600 }}>{g.label}</span>
              <span style={{ color: '#666' }}>{' { '}</span>
              {g.items.map((s, si) => (
                <span key={si}>
                  <span style={{ color: '#333' }}>{s}</span>
                  {si < g.items.length - 1 && <span style={{ color: '#999' }}>, </span>}
                </span>
              ))}
              <span style={{ color: '#666' }}>{' }'}</span>
            </div>
          ))}
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: blue, marginBottom: '6px', fontFamily: 'Segoe UI, Arial, sans-serif', textTransform: 'uppercase' as const }}>// Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: blue, fontFamily: 'Segoe UI, Arial, sans-serif' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0, fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '10.5px' }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: blue, marginBottom: '6px', fontFamily: 'Segoe UI, Arial, sans-serif', textTransform: 'uppercase' as const }}>// Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
              <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
              {getEduSchool(edu) && <span style={{ color: '#555' }}> — {getEduSchool(edu)}</span>}
              {getEduDates(edu) && <span style={{ color: '#888', fontSize: '10px' }}> ({getEduDates(edu)})</span>}
              {edu.gpa && <span style={{ color: '#888', fontSize: '10px' }}> GPA: {edu.gpa}</span>}
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: blue, marginBottom: '4px', fontFamily: 'Segoe UI, Arial, sans-serif', textTransform: 'uppercase' as const }}>// Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0, fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '10.5px' }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderCreative(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const orange = '#E16B00';
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif', fontSize: '11px', lineHeight: 1.55, color: '#333', maxWidth: '800px' }}>
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '30px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#777', marginTop: '4px' }}>{contactParts.join('  ·  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: orange, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: orange, marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#999' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: orange, marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 700 }}>{getEduDegree(edu)}</div>
              <div style={{ color: '#555', fontSize: '10px' }}>{getEduSchool(edu)}{getEduDates(edu) ? ` · ${getEduDates(edu)}` : ''}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: orange, marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Skills</div>
          {normalizeSkills(data.skills).map((g, gi) => (
            <div key={gi} style={{ marginBottom: '6px' }}>
              <div style={{ fontWeight: 600, fontSize: '10px', marginBottom: '3px', color: '#555' }}>{g.label}</div>
              <div>
                {g.items.map((s, si) => (
                  <span key={si} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '12px', marginBottom: '2px' }}>
                    <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: orange, marginRight: '5px', flexShrink: 0 }}></span>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: orange, marginBottom: '4px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function renderCorporate(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const navy = '#004182';
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  return (
    <div style={{ fontFamily: 'Cambria, Georgia, Times New Roman, serif', fontSize: '11px', lineHeight: 1.55, color: '#222', maxWidth: '800px' }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '26px', fontWeight: 700, color: navy }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '10px', color: '#555', marginTop: '4px', fontFamily: 'Arial, sans-serif' }}>{contactParts.join('  |  ')}</div>
        )}
      </div>
      {data.summary && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Professional Summary</div>
          <div>{data.summary}</div>
        </div>
      )}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Education</div>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ color: '#444' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Professional Experience</div>
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '10px', color: '#666' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#444', fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(', ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                  {exp.bullets.map((b, j) => <li key={j} style={{ marginBottom: '2px' }}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Skills &amp; Qualifications</div>
          {normalizeSkills(data.skills).map((g, i) => (
            <div key={i} style={{ marginBottom: '3px' }}><span style={{ fontWeight: 600 }}>{g.label}: </span>{g.items.join(', ')}</div>
          ))}
        </div>
      )}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: '2px', marginBottom: '6px', textTransform: 'uppercase' as const }}>Achievements</div>
          <ul style={{ margin: '0 0 0 18px', padding: 0 }}>
            {data.achievements.map((a, i) => <li key={i} style={{ marginBottom: '2px' }}>{a}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main JSX Renderer ───────────────────────────────────────────────────────

const renderers: Record<string, (data: ResumeData) => React.ReactNode> = {
  classic: renderClassic,
  modern: renderModern,
  minimal: renderMinimal,
  executive: renderExecutive,
  compact: renderCompact,
  bold: renderBold,
  elegant: renderElegant,
  technical: renderTechnical,
  creative: renderCreative,
  corporate: renderCorporate,
};

export function renderResumeHTML(data: ResumeData, templateId: string): React.ReactNode {
  const render = renderers[templateId] || renderers.classic;
  return render(data || {});
}

// ─── Print HTML Renderer ─────────────────────────────────────────────────────

function esc(s?: string): string {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildContactLine(c: ContactInfo, sep: string): string {
  return [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join(sep);
}

function buildBulletsHTML(bullets?: string[]): string {
  if (!bullets || bullets.length === 0) return '';
  return '<ul>' + bullets.map(b => `<li>${esc(b)}</li>`).join('') + '</ul>';
}

function buildSkillGroupsHTML(skills?: SkillsData, format?: 'list' | 'pills' | 'dots' | 'code'): string {
  const groups = normalizeSkills(skills);
  if (groups.length === 0) return '';
  if (format === 'pills') {
    return groups.map(g =>
      `<div class="skill-group"><div class="skill-group-label">${esc(g.label)}</div><div class="pills">${g.items.map(s => `<span class="pill">${esc(s)}</span>`).join('')}</div></div>`
    ).join('');
  }
  if (format === 'dots') {
    return groups.map(g =>
      `<div class="skill-group"><div class="skill-group-label">${esc(g.label)}</div><div>${g.items.map(s => `<span class="dot-item"><span class="dot"></span>${esc(s)}</span>`).join('')}</div></div>`
    ).join('');
  }
  if (format === 'code') {
    return groups.map(g =>
      `<div class="code-block"><span class="code-label">${esc(g.label)}</span><span class="brace"> { </span>${g.items.map(esc).join(', ')}<span class="brace"> }</span></div>`
    ).join('');
  }
  return groups.map(g =>
    `<div class="skill-line"><strong>${esc(g.label)}:</strong> ${g.items.map(esc).join(', ')}</div>`
  ).join('');
}

function buildFlatSkillsHTML(skills?: SkillsData): string {
  return flattenSkills(skills).map(esc).join('  &middot;  ');
}

function buildExpHTML(experience?: ExperienceEntry[], opts?: { compactTitle?: boolean }): string {
  if (!experience || experience.length === 0) return '';
  return experience.map(exp => {
    const title = esc(getExpTitle(exp));
    const dates = esc(getExpDates(exp));
    const company = esc(exp.company || '');
    const loc = esc(exp.location || '');
    const companyLine = [company, loc].filter(Boolean).join(opts?.compactTitle ? ' | ' : ' &mdash; ');
    return `<div class="entry">
      <div class="entry-header"><span class="entry-title">${title}${opts?.compactTitle && company ? ` &mdash; ${company}` : ''}</span><span class="entry-date">${dates}${opts?.compactTitle && loc ? ` | ${loc}` : ''}</span></div>
      ${!opts?.compactTitle && companyLine ? `<div class="entry-sub">${companyLine}</div>` : ''}
      ${buildBulletsHTML(exp.bullets)}
    </div>`;
  }).join('');
}

function buildEduHTML(education?: EducationEntry[]): string {
  if (!education || education.length === 0) return '';
  return education.map(edu => {
    const degree = esc(getEduDegree(edu));
    const school = esc(getEduSchool(edu));
    const dates = esc(getEduDates(edu));
    const gpa = edu.gpa ? ` &mdash; GPA: ${esc(edu.gpa)}` : '';
    return `<div class="entry">
      <div class="entry-header"><span class="entry-title">${degree}</span><span class="entry-date">${dates}</span></div>
      <div class="entry-sub">${school}${gpa}</div>
    </div>`;
  }).join('');
}

function buildAchievementsHTML(achievements?: string[]): string {
  if (!achievements || achievements.length === 0) return '';
  return '<ul>' + achievements.map(a => `<li>${esc(a)}</li>`).join('') + '</ul>';
}

function wrapPrintHTML(bodyHTML: string, css: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title> </title>
<style>
@page { margin: 20mm; size: A4; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
* { margin: 0; padding: 0; box-sizing: border-box; }
${css}
</style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}

// ─── Per-Template Print Builders ─────────────────────────────────────────────

function printClassic(data: ResumeData): string {
  const c = data.contact || {};
  const css = `
body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.5; color: #222; }
.name { font-size: 28px; font-weight: 700; color: #111; }
.contact { font-size: 10px; color: #555; margin-top: 4px; }
.section-title { font-size: 12px; font-weight: 700; color: #555; border-bottom: 1px solid #bbb; padding-bottom: 2px; margin: 12px 0 6px; text-transform: uppercase; }
.entry { margin-bottom: 10px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 700; }
.entry-date { font-size: 10px; color: #666; }
.entry-sub { color: #444; font-style: italic; }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin-bottom: 2px; }
.skill-line { margin-bottom: 4px; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, '  |  ')}</div>`;
  if (data.summary) html += `<div class="section-title">Summary</div><div>${esc(data.summary)}</div>`;
  if (data.experience?.length) html += `<div class="section-title">Experience</div>${buildExpHTML(data.experience)}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Skills</div>${buildSkillGroupsHTML(data.skills)}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printModern(data: ResumeData): string {
  const c = data.contact || {};
  const blue = '#0A66C2';
  const css = `
body { font-family: Segoe UI, Roboto, Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #222; border-left: 4px solid ${blue}; padding-left: 16px; }
.name { font-size: 28px; font-weight: 700; color: ${blue}; }
.contact { font-size: 10px; color: #555; margin-top: 4px; }
.section-title { font-size: 12px; font-weight: 700; color: ${blue}; margin: 14px 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
.entry { margin-bottom: 10px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 700; color: #111; }
.entry-date { font-size: 10px; color: #666; }
.entry-sub { color: #444; }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin-bottom: 2px; }
.skill-group { margin-bottom: 6px; }
.skill-group-label { font-weight: 600; font-size: 10px; margin-bottom: 3px; }
.pills { display: flex; flex-wrap: wrap; gap: 4px; }
.pill { display: inline-block; padding: 2px 8px; font-size: 10px; border-radius: 10px; background: #E8F0FE; color: ${blue}; border: 1px solid ${blue}33; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, '  &middot;  ')}</div>`;
  if (data.summary) html += `<div class="section-title">Summary</div><div>${esc(data.summary)}</div>`;
  if (data.experience?.length) html += `<div class="section-title">Experience</div>${buildExpHTML(data.experience)}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Skills</div>${buildSkillGroupsHTML(data.skills, 'pills')}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printMinimal(data: ResumeData): string {
  const c = data.contact || {};
  const css = `
body { font-family: Helvetica Neue, Arial, sans-serif; font-size: 11px; line-height: 1.6; color: #333; }
.name { font-size: 26px; font-weight: 300; color: #111; letter-spacing: 2px; text-align: center; }
.contact { font-size: 10px; color: #888; margin-top: 6px; text-align: center; }
.section-title { font-size: 9px; font-weight: 600; color: #999; letter-spacing: 4px; text-transform: uppercase; margin: 20px 0 8px; text-align: center; }
.summary { text-align: center; max-width: 600px; margin: 0 auto; color: #555; }
.entry { margin-bottom: 14px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 600; color: #222; }
.entry-date { font-size: 10px; color: #999; }
.entry-sub { color: #666; font-size: 10px; }
ul { margin: 4px 0 0 18px; padding: 0; color: #444; }
li { margin-bottom: 2px; }
.flat-skills { text-align: center; color: #555; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, '   |   ')}</div>`;
  if (data.summary) html += `<div class="section-title">Summary</div><div class="summary">${esc(data.summary)}</div>`;
  if (data.experience?.length) html += `<div class="section-title">Experience</div>${buildExpHTML(data.experience)}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (flattenSkills(data.skills).length) html += `<div class="section-title">Skills</div><div class="flat-skills">${buildFlatSkillsHTML(data.skills)}</div>`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printExecutive(data: ResumeData): string {
  const c = data.contact || {};
  const css = `
body { font-family: Georgia, Times New Roman, serif; font-size: 11px; line-height: 1.55; color: #222; }
.header { text-align: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #bbb; }
.name { font-size: 32px; font-weight: 700; color: #111; }
.contact { font-size: 10px; color: #555; margin-top: 6px; }
.section { margin-bottom: 12px; padding-bottom: 10px; border-bottom: 0.5px solid #ddd; }
.section-title { font-size: 12px; font-weight: 700; color: #333; margin-bottom: 6px; text-transform: uppercase; }
.entry { margin-bottom: 10px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 700; font-size: 12px; }
.entry-date { font-size: 10px; color: #666; }
.entry-sub { font-style: italic; color: #444; }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin-bottom: 2px; }
.skill-line { margin-bottom: 3px; }
`;
  let html = `<div class="header"><div class="name">${esc(c.name)}</div><div class="contact">${buildContactLine(c, '  |  ')}</div></div>`;
  if (data.summary) html += `<div class="section"><div class="section-title">Executive Summary</div><div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) html += `<div class="section"><div class="section-title">Professional Experience</div>${buildExpHTML(data.experience)}</div>`;
  if (data.education?.length) html += `<div class="section"><div class="section-title">Education</div>${buildEduHTML(data.education)}</div>`;
  if (normalizeSkills(data.skills).length) html += `<div class="section"><div class="section-title">Core Competencies</div>${buildSkillGroupsHTML(data.skills)}</div>`;
  if (data.achievements?.length) html += `<div class="section-title">Key Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printCompact(data: ResumeData): string {
  const c = data.contact || {};
  const css = `
body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.4; color: #222; }
.name { font-size: 20px; font-weight: 700; color: #111; }
.contact { font-size: 9px; color: #555; margin-top: 2px; }
.section-title { font-size: 10px; font-weight: 700; color: #444; border-bottom: 0.5px solid #ccc; padding-bottom: 1px; margin: 6px 0 3px; text-transform: uppercase; }
.entry { margin-bottom: 6px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 700; font-size: 10px; }
.entry-date { font-size: 9px; color: #666; }
.entry-sub { color: #444; }
ul { margin: 2px 0 0 14px; padding: 0; }
li { margin-bottom: 1px; }
.skill-line { margin-bottom: 2px; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, ' | ')}</div>`;
  if (data.summary) html += `<div class="section-title">Summary</div><div>${esc(data.summary)}</div>`;
  if (data.experience?.length) html += `<div class="section-title">Experience</div>${buildExpHTML(data.experience, { compactTitle: true })}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Skills</div>${buildSkillGroupsHTML(data.skills)}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printBold(data: ResumeData): string {
  const c = data.contact || {};
  const green = '#057642';
  const css = `
body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.5; color: #222; }
.name { font-size: 36px; font-weight: 900; color: #111; font-family: Arial Black, Arial, sans-serif; }
.contact { font-size: 10px; color: #555; margin-top: 4px; }
.section-title { font-size: 14px; font-weight: 900; color: ${green}; margin: 14px 0 6px; text-transform: uppercase; font-family: Arial Black, Arial, sans-serif; }
.entry { margin-bottom: 12px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 900; font-size: 12px; color: #111; }
.entry-date { font-size: 10px; color: #666; }
.entry-sub { font-weight: 700; color: #333; }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin-bottom: 2px; }
.skill-line { margin-bottom: 4px; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, '  |  ')}</div>`;
  if (data.summary) html += `<div class="section-title">Summary</div><div>${esc(data.summary)}</div>`;
  if (data.experience?.length) html += `<div class="section-title">Experience</div>${buildExpHTML(data.experience)}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Skills</div>${buildSkillGroupsHTML(data.skills)}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printElegant(data: ResumeData): string {
  const c = data.contact || {};
  const css = `
body { font-family: Garamond, Georgia, Times New Roman, serif; font-size: 11px; line-height: 1.55; color: #333; }
.header { text-align: center; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 0.5px solid #ccc; }
.name { font-size: 26px; font-weight: 400; color: #222; letter-spacing: 3px; font-variant: small-caps; }
.contact { font-size: 10px; color: #777; margin-top: 6px; letter-spacing: 0.5px; }
.section-title { font-size: 10px; font-weight: 600; color: #555; letter-spacing: 2px; text-transform: uppercase; margin: 14px 0 6px; padding: 4px 8px; background: #F8F9FA; border: 0.5px solid #E5E7EB; font-variant: small-caps; }
.entry { margin-bottom: 10px; padding-left: 4px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 600; font-style: italic; }
.entry-date { font-size: 10px; color: #888; }
.entry-sub { color: #555; }
ul { margin: 4px 0 0 18px; padding: 0; color: #444; }
li { margin-bottom: 2px; }
.skill-line { margin-bottom: 3px; padding-left: 4px; }
`;
  let html = `<div class="header"><div class="name">${esc(c.name)}</div><div class="contact">${buildContactLine(c, '  &middot;  ')}</div></div>`;
  if (data.summary) html += `<div class="section-title">Professional Summary</div><div style="padding-left:4px">${esc(data.summary)}</div>`;
  if (data.experience?.length) html += `<div class="section-title">Professional Experience</div>${buildExpHTML(data.experience)}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Skills &amp; Competencies</div>${buildSkillGroupsHTML(data.skills)}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printTechnical(data: ResumeData): string {
  const c = data.contact || {};
  const blue = '#0A66C2';
  const css = `
body { font-family: Segoe UI, Arial, sans-serif; font-size: 10.5px; line-height: 1.5; color: #222; }
.name { font-size: 24px; font-weight: 700; color: #111; }
.contact { font-size: 10px; color: #555; margin-top: 4px; font-family: Consolas, Monaco, monospace; }
.section-title { font-size: 11px; font-weight: 700; color: ${blue}; margin: 12px 0 6px; text-transform: uppercase; }
.section-title:before { content: "// "; font-family: Consolas, Monaco, monospace; }
.entry { margin-bottom: 10px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 700; color: #111; }
.entry-date { font-size: 10px; color: #666; }
.entry-sub { color: ${blue}; }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin-bottom: 2px; }
.code-block { margin-bottom: 4px; padding: 4px 8px; background: #F5F7FA; border: 1px solid #E5E7EB; font-family: Consolas, Monaco, monospace; font-size: 10px; }
.code-label { color: ${blue}; font-weight: 600; }
.brace { color: #666; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, '  |  ')}</div>`;
  if (data.summary) html += `<div class="section-title">Summary</div><div>${esc(data.summary)}</div>`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Technical Skills</div>${buildSkillGroupsHTML(data.skills, 'code')}`;
  if (data.experience?.length) html += `<div class="section-title">Experience</div>${buildExpHTML(data.experience)}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printCreative(data: ResumeData): string {
  const c = data.contact || {};
  const orange = '#E16B00';
  const css = `
body { font-family: Helvetica Neue, Arial, sans-serif; font-size: 11px; line-height: 1.55; color: #333; }
.name { font-size: 30px; font-weight: 700; color: #111; }
.contact { font-size: 10px; color: #777; margin-top: 4px; }
.section-title { font-size: 12px; font-weight: 700; color: ${orange}; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: 1px; }
.entry { margin-bottom: 12px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 700; color: #111; }
.entry-date { font-size: 10px; color: #999; }
.entry-sub { color: #555; }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin-bottom: 2px; }
.skill-group { margin-bottom: 6px; }
.skill-group-label { font-weight: 600; font-size: 10px; color: #555; margin-bottom: 3px; }
.dot-item { display: inline-flex; align-items: center; margin-right: 12px; margin-bottom: 2px; }
.dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${orange}; margin-right: 5px; flex-shrink: 0; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, '  &middot;  ')}</div>`;
  if (data.summary) html += `<div class="section-title">Summary</div><div>${esc(data.summary)}</div>`;
  if (data.experience?.length) html += `<div class="section-title">Experience</div>${buildExpHTML(data.experience)}`;
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Skills</div>${buildSkillGroupsHTML(data.skills, 'dots')}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

function printCorporate(data: ResumeData): string {
  const c = data.contact || {};
  const navy = '#004182';
  const css = `
body { font-family: Cambria, Georgia, Times New Roman, serif; font-size: 11px; line-height: 1.55; color: #222; }
.name { font-size: 26px; font-weight: 700; color: ${navy}; }
.contact { font-size: 10px; color: #555; margin-top: 4px; font-family: Arial, sans-serif; }
.section-title { font-size: 12px; font-weight: 700; color: ${navy}; border-bottom: 2px solid ${navy}; padding-bottom: 2px; margin: 14px 0 6px; text-transform: uppercase; }
.entry { margin-bottom: 10px; }
.entry-header { display: flex; justify-content: space-between; flex-wrap: wrap; }
.entry-title { font-weight: 700; }
.entry-date { font-size: 10px; color: #666; }
.entry-sub { color: #444; font-style: italic; }
ul { margin: 4px 0 0 18px; padding: 0; }
li { margin-bottom: 2px; }
.skill-line { margin-bottom: 3px; }
`;
  let html = `<div class="name">${esc(c.name)}</div>`;
  html += `<div class="contact">${buildContactLine(c, '  |  ')}</div>`;
  if (data.summary) html += `<div class="section-title">Professional Summary</div><div>${esc(data.summary)}</div>`;
  // Corporate: education before experience
  if (data.education?.length) html += `<div class="section-title">Education</div>${buildEduHTML(data.education)}`;
  if (data.experience?.length) html += `<div class="section-title">Professional Experience</div>${buildExpHTML(data.experience)}`;
  if (normalizeSkills(data.skills).length) html += `<div class="section-title">Skills &amp; Qualifications</div>${buildSkillGroupsHTML(data.skills)}`;
  if (data.achievements?.length) html += `<div class="section-title">Achievements</div>${buildAchievementsHTML(data.achievements)}`;
  return wrapPrintHTML(html, css);
}

// ─── Main Print Renderer ─────────────────────────────────────────────────────

const printRenderers: Record<string, (data: ResumeData) => string> = {
  classic: printClassic,
  modern: printModern,
  minimal: printMinimal,
  executive: printExecutive,
  compact: printCompact,
  bold: printBold,
  elegant: printElegant,
  technical: printTechnical,
  creative: printCreative,
  corporate: printCorporate,
};

export function buildPrintHTML(data: ResumeData, templateId: string): string {
  const render = printRenderers[templateId] || printRenderers.classic;
  return render(data || {});
}

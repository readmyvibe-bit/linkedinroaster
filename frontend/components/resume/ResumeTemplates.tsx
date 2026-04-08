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

interface PersonalDetails {
  dob?: string;
  gender?: string;
  nationality?: string;
  father_name?: string;
  declaration_place?: string;
  declaration_date?: string;
}

interface CustomSection {
  title: string;
  items: string[];
}

interface ResumeData {
  contact?: ContactInfo;
  photo?: string;
  personal?: PersonalDetails;
  summary?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: SkillsData;
  achievements?: string[];
  custom_sections?: CustomSection[];
  printSize?: 'compact' | 'standard' | 'spacious';
  fitOnePage?: boolean;
}

interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  atsLevel?: 'high' | 'medium' | 'low';
  ats: 'high' | 'medium';
  bestFor?: string[];
}

// ─── Template Definitions ────────────────────────────────────────────────────

export const TEMPLATES: (TemplateDefinition & { proOnly?: boolean })[] = [
  // 11 templates — all single-column, ATS-optimized
  { id: 'classic', name: 'Classic Professional', description: 'Traditional clean layout. Maximum ATS compatibility.', category: 'ATS-Friendly', atsLevel: 'high', ats: 'high', bestFor: ['any', 'general', 'corporate'] },
  { id: 'modern', name: 'Modern Accent', description: 'Blue accent styling with skill tags. ATS safe.', category: 'ATS-Friendly', atsLevel: 'high', ats: 'high', bestFor: ['tech', 'analyst', 'engineer'] },
  { id: 'minimal', name: 'Minimalist', description: 'Ultra clean with maximum whitespace.', category: 'ATS-Friendly', atsLevel: 'high', ats: 'high', bestFor: ['consulting', 'finance', 'any'] },
  { id: 'compact', name: 'Compact Dense', description: 'Maximum content in minimum space.', category: 'ATS-Friendly', atsLevel: 'high', ats: 'high', bestFor: ['experienced', 'senior', 'any'] },
  { id: 'technical', name: 'Technical Developer', description: 'Code-inspired design for engineering roles.', category: 'ATS-Friendly', atsLevel: 'high', ats: 'high', bestFor: ['engineer', 'developer', 'tech', 'devops'] },
  { id: 'bold', name: 'Bold Statement', description: 'High impact with strong visual hierarchy.', category: 'Professional', atsLevel: 'high', ats: 'medium', bestFor: ['sales', 'marketing', 'leadership'] },
  { id: 'monochrome', name: 'Monochrome Prestige', description: 'Pure black and white luxury typography.', category: 'Professional', atsLevel: 'high', ats: 'high', bestFor: ['corporate', 'finance', 'law'] },
  { id: 'headline', name: 'Headline Impact', description: 'Large summary section. Perfect for sales and CS roles.', category: 'Professional', atsLevel: 'high', ats: 'high', bestFor: ['sales', 'customer success', 'account manager'] },
  { id: 'campus', name: 'Campus Placement', description: 'Indian campus format. Photo, personal details, education-first.', category: 'India', atsLevel: 'high', ats: 'medium', bestFor: ['fresher', 'student', 'campus'] },
  { id: 'salesbd', name: 'Sales & BD', description: 'Metrics-forward layout for sales and business development.', category: 'India', atsLevel: 'high', ats: 'high', bestFor: ['sales', 'business development', 'account manager', 'customer success'] },
  { id: 'skylight', name: 'Aviation & Hospitality', description: 'Photo layout for cabin crew, aviation, and hospitality roles.', category: 'India', atsLevel: 'high', ats: 'medium', bestFor: ['cabin crew', 'aviation', 'hospitality'] },
];

// ─── Template Recommendation ─────────────────────────────────────────────────

export function getRecommendedTemplates(targetRole: string, isPro: boolean): string[] {
  const role = (targetRole || '').toLowerCase();
  const scored = TEMPLATES
    .filter(t => isPro || !(t as any).proOnly)
    .map(t => {
      let score = 0;
      // Match role keywords against bestFor
      for (const keyword of (t.bestFor || [])) {
        if (role.includes(keyword) || keyword === 'any') score += 10;
      }
      // Prefer high ATS templates
      if (t.atsLevel === 'high') score += 5;
      else if (t.atsLevel === 'medium') score += 2;
      return { id: t.id, score };
    })
    .sort((a, b) => b.score - a.score);
  // Return top 3, fallback to classic if no match
  const top = scored.filter(s => s.score > 0).slice(0, 3).map(s => s.id);
  return top.length > 0 ? top : ['classic', 'modern', 'minimal'];
}

// ─── Content Density Calculator ──────────────────────────────────────────────

export function getContentDensity(data: ResumeData): 'sparse' | 'medium' | 'dense' {
  let score = 0;
  const totalBullets = (data.experience || []).reduce((s, e) => s + (e.bullets?.length || 0), 0);
  score += totalBullets;
  if (data.summary) score += Math.min(data.summary.length / 50, 5);
  score += (data.experience?.length || 0) * 2;
  score += (data.education?.length || 0);
  const skillsArr = Array.isArray(data.skills) ? data.skills : [];
  score += skillsArr.length > 0 ? 2 : 0;
  score += (data.achievements?.length || 0);
  if (score <= 8) return 'sparse';
  if (score <= 20) return 'medium';
  return 'dense';
}

export function getAdaptiveSpacingStyle(density: 'sparse' | 'medium' | 'dense', printSize?: string): React.CSSProperties {
  // Don't override if user explicitly chose compact or spacious
  if (printSize === 'compact' || printSize === 'spacious') return {};
  if (density === 'sparse') return { lineHeight: '1.75', fontSize: '12.5px' };
  if (density === 'medium') return { lineHeight: '1.6' };
  return {};
}

export function getAdaptiveSpacingCSS(density: 'sparse' | 'medium' | 'dense', printSize?: string): string {
  if (printSize === 'compact' || printSize === 'spacious') return '';
  if (density === 'sparse') {
    return `
      body { line-height: 1.75 !important; font-size: 12.5px !important; }
      body div, body p, body li { margin-bottom: 6px !important; }
      h2, h3 { margin-top: 16px !important; margin-bottom: 10px !important; }
    `;
  }
  if (density === 'medium') {
    return `
      body { line-height: 1.6 !important; }
      h2, h3 { margin-bottom: 8px !important; }
    `;
  }
  return '';
}

// ─── Design Tokens ──────────────────────────────────────────────────────────

const T = {
  // Spacing scale (px)
  sp: { xs: 2, sm: 4, md: 8, lg: 14, xl: 24, '2xl': 40 },
  // Font sizes (px)
  fs: { xs: 9, sm: 10, body: 11, md: 12, lg: 15, xl: 20, '2xl': 26, '3xl': 28, '4xl': 34 },
  // Line heights
  lh: { tight: 1.3, normal: 1.5, relaxed: 1.6, loose: 1.75 },
  // Font families
  ff: {
    sans: 'Arial, Helvetica, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Courier New", Courier, monospace',
  },
  // Neutral palette
  c: {
    black: '#111',
    text: '#374151',
    muted: '#555',
    light: '#666',
    border: '#D1D5DB',
    bg: '#F8FAFC',
    white: '#FFFFFF',
  },
  // Accent colors (per-template override)
  accent: {
    blue: '#0A66C2',
    green: '#057642',
    red: '#991B1B',
    teal: '#0D9488',
    gold: '#B8860B',
    indigo: '#4F46E5',
    orange: '#EA580C',
    navy: '#004182',
    slate: '#334155',
    cyan: '#0891B2',
  },
  // Radii
  r: { sm: 4, md: 8 },
} as const;

// ─── Shared JSX Builders ────────────────────────────────────────────────────

interface SectionStyle {
  headerFontSize?: number;
  headerColor?: string;
  headerBorder?: string;
  headerTransform?: 'uppercase' | 'none';
  sectionGap?: number;
}

function SectionHeader({ title, style: s }: { title: string; style: SectionStyle }) {
  return (
    <div style={{
      fontSize: s.headerFontSize || T.fs.body,
      fontWeight: 700,
      textTransform: (s.headerTransform || 'uppercase') as any,
      color: s.headerColor || T.c.text,
      borderBottom: s.headerBorder || `1px solid ${T.c.border}`,
      paddingBottom: T.sp.xs,
      marginBottom: T.sp.md,
    }}>{title}</div>
  );
}

function ExperienceBlock({ data, dateColor, titleColor, bullet }: {
  data: ResumeData; dateColor?: string; titleColor?: string; bullet?: string;
}) {
  if (!data.experience?.length) return null;
  return (
    <>
      {data.experience.map((exp, i) => (
        <div key={i} style={{ marginBottom: T.sp.lg - 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: titleColor || T.c.black }}>{getExpTitle(exp)}</span>
            <span style={{ fontSize: T.fs.sm, color: dateColor || T.c.light, fontStyle: 'italic' }}>{getExpDates(exp)}</span>
          </div>
          <div style={{ color: T.c.muted, fontStyle: 'italic' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
          {exp.bullets && exp.bullets.length > 0 && (
            <div style={{ marginTop: T.sp.sm }}>
              {exp.bullets.map((b, j) => (
                <div key={j} style={{ paddingLeft: 12, textIndent: -12, marginBottom: T.sp.xs }}>{bullet || '•'} {b}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

function EducationBlock({ data, dateColor }: { data: ResumeData; dateColor?: string }) {
  if (!data.education?.length) return null;
  return (
    <>
      {data.education.map((edu, i) => (
        <div key={i} style={{ marginBottom: T.sp.md - 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span>
            <span style={{ fontSize: T.fs.sm, color: dateColor || T.c.light, fontStyle: 'italic' }}>{getEduDates(edu)}</span>
          </div>
          <div style={{ color: T.c.muted }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
        </div>
      ))}
    </>
  );
}

function SkillsGrouped({ data }: { data: ResumeData }) {
  const groups = normalizeSkills(data.skills);
  if (!groups.length) return null;
  return (
    <>
      {groups.map((g, i) => (
        <div key={i} style={{ marginBottom: T.sp.sm }}>
          {groups.length > 1 && <span style={{ fontWeight: 700, fontSize: T.fs.sm }}>{g.label}: </span>}
          <span>{g.items.join(', ')}</span>
        </div>
      ))}
    </>
  );
}

function SkillTags({ data, bgColor, textColor }: { data: ResumeData; bgColor?: string; textColor?: string }) {
  const allSkills = flattenSkills(data.skills);
  if (!allSkills.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: T.sp.md - 2 }}>
      {allSkills.map((s, i) => (
        <span key={i} style={{ background: bgColor || '#EFF6FF', color: textColor || '#1D4ED8', borderRadius: T.r.sm, padding: `${T.sp.xs}px ${T.sp.md}px`, fontSize: T.fs.sm }}>{s}</span>
      ))}
    </div>
  );
}

function AchievementsBlock({ data, bullet }: { data: ResumeData; bullet?: string }) {
  if (!data.achievements?.length) return null;
  return (
    <>
      {data.achievements.map((a, i) => (
        <div key={i} style={{ paddingLeft: 12, textIndent: -12, marginBottom: T.sp.xs }}>{bullet || '•'} {a}</div>
      ))}
    </>
  );
}

function CustomSectionsBlock({ data, bullet, headerStyle }: { data: ResumeData; bullet?: string; headerStyle?: SectionStyle }) {
  if (!data.custom_sections?.length) return null;
  const ss = headerStyle || { headerFontSize: T.fs.body, headerColor: T.c.text, headerBorder: `1px solid ${T.c.border}` };
  return (
    <>
      {data.custom_sections.map((sec, i) => (
        <div key={i} style={{ marginBottom: T.sp.lg }}>
          <SectionHeader title={sec.title} style={ss} />
          {sec.items.map((item, j) => (
            <div key={j} style={{ paddingLeft: 12, textIndent: -12, marginBottom: T.sp.xs }}>{bullet || '•'} {item}</div>
          ))}
        </div>
      ))}
    </>
  );
}

/** Ensure photo URL is absolute for print (required for window.open print) */
function resolvePhotoUrl(photo?: string): string {
  if (!photo) return '';
  // Already absolute or data URI
  if (photo.startsWith('http') || photo.startsWith('data:')) return photo;
  // Relative path — prepend origin
  if (typeof window !== 'undefined') return `${window.location.origin}${photo.startsWith('/') ? '' : '/'}${photo}`;
  return photo;
}

function ContactLine({ contact, separator, separatorColor }: { contact: ContactInfo; separator?: string; separatorColor?: string }) {
  const parts = [contact.email, contact.phone, contact.location, contact.linkedin, contact.website].filter(Boolean);
  if (!parts.length) return null;
  if (separatorColor) {
    return (
      <div style={{ fontSize: T.fs.sm, color: T.c.muted, marginTop: T.sp.sm }}>
        {parts.map((p, i) => <span key={i}>{i > 0 && <span style={{ color: separatorColor, margin: `0 ${T.sp.md - 2}px` }}>{separator || '|'}</span>}{p}</span>)}
      </div>
    );
  }
  return (
    <div style={{ fontSize: T.fs.sm, color: T.c.muted, marginTop: T.sp.sm }}>{parts.join(separator ? `  ${separator}  ` : '  |  ')}</div>
  );
}

// ─── Generic Single-Column Renderer ─────────────────────────────────────────

interface TemplateSkin {
  font: string;
  fontSize: number;
  lineHeight: number;
  textColor: string;
  padding: number;
  // Header
  nameSize: number;
  nameColor: string;
  nameAlign?: 'left' | 'center';
  nameExtra?: React.ReactNode;
  contactColor?: string;
  contactSepColor?: string;
  // Section headers
  sectionFontSize: number;
  sectionColor: string;
  sectionBorder: string;
  sectionTransform?: 'uppercase' | 'none';
  sectionLetterSpacing?: number;
  sectionFontVariant?: string;
  // Spacing
  sectionGap: number;
  headerDivider?: string;
  // Content
  dateColor?: string;
  titleColor?: string;
  bulletChar?: string;
  companyColor?: string;
  // Skills mode
  skillsMode?: 'grouped' | 'tags' | 'inline';
  skillTagBg?: string;
  skillTagColor?: string;
  // Wrapper
  borderLeft?: string;
  paddingLeft?: number;
  background?: string;
  // Sections config
  sections?: { summary?: string; experience?: string; education?: string; skills?: string; achievements?: string };
}

function renderSingleColumn(data: ResumeData, skin: TemplateSkin): React.ReactNode {
  const c = data.contact || {};
  const sec = skin.sections || {};
  const ss: SectionStyle = {
    headerFontSize: skin.sectionFontSize,
    headerColor: skin.sectionColor,
    headerBorder: skin.sectionBorder,
    headerTransform: skin.sectionTransform || 'uppercase',
  };
  const headerStyle: React.CSSProperties = skin.sectionFontVariant
    ? { fontSize: skin.sectionFontSize, fontVariant: skin.sectionFontVariant as any, color: skin.sectionColor, borderBottom: skin.sectionBorder, paddingBottom: T.sp.sm, marginBottom: T.sp.md, letterSpacing: skin.sectionLetterSpacing || 0 }
    : {};
  const useCustomHeader = !!skin.sectionFontVariant;

  const Hdr = ({ title }: { title: string }) => useCustomHeader
    ? <div style={headerStyle}>{title}</div>
    : <SectionHeader title={title} style={ss} />;

  return (
    <div style={{
      fontFamily: skin.font, fontSize: skin.fontSize, lineHeight: skin.lineHeight,
      color: skin.textColor, padding: skin.padding, paddingLeft: skin.paddingLeft || skin.padding,
      maxWidth: 800, borderLeft: skin.borderLeft, background: skin.background,
    }}>
      <div style={{ textAlign: skin.nameAlign || 'left', marginBottom: skin.sectionGap }}>
        <div style={{ fontSize: skin.nameSize, fontWeight: 700, color: skin.nameColor }}>{c.name || 'Your Name'}</div>
        {skin.nameExtra}
        <ContactLine contact={c} separatorColor={skin.contactSepColor} />
      </div>
      {skin.headerDivider && <div style={{ borderBottom: skin.headerDivider, marginBottom: skin.sectionGap }} />}
      {data.summary && <div style={{ marginBottom: skin.sectionGap }}><Hdr title={sec.summary || 'Summary'} /><div>{data.summary}</div></div>}
      {data.experience?.length ? <div style={{ marginBottom: skin.sectionGap }}><Hdr title={sec.experience || 'Experience'} /><ExperienceBlock data={data} dateColor={skin.dateColor} titleColor={skin.titleColor} bullet={skin.bulletChar} /></div> : null}
      {data.education?.length ? <div style={{ marginBottom: skin.sectionGap }}><Hdr title={sec.education || 'Education'} /><EducationBlock data={data} dateColor={skin.dateColor} /></div> : null}
      {skin.skillsMode === 'tags' && flattenSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: skin.sectionGap }}><Hdr title={sec.skills || 'Skills'} /><SkillTags data={data} bgColor={skin.skillTagBg} textColor={skin.skillTagColor} /></div>
      )}
      {skin.skillsMode !== 'tags' && normalizeSkills(data.skills).length > 0 && (
        <div style={{ marginBottom: skin.sectionGap }}><Hdr title={sec.skills || 'Skills'} /><SkillsGrouped data={data} /></div>
      )}
      {data.achievements?.length ? <div style={{ marginBottom: skin.sectionGap }}><Hdr title={sec.achievements || 'Achievements'} /><AchievementsBlock data={data} bullet={skin.bulletChar} /></div> : null}
      <CustomSectionsBlock data={data} bullet={skin.bulletChar} headerStyle={ss} />
    </div>
  );
}

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
  const ss: SectionStyle = { headerFontSize: T.fs.body, headerColor: T.c.text, headerBorder: `1px solid ${T.c.border}` };
  return (
    <div style={{ fontFamily: T.ff.sans, fontSize: T.fs.body, lineHeight: T.lh.normal, color: T.c.text, padding: T.sp['2xl'], maxWidth: 800 }}>
      <div style={{ marginBottom: T.sp.lg - 2 }}>
        <div style={{ fontSize: T.fs['2xl'], fontWeight: 700, color: T.c.black }}>{c.name || 'Your Name'}</div>
        <ContactLine contact={c} />
      </div>
      <div style={{ borderBottom: `1px solid ${T.c.border}`, marginBottom: T.sp.lg }} />
      {data.summary && <div style={{ marginBottom: T.sp.lg }}><SectionHeader title="Summary" style={ss} /><div>{data.summary}</div></div>}
      {data.experience?.length ? <div style={{ marginBottom: T.sp.lg }}><SectionHeader title="Experience" style={ss} /><ExperienceBlock data={data} /></div> : null}
      {data.education?.length ? <div style={{ marginBottom: T.sp.lg }}><SectionHeader title="Education" style={ss} /><EducationBlock data={data} /></div> : null}
      {normalizeSkills(data.skills).length > 0 && <div style={{ marginBottom: T.sp.lg }}><SectionHeader title="Skills" style={ss} /><SkillsGrouped data={data} /></div>}
      {data.achievements?.length ? <div style={{ marginBottom: T.sp.lg }}><SectionHeader title="Achievements" style={ss} /><AchievementsBlock data={data} /></div> : null}
    </div>
  );
}

// ─── 2. Modern Accent ───────────────────────────────────────────────────────

function renderModern(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const accent = T.accent.blue;
  const ss: SectionStyle = { headerFontSize: T.fs.md, headerColor: accent, headerBorder: 'none' };
  return (
    <div style={{ fontFamily: T.ff.sans, fontSize: T.fs.body, lineHeight: T.lh.normal, color: T.c.text, padding: T.sp['2xl'], paddingLeft: 44, maxWidth: 800, borderLeft: `4px solid ${accent}` }}>
      <div style={{ marginBottom: T.sp.xl - 8 }}>
        <div style={{ fontSize: T.fs['3xl'], fontWeight: 700, color: accent }}>{c.name || 'Your Name'}</div>
        <ContactLine contact={c} separatorColor={accent} />
      </div>
      {data.summary && <div style={{ marginBottom: T.sp.xl }}><SectionHeader title="SUMMARY" style={ss} /><div>{data.summary}</div></div>}
      {data.experience?.length ? <div style={{ marginBottom: T.sp.xl }}><SectionHeader title="EXPERIENCE" style={ss} /><ExperienceBlock data={data} /></div> : null}
      {data.education?.length ? <div style={{ marginBottom: T.sp.xl }}><SectionHeader title="EDUCATION" style={ss} /><EducationBlock data={data} /></div> : null}
      {flattenSkills(data.skills).length > 0 && <div style={{ marginBottom: T.sp.xl }}><SectionHeader title="SKILLS" style={{ ...ss, sectionGap: T.sp.md }} /><SkillTags data={data} /></div>}
      {data.achievements?.length ? <div style={{ marginBottom: T.sp.xl }}><SectionHeader title="ACHIEVEMENTS" style={ss} /><AchievementsBlock data={data} /></div> : null}
    </div>
  );
}

// ─── 3. Minimalist ──────────────────────────────────────────────────────────

function renderMinimal(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const ss: SectionStyle = { headerFontSize: T.fs.sm, headerColor: '#9CA3AF', headerBorder: 'none', headerTransform: 'uppercase' };
  return (
    <div style={{ fontFamily: T.ff.serif, fontSize: T.fs.body, lineHeight: T.lh.relaxed, color: T.c.text, padding: T.sp['2xl'], maxWidth: 800 }}>
      <div style={{ textAlign: 'center', marginBottom: T.sp.xl }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: T.c.black }}>{c.name || 'Your Name'}</div>
        <ContactLine contact={c} />
      </div>
      <div style={{ borderBottom: '0.5px solid #E5E7EB', marginBottom: 32 }} />
      {data.summary && <div style={{ marginBottom: 32 }}><SectionHeader title="Summary" style={ss} /><div>{data.summary}</div></div>}
      {data.experience?.length ? <div style={{ marginBottom: 32 }}><SectionHeader title="Experience" style={ss} /><ExperienceBlock data={data} dateColor="#999" bullet="—" /></div> : null}
      {data.education?.length ? <div style={{ marginBottom: 32 }}><SectionHeader title="Education" style={ss} /><EducationBlock data={data} dateColor="#999" /></div> : null}
      {normalizeSkills(data.skills).length > 0 && <div style={{ marginBottom: 32 }}><SectionHeader title="Skills" style={ss} /><SkillsGrouped data={data} /></div>}
      {data.achievements?.length ? <div style={{ marginBottom: 32 }}><SectionHeader title="Achievements" style={ss} /><AchievementsBlock data={data} bullet="—" /></div> : null}
    </div>
  );
}

// ─── 4. Executive Premium ───────────────────────────────────────────────────

function renderExecutive(data: ResumeData): React.ReactNode {
  return renderSingleColumn(data, {
    font: T.ff.serif, fontSize: T.fs.md, lineHeight: T.lh.relaxed, textColor: T.c.text, padding: 48,
    nameSize: 30, nameColor: '#111827', nameAlign: 'center',
    nameExtra: <div style={{ width: 60, height: 2, background: '#D4A574', margin: '8px auto' }} />,
    sectionFontSize: 13, sectionColor: T.c.text, sectionBorder: `3px double ${T.c.border}`,
    sectionFontVariant: 'small-caps', sectionLetterSpacing: 1, sectionGap: 20,
    headerDivider: undefined,
    sections: { summary: 'Professional Summary', experience: 'Professional Experience', skills: 'Skills & Competencies', achievements: 'Key Achievements' },
  });
}

// ─── 5. Compact Dense ───────────────────────────────────────────────────────

function renderCompact(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const allSkills = flattenSkills(data.skills);
  const ss: SectionStyle = { headerFontSize: T.fs.xs, headerColor: T.c.muted, headerBorder: '0.5px solid #E5E7EB' };
  return (
    <div style={{ fontFamily: T.ff.sans, fontSize: T.fs.sm, lineHeight: T.lh.tight + 0.1, color: '#333', padding: `${T.sp.xl}px 32px`, maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', marginBottom: T.sp.md - 2 }}>
        <div style={{ fontSize: T.fs.xl, fontWeight: 700, color: T.c.black }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && <div style={{ fontSize: T.fs.xs, color: T.c.light, textAlign: 'right' }}>{contactParts.join(' | ')}</div>}
      </div>
      <div style={{ borderBottom: `0.5px solid ${T.c.border}`, marginBottom: T.sp.md - 2 }} />
      {data.summary && <div style={{ marginBottom: T.sp.md - 2 }}><SectionHeader title="Summary" style={ss} /><div>{data.summary}</div></div>}
      {data.experience?.length ? (
        <div style={{ marginBottom: T.sp.md - 2 }}>
          <SectionHeader title="Experience" style={ss} />
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: T.sp.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span><span style={{ fontWeight: 700 }}>{getExpTitle(exp)}</span>{exp.company ? `, ${exp.company}` : ''}{exp.location ? ` — ${exp.location}` : ''}</span>
                <span style={{ fontSize: T.fs.xs, color: '#888', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              {exp.bullets?.length ? <div style={{ marginTop: T.sp.xs }}>{exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: 10, textIndent: -10, marginBottom: 1 }}>• {b}</div>)}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
      {data.education?.length ? (
        <div style={{ marginBottom: T.sp.md - 2 }}>
          <SectionHeader title="Education" style={ss} />
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: T.sp.sm, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span><span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span> — {getEduSchool(edu)}{edu.gpa ? ` (GPA: ${edu.gpa})` : ''}</span>
              <span style={{ fontSize: T.fs.xs, color: '#888', fontStyle: 'italic' }}>{getEduDates(edu)}</span>
            </div>
          ))}
        </div>
      ) : null}
      {allSkills.length > 0 && <div style={{ marginBottom: T.sp.md - 2 }}><SectionHeader title="Skills" style={ss} /><div>{allSkills.join(', ')}</div></div>}
      {data.achievements?.length ? (
        <div style={{ marginBottom: T.sp.md - 2 }}>
          <SectionHeader title="Achievements" style={ss} />
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: 10, textIndent: -10, marginBottom: 1 }}>• {a}</div>)}
        </div>
      ) : null}
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
  return renderSingleColumn(data, {
    font: T.ff.sans, fontSize: T.fs.body, lineHeight: T.lh.normal, textColor: '#333', padding: T.sp['2xl'],
    nameSize: 30, nameColor: '#000', nameAlign: 'left',
    sectionFontSize: T.fs.md, sectionColor: '#000', sectionBorder: '2px solid #000', sectionLetterSpacing: 3, sectionGap: 28,
    titleColor: '#000',
  });
}

// ─── 14. Professional Serif ────────────────────────────────────────────────

function renderSerif(data: ResumeData): React.ReactNode {
  return renderSingleColumn(data, {
    font: T.ff.serif, fontSize: 11.5, lineHeight: 1.7, textColor: '#333', padding: T.sp['2xl'],
    nameSize: T.fs['2xl'], nameColor: '#1a1a1a', nameAlign: 'left',
    sectionFontSize: 13, sectionColor: '#333', sectionBorder: '1px solid #ccc', sectionTransform: 'none', sectionGap: 16,
    titleColor: '#1a1a1a', bulletChar: '–',
  });
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
    <div style={{ textAlign: 'center' as const, margin: '14px 0' }}>
      <span style={{ display: 'inline-block', width: '24px', height: '2px', background: '#D1D5DB', verticalAlign: 'middle' }} />
      <span style={{ display: 'inline-block', margin: '0 6px', color: '#D1D5DB', fontSize: '8px', verticalAlign: 'middle' }}>◆</span>
      <span style={{ display: 'inline-block', width: '24px', height: '2px', background: '#D1D5DB', verticalAlign: 'middle' }} />
    </div>
  );
  const sectionHdr = (t: string) => (
    <div style={{ fontSize: '12px', fontWeight: 700, color: '#555', textTransform: 'uppercase' as const, marginBottom: '6px' }}>{t}</div>
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
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', lineHeight: 1.55, color: '#374151', padding: '28px 32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: '#111' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && (
          <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>
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
  return renderSingleColumn(data, {
    font: T.ff.sans, fontSize: T.fs.body, lineHeight: T.lh.normal, textColor: T.c.text, padding: T.sp['2xl'],
    nameSize: T.fs['3xl'], nameColor: T.accent.red, nameAlign: 'left',
    sectionFontSize: T.fs.md, sectionColor: T.accent.red, sectionBorder: `2px solid ${T.accent.red}`, sectionGap: 16,
    skillsMode: 'tags', skillTagBg: '#FEE2E2', skillTagColor: T.accent.red,
  });
}

// ─── 18. Ocean Professional ────────────────────────────────────────────────

function renderOcean(data: ResumeData): React.ReactNode {
  return renderSingleColumn(data, {
    font: T.ff.sans, fontSize: T.fs.body, lineHeight: T.lh.normal, textColor: T.c.text, padding: T.sp['2xl'],
    nameSize: T.fs['2xl'], nameColor: T.accent.teal, nameAlign: 'left',
    sectionFontSize: T.fs.body, sectionColor: T.accent.teal, sectionBorder: `1px solid ${T.accent.teal}`, sectionGap: T.sp.lg,
    skillsMode: 'tags', skillTagBg: '#F0FDFA', skillTagColor: T.accent.teal,
    bulletChar: '●',
  });
}

// ─── 19. Slate & Gold ──────────────────────────────────────────────────────

function renderSlateGold(data: ResumeData): React.ReactNode {
  return renderSingleColumn(data, {
    font: T.ff.sans, fontSize: T.fs.body, lineHeight: T.lh.normal, textColor: '#475569', padding: T.sp['2xl'],
    nameSize: T.fs['3xl'], nameColor: T.accent.slate, nameAlign: 'left',
    nameExtra: <div style={{ width: 80, height: 2, background: T.accent.gold, marginTop: 6 }} />,
    sectionFontSize: T.fs.md, sectionColor: T.accent.slate, sectionBorder: `1px solid ${T.accent.gold}`, sectionGap: 16,
    dateColor: '#64748B', titleColor: T.accent.slate, companyColor: '#64748B',
  });
}

// ─── 20. Indigo Modern ─────────────────────────────────────────────────────

function renderIndigo(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  return renderSingleColumn(data, {
    font: T.ff.sans, fontSize: T.fs.body, lineHeight: T.lh.normal, textColor: T.c.text, padding: T.sp['2xl'],
    nameSize: T.fs['2xl'], nameColor: T.accent.indigo, nameAlign: 'left',
    contactSepColor: T.accent.indigo,
    sectionFontSize: T.fs.body, sectionColor: T.accent.indigo, sectionBorder: 'none', sectionGap: T.sp.lg,
    skillsMode: 'tags', skillTagBg: '#EEF2FF', skillTagColor: T.accent.indigo,
  });
}

// ─── Render: Campus Placement (India) ──────────────────────────────────────
function renderCampus(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const p = data.personal || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const sectionHeader = (title: string) => (
    <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#1e3a5f', background: '#e8eef4', padding: '5px 12px', marginBottom: '10px', letterSpacing: '1px', borderLeft: '4px solid #1e3a5f' }}>{title}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', lineHeight: 1.55, color: '#333', padding: '24px 28px', maxWidth: '800px' }}>
      {/* Header with photo */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' }}>
        {data.photo ? (
          <img src={resolvePhotoUrl(data.photo)} alt="Photo" style={{ width: '90px', height: '110px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc', flexShrink: 0 }} />
        ) : (
          <div style={{ width: '90px', height: '110px', border: '1px solid #ccc', borderRadius: '4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', color: '#999', textAlign: 'center' }}>Upload<br/>Photo</div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a5f' }}>{c.name || 'Your Name'}</div>
          {contactParts.length > 0 && <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>}
          <div style={{ fontSize: '11px', color: '#555', marginTop: '5px', borderTop: '1px solid #ddd', paddingTop: '5px' }}>
            {p.dob && <>Date of Birth: {p.dob} &nbsp;&nbsp;</>}
            {p.gender && <>Gender: {p.gender} &nbsp;&nbsp;</>}
            Nationality: {p.nationality || 'Indian'}
            {p.father_name && <> &nbsp;&nbsp; Father{"'"}s Name: {p.father_name}</>}
          </div>
        </div>
      </div>
      <div style={{ borderBottom: '2px solid #1e3a5f', marginBottom: '12px' }} />
      {/* Objective / Summary */}
      {data.summary && <div style={{ marginBottom: '12px' }}>{sectionHeader('Career Objective')}<div style={{ paddingLeft: '4px' }}>{data.summary}</div></div>}
      {/* Education FIRST */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {sectionHeader('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ padding: '8px 10px', background: i % 2 === 0 ? '#f0f4f8' : 'transparent', borderBottom: '1px solid #ddd', marginBottom: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#111' }}>{getEduDegree(edu)}</span>
                <span style={{ fontSize: '11px', color: '#666' }}>{getEduDates(edu)}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#555' }}>{getEduSchool(edu)}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</div>
            </div>
          ))}
        </div>
      )}
      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {sectionHeader('Experience / Internships')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#1e3a5f' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic', fontSize: '11px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '3px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '1px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Skills */}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {sectionHeader('Technical & Soft Skills')}
          {skillGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '3px', paddingLeft: '4px' }}>
              {skillGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '10px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {sectionHeader('Achievements & Activities')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '1px' }}>• {a}</div>)}
        </div>
      )}
      {/* Declaration */}
      <div style={{ marginTop: '12px', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e3a5f', marginBottom: '3px' }}>DECLARATION</div>
        <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.5 }}>
          I hereby declare that the information furnished above is true to the best of my knowledge and belief.
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '11px', color: '#555' }}>
          <div>Place: {p.declaration_place || '__________'} &nbsp; Date: {p.declaration_date || '__________'}</div>
          <div style={{ textAlign: 'right' }}><span style={{ fontWeight: 600, color: '#1e3a5f' }}>{c.name || '(Your Name)'}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Render: Fresher & Intern ──────────────────────────────────────────────
function renderFresher(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const sideHdr = (t: string) => <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#6366F1', letterSpacing: '1.5px', marginBottom: '10px' }}>{t}</div>;
  const mainHdr = (t: string) => <div style={{ fontSize: '15px', fontWeight: 700, textTransform: 'uppercase' as const, color: '#1E1B4B', borderBottom: '2px solid #6366F1', paddingBottom: '3px', marginBottom: '12px' }}>{t}</div>;
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '14.5px', lineHeight: 1.6, maxWidth: '800px' }}>
      {/* Full-width header */}
      <div style={{ background: 'linear-gradient(135deg, #312E81, #4338CA)', padding: '20px 22px', color: 'white' }}>
        <div style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '0.5px' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && <div style={{ fontSize: '13px', opacity: 0.85, marginTop: '5px' }}>{contactParts.join('  •  ')}</div>}
      </div>
      <div style={{ display: 'flex' }}>
        {/* Left sidebar */}
        <div style={{ width: '33%', background: '#F5F3FF', padding: '16px 14px', minHeight: '500px', borderRight: '1px solid #E5E7EB' }}>
          {data.education && data.education.length > 0 && (
            <div style={{ marginBottom: '18px' }}>
              {sideHdr('Education')}
              {data.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E1B4B' }}>{getEduDegree(edu)}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{getEduSchool(edu)}</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{getEduDates(edu)}{edu.gpa ? ` — ${edu.gpa}` : ''}</div>
                </div>
              ))}
            </div>
          )}
          {skillGroups.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {sideHdr('Skills')}
              {skillGroups.map((g, i) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  {skillGroups.length > 1 && <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, marginBottom: '5px' }}>{g.label}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {g.items.map((s, j) => <span key={j} style={{ background: '#E0E7FF', color: '#3730A3', borderRadius: '4px', padding: '3px 9px', fontSize: '12px', fontWeight: 500 }}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.achievements && data.achievements.length > 0 && (
            <div>
              {sideHdr('Achievements')}
              {data.achievements.map((a, i) => <div key={i} style={{ fontSize: '12px', color: '#4B5563', marginBottom: '6px', paddingLeft: '10px', textIndent: '-10px', lineHeight: 1.5 }}>▸ {a}</div>)}
            </div>
          )}
        </div>
        {/* Right main — Summary + Projects/Experience */}
        <div style={{ width: '67%', padding: '16px 20px', color: '#333' }}>
          {data.summary && <div style={{ marginBottom: '16px' }}>{mainHdr('Profile')}<div style={{ fontSize: '14px', color: '#374151', lineHeight: 1.65 }}>{data.summary}</div></div>}
          {data.experience && data.experience.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              {mainHdr('Projects & Experience')}
              {data.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#1E1B4B', fontSize: '14px' }}>{getExpTitle(exp)}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
                  </div>
                  <div style={{ color: '#6B7280', fontStyle: 'italic', fontSize: '13px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
                  {exp.bullets && exp.bullets.length > 0 && (
                    <div style={{ marginTop: '5px' }}>
                      {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '4px', fontSize: '13.5px', lineHeight: 1.55 }}>• {b}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Render: Sales & BD ────────────────────────────────────────────────────
function renderSalesBD(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr = (t: string) => <div style={{ fontSize: '14px', fontWeight: 800, textTransform: 'uppercase' as const, color: '#0F172A', letterSpacing: '2px', borderBottom: '3px solid #E16B00', paddingBottom: '4px', marginBottom: '12px' }}>{t}</div>;
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '14.5px', lineHeight: 1.6, color: '#333', padding: '20px 24px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ background: '#0F172A', padding: '18px 22px', borderRadius: '8px 8px 0 0', marginBottom: '0' }}>
        <div style={{ fontSize: '30px', fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>}
      </div>
      <div style={{ height: '4px', background: '#E16B00' }} />
      {/* Summary */}
      {data.summary && <div style={{ marginBottom: '16px', marginTop: '16px' }}>{hdr('Profile Summary')}<div style={{ fontSize: '14px', lineHeight: 1.65, color: '#374151' }}>{data.summary}</div></div>}
      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {hdr('Sales Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px', paddingLeft: '12px', borderLeft: '3px solid #E16B00' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '15px' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#64748B', fontStyle: 'italic', fontSize: '13px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '5px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '4px', fontSize: '14px', lineHeight: 1.55 }}>▸ {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {hdr('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div><span style={{ fontWeight: 700, color: '#0F172A' }}>{getEduDegree(edu)}</span> — <span style={{ color: '#64748B' }}>{getEduSchool(edu)}</span>{edu.gpa && <span style={{ color: '#94A3B8', fontSize: '11px' }}> — GPA: {edu.gpa}</span>}</div>
              <span style={{ fontSize: '10px', color: '#94A3B8' }}>{getEduDates(edu)}</span>
            </div>
          ))}
        </div>
      )}
      {/* Skills */}
      {skillGroups.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {hdr('Skills & Tools')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skillGroups.flatMap(g => g.items).map((s, i) => (
              <span key={i} style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FDBA74', borderRadius: '4px', padding: '4px 12px', fontSize: '13px', fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <div>
          {hdr('Key Wins')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '5px', fontSize: '14px', lineHeight: 1.55 }}>★ {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── Render: Operator Grid ─────────────────────────────────────────────────
function renderOperator(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr = (t: string) => (
    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#0F172A', borderLeft: '3px solid #06B6D4', paddingLeft: '10px', marginBottom: '10px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: '13px', lineHeight: 1.55, color: '#334155', maxWidth: '800px' }}>
      {/* Header band */}
      <div style={{ background: '#0F172A', padding: '22px 28px', marginBottom: '0' }}>
        <div style={{ fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', marginTop: '5px' }}>{contactParts.join('  |  ')}</div>}
      </div>
      <div style={{ height: '3px', background: '#06B6D4' }} />
      <div style={{ padding: '20px 28px' }}>
        {data.summary && <div style={{ marginBottom: '18px' }}>{hdr('Summary')}<div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.65 }}>{data.summary}</div></div>}
        {data.experience && data.experience.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            {hdr('Experience')}
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>{getExpTitle(exp)}</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
                </div>
                <div style={{ color: '#64748B', fontSize: '12px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div style={{ marginTop: '5px' }}>
                    {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '3px', fontSize: '13px' }}>• {b}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Skills as grid cells */}
        {skillGroups.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            {hdr('Skills')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {skillGroups.map((g, i) => (
                <div key={i} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 10px' }}>
                  {skillGroups.length > 1 && <div style={{ fontSize: '10px', fontWeight: 700, color: '#06B6D4', marginBottom: '3px' }}>{g.label}</div>}
                  <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>{g.items.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.education && data.education.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            {hdr('Education')}
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div><span style={{ fontWeight: 700, color: '#0F172A' }}>{getEduDegree(edu)}</span> — <span style={{ color: '#64748B' }}>{getEduSchool(edu)}</span>{edu.gpa && <span style={{ color: '#94A3B8', fontSize: '11px' }}> — GPA: {edu.gpa}</span>}</div>
                <span style={{ fontSize: '11px', color: '#94A3B8' }}>{getEduDates(edu)}</span>
              </div>
            ))}
          </div>
        )}
        {data.achievements && data.achievements.length > 0 && (
          <div style={{ background: 'rgba(6,182,212,0.06)', borderRadius: '8px', padding: '12px 14px' }}>
            {hdr('Key Achievements')}
            {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '3px', fontSize: '13px' }}>▸ {a}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Render: Editorial Canvas ──────────────────────────────────────────────
function renderEditorial(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr = (t: string) => (
    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#9A3412', marginBottom: '10px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: "'Georgia', serif", fontSize: '13px', lineHeight: 1.6, color: '#292524', background: '#FFFAF5', maxWidth: '800px' }}>
      {/* Header — asymmetric */}
      <div style={{ padding: '28px 28px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '36px', fontWeight: 700, color: '#171717', lineHeight: 1.1 }}>{c.name || 'Your Name'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {contactParts.map((p, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#78716C' }}>{p}</div>
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: '#C2410C', margin: '0 28px' }} />
      <div style={{ padding: '20px 28px' }}>
        {/* Summary as pull-quote */}
        {data.summary && (
          <div style={{ borderLeft: '4px solid #C2410C', paddingLeft: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#292524', lineHeight: 1.7, fontStyle: 'italic' }}>{data.summary}</div>
          </div>
        )}
        {data.experience && data.experience.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            {hdr('Experience')}
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#171717', fontSize: '14px', fontFamily: "'Segoe UI', Arial, sans-serif" }}>{getExpTitle(exp)}</span>
                  <span style={{ fontSize: '11px', color: '#78716C' }}>{getExpDates(exp)}</span>
                </div>
                <div style={{ color: '#C2410C', fontSize: '12px', fontWeight: 600 }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
                {exp.bullets && exp.bullets.length > 0 && (
                  <div style={{ marginTop: '5px' }}>
                    {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '3px', fontSize: '13px', color: '#44403C' }}>– {b}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {skillGroups.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            {hdr('Skills')}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skillGroups.flatMap(g => g.items).map((s, i) => (
                <span key={i} style={{ border: '1px solid #FDBA74', color: '#9A3412', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', background: 'transparent' }}>{s}</span>
              ))}
            </div>
          </div>
        )}
        {data.education && data.education.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            {hdr('Education')}
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid #FED7AA', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <div><span style={{ fontWeight: 700, color: '#171717' }}>{getEduDegree(edu)}</span> — <span style={{ color: '#78716C' }}>{getEduSchool(edu)}</span></div>
                <span style={{ fontSize: '11px', color: '#A8A29E' }}>{getEduDates(edu)}</span>
              </div>
            ))}
          </div>
        )}
        {data.achievements && data.achievements.length > 0 && (
          <div>
            {hdr('Achievements')}
            {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '3px', fontSize: '13px', color: '#44403C' }}>✦ {a}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Render: Skylight Cabin ───────────────────────────────────────────────
function renderSkylight(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const languages = skillGroups.find(g => g.label.toLowerCase().includes('language'));
  const certifications = skillGroups.find(g => g.label.toLowerCase().includes('certif'));
  const otherGroups = skillGroups.filter(g => g !== languages && g !== certifications);
  const sectionHeader = (title: string) => (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#1E3A5F', borderBottom: '1px solid #C5A572', paddingBottom: '3px', marginBottom: '8px' }}>{title}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', lineHeight: 1.55, color: '#1F2937', padding: '24px 28px', maxWidth: '800px' }}>
      {/* Navy header band */}
      <div style={{ background: '#1E3A5F', padding: '18px 24px', marginBottom: '0' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 700, color: 'white' }}>{c.name || 'Your Name'}</div>
        {contactParts.length > 0 && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>}
      </div>
      <div style={{ height: '2px', background: '#C5A572' }} />
      {/* Photo row */}
      {data.photo && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 0 0' }}>
          <img src={resolvePhotoUrl(data.photo)} alt="Photo" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #C5A572' }} />
        </div>
      )}
      {/* Languages & Certifications two-column row */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '12px', marginBottom: '14px' }}>
        {languages && languages.items.length > 0 && (
          <div style={{ flex: 1 }}>
            {sectionHeader('Languages')}
            {languages.items.map((l, i) => <div key={i} style={{ marginBottom: '2px' }}>{l}</div>)}
          </div>
        )}
        {certifications && certifications.items.length > 0 && (
          <div style={{ flex: 1 }}>
            {sectionHeader('Certifications')}
            {certifications.items.map((cert, i) => <div key={i} style={{ marginBottom: '2px' }}>{cert}</div>)}
          </div>
        )}
      </div>
      {/* Summary */}
      {data.summary && <div style={{ marginBottom: '14px' }}>{sectionHeader('Professional Summary')}<div>{data.summary}</div></div>}
      {/* Core Competencies */}
      {otherGroups.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Core Competencies')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {otherGroups.flatMap(g => g.items).map((s, i) => (
              <span key={i} style={{ border: '1px solid #C5A572', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: '#1E3A5F' }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ fontWeight: 700, color: '#1E3A5F' }}>{getExpTitle(exp)}</div>
              <div style={{ fontSize: '12px', color: '#555' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')} {getExpDates(exp) && `| ${getExpDates(exp)}`}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '3px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}><span style={{ color: '#C5A572' }}>&#9679;</span> {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span> — <span style={{ color: '#555' }}>{getEduSchool(edu)}</span>
              {getEduDates(edu) && <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>{getEduDates(edu)}</span>}
              {edu.gpa && <span style={{ fontSize: '11px', color: '#888' }}> — GPA: {edu.gpa}</span>}
            </div>
          ))}
        </div>
      )}
      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Additional Information')}
          {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '14px', textIndent: '-14px', marginBottom: '2px' }}><span style={{ color: '#C5A572' }}>&#9679;</span> {a}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── Render: Ramp & Terminal ──────────────────────────────────────────────
function renderRamp(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [
    c.email && { label: 'Email', value: c.email },
    c.phone && { label: 'Phone', value: c.phone },
    c.location && { label: 'Location', value: c.location },
    c.linkedin && { label: 'LinkedIn', value: c.linkedin },
    c.website && { label: 'Website', value: c.website },
  ].filter(Boolean) as { label: string; value: string }[];
  const skillGroups = normalizeSkills(data.skills);
  const certifications = skillGroups.find(g => g.label.toLowerCase().includes('certif'));
  const techSystems = skillGroups.find(g => g.label.toLowerCase().includes('technical'));
  const languages = skillGroups.find(g => g.label.toLowerCase().includes('language'));
  const otherGroups = skillGroups.filter(g => g !== certifications && g !== techSystems && g !== languages);
  const sideLabel = (t: string) => (
    <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#EA580C', marginBottom: '6px' }}>{t}</div>
  );
  const mainHdr = (t: string) => (
    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '2px', color: '#27272A', borderLeft: '3px solid #EA580C', paddingLeft: '10px', marginBottom: '10px' }}>{t}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '12.5px', lineHeight: 1.5, display: 'flex', maxWidth: '800px' }}>
      {/* Sidebar */}
      <div style={{ width: '28%', background: '#F4F4F5', padding: '16px', color: '#27272A', minHeight: '600px' }}>
        {contactParts.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {sideLabel('Contact')}
            {contactParts.map((p, i) => (
              <div key={i} style={{ marginBottom: '4px', fontSize: '11px', wordBreak: 'break-all' }}>{p.value}</div>
            ))}
          </div>
        )}
        {certifications && certifications.items.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {sideLabel('Certifications')}
            {certifications.items.map((cert, i) => <div key={i} style={{ fontSize: '11px', marginBottom: '2px' }}>• {cert}</div>)}
          </div>
        )}
        {techSystems && techSystems.items.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {sideLabel('Technical Systems')}
            {techSystems.items.map((s, i) => <div key={i} style={{ fontSize: '11px', marginBottom: '2px' }}>• {s}</div>)}
          </div>
        )}
        {languages && languages.items.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {sideLabel('Languages')}
            {languages.items.map((l, i) => <div key={i} style={{ fontSize: '11px', marginBottom: '2px' }}>{l}</div>)}
          </div>
        )}
      </div>
      {/* Main column */}
      <div style={{ width: '72%', padding: '20px 24px', color: '#27272A' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#27272A', marginBottom: '14px' }}>{c.name || 'Your Name'}</div>
        {data.summary && <div style={{ marginBottom: '16px' }}>{mainHdr('Summary')}<div>{data.summary}</div></div>}
        {data.experience && data.experience.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {mainHdr('Experience')}
            {data.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: '#27272A' }}>{getExpTitle(exp)}</span>
                  <span style={{ fontSize: '11px', color: '#71717A', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
                </div>
                <div style={{ color: '#EA580C', fontSize: '11px', fontWeight: 600 }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
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
            {mainHdr('Education')}
            {data.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '6px' }}>
                <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span> — <span style={{ color: '#71717A' }}>{getEduSchool(edu)}</span>
                {getEduDates(edu) && <span style={{ fontSize: '11px', color: '#A1A1AA', marginLeft: '8px' }}>{getEduDates(edu)}</span>}
                {edu.gpa && <span style={{ fontSize: '11px', color: '#A1A1AA' }}> — GPA: {edu.gpa}</span>}
              </div>
            ))}
          </div>
        )}
        {/* Remaining skill groups */}
        {otherGroups.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {mainHdr('Skills')}
            {otherGroups.map((g, i) => (
              <div key={i} style={{ marginBottom: '3px' }}>
                {otherGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '11px' }}>{g.label}: </span>}
                <span>{g.items.join(', ')}</span>
              </div>
            ))}
          </div>
        )}
        {data.achievements && data.achievements.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {mainHdr('Training & Achievements')}
            {data.achievements.map((a, i) => <div key={i} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {a}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Render: Clinical Care ────────────────────────────────────────────────
function renderClinical(data: ResumeData): React.ReactNode {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const certifications = skillGroups.find(g => g.label.toLowerCase().includes('certif'));
  const otherGroups = skillGroups.filter(g => g !== certifications);
  const sectionHeader = (title: string) => (
    <div style={{ fontFamily: 'Georgia, serif', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1.5px', color: '#1F2937', borderBottom: '2px solid #0F766E', paddingBottom: '3px', marginBottom: '8px' }}>{title}</div>
  );
  return (
    <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '13px', lineHeight: 1.55, color: '#1F2937', padding: '26px 30px', maxWidth: '800px' }}>
      {/* Name + optional photo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>{c.name || 'Your Name'}</div>
          {contactParts.length > 0 && <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{contactParts.join('  |  ')}</div>}
        </div>
        {data.photo && (
          <img src={resolvePhotoUrl(data.photo)} alt="Photo" style={{ width: '64px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ccc', flexShrink: 0 }} />
        )}
      </div>
      <div style={{ borderBottom: '1px solid #D1D5DB', marginBottom: '14px' }} />
      {/* Summary */}
      {data.summary && <div style={{ marginBottom: '14px' }}>{sectionHeader('Professional Summary')}<div>{data.summary}</div></div>}
      {/* Certifications & Registrations box */}
      {certifications && certifications.items.length > 0 && (
        <div style={{ border: '2px solid #0F766E', background: '#F0FDFA', borderRadius: '6px', padding: '12px 16px', marginBottom: '14px' }}>
          {sectionHeader('Certifications & Registrations')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {certifications.items.map((cert, i) => (
              <span key={i} style={{ background: 'white', border: '1px solid #0F766E', borderRadius: '4px', padding: '3px 10px', fontSize: '12px', color: '#0F766E', fontWeight: 600 }}>{cert}</span>
            ))}
          </div>
        </div>
      )}
      {/* Experience */}
      {data.experience && data.experience.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Experience')}
          {data.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#1F2937' }}>{getExpTitle(exp)}</span>
                <span style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>{getExpDates(exp)}</span>
              </div>
              <div style={{ color: '#555', fontStyle: 'italic', fontSize: '11px' }}>{[exp.company, exp.location].filter(Boolean).join(' — ')}</div>
              {exp.bullets && exp.bullets.length > 0 && (
                <div style={{ marginTop: '3px' }}>
                  {exp.bullets.map((b, j) => <div key={j} style={{ paddingLeft: '12px', textIndent: '-12px', marginBottom: '2px' }}>• {b}</div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Education */}
      {data.education && data.education.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Education')}
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '6px' }}>
              <span style={{ fontWeight: 700 }}>{getEduDegree(edu)}</span> — <span style={{ color: '#555' }}>{getEduSchool(edu)}</span>
              {getEduDates(edu) && <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>{getEduDates(edu)}</span>}
              {edu.gpa && <span style={{ fontSize: '11px', color: '#888' }}> — GPA: {edu.gpa}</span>}
            </div>
          ))}
        </div>
      )}
      {/* Skills */}
      {otherGroups.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Skills')}
          {otherGroups.map((g, i) => (
            <div key={i} style={{ marginBottom: '3px' }}>
              {otherGroups.length > 1 && <span style={{ fontWeight: 700, fontSize: '11px' }}>{g.label}: </span>}
              <span>{g.items.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
      {/* Achievements */}
      {data.achievements && data.achievements.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          {sectionHeader('Achievements')}
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
    case 'campus': return renderCampus(data);
    case 'fresher': return renderFresher(data);
    case 'salesbd': return renderSalesBD(data);
    case 'operator': return renderOperator(data);
    case 'editorial': return renderEditorial(data);
    case 'skylight': return renderSkylight(data);
    case 'ramp': return renderRamp(data);
    case 'clinical': return renderClinical(data);
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

/**
 * Wraps print HTML in A4 page container.
 * - A4: 210mm x 297mm, margins: 12mm top/bottom, 14mm left/right → content height: 273mm
 * - All backgrounds preserved via print-color-adjust:exact
 * - Two-page mode: content naturally flows; page-break-inside:avoid on .entry/.section-block
 * - Sidebar templates use .two-col layout with flex; sidebars use min-height:273mm to fill page
 * - IMPORTANT: All sidebar print functions should use PAGE_CONTENT_HEIGHT (273mm), not 250mm or 297mm
 */
const PAGE_CONTENT_HEIGHT = 'calc(297mm - 24mm)'; // 273mm = A4 height minus top+bottom margins

/**
 * Print token helpers — map screen T values to CSS strings for print HTML.
 * Screen px ≈ print px (browsers render print at 96dpi by default).
 * These helpers produce inline CSS strings for print functions.
 */
const PT = {
  font: (family: string) => `font-family:${family}`,
  size: (px: number) => `font-size:${px}px`,
  line: (lh: number) => `line-height:${lh}`,
  pad: (px: number) => `padding:${px}px`,
  mb: (px: number) => `margin-bottom:${px}px`,
  color: (c: string) => `color:${c}`,
  // Common print style strings
  dateStyle: `font-size:${T.fs.sm}px;color:${T.c.light};font-style:italic`,
  titleStyle: `font-weight:700;color:${T.c.black}`,
  companyStyle: `color:${T.c.muted};font-style:italic`,
  hdr: (title: string, color: string, border: string) =>
    `<div style="font-size:${T.fs.body}px;font-weight:700;text-transform:uppercase;color:${color};border-bottom:${border};padding-bottom:${T.sp.xs}px;margin-bottom:${T.sp.md}px">${title}</div>`,
} as const;

function printPageWrapper(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title> </title><style>
@page{size:A4;margin:12mm 14mm 12mm 14mm}
*{margin:0;padding:0;box-sizing:border-box}
html{width:210mm}
body{width:100%;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important;font-size:${T.fs.body}px}
.print-content-root{width:100%;max-width:210mm;min-height:${PAGE_CONTENT_HEIGHT};box-sizing:border-box}
.print-content-root>div{min-height:${PAGE_CONTENT_HEIGHT};box-sizing:border-box}
.resume-body{min-height:${PAGE_CONTENT_HEIGHT};box-sizing:border-box}
.resume-wrapper{width:100%;position:relative}
.two-col{display:flex;width:100%;min-height:${PAGE_CONTENT_HEIGHT}}
.two-col-left{flex-shrink:0;min-height:${PAGE_CONTENT_HEIGHT}}
.two-col-right{flex:1;min-height:${PAGE_CONTENT_HEIGHT}}
@media print{
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  html,body{width:210mm!important;overflow:visible!important}
  .print-content-root{width:100%!important;transform:none!important;min-height:${PAGE_CONTENT_HEIGHT}!important}
  .print-content-root>div{min-height:${PAGE_CONTENT_HEIGHT}!important;box-sizing:border-box!important}
  .resume-body{min-height:${PAGE_CONTENT_HEIGHT}!important}
  .entry{page-break-inside:avoid;break-inside:avoid}
  .section-block{page-break-inside:avoid;break-inside:avoid}
  .two-col{min-height:${PAGE_CONTENT_HEIGHT}!important}
  .two-col-left,.two-col-right{min-height:${PAGE_CONTENT_HEIGHT}!important}
}
</style></head><body><div class="print-content-root">${body}</div></body></html>`;
}

// Helper: build experience HTML for single-column templates
function buildExpHTML(data: ResumeData, bullet: string, dateStyle: string, companyStyle: string, titleStyle: string): string {
  if (!data.experience?.length) return '';
  return data.experience.map(exp => {
    const title = esc(getExpTitle(exp));
    const dates = esc(getExpDates(exp));
    const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
    const bullets = (exp.bullets || []).map(b => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">${bullet} ${esc(b)}</div>`).join('');
    return `<div class="entry" style="margin-bottom:${bullet === '&gt;' ? '12' : '10'}px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleStyle}">${title}</span><span style="${dateStyle}">${dates}</span></div><div style="${companyStyle}">${company}</div>${bullets ? `<div style="margin-top:4px">${bullets}</div>` : ''}</div>`;
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

function buildCustomSectionsHTML(data: ResumeData, bullet: string, hdrFn: (t: string) => string): string {
  if (!data.custom_sections?.length) return '';
  return data.custom_sections.map(sec => {
    const items = sec.items.map(item => `<div style="padding-left:12px;text-indent:-12px;margin-bottom:2px">${bullet} ${esc(item)}</div>`).join('');
    return `<div style="margin-bottom:14px">${hdrFn(esc(sec.title))}${items}</div>`;
  }).join('');
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
  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#374151;padding:40px 40px 40px 44px;max-width:100%;border-left:4px solid #0A66C2">`;
  h += `<div style="margin-bottom:16px"><div style="font-size:28px;font-weight:700;color:#0A66C2">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:10px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:24px">${hdr('SUMMARY')}<div>${esc(data.summary)}</div></div>`;
  if (data.experience?.length) h += `<div style="margin-bottom:24px">${hdr('EXPERIENCE')}${buildExpHTML(data, '&bull;', dateS, 'color:#555;font-style:italic', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:24px">${hdr('EDUCATION')}${buildEduHTML(data, dateS)}</div>`;
  const skModern = buildSkillsGroupedHTML(data);
  if (skModern) h += `<div style="margin-bottom:24px">${hdr('SKILLS')}${skModern}</div>`;
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
  const dateS = 'font-size:11px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#111;font-size:13px';
  const hdr = (t: string) => `<div style="font-size:14px;font-weight:700;color:#057642;border-left:4px solid #057642;padding-left:12px;margin-bottom:8px">${t}</div>`;
  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.55;color:#333;padding:28px 32px;max-width:100%">`;
  h += `<div style="margin-bottom:6px"><div style="font-size:34px;font-weight:800;color:#111">${esc(c.name) || 'Your Name'}</div><div style="width:100%;height:4px;background:#057642;margin-top:6px;margin-bottom:8px"></div>`;
  if (cp) h += `<div style="font-size:11px;color:#666">${cp}</div>`;
  h += `</div><div style="height:10px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:14px">${hdr('SUMMARY')}<div>${esc(data.summary)}</div></div>`;
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
      sidebar += `<div style="margin-bottom:8px"><div style="font-weight:700;font-size:9px;color:#fff">${esc(getEduDegree(edu))}</div><div style="font-size:9px;color:rgba(255,255,255,0.7)">${esc(getEduSchool(edu))}</div><div style="font-size:8px;color:rgba(255,255,255,0.5)">${esc(getEduDates(edu))}${edu.gpa ? ` &mdash; GPA: ${esc(edu.gpa)}` : ''}</div></div>`;
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

  return printPageWrapper(`<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:10px;line-height:1.4;position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:30%;background:#1E293B;min-height:calc(297mm - 24mm)"></div><div class="two-col" style="position:relative;z-index:1">${sidebar}${main}</div></div>`);
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
  h += `<div style="position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:35%;background:#F1F5F9;min-height:calc(297mm - 24mm)"></div><div class="two-col" style="position:relative;z-index:1">`;

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
      const label = skillGroups.length > 1 ? `<div style="font-size:9px;color:#94A3B8;font-weight:700;margin-bottom:4px">${esc(g.label)}</div>` : '';
      h += `<div style="margin-bottom:8px">${label}<div style="font-size:9px;color:#334155">${g.items.map(esc).join(', ')}</div></div>`;
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
  h += `<div style="position:relative"><div style="position:absolute;top:0;right:0;bottom:0;width:35%;background:#F0F7FF;min-height:calc(297mm - 24mm)"></div><div class="two-col" style="position:relative;z-index:1">`;
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
  h += `<div style="position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:28%;background:#F8FAFC;border-right:1px solid #E2E8F0;min-height:calc(297mm - 24mm)"></div><div class="two-col" style="position:relative;z-index:1">`;
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
  const hdr = (t: string) => `<div style="font-size:12px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:6px">${t}</div>`;
  const dividerHTML = `<div style="text-align:center;margin:14px 0"><span style="display:inline-block;width:24px;height:2px;background:#D1D5DB;vertical-align:middle"></span><span style="display:inline-block;margin:0 6px;color:#D1D5DB;font-size:8px;vertical-align:middle">&#9670;</span><span style="display:inline-block;width:24px;height:2px;background:#D1D5DB;vertical-align:middle"></span></div>`;
  let h = `<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#374151;padding:28px 32px;max-width:100%">`;
  h += `<div style="margin-bottom:4px"><div style="font-size:28px;font-weight:700;color:#111">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:11px;color:#555;margin-top:4px">${cp}</div>`;
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
  const skCrimson = buildSkillsGroupedHTML(data);
  if (skCrimson) h += `<div style="margin-bottom:16px">${hdr('Skills')}${skCrimson}</div>`;
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
  const skOcean = buildSkillsGroupedHTML(data);
  if (skOcean) h += `<div style="margin-bottom:14px">${hdr('Skills')}${skOcean}</div>`;
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
  const skIndigo = buildSkillsGroupedHTML(data);
  if (skIndigo) h += `<div style="margin-bottom:14px">${hdr('Skills')}${skIndigo}</div>`;
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:14px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Campus Placement (India) ───────────────────────────────────────
function printCampus(data: ResumeData): string {
  const c = data.contact || {};
  const p = data.personal || {};
  const cp = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).map(esc).join('  |  ');
  const hdr = (t: string) => `<div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#1e3a5f;background:#e8eef4;padding:5px 12px;margin-bottom:10px;letter-spacing:1px;border-left:4px solid #1e3a5f">${t}</div>`;
  const dateS = 'font-size:11px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#1e3a5f';

  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#333;padding:24px 28px;max-width:100%">`;
  // Header (photo removed for ATS compatibility)
  h += `<!-- Photo removed for ATS compatibility -->`;
  h += `<div style="margin-bottom:16px">`;
  h += `<div>`;
  h += `<div style="font-size:24px;font-weight:700;color:#1e3a5f">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:11px;color:#555;margin-top:4px">${cp}</div>`;
  const personalParts = [];
  if (p.dob) personalParts.push(`Date of Birth: ${esc(p.dob)}`);
  if (p.gender) personalParts.push(`Gender: ${esc(p.gender)}`);
  personalParts.push(`Nationality: ${esc(p.nationality || 'Indian')}`);
  if (p.father_name) personalParts.push(`Father's Name: ${esc(p.father_name)}`);
  h += `<div style="font-size:10px;color:#555;margin-top:4px;border-top:1px solid #ddd;padding-top:4px">${personalParts.join(' &nbsp;&nbsp; ')}</div>`;
  h += `</div></div>`;
  h += `<div style="border-bottom:2px solid #1e3a5f;margin-bottom:12px"></div>`;
  // Summary
  if (data.summary) h += `<div style="margin-bottom:12px">${hdr('Career Objective')}<div style="padding-left:4px">${esc(data.summary)}</div></div>`;
  // Education table
  if (data.education?.length) {
    h += `<div style="margin-bottom:12px">${hdr('Education')}`;
    data.education.forEach((edu, i) => {
      h += `<div class="entry" style="padding:8px 10px;background:${i % 2 === 0 ? '#f0f4f8' : 'transparent'};border-bottom:1px solid #ddd;margin-bottom:2px">`;
      h += `<div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="font-weight:700;color:#111">${esc(getEduDegree(edu))}</span><span style="font-size:11px;color:#666">${esc(getEduDates(edu))}</span></div>`;
      h += `<div style="font-size:11px;color:#555">${esc(getEduSchool(edu))}${edu.gpa ? ` &mdash; GPA: ${esc(edu.gpa)}` : ''}</div></div>`;
    });
    h += `</div>`;
  }
  // Experience
  if (data.experience?.length) {
    h += `<div style="margin-bottom:12px">${hdr('Experience / Internships')}`;
    h += buildExpHTML(data, '&bull;', dateS, 'color:#555;font-style:italic;font-size:10px', titleS);
    h += `</div>`;
  }
  // Skills
  const sk = buildSkillsGroupedHTML(data);
  if (sk) h += `<div style="margin-bottom:12px">${hdr('Technical &amp; Soft Skills')}${sk}</div>`;
  // Achievements
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:12px">${hdr('Achievements &amp; Activities')}${ach}</div>`;
  // Declaration
  h += `<div style="margin-top:12px;border-top:1px solid #ddd;padding-top:8px">`;
  h += `<div style="font-size:12px;font-weight:700;color:#1e3a5f;margin-bottom:3px">DECLARATION</div>`;
  h += `<div style="font-size:11px;color:#555;line-height:1.5">I hereby declare that the information furnished above is true to the best of my knowledge and belief.</div>`;
  h += `<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:#555">`;
  h += `<div>Place: ${esc(p.declaration_place) || '__________'} &nbsp; Date: ${esc(p.declaration_date) || '__________'}</div>`;
  h += `<div style="text-align:right"><span style="font-weight:600;color:#1e3a5f">${esc(c.name) || '(Your Name)'}</span></div>`;
  h += `</div></div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Fresher & Intern ───────────────────────────────────────────────
function printFresher(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).map(esc).join('  &bull;  ');
  const skillGroups = normalizeSkills(data.skills);
  const sideHdr = (t: string) => `<div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6366F1;letter-spacing:1.5px;margin-bottom:10px">${t}</div>`;
  const mainHdr = (t: string) => `<div style="font-size:15px;font-weight:700;text-transform:uppercase;color:#1E1B4B;border-bottom:2px solid #6366F1;padding-bottom:3px;margin-bottom:12px">${t}</div>`;
  const dateS = 'font-size:12px;color:#9CA3AF;font-style:italic';
  const titleS = 'font-weight:700;color:#1E1B4B;font-size:14px';

  let h = `<div class="resume-wrapper" style="font-family:'Segoe UI',Arial,sans-serif;font-size:14.5px;line-height:1.6">`;
  // Header
  h += `<div style="background:linear-gradient(135deg,#312E81,#4338CA);padding:20px 22px;color:white">`;
  h += `<div style="font-size:30px;font-weight:800;letter-spacing:0.5px">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:13px;opacity:0.85;margin-top:5px">${cp}</div>`;
  h += `</div>`;
  // Two column
  h += `<div style="position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:32%;background:#F5F3FF;min-height:calc(297mm - 24mm)"></div><div class="two-col" style="position:relative;z-index:1">`;
  // Left sidebar
  h += `<div class="two-col-left" style="width:33%;background:#F5F3FF;padding:16px 14px;border-right:1px solid #E5E7EB">`;
  if (data.education?.length) {
    h += `<div style="margin-bottom:20px">${sideHdr('Education')}`;
    data.education.forEach(edu => {
      h += `<div style="margin-bottom:10px"><div style="font-weight:700;font-size:11px;color:#1E1B4B">${esc(getEduDegree(edu))}</div><div style="font-size:10px;color:#6B7280">${esc(getEduSchool(edu))}</div><div style="font-size:10px;color:#9CA3AF">${esc(getEduDates(edu))}${edu.gpa ? ` &mdash; ${esc(edu.gpa)}` : ''}</div></div>`;
    });
    h += `</div>`;
  }
  if (skillGroups.length) {
    h += `<div style="margin-bottom:20px">${sideHdr('Skills')}`;
    skillGroups.forEach(g => {
      const label = skillGroups.length > 1 ? `<div style="font-size:9px;color:#9CA3AF;font-weight:700;margin-bottom:4px">${esc(g.label)}</div>` : '';
      h += `<div style="margin-bottom:10px">${label}<div style="font-size:10px;color:#3730A3">${g.items.map(esc).join(', ')}</div></div>`;
    });
    h += `</div>`;
  }
  const ach = buildAchievementsHTML(data, '&#9658;');
  if (ach) h += `<div>${sideHdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  // Right main
  h += `<div class="two-col-right" style="width:68%;padding:20px 24px;color:#333">`;
  if (data.summary) h += `<div style="margin-bottom:16px">${mainHdr('Profile')}<div style="font-size:12px;color:#374151;line-height:1.6">${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:16px">${mainHdr('Projects & Experience')}`;
    h += buildExpHTML(data, '&bull;', dateS, 'color:#6B7280;font-style:italic;font-size:11px', titleS);
    h += `</div>`;
  }
  h += `</div></div></div></div>`;
  return printPageWrapper(h);
}

// ─── Print: Sales & BD ─────────────────────────────────────────────────────
function printSalesBD(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).map(esc).join('  |  ');
  const skillGroups = normalizeSkills(data.skills);
  const hdr = (t: string) => `<div style="font-size:14px;font-weight:800;text-transform:uppercase;color:#0F172A;letter-spacing:2px;border-bottom:3px solid #E16B00;padding-bottom:4px;margin-bottom:12px">${t}</div>`;
  const dateS = 'font-size:12px;color:#94A3B8;font-style:italic';
  const titleS = 'font-weight:700;color:#0F172A;font-size:15px';

  let h = `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14.5px;line-height:1.6;color:#333;padding:20px 24px;max-width:100%">`;
  // Dark header
  h += `<div style="background:#0F172A;padding:18px 22px;border-radius:8px 8px 0 0"><div style="font-size:30px;font-weight:900;color:white;letter-spacing:-0.5px">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px">${cp}</div>`;
  h += `</div><div style="height:4px;background:#E16B00"></div>`;
  // Summary
  if (data.summary) h += `<div style="margin-bottom:16px;margin-top:16px">${hdr('Profile Summary')}<div style="font-size:14px;line-height:1.65;color:#374151">${esc(data.summary)}</div></div>`;
  // Experience with orange left border
  if (data.experience?.length) {
    h += `<div style="margin-bottom:16px">${hdr('Sales Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:14px;text-indent:-14px;margin-bottom:4px;font-size:14px;line-height:1.55">&#9658; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:12px;padding-left:12px;border-left:3px solid #E16B00"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#64748B;font-style:italic;font-size:13px">${company}</div>${bullets ? `<div style="margin-top:5px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  // Education
  if (data.education?.length) {
    h += `<div style="margin-bottom:16px">${hdr('Education')}`;
    data.education.forEach(edu => {
      h += `<div style="margin-bottom:6px;display:flex;justify-content:space-between;flex-wrap:wrap"><div><span style="font-weight:700;color:#0F172A">${esc(getEduDegree(edu))}</span> &mdash; <span style="color:#64748B">${esc(getEduSchool(edu))}</span>${edu.gpa ? ` <span style="color:#94A3B8;font-size:11px">&mdash; GPA: ${esc(edu.gpa)}</span>` : ''}</div><span style="font-size:11px;color:#94A3B8">${esc(getEduDates(edu))}</span></div>`;
    });
    h += `</div>`;
  }
  // Skills as comma-separated text (ATS-friendly)
  if (skillGroups.length) {
    h += `<div style="margin-bottom:16px">${hdr('Skills & Tools')}`;
    skillGroups.forEach(g => {
      const label = skillGroups.length > 1 ? `<strong>${esc(g.label)}:</strong> ` : '';
      h += `<div style="margin-bottom:4px;font-size:13px;color:#334155">${label}${g.items.map(esc).join(', ')}</div>`;
    });
    h += `</div>`;
  }
  // Achievements
  const ach = buildAchievementsHTML(data, '&#9733;');
  if (ach) h += `<div>${hdr('Key Wins')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Operator Grid ──────────────────────────────────────────────────
function printOperator(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin].filter(Boolean).map(esc).join('  |  ');
  const skillGroups = normalizeSkills(data.skills);
  const hdr = (t: string) => `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#0F172A;border-left:3px solid #06B6D4;padding-left:10px;margin-bottom:10px">${t}</div>`;
  const dateS = 'font-size:11px;color:#94A3B8;font-style:italic';
  const titleS = 'font-weight:700;color:#0F172A;font-size:14px';

  let h = `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:13px;line-height:1.55;color:#334155">`;
  h += `<div style="background:#0F172A;padding:22px 28px"><div style="font-size:28px;font-weight:800;color:white;letter-spacing:-0.5px">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:5px">${cp}</div>`;
  h += `</div><div style="height:3px;background:#06B6D4"></div><div style="padding:20px 28px">`;
  if (data.summary) h += `<div style="margin-bottom:18px">${hdr('Summary')}<div style="font-size:13px;color:#334155;line-height:1.65">${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:18px">${hdr('Experience')}`;
    h += buildExpHTML(data, '&bull;', dateS, 'color:#64748B;font-size:12px', titleS);
    h += `</div>`;
  }
  if (skillGroups.length) {
    h += `<div style="margin-bottom:18px">${hdr('Skills')}`;
    skillGroups.forEach(g => {
      const label = skillGroups.length > 1 ? `<strong style="color:#06B6D4">${esc(g.label)}:</strong> ` : '';
      h += `<div style="margin-bottom:4px;font-size:11px;color:#334155">${label}${g.items.map(esc).join(', ')}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) { h += `<div style="margin-bottom:18px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`; }
  const ach = buildAchievementsHTML(data, '&#9658;');
  if (ach) h += `<div style="background:rgba(6,182,212,0.06);border-radius:8px;padding:12px 14px">${hdr('Key Achievements')}${ach}</div>`;
  h += `</div></div>`;
  return printPageWrapper(h);
}

// ─── Print: Editorial Canvas ───────────────────────────────────────────────
function printEditorial(data: ResumeData): string {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const hdr = (t: string) => `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#9A3412;margin-bottom:10px">${t}</div>`;
  const dateS = 'font-size:11px;color:#78716C';
  const titleS = 'font-weight:700;color:#171717;font-size:14px;font-family:Segoe UI,Arial,sans-serif';

  let h = `<div style="font-family:Georgia,serif;font-size:13px;line-height:1.6;color:#292524;background:#FFFAF5">`;
  // Asymmetric header
  h += `<div style="padding:28px 28px 16px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:12px">`;
  h += `<div style="flex:1"><div style="font-size:36px;font-weight:700;color:#171717;line-height:1.1">${esc(c.name) || 'Your Name'}</div></div>`;
  h += `<div style="text-align:right">`;
  contactParts.forEach(p => { h += `<div style="font-size:11px;color:#78716C">${esc(p)}</div>`; });
  h += `</div></div>`;
  h += `<div style="height:1px;background:#C2410C;margin:0 28px"></div>`;
  h += `<div style="padding:20px 28px">`;
  // Summary as pull-quote
  if (data.summary) h += `<div style="border-left:4px solid #C2410C;padding-left:16px;margin-bottom:20px"><div style="font-size:14px;color:#292524;line-height:1.7;font-style:italic">${esc(data.summary)}</div></div>`;
  if (data.experience?.length) {
    h += `<div style="margin-bottom:20px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:14px;text-indent:-14px;margin-bottom:3px;font-size:13px;color:#44403C">&ndash; ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap"><span style="${titleS}">${title}</span><span style="${dateS}">${dates}</span></div><div style="color:#C2410C;font-size:12px;font-weight:600">${company}</div>${bullets ? `<div style="margin-top:5px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (skillGroups.length) {
    h += `<div style="margin-bottom:20px">${hdr('Skills')}`;
    skillGroups.forEach(g => {
      const label = skillGroups.length > 1 ? `<strong>${esc(g.label)}:</strong> ` : '';
      h += `<div style="margin-bottom:4px;font-size:12px;color:#9A3412;font-family:Segoe UI,Arial,sans-serif">${label}${g.items.map(esc).join(', ')}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) {
    h += `<div style="margin-bottom:20px">${hdr('Education')}`;
    data.education.forEach(edu => {
      h += `<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid #FED7AA;display:flex;justify-content:space-between;flex-wrap:wrap"><div><span style="font-weight:700;color:#171717">${esc(getEduDegree(edu))}</span> &mdash; <span style="color:#78716C">${esc(getEduSchool(edu))}</span></div><span style="font-size:11px;color:#A8A29E">${esc(getEduDates(edu))}</span></div>`;
    });
    h += `</div>`;
  }
  const ach = buildAchievementsHTML(data, '&#10022;');
  if (ach) h += `<div>${hdr('Achievements')}${ach}</div>`;
  h += `</div></div>`;
  return printPageWrapper(h);
}

// ─── Print: Skylight Cabin ────────────────────────────────────────────────
function printSkylight(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const skillGroups = normalizeSkills(data.skills);
  const languages = skillGroups.find(g => g.label.toLowerCase().includes('language'));
  const certifications = skillGroups.find(g => g.label.toLowerCase().includes('certif'));
  const otherGroups = skillGroups.filter(g => g !== languages && g !== certifications);
  const hdr = (t: string) => `<div style="font-family:Georgia,serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1E3A5F;border-bottom:1px solid #C5A572;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  const dateS = 'font-size:11px;color:#888;font-style:italic';
  const titleS = 'font-weight:700;color:#1E3A5F';

  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#1F2937;padding:24px 28px;max-width:100%">`;
  // Navy header band
  h += `<div style="background:#1E3A5F;padding:18px 24px;margin:-24px -28px 0"><div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:white">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:4px">${cp}</div>`;
  h += `</div><div style="height:2px;background:#C5A572;margin:0 -28px"></div>`;
  // Photo removed for ATS compatibility
  h += `<!-- Photo removed for ATS compatibility -->`;
  // Languages & Certifications
  h += `<div style="display:flex;gap:24px;margin-top:12px;margin-bottom:14px">`;
  if (languages && languages.items.length) {
    h += `<div style="flex:1">${hdr('Languages')}`;
    languages.items.forEach(l => { h += `<div style="margin-bottom:2px">${esc(l)}</div>`; });
    h += `</div>`;
  }
  if (certifications && certifications.items.length) {
    h += `<div style="flex:1">${hdr('Certifications')}`;
    certifications.items.forEach(cert => { h += `<div style="margin-bottom:2px">${esc(cert)}</div>`; });
    h += `</div>`;
  }
  h += `</div>`;
  if (data.summary) h += `<div style="margin-bottom:14px">${hdr('Professional Summary')}<div>${esc(data.summary)}</div></div>`;
  // Core Competencies
  if (otherGroups.length) {
    h += `<div style="margin-bottom:14px">${hdr('Core Competencies')}`;
    otherGroups.forEach(g => {
      const label = otherGroups.length > 1 ? `<strong>${esc(g.label)}:</strong> ` : '';
      h += `<div style="margin-bottom:4px;font-size:12px;color:#1E3A5F">${label}${g.items.map(esc).join(', ')}</div>`;
    });
    h += `</div>`;
  }
  if (data.experience?.length) {
    h += `<div style="margin-bottom:14px">${hdr('Experience')}`;
    data.experience.forEach(exp => {
      const title = esc(getExpTitle(exp));
      const dates = esc(getExpDates(exp));
      const company = [exp.company, exp.location].filter(Boolean).map(esc).join(' &mdash; ');
      const bullets = (exp.bullets || []).map(b => `<div style="padding-left:14px;text-indent:-14px;margin-bottom:2px"><span style="color:#C5A572">&#9679;</span> ${esc(b)}</div>`).join('');
      h += `<div class="entry" style="margin-bottom:10px"><div style="${titleS}">${title}</div><div style="font-size:12px;color:#555">${company}${dates ? ` | ${dates}` : ''}</div>${bullets ? `<div style="margin-top:3px">${bullets}</div>` : ''}</div>`;
    });
    h += `</div>`;
  }
  if (data.education?.length) h += `<div style="margin-bottom:14px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  const ach = buildAchievementsHTML(data, '<span style="color:#C5A572">&#9679;</span>');
  if (ach) h += `<div style="margin-bottom:14px">${hdr('Additional Information')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

// ─── Print: Ramp & Terminal ───────────────────────────────────────────────
function printRamp(data: ResumeData): string {
  const c = data.contact || {};
  const contactParts = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean);
  const skillGroups = normalizeSkills(data.skills);
  const certifications = skillGroups.find(g => g.label.toLowerCase().includes('certif'));
  const techSystems = skillGroups.find(g => g.label.toLowerCase().includes('technical'));
  const languages = skillGroups.find(g => g.label.toLowerCase().includes('language'));
  const otherGroups = skillGroups.filter(g => g !== certifications && g !== techSystems && g !== languages);
  const sideHdr = (t: string) => `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#EA580C;margin-bottom:6px">${t}</div>`;
  const mainHdr = (t: string) => `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#27272A;border-left:3px solid #EA580C;padding-left:10px;margin-bottom:10px">${t}</div>`;
  const dateS = 'font-size:11px;color:#71717A;font-style:italic';
  const titleS = 'font-weight:700;color:#27272A';

  let sidebar = `<div class="two-col-left" style="width:28%;background:#F4F4F5;padding:16px;color:#27272A">`;
  if (contactParts.length) {
    sidebar += `<div style="margin-bottom:16px">${sideHdr('Contact')}`;
    contactParts.forEach(p => { sidebar += `<div style="margin-bottom:4px;font-size:11px;word-break:break-all">${esc(p)}</div>`; });
    sidebar += `</div>`;
  }
  if (certifications && certifications.items.length) {
    sidebar += `<div style="margin-bottom:16px">${sideHdr('Certifications')}`;
    certifications.items.forEach(cert => { sidebar += `<div style="font-size:11px;margin-bottom:2px">&bull; ${esc(cert)}</div>`; });
    sidebar += `</div>`;
  }
  if (techSystems && techSystems.items.length) {
    sidebar += `<div style="margin-bottom:16px">${sideHdr('Technical Systems')}`;
    techSystems.items.forEach(s => { sidebar += `<div style="font-size:11px;margin-bottom:2px">&bull; ${esc(s)}</div>`; });
    sidebar += `</div>`;
  }
  if (languages && languages.items.length) {
    sidebar += `<div style="margin-bottom:16px">${sideHdr('Languages')}`;
    languages.items.forEach(l => { sidebar += `<div style="font-size:11px;margin-bottom:2px">${esc(l)}</div>`; });
    sidebar += `</div>`;
  }
  sidebar += `</div>`;

  let main = `<div class="two-col-right" style="width:72%;padding:20px 24px;color:#27272A">`;
  main += `<div style="font-size:24px;font-weight:700;color:#27272A;margin-bottom:14px">${esc(c.name) || 'Your Name'}</div>`;
  if (data.summary) main += `<div style="margin-bottom:16px">${mainHdr('Summary')}<div style="font-size:12.5px">${esc(data.summary)}</div></div>`;
  if (data.experience?.length) main += `<div style="margin-bottom:16px">${mainHdr('Experience')}${buildExpHTML(data, '&bull;', dateS, 'color:#EA580C;font-size:11px;font-weight:600', titleS)}</div>`;
  if (data.education?.length) main += `<div style="margin-bottom:16px">${mainHdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  if (otherGroups.length) {
    main += `<div style="margin-bottom:16px">${mainHdr('Skills')}`;
    otherGroups.forEach(g => {
      const label = otherGroups.length > 1 ? `<span style="font-weight:700;font-size:11px">${esc(g.label)}: </span>` : '';
      main += `<div style="margin-bottom:3px">${label}<span>${g.items.map(esc).join(', ')}</span></div>`;
    });
    main += `</div>`;
  }
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) main += `<div style="margin-bottom:16px">${mainHdr('Training &amp; Achievements')}${ach}</div>`;
  main += `</div>`;

  return printPageWrapper(`<div class="resume-wrapper" style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.5;position:relative"><div style="position:absolute;top:0;left:0;bottom:0;width:28%;background:#F4F4F5;min-height:calc(297mm - 24mm)"></div><div class="two-col" style="position:relative;z-index:1">${sidebar}${main}</div></div>`);
}

// ─── Print: Clinical Care ─────────────────────────────────────────────────
function printClinical(data: ResumeData): string {
  const c = data.contact || {};
  const cp = [c.email, c.phone, c.location, c.linkedin, c.website].filter(Boolean).map(esc).join('  |  ');
  const skillGroups = normalizeSkills(data.skills);
  const certifications = skillGroups.find(g => g.label.toLowerCase().includes('certif'));
  const otherGroups = skillGroups.filter(g => g !== certifications);
  const hdr = (t: string) => `<div style="font-family:Georgia,serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#1F2937;border-bottom:2px solid #0F766E;padding-bottom:3px;margin-bottom:8px">${t}</div>`;
  const dateS = 'font-size:11px;color:#666;font-style:italic';
  const titleS = 'font-weight:700;color:#1F2937';

  let h = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;color:#1F2937;padding:26px 30px;max-width:100%">`;
  // Name + photo
  h += `<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">`;
  h += `<div style="flex:1"><div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1F2937">${esc(c.name) || 'Your Name'}</div>`;
  if (cp) h += `<div style="font-size:11px;color:#555;margin-top:4px">${cp}</div>`;
  h += `</div>`;
  if (data.photo) h += `<img src="${esc(resolvePhotoUrl(data.photo))}" alt="Photo" style="width:64px;height:80px;object-fit:cover;border-radius:4px;border:1px solid #ccc;flex-shrink:0"/>`;
  h += `</div>`;
  h += `<div style="border-bottom:1px solid #D1D5DB;margin-bottom:14px"></div>`;
  if (data.summary) h += `<div style="margin-bottom:14px">${hdr('Professional Summary')}<div>${esc(data.summary)}</div></div>`;
  // Certifications (ATS-friendly comma-separated)
  if (certifications && certifications.items.length) {
    h += `<div style="margin-bottom:14px">${hdr('Certifications &amp; Registrations')}<div style="font-size:12px;color:#0F766E;font-weight:600">${certifications.items.map(esc).join(', ')}</div></div>`;
  }
  if (data.experience?.length) h += `<div style="margin-bottom:14px">${hdr('Experience')}${buildExpHTML(data, '&bull;', dateS, 'color:#555;font-style:italic;font-size:11px', titleS)}</div>`;
  if (data.education?.length) h += `<div style="margin-bottom:14px">${hdr('Education')}${buildEduHTML(data, dateS)}</div>`;
  if (otherGroups.length) {
    h += `<div style="margin-bottom:14px">${hdr('Skills')}`;
    otherGroups.forEach(g => {
      const label = otherGroups.length > 1 ? `<span style="font-weight:700;font-size:11px">${esc(g.label)}: </span>` : '';
      h += `<div style="margin-bottom:3px">${label}<span>${g.items.map(esc).join(', ')}</span></div>`;
    });
    h += `</div>`;
  }
  const ach = buildAchievementsHTML(data, '&bull;');
  if (ach) h += `<div style="margin-bottom:14px">${hdr('Achievements')}${ach}</div>`;
  h += `</div>`;
  return printPageWrapper(h);
}

export function buildPrintHTML(data: ResumeData, templateId: string, opts?: { fitOnePage?: boolean; printSize?: string; density?: 'sparse' | 'medium' | 'dense' }): string {
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
    case 'campus': html = printCampus(data); break;
    case 'fresher': html = printFresher(data); break;
    case 'salesbd': html = printSalesBD(data); break;
    case 'operator': html = printOperator(data); break;
    case 'editorial': html = printEditorial(data); break;
    case 'skylight': html = printSkylight(data); break;
    case 'ramp': html = printRamp(data); break;
    case 'clinical': html = printClinical(data); break;
    case 'classic':
    default: html = printClassic(data); break;
  }

  // ═══ SMART AUTO-PAGE SYSTEM ═══
  // Goal: fit to 1 page naturally. If content overflows by a small amount,
  // compress slightly. If real overflow, allow 2nd page gracefully.
  //
  // A4 printable height ≈ 273mm (297mm - 24mm margins) ≈ 1032px at 96dpi
  // We use CSS-only compression ladder — no JS measurement needed because
  // the browser's print engine handles pagination. We just control spacing.

  const density = opts?.density || getContentDensity(data);
  let layoutCSS = '';

  // Always remove forced min-height — let content determine height
  layoutCSS += `
    .print-content-root, .print-content-root > div, .resume-body,
    .two-col, .two-col-left, .two-col-right {
      min-height: auto !important;
    }
    .entry { page-break-inside: avoid; break-inside: avoid; }
    .section-block { page-break-inside: avoid; break-inside: avoid; }
  `;

  // Density-based compression: sparse gets more air, dense gets tighter
  if (density === 'sparse') {
    // Sparse: expand spacing to fill page naturally
    layoutCSS += `
      body { line-height: 1.7 !important; font-size: 11.5px !important; }
      .entry { margin-bottom: 14px !important; }
    `;
  } else if (density === 'dense') {
    // Dense: compress to fit — tighter spacing, slightly smaller text
    layoutCSS += `
      body { line-height: 1.35 !important; font-size: 10.5px !important; }
      .entry { margin-bottom: 6px !important; }
    `;
  } else {
    // Medium: standard — slight tightening if needed
    layoutCSS += `
      body { line-height: 1.45 !important; }
      .entry { margin-bottom: 10px !important; }
    `;
  }

  // Inject layout CSS before closing </style>
  if (layoutCSS) {
    html = html.replace('</style>', `${layoutCSS}\n</style>`);
  }

  return html;
}

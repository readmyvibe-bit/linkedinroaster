'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { TEMPLATES, renderResumeHTML, buildPrintHTML } from '../../../../components/resume/ResumeTemplates';

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
  startDate?: string;
  endDate?: string;
  start_date?: string;
  end_date?: string;
  current?: boolean;
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
  gpa?: string;
}

interface SkillCategory {
  category?: string;
  skills?: string[];
}

interface CustomSection {
  title?: string;
  content?: string;
}

interface ResumeData {
  contact?: ContactInfo;
  photo?: string;
  personal?: {
    dob?: string;
    gender?: string;
    nationality?: string;
    father_name?: string;
    declaration_place?: string;
    declaration_date?: string;
  };
  summary?: string;
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  skills?: SkillCategory[] | string[];
  achievements?: string[];
  customSections?: CustomSection[];
  printSize?: 'compact' | 'standard' | 'spacious';
  fitOnePage?: boolean;
}

interface ResumeResponse {
  id: string;
  resume_data: ResumeData;
  ats_score: number;
  keywords_matched: string[];
  keywords_missing: string[];
  recommendations: string[];
  target_role: string;
  job_description: string;
  template_id: string;
  order_id: string;
}

type SavedStatus = 'saved' | 'saving' | 'unsaved';
type TabName = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'extras' | 'styles';

// ─── Helpers ───
function getScoreColor(score: number): string {
  if (score >= 80) return '#057642';
  if (score >= 60) return '#E67E22';
  return '#CC1016';
}

function normalizeSkills(skills: any): {
  technical: string[];
  soft: string[];
  languages: string[];
  certifications: string[];
} {
  const result = { technical: [] as string[], soft: [] as string[], languages: [] as string[], certifications: [] as string[] };
  if (!skills) return result;

  // Handle object format: { technical: [], soft: [], languages: [], certifications: [] }
  if (!Array.isArray(skills) && typeof skills === 'object') {
    if (skills.technical) result.technical = Array.isArray(skills.technical) ? skills.technical : [];
    if (skills.soft) result.soft = Array.isArray(skills.soft) ? skills.soft : [];
    if (skills.languages) result.languages = Array.isArray(skills.languages) ? skills.languages : [];
    if (skills.certifications) result.certifications = Array.isArray(skills.certifications) ? skills.certifications : [];
    return result;
  }

  // Handle array format
  if (!Array.isArray(skills) || !skills.length) return result;
  if (typeof skills[0] === 'string') {
    result.technical = skills as string[];
    return result;
  }
  const cats = skills as SkillCategory[];
  for (const cat of cats) {
    const name = (cat.category || '').toLowerCase();
    if (name.includes('techni') || name.includes('hard')) {
      result.technical = [...result.technical, ...(cat.skills || [])];
    } else if (name.includes('soft') || name.includes('interpersonal')) {
      result.soft = [...result.soft, ...(cat.skills || [])];
    } else if (name.includes('language')) {
      result.languages = [...result.languages, ...(cat.skills || [])];
    } else if (name.includes('certif')) {
      result.certifications = [...result.certifications, ...(cat.skills || [])];
    } else {
      result.technical = [...result.technical, ...(cat.skills || [])];
    }
  }
  return result;
}

function skillsToCategories(parsed: { technical: string[]; soft: string[]; languages: string[]; certifications: string[] }): SkillCategory[] {
  const result: SkillCategory[] = [];
  if (parsed.technical.length) result.push({ category: 'Technical', skills: parsed.technical });
  if (parsed.soft.length) result.push({ category: 'Soft Skills', skills: parsed.soft });
  if (parsed.languages.length) result.push({ category: 'Languages', skills: parsed.languages });
  if (parsed.certifications.length) result.push({ category: 'Certifications', skills: parsed.certifications });
  return result;
}

// ─── Shared Styles ───
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #D1D5DB',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
  background: '#FAFBFC',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
  display: 'block',
  letterSpacing: '0.02em',
};
const fieldGap: React.CSSProperties = { marginBottom: 12 };

// ─── Tag Input Component ───
function TagInput({ tags, onTagsChange, placeholder }: { tags: string[]; onTagsChange: (t: string[]) => void; placeholder?: string }) {
  const [inputVal, setInputVal] = useState('');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {tags.map((tag, i) => (
        <span key={i} style={{
          background: '#EFF6FF', color: '#1D4ED8', borderRadius: 4,
          padding: '2px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          {tag}
          <span
            style={{ cursor: 'pointer', fontWeight: 700, fontSize: 14, lineHeight: 1 }}
            onClick={() => onTagsChange(tags.filter((_, j) => j !== i))}
          >
            &times;
          </span>
        </span>
      ))}
      <input
        value={inputVal}
        onChange={e => setInputVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && inputVal.trim()) {
            e.preventDefault();
            onTagsChange([...tags, inputVal.trim()]);
            setInputVal('');
          }
        }}
        placeholder={placeholder || 'Type + Enter'}
        style={{ ...inputStyle, width: 'auto', flex: 1, minWidth: 120 }}
      />
    </div>
  );
}

// ─── Main Page ───
export default function ResumeEditorPage() {
  const params = useParams();
  const resumeId = params.resumeId as string;

  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [atsScore, setAtsScore] = useState(0);
  const [keywordsMatched, setKeywordsMatched] = useState<string[]>([]);
  const [keywordsMissing, setKeywordsMissing] = useState<string[]>([]);
  const [orderId, setOrderId] = useState('');
  const [templateId, setTemplateId] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedStatus, setSavedStatus] = useState<SavedStatus>('saved');
  const [activeTab, setActiveTab] = useState<TabName>('contact');
  const [expandedJobs, setExpandedJobs] = useState<Record<number, boolean>>({});
  const [skillsParsed, setSkillsParsed] = useState({ technical: [] as string[], soft: [] as string[], languages: [] as string[], certifications: [] as string[] });
  const [isMobile, setIsMobile] = useState(false);
  const [mobileView, setMobileView] = useState<'edit' | 'preview'>('edit');
  const [dragBullet, setDragBullet] = useState<{expIndex: number; bulletIndex: number} | null>(null);
  const [dragOverBullet, setDragOverBullet] = useState<{expIndex: number; bulletIndex: number} | null>(null);
  const [dragExp, setDragExp] = useState<number | null>(null);
  const [dragOverExp, setDragOverExp] = useState<number | null>(null);

  // Advanced Styles
  const [styleSettings, setStyleSettings] = useState({
    bullet: '\u2022',
    separator: '|',
    fontSize: { body: 11, heading1: 12, heading2: 11, section: 11, name: 18, minor: 10 },
    fontWeight: { body: 'normal', heading1: '600', heading2: 'normal', section: '300', name: '600', minor: 'normal' },
    textTransform: { heading1: 'none', heading2: 'none', section: 'uppercase', name: 'none', minor: 'none' },
    spacing: { betweenSections: 16, titleContent: 8, headings: 3, contentBlocks: 5, listItems: 2 },
    borders: { aboveHeader: 0, belowHeader: 1, sectionTitles: 1 },
  });

  function updateStyle(category: string, key: string, value: any) {
    setStyleSettings(prev => ({
      ...prev,
      [category]: typeof prev[category as keyof typeof prev] === 'object'
        ? { ...(prev[category as keyof typeof prev] as any), [key]: value }
        : value,
    }));
    // Trigger auto-save by touching resumeData
    setResumeData(prev => prev ? { ...prev } : prev);
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate CSS overrides string for preview and PDF
  // Build styled HTML for both preview and PDF
  function buildStyledHTML(): string {
    if (!resumeData) return '';
    let html = buildPrintHTML(resumeData, templateId);
    const s = styleSettings;

    // 1. Replace bullet characters — only bullet entities at start of lines
    if (s.bullet !== '\u2022') {
      html = html.replace(/&bull;\s*/g, s.bullet + ' ');
      html = html.replace(/&#8226;\s*/g, s.bullet + ' ');
      html = html.replace(/(>)\s*[•·▸►▶»→■●▪‣]\s/g, '$1' + s.bullet + ' ');
    }

    // 2. Replace contact separator — only in text between > and < that contains |
    if (s.separator !== '|') {
      // Target the contact line — usually within first part of the resume
      html = html.replace(/(>[^<]{0,200})\s\|\s/g, (match, prefix) => {
        return prefix + ` ${s.separator} `;
      });
    }

    // 3. Font size overrides via inline style replacement
    // Body font size — replace the root font-size
    html = html.replace(/font-size:\s*1[0-2](\.\d+)?px/g, `font-size:${s.fontSize.body}px`);

    // Name — replace large font sizes (18px+)
    html = html.replace(/font-size:\s*(1[8-9]|[2-3]\d)px/g, `font-size:${s.fontSize.name}px`);

    // Section titles — find uppercase+letter-spacing elements and change their font-size
    html = html.replace(/(text-transform:\s*uppercase[^"]*?)font-size:\s*\d+px/g, `$1font-size:${s.fontSize.section}px`);
    html = html.replace(/(font-size:\s*\d+px[^"]*?text-transform:\s*)uppercase/g, `font-size:${s.fontSize.section}px;$1${s.textTransform.section}`);

    // 4. Font weight overrides
    // Section titles weight
    html = html.replace(/(text-transform:\s*uppercase[^"]*?)font-weight:\s*\d+/g, `$1font-weight:${s.fontWeight.section}`);

    // 5. Text transform for section titles
    if (s.textTransform.section !== 'uppercase') {
      html = html.replace(/text-transform:\s*uppercase/g, `text-transform:${s.textTransform.section}`);
    }

    // 6. Spacing — between sections
    html = html.replace(/margin-bottom:\s*16px/g, `margin-bottom:${s.spacing.betweenSections}px`);
    html = html.replace(/margin-bottom:\s*18px/g, `margin-bottom:${s.spacing.betweenSections}px`);

    // Spacing — list items
    html = html.replace(/(text-indent:[^"]*?)margin-bottom:\s*[12345]px/g, `$1margin-bottom:${s.spacing.listItems}px`);

    // Spacing — content blocks
    html = html.replace(/margin-bottom:\s*8px/g, `margin-bottom:${s.spacing.contentBlocks}px`);
    html = html.replace(/margin-bottom:\s*12px/g, `margin-bottom:${s.spacing.contentBlocks}px`);

    // 7. Section title borders
    if (s.borders.sectionTitles === 0) {
      html = html.replace(/border-bottom:\s*[\d.]+px\s+solid\s+[^;"]+/g, 'border-bottom:none');
    } else {
      html = html.replace(/(border-bottom:\s*)[\d.]+px(\s+solid)/g, `$1${s.borders.sectionTitles}px$2`);
    }

    return html;
  }

  // Check if style is at default values (no overrides needed)
  const isDefaultStyles = styleSettings.fontSize.body === 11 && styleSettings.fontSize.name === 18 &&
    styleSettings.fontWeight.heading1 === '600' && styleSettings.spacing.betweenSections === 16 &&
    styleSettings.borders.sectionTitles === 1 && styleSettings.bullet === '\u2022' && styleSettings.separator === '|';

  function getStyleOverrideCSS(): string {
    // Don't inject any overrides if at defaults — preserve template exactly
    if (isDefaultStyles) return '';

    const s = styleSettings;
    return `
      /* Body text size */
      .rs-preview { font-size: ${s.fontSize.body}px !important; }

      /* Full Name — elements with font-size 18px+ */
      .rs-preview [style*="font-size:18"], .rs-preview [style*="font-size: 18"],
      .rs-preview [style*="font-size:20"], .rs-preview [style*="font-size: 20"],
      .rs-preview [style*="font-size:22"], .rs-preview [style*="font-size: 22"],
      .rs-preview [style*="font-size:24"], .rs-preview [style*="font-size: 24"],
      .rs-preview [style*="font-size:26"], .rs-preview [style*="font-size: 26"],
      .rs-preview [style*="font-size:28"], .rs-preview [style*="font-size: 28"],
      .rs-preview [style*="font-size:30"], .rs-preview [style*="font-size: 30"],
      .rs-preview [style*="font-size:32"], .rs-preview [style*="font-size: 32"] {
        font-size: ${s.fontSize.name}px !important;
        font-weight: ${s.fontWeight.name} !important;
        ${s.textTransform.name !== 'none' ? `text-transform: ${s.textTransform.name} !important;` : ''}
      }

      /* Section titles — uppercase text with letter-spacing */
      .rs-preview [style*="text-transform:uppercase"],
      .rs-preview [style*="text-transform: uppercase"] {
        font-size: ${s.fontSize.section}px !important;
        font-weight: ${s.fontWeight.section} !important;
        text-transform: ${s.textTransform.section} !important;
        ${s.borders.sectionTitles > 0
          ? `border-bottom-width: ${s.borders.sectionTitles}px !important; border-bottom-style: solid !important;`
          : `border-bottom: none !important;`}
      }

      /* Primary headings — font-weight 700/800 with font-size 13px+ */
      .rs-preview [style*="font-weight:700"][style*="font-size:1"],
      .rs-preview [style*="font-weight: 700"][style*="font-size:1"],
      .rs-preview [style*="font-weight:800"][style*="font-size:1"] {
        font-weight: ${s.fontWeight.heading1} !important;
        font-size: ${s.fontSize.heading1}px !important;
        ${s.textTransform.heading1 !== 'none' ? `text-transform: ${s.textTransform.heading1} !important;` : ''}
      }

      /* Secondary headings — italic company/location lines */
      .rs-preview [style*="font-style:italic"][style*="font-size:1"],
      .rs-preview [style*="font-style: italic"][style*="font-size:1"] {
        font-size: ${s.fontSize.heading2}px !important;
        font-weight: ${s.fontWeight.heading2} !important;
      }

      /* Minor copy — small gray text (dates, labels) */
      .rs-preview [style*="font-size:9"], .rs-preview [style*="font-size: 9"],
      .rs-preview [style*="font-size:10"], .rs-preview [style*="font-size: 10"],
      .rs-preview [style*="font-size:11"], .rs-preview [style*="font-size: 11"] {
        font-size: ${s.fontSize.minor}px !important;
        font-weight: ${s.fontWeight.minor} !important;
      }

      /* Bullet line spacing */
      .rs-preview [style*="text-indent"] {
        margin-bottom: ${s.spacing.listItems}px !important;
      }

      /* Section spacing — only target margin-bottom on divs that had margin */
      .rs-preview [style*="margin-bottom:16"], .rs-preview [style*="margin-bottom: 16"],
      .rs-preview [style*="margin-bottom:18"], .rs-preview [style*="margin-bottom: 18"],
      .rs-preview [style*="margin-bottom:14"], .rs-preview [style*="margin-bottom: 14"] {
        margin-bottom: ${s.spacing.betweenSections}px !important;
      }

      /* Content block spacing */
      .rs-preview [style*="margin-bottom:8"], .rs-preview [style*="margin-bottom: 8"],
      .rs-preview [style*="margin-bottom:12"], .rs-preview [style*="margin-bottom: 12"] {
        margin-bottom: ${s.spacing.contentBlocks}px !important;
      }

      /* Header borders */
      ${s.borders.aboveHeader > 0 ? `.rs-preview > div > div:first-child { border-top: ${s.borders.aboveHeader}px solid #333 !important; }` : ''}
      ${s.borders.belowHeader > 0 ? `.rs-preview [style*="border-bottom"] { border-bottom-width: ${s.borders.belowHeader}px !important; }` : ''}
    `;
  }

  // Apply bullet and separator replacements to rendered HTML
  function applyTextReplacements(container: HTMLElement) {
    if (!container) return;
    // Replace bullets
    const defaultBullets = ['•', '·', '–', '—', '▸', '►', '▶', '»', '→', '■', '●', '▪', '‣', '-'];
    container.querySelectorAll('[style*="text-indent"], li').forEach(node => {
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      let textNode;
      while ((textNode = walker.nextNode())) {
        const t = textNode.textContent || '';
        for (const b of defaultBullets) {
          if (t.trimStart().startsWith(b + ' ') || t.trimStart().startsWith(b)) {
            textNode.textContent = t.replace(new RegExp(`^\\s*\\${b}\\s*`), styleSettings.bullet + ' ');
            break;
          }
        }
      }
    });
    // Replace separators in contact line
    const allDivs = container.querySelectorAll('div');
    allDivs.forEach(div => {
      if (div.children.length === 0 && div.textContent && (div.textContent.includes(' | ') || div.textContent.includes(' • ') || div.textContent.includes(' · '))) {
        div.textContent = div.textContent
          .replace(/\s*\|\s*/g, ` ${styleSettings.separator} `)
          .replace(/\s*•\s*/g, ` ${styleSettings.separator} `)
          .replace(/\s*·\s*/g, ` ${styleSettings.separator} `);
      }
    });
  }

  // Apply text replacements after every render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (previewRef.current) applyTextReplacements(previewRef.current);
    }, 50);
    return () => clearTimeout(timer);
  }, [styleSettings, resumeData, templateId]);

  // ─── Fetch ───
  useEffect(() => {
    if (!resumeId) return;
    setLoading(true);
    fetch(`${API_URL}/api/resume/${resumeId}`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then((data: ResumeResponse) => {
        setResumeData(data.resume_data);
        setAtsScore(data.ats_score || 0);
        setKeywordsMatched(data.keywords_matched || []);
        setKeywordsMissing(data.keywords_missing || []);
        setOrderId(data.order_id || '');
        setTemplateId(data.template_id || 'classic');
        setSkillsParsed(normalizeSkills(data.resume_data?.skills));
        if ((data.resume_data as any)?.styleSettings) setStyleSettings((data.resume_data as any).styleSettings);
        if (data.resume_data?.experience?.length) {
          const exp: Record<number, boolean> = {};
          exp[0] = true;
          setExpandedJobs(exp);
        }
        setLoading(false);
      })
      .catch(() => { setError('Resume not found'); setLoading(false); });
  }, [resumeId]);

  // ─── Mobile detection ───
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ─── Auto-save ───
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!resumeData) return;
    setSavedStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSavedStatus('saving');
      fetch(`${API_URL}/api/resume/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_data: { ...resumeData, styleSettings }, template_id: templateId }),
      })
        .then(res => { if (!res.ok) throw new Error('Save failed'); setSavedStatus('saved'); })
        .catch(() => setSavedStatus('unsaved'));
    }, 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeData, resumeId, templateId, styleSettings]);

  // ─── Update helpers ───
  const updateContact = useCallback((field: keyof ContactInfo, value: string) => {
    setResumeData(prev => prev ? { ...prev, contact: { ...prev.contact, [field]: value } } : prev);
  }, []);

  const updatePersonal = useCallback((field: string, value: string) => {
    setResumeData(prev => prev ? { ...prev, personal: { ...prev.personal, [field]: value } } : prev);
  }, []);

  const handlePhotoUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    try {
      const res = await fetch(`${API_URL}/api/resume/${resumeId}/photo`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.photo_url) {
        setResumeData(prev => prev ? { ...prev, photo: data.photo_url } : prev);
      }
    } catch { /* silent fail */ }
  }, [resumeId]);

  const removePhoto = useCallback(() => {
    setResumeData(prev => prev ? { ...prev, photo: undefined } : prev);
  }, []);

  const updateSummary = useCallback((value: string) => {
    setResumeData(prev => prev ? { ...prev, summary: value } : prev);
  }, []);

  const updateExperience = useCallback((index: number, field: string, value: unknown) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const exp = [...(prev.experience || [])];
      exp[index] = { ...exp[index], [field]: value };
      return { ...prev, experience: exp };
    });
  }, []);

  const updateBullet = useCallback((expIdx: number, bulIdx: number, value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const exp = [...(prev.experience || [])];
      const bullets = [...(exp[expIdx].bullets || [])];
      bullets[bulIdx] = value;
      exp[expIdx] = { ...exp[expIdx], bullets };
      return { ...prev, experience: exp };
    });
  }, []);

  const removeBullet = useCallback((expIdx: number, bulIdx: number) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const exp = [...(prev.experience || [])];
      const bullets = (exp[expIdx].bullets || []).filter((_, j) => j !== bulIdx);
      exp[expIdx] = { ...exp[expIdx], bullets };
      return { ...prev, experience: exp };
    });
  }, []);

  const addBullet = useCallback((expIdx: number) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const exp = [...(prev.experience || [])];
      exp[expIdx] = { ...exp[expIdx], bullets: [...(exp[expIdx].bullets || []), ''] };
      return { ...prev, experience: exp };
    });
  }, []);

  const addExperience = useCallback(() => {
    setResumeData(prev => {
      if (!prev) return prev;
      const newIdx = (prev.experience || []).length;
      setExpandedJobs(ej => ({ ...ej, [newIdx]: true }));
      return { ...prev, experience: [...(prev.experience || []), { role: '', company: '', location: '', startDate: '', endDate: '', current: false, bullets: [''] }] };
    });
  }, []);

  const removeExperience = useCallback((index: number) => {
    setResumeData(prev => {
      if (!prev) return prev;
      return { ...prev, experience: (prev.experience || []).filter((_, i) => i !== index) };
    });
  }, []);

  const updateEducation = useCallback((index: number, field: string, value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const edu = [...(prev.education || [])];
      edu[index] = { ...edu[index], [field]: value };
      return { ...prev, education: edu };
    });
  }, []);

  const addEducation = useCallback(() => {
    setResumeData(prev => prev ? { ...prev, education: [...(prev.education || []), { institution: '', degree: '', field: '', year: '', gpa: '' }] } : prev);
  }, []);

  const removeEducation = useCallback((index: number) => {
    setResumeData(prev => prev ? { ...prev, education: (prev.education || []).filter((_, i) => i !== index) } : prev);
  }, []);

  const updateSkillCategory = useCallback((cat: 'technical' | 'soft' | 'languages' | 'certifications', tags: string[]) => {
    setSkillsParsed(prev => {
      const next = { ...prev, [cat]: tags };
      setResumeData(rd => rd ? { ...rd, skills: skillsToCategories(next) } : rd);
      return next;
    });
  }, []);

  const updateAchievement = useCallback((index: number, value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const a = [...(prev.achievements || [])];
      a[index] = value;
      return { ...prev, achievements: a };
    });
  }, []);

  const addAchievement = useCallback(() => {
    setResumeData(prev => prev ? { ...prev, achievements: [...(prev.achievements || []), ''] } : prev);
  }, []);

  const removeAchievement = useCallback((index: number) => {
    setResumeData(prev => prev ? { ...prev, achievements: (prev.achievements || []).filter((_, i) => i !== index) } : prev);
  }, []);

  // ─── AI Enhance ───
  const [enhancingFields, setEnhancingFields] = useState<Record<string, boolean>>({});

  async function aiEnhance(text: string, context: string): Promise<string> {
    const res = await fetch(`${API_URL}/api/resume/ai-enhance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
    });
    if (!res.ok) throw new Error('AI enhance failed');
    const data = await res.json();
    return data.enhanced;
  }

  const enhanceButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #7C3AED, #0B69C7)',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: 6,
    color: 'white',
    opacity: 1,
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
  };

  const updateCustomSection = useCallback((index: number, field: 'title' | 'content', value: string) => {
    setResumeData(prev => {
      if (!prev) return prev;
      const cs = [...(prev.customSections || [])];
      cs[index] = { ...cs[index], [field]: value };
      return { ...prev, customSections: cs };
    });
  }, []);

  const addCustomSection = useCallback(() => {
    setResumeData(prev => prev ? { ...prev, customSections: [...(prev.customSections || []), { title: '', content: '' }] } : prev);
  }, []);

  const removeCustomSection = useCallback((index: number) => {
    setResumeData(prev => prev ? { ...prev, customSections: (prev.customSections || []).filter((_, i) => i !== index) } : prev);
  }, []);

  // ─── Download PDF ───
  const [pdfGenerating, setPdfGenerating] = useState(false);

  function injectStyleOverrides(html: string): string {
    let processed = html;

    // 1. Replace ONLY bullet characters at start of bullet lines (not inside words)
    // Target: text after text-indent or &bull; entities — NOT hyphens in words
    if (styleSettings.bullet !== '•') {
      processed = processed.replace(/&bull;\s*/g, styleSettings.bullet + ' ');
      processed = processed.replace(/&#8226;\s*/g, styleSettings.bullet + ' ');
      // Replace bullets at line start: "• text" or "- text" but ONLY after > or at start
      processed = processed.replace(/>(\s*)[•·▸►▶»→■●▪‣]\s/g, '>$1' + styleSettings.bullet + ' ');
    }

    // 2. Replace contact separators ONLY in the contact line (first few lines, not everywhere)
    // Find the contact info section (usually within first 500 chars of body content)
    if (styleSettings.separator !== '|') {
      const bodyStart = processed.indexOf('<body');
      if (bodyStart > -1) {
        const first500 = processed.substring(bodyStart, bodyStart + 800);
        const replaced = first500.replace(/\s\|\s/g, ` ${styleSettings.separator} `);
        processed = processed.substring(0, bodyStart) + replaced + processed.substring(bodyStart + 800);
      }
    }

    // 3. Inject CSS — scoped to print, preserving template colors
    const css = getStyleOverrideCSS().replace(/\.rs-preview/g, '.print-content-root');
    return processed.replace('</style>', css + '</style>');
  }

  async function handleDownloadPDF() {
    if (!resumeData) return;
    const html = isDefaultStyles ? buildPrintHTML(resumeData, templateId) : buildStyledHTML();
    const name = resumeData?.contact?.name || 'resume';
    const filename = `${name.replace(/[^a-zA-Z0-9]/g, '-')}-resume.pdf`;

    // Try server-side PDF first
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
    // Fallback: browser print
    const win = window.open('', '_blank');
    if (!win) { alert('Please allow popups to download PDF.'); return; }
    win.document.write(html); win.document.close(); win.document.title = ' ';
    setTimeout(() => win.print(), 600);
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid #E5E7EB', borderTopColor: '#0B69C7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 4 }}>Loading Editor</div>
          <div style={{ fontSize: 13, color: '#6B7280' }}>Preparing your resume...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !resumeData) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ textAlign: 'center', background: '#FFFFFF', borderRadius: 16, padding: '48px 40px', border: '1px solid #E5E7EB', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Resume not found</div>
          <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 1.5 }}>This resume doesn&apos;t exist or has expired.</div>
          <a href="/" style={{ display: 'inline-block', padding: '12px 28px', background: '#0B69C7', color: 'white', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Go Home</a>
        </div>
      </div>
    );
  }

  // ─── Computed ───
  const rd = resumeData;
  const contact = rd.contact || {};
  const matched = keywordsMatched.length;

  const tabs: { key: TabName; label: string }[] = [
    { key: 'contact', label: 'Contact' },
    { key: 'summary', label: 'Summary' },
    { key: 'experience', label: 'Experience' },
    { key: 'education', label: 'Education' },
    { key: 'skills', label: 'Skills' },
    { key: 'extras', label: 'Extras' },
    { key: 'styles', label: 'Styles' },
  ];

  const savedStatusColor = savedStatus === 'saved' ? '#057642' : savedStatus === 'saving' ? '#888' : '#E67E22';
  const savedStatusText = savedStatus === 'saved' ? 'Saved' : savedStatus === 'saving' ? 'Saving...' : 'Unsaved';

  // ─── Render ───
  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#F1F3F5', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ═══ HEADER ═══ */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', flexShrink: 0, zIndex: 50 }}>
        <div style={{ padding: '0 20px' }}>
          {/* Row 1: Breadcrumb + status + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <a href={`/resume/${resumeId}`} style={{ fontSize: 13, color: '#6B7280', textDecoration: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}>&larr; Resume</a>
              <span style={{ color: '#D1D5DB' }}>|</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap' }}>Editor</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: savedStatusColor, background: savedStatus === 'saved' ? '#F0FDF4' : savedStatus === 'saving' ? '#F3F4F6' : '#FFFBEB', padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{savedStatusText}</span>
            </div>
            {/* Mobile: Edit/Preview toggle */}
            {isMobile && (
              <div style={{ display: 'flex', gap: 2, background: '#F1F3F5', borderRadius: 10, padding: 3 }}>
                <button onClick={() => setMobileView('edit')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: mobileView === 'edit' ? '#0B69C7' : 'transparent', color: mobileView === 'edit' ? 'white' : '#6B7280', transition: 'all 0.2s' }}>Edit</button>
                <button onClick={() => setMobileView('preview')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: mobileView === 'preview' ? '#0B69C7' : 'transparent', color: mobileView === 'preview' ? 'white' : '#6B7280', transition: 'all 0.2s' }}>Preview</button>
              </div>
            )}
            {/* Actions — Desktop */}
            <div className="hidden sm:flex" style={{ gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 12, outline: 'none', maxWidth: 180, color: '#374151', background: 'white', cursor: 'pointer' }}>
                {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={handleDownloadPDF} disabled={pdfGenerating} style={{ padding: '6px 16px', fontSize: 12, fontWeight: 600, background: '#057642', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: pdfGenerating ? 0.6 : 1 }}>{pdfGenerating ? 'Generating...' : 'Download PDF'}</button>
              <a href={`${API_URL}/api/resume/${resumeId}/download/txt`} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, color: '#374151', border: '1px solid #D1D5DB', borderRadius: 8, textDecoration: 'none', background: '#F9FAFB' }}>TXT</a>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ MAIN PANELS ═══ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Section Nav (desktop only — vertical rail) */}
        {!isMobile && (
          <div style={{ width: 180, flexShrink: 0, background: '#FAFBFC', borderRight: '1px solid #E5E7EB', padding: '20px 0', overflowY: 'auto' }}>
            <div style={{ padding: '0 12px 12px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 2, textTransform: 'uppercase' }}>Sections</div>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 16px', background: activeTab === tab.key ? '#FFFFFF' : 'transparent', border: 'none', borderLeft: activeTab === tab.key ? '3px solid #0B69C7' : '3px solid transparent', color: activeTab === tab.key ? '#0B69C7' : '#6B7280', fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
              }}>
                {tab.label}
              </button>
            ))}
            <div style={{ borderTop: '1px solid #E5E7EB', margin: '16px 12px 0', paddingTop: 16 }}>
              <a href={`/resume/${resumeId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>&larr; Preview</a>
              <a href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 12, color: '#6B7280', textDecoration: 'none', fontWeight: 500 }}>Dashboard</a>
            </div>
          </div>
        )}

        {/* Form Panel */}
        <div style={{ width: isMobile ? '100%' : 0, flex: isMobile ? undefined : '1 1 0', display: (!isMobile || mobileView === 'edit') ? 'block' : 'none', background: '#FFFFFF', overflowY: 'auto', height: 'calc(100vh - 52px)', padding: '20px 24px', maxWidth: isMobile ? undefined : 560, borderRight: '1px solid #E5E7EB' }}>
          {/* Mobile tab bar (horizontal) */}
          {isMobile && (
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)', marginBottom: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch', gap: 0 }}>
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  flexShrink: 0, padding: '8px 12px', background: 'none', border: 'none', whiteSpace: 'nowrap', borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent', color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>{tab.label}</button>
              ))}
            </div>
          )}

          {/* Tab Content */}
          <div style={{ padding: '16px 0' }}>

            {/* ── Contact Tab ── */}
            {activeTab === 'contact' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Contact Information</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Your personal and professional details</div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Full Name</label>
                  <input style={inputStyle} value={contact.name || ''} onChange={e => updateContact('name', e.target.value)} />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} value={contact.email || ''} onChange={e => updateContact('email', e.target.value)} />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} value={contact.phone || ''} onChange={e => updateContact('phone', e.target.value)} />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Location</label>
                  <input style={inputStyle} value={contact.location || ''} onChange={e => updateContact('location', e.target.value)} />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>LinkedIn URL</label>
                  <input style={inputStyle} value={contact.linkedin || ''} onChange={e => updateContact('linkedin', e.target.value)} />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Website</label>
                  <input style={inputStyle} value={contact.website || ''} onChange={e => updateContact('website', e.target.value)} />
                </div>

                {/* Campus template fields */}
                {templateId === 'campus' && (
                  <>
                    <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 16, paddingTop: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e3a5f', marginBottom: 12 }}>Campus Placement Details</div>
                      {/* Photo upload */}
                      <div style={fieldGap}>
                        <label style={labelStyle}>Photo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {resumeData?.photo ? (
                            <div style={{ position: 'relative' }}>
                              <img src={resumeData.photo} alt="Photo" style={{ width: 60, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid #ddd' }} />
                              <button onClick={removePhoto} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#CC1016', color: 'white', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>&times;</button>
                            </div>
                          ) : (
                            <div style={{ width: 60, height: 72, border: '1px dashed #ccc', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999' }}>No photo</div>
                          )}
                          <input type="file" accept="image/*" onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); }} style={{ fontSize: 12 }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={fieldGap}>
                          <label style={labelStyle}>Date of Birth</label>
                          <input style={inputStyle} value={resumeData?.personal?.dob || ''} onChange={e => updatePersonal('dob', e.target.value)} placeholder="01 Jan 2000" />
                        </div>
                        <div style={fieldGap}>
                          <label style={labelStyle}>Gender</label>
                          <select style={inputStyle} value={resumeData?.personal?.gender || ''} onChange={e => updatePersonal('gender', e.target.value)}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={fieldGap}>
                          <label style={labelStyle}>Nationality</label>
                          <input style={inputStyle} value={resumeData?.personal?.nationality || ''} onChange={e => updatePersonal('nationality', e.target.value)} placeholder="Indian" />
                        </div>
                        <div style={fieldGap}>
                          <label style={labelStyle}>Father{"'"}s Name <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span></label>
                          <input style={inputStyle} value={resumeData?.personal?.father_name || ''} onChange={e => updatePersonal('father_name', e.target.value)} />
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid #E5E7EB', marginTop: 12, paddingTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>Declaration</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={fieldGap}>
                            <label style={labelStyle}>Place</label>
                            <input style={inputStyle} value={resumeData?.personal?.declaration_place || ''} onChange={e => updatePersonal('declaration_place', e.target.value)} placeholder="Tirupati" />
                          </div>
                          <div style={fieldGap}>
                            <label style={labelStyle}>Date</label>
                            <input style={inputStyle} type="date" value={resumeData?.personal?.declaration_date || ''} onChange={e => updatePersonal('declaration_date', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Summary Tab ── */}
            {activeTab === 'summary' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Professional Summary</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>A brief overview of your career</div>
                <div style={fieldGap}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={labelStyle}>Professional Summary</label>
                    <button
                      style={enhanceButtonStyle}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                      disabled={!!enhancingFields['summary']}
                      onClick={async () => {
                        if (!rd.summary?.trim()) return;
                        setEnhancingFields(prev => ({ ...prev, summary: true }));
                        try {
                          const enhanced = await aiEnhance(rd.summary, 'summary');
                          updateSummary(enhanced);
                        } catch { /* silent */ }
                        setEnhancingFields(prev => ({ ...prev, summary: false }));
                      }}
                      title="AI Enhance — Rewrite this text with stronger action verbs and metrics"
                    >
                      {enhancingFields['summary'] ? '...' : '\u2728'}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    value={rd.summary || ''}
                    onChange={e => updateSummary(e.target.value)}
                  />
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{(rd.summary || '').length} characters</div>
                </div>
              </div>
            )}

            {/* ── Experience Tab ── */}
            {activeTab === 'experience' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Work Experience</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Your roles and achievements</div>
                {(rd.experience || []).map((exp, i) => {
                  const isOpen = !!expandedJobs[i];
                  const dateStr = exp.dates || [exp.startDate || exp.start_date, exp.current ? 'Present' : (exp.endDate || exp.end_date)].filter(Boolean).join(' - ');
                  return (
                    <div
                      key={i}
                      style={{
                        border: '1px solid #E0E0E0', borderRadius: 8, overflow: 'hidden', marginBottom: 12,
                        borderTop: dragOverExp === i ? '2px solid #0A66C2' : '1px solid #E0E0E0',
                        opacity: dragExp === i ? 0.4 : 1,
                      }}
                      onDragOver={(e) => {
                        if (dragExp === null) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        setDragOverExp(i);
                      }}
                      onDragLeave={() => { if (dragExp !== null) setDragOverExp(null); }}
                      onDrop={(e) => {
                        if (dragExp === null) return;
                        e.preventDefault();
                        if (dragExp !== i) {
                          const expArr = [...(resumeData.experience || [])];
                          const [moved] = expArr.splice(dragExp, 1);
                          expArr.splice(i, 0, moved);
                          setResumeData(prev => prev ? { ...prev, experience: expArr } : prev);
                          // Update expandedJobs to follow the moved entries
                          setExpandedJobs(ej => {
                            const newEj: Record<number, boolean> = {};
                            const oldKeys = Object.keys(ej).map(Number);
                            for (const k of oldKeys) {
                              if (!ej[k]) continue;
                              let newK = k;
                              if (k === dragExp) {
                                newK = i;
                              } else if (dragExp < i && k > dragExp && k <= i) {
                                newK = k - 1;
                              } else if (dragExp > i && k >= i && k < dragExp) {
                                newK = k + 1;
                              }
                              newEj[newK] = true;
                            }
                            return newEj;
                          });
                        }
                        setDragExp(null);
                        setDragOverExp(null);
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: '12px 16px', background: '#F9FAFB', cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                        }}
                      >
                        <div
                          draggable
                          tabIndex={0}
                          role="button"
                          aria-label={`Reorder ${exp.title || exp.role || 'experience'}. Use arrow keys.`}
                          onDragStart={(e) => {
                            setDragExp(i);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => { setDragExp(null); setDragOverExp(null); }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp' && i > 0) {
                              e.preventDefault();
                              const items = [...(resumeData?.experience || [])];
                              [items[i - 1], items[i]] = [items[i], items[i - 1]];
                              setResumeData(prev => prev ? { ...prev, experience: items } : prev);
                            } else if (e.key === 'ArrowDown' && i < (resumeData?.experience?.length || 0) - 1) {
                              e.preventDefault();
                              const items = [...(resumeData?.experience || [])];
                              [items[i + 1], items[i]] = [items[i], items[i + 1]];
                              setResumeData(prev => prev ? { ...prev, experience: items } : prev);
                            }
                          }}
                          style={{
                            cursor: 'grab', padding: '0 6px', color: '#bbb', fontSize: 14,
                            userSelect: 'none', display: 'flex', alignItems: 'center', marginRight: 8,
                          }}
                          title="Drag to reorder (or use arrow keys)"
                        >
                          ⠿
                        </div>
                        <div
                          onClick={() => setExpandedJobs(ej => ({ ...ej, [i]: !ej[i] }))}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                            {(exp.role || exp.title || 'New Position')}{exp.company ? ` at ${exp.company}` : ''}
                          </span>
                          <span style={{ fontSize: 18, color: '#888', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                            &#9662;
                          </span>
                        </div>
                      </div>
                      {/* Body */}
                      {isOpen && (
                        <div style={{ padding: 16 }}>
                          <div style={fieldGap}>
                            <label style={labelStyle}>Role</label>
                            <input style={inputStyle} value={exp.role || exp.title || ''} onChange={e => updateExperience(i, 'role', e.target.value)} />
                          </div>
                          <div style={fieldGap}>
                            <label style={labelStyle}>Company</label>
                            <input style={inputStyle} value={exp.company || ''} onChange={e => updateExperience(i, 'company', e.target.value)} />
                          </div>
                          <div style={fieldGap}>
                            <label style={labelStyle}>Location</label>
                            <input style={inputStyle} value={exp.location || ''} onChange={e => updateExperience(i, 'location', e.target.value)} />
                          </div>
                          {(() => {
                            // Normalize: handle both startDate/endDate and start_date/end_date formats
                            const startStr = exp.startDate || exp.start_date || (exp.dates ? exp.dates.split(/\s*[-–—]\s*/)[0] : '') || '';
                            const endStr = exp.current ? 'Present' : (exp.endDate || exp.end_date || (exp.dates ? exp.dates.split(/\s*[-–—]\s*/)[1] : '') || '');
                            const startMonth = startStr.replace(/\s*\d{4}$/, '').trim();
                            const startYear = startStr.match(/\d{4}/)?.[0] || '';
                            const endMonth = endStr.replace(/\s*\d{4}$/, '').replace('Present', '').trim();
                            const endYear = endStr === 'Present' ? '' : (endStr.match(/\d{4}/)?.[0] || '');
                            const isCurrent = !!exp.current;
                            return (
                          <div style={{ display: 'flex', gap: 8, ...fieldGap, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 110 }}>
                              <label style={labelStyle}>Start Month</label>
                              <select style={inputStyle} value={startMonth} onChange={e => {
                                updateExperience(i, 'start_date', `${e.target.value} ${startYear}`.trim());
                                updateExperience(i, 'startDate', `${e.target.value} ${startYear}`.trim());
                              }}>
                                <option value="">Month</option>
                                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 80 }}>
                              <label style={labelStyle}>Start Year</label>
                              <select style={inputStyle} value={startYear} onChange={e => {
                                updateExperience(i, 'start_date', `${startMonth} ${e.target.value}`.trim());
                                updateExperience(i, 'startDate', `${startMonth} ${e.target.value}`.trim());
                              }}>
                                <option value="">Year</option>
                                {Array.from({ length: 30 }, (_, j) => 2026 - j).map(y => <option key={y} value={String(y)}>{y}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 110 }}>
                              <label style={labelStyle}>End Month</label>
                              <select style={inputStyle} disabled={!!isCurrent} value={isCurrent ? '' : endMonth} onChange={e => {
                                updateExperience(i, 'end_date', `${e.target.value} ${endYear}`.trim());
                                updateExperience(i, 'endDate', `${e.target.value} ${endYear}`.trim());
                              }}>
                                <option value="">Month</option>
                                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 80 }}>
                              <label style={labelStyle}>End Year</label>
                              <select style={inputStyle} disabled={!!isCurrent} value={isCurrent ? '' : endYear} onChange={e => {
                                updateExperience(i, 'end_date', `${endMonth} ${e.target.value}`.trim());
                                updateExperience(i, 'endDate', `${endMonth} ${e.target.value}`.trim());
                              }}>
                                <option value="">Year</option>
                                {Array.from({ length: 30 }, (_, j) => 2026 - j).map(y => <option key={y} value={String(y)}>{y}</option>)}
                              </select>
                            </div>
                          </div>
                            );
                          })()}
                          <div style={fieldGap}>
                            <div>
                              <label style={{ fontSize: 12, color: '#666', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <input
                                  type="checkbox"
                                  checked={!!exp.current}
                                  onChange={e => {
                                    updateExperience(i, 'current', e.target.checked);
                                    if (e.target.checked) {
                                      updateExperience(i, 'endDate', '');
                                      updateExperience(i, 'end_date', '');
                                      updateExperience(i, 'dates', '');
                                      // Move this entry to top of experience list
                                      setResumeData(prev => {
                                        if (!prev || !prev.experience) return prev;
                                        const exp = [...prev.experience];
                                        const [moved] = exp.splice(i, 1);
                                        moved.current = true;
                                        moved.endDate = '';
                                        moved.end_date = '';
                                        // Uncheck current on all others
                                        exp.forEach(e => { e.current = false; });
                                        return { ...prev, experience: [moved, ...exp] };
                                      });
                                    }
                                  }}
                                />
                                Current
                              </label>
                            </div>
                          </div>
                          {/* Bullets */}
                          <label style={labelStyle}>Bullets</label>
                          {(exp.bullets || []).map((b, j) => (
                            <div
                              key={j}
                              style={{
                                display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start',
                                borderTop: dragOverBullet?.expIndex === i && dragOverBullet?.bulletIndex === j ? '2px solid #0A66C2' : 'none',
                                opacity: dragBullet?.expIndex === i && dragBullet?.bulletIndex === j ? 0.4 : 1,
                              }}
                              onDragOver={(e) => {
                                if (dragBullet === null || dragBullet.expIndex !== i) return;
                                e.preventDefault();
                                e.dataTransfer.dropEffect = 'move';
                                setDragOverBullet({ expIndex: i, bulletIndex: j });
                              }}
                              onDragLeave={() => { if (dragBullet !== null) setDragOverBullet(null); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (dragBullet && dragBullet.expIndex === i) {
                                  const expArr = [...(resumeData.experience || [])];
                                  const bullets = [...(expArr[i].bullets || [])];
                                  const [moved] = bullets.splice(dragBullet.bulletIndex, 1);
                                  bullets.splice(j, 0, moved);
                                  expArr[i] = { ...expArr[i], bullets };
                                  setResumeData(prev => prev ? { ...prev, experience: expArr } : prev);
                                }
                                setDragBullet(null);
                                setDragOverBullet(null);
                              }}
                            >
                              <div
                                draggable
                                onDragStart={(e) => {
                                  setDragBullet({ expIndex: i, bulletIndex: j });
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => { setDragBullet(null); setDragOverBullet(null); }}
                                style={{
                                  cursor: 'grab', padding: '0 6px', color: '#bbb', fontSize: 14,
                                  userSelect: 'none', display: 'flex', alignItems: 'center', flexShrink: 0,
                                }}
                                title="Drag to reorder"
                              >
                                ⠿
                              </div>
                              <textarea
                                rows={3}
                                style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: '1.5' }}
                                value={b}
                                onChange={e => updateBullet(i, j, e.target.value)}
                              />
                              <button
                                style={{ ...enhanceButtonStyle, flexShrink: 0 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                                disabled={!!enhancingFields[`bullet-${i}-${j}`]}
                                onClick={async () => {
                                  if (!b.trim()) return;
                                  setEnhancingFields(prev => ({ ...prev, [`bullet-${i}-${j}`]: true }));
                                  try {
                                    const enhanced = await aiEnhance(b, 'bullet');
                                    updateBullet(i, j, enhanced);
                                  } catch { /* silent */ }
                                  setEnhancingFields(prev => ({ ...prev, [`bullet-${i}-${j}`]: false }));
                                }}
                                title="AI Enhance — Rewrite this text with stronger action verbs and metrics"
                              >
                                {enhancingFields[`bullet-${i}-${j}`] ? '...' : '\u2728'}
                              </button>
                              {(exp.bullets || []).length > 1 && (
                                <button
                                  onClick={() => removeBullet(i, j)}
                                  style={{
                                    background: 'none', border: 'none', color: '#CC1016', fontSize: 18,
                                    cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: '6px 2px',
                                  }}
                                >
                                  &times;
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            onClick={() => addBullet(i)}
                            style={{
                              background: 'none', border: 'none', color: '#0A66C2',
                              fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
                            }}
                          >
                            + Add Bullet
                          </button>
                          <div style={{ marginTop: 12 }}>
                            <button
                              onClick={() => removeExperience(i)}
                              style={{
                                background: 'none', border: 'none', color: '#CC1016',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0,
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addExperience}
                  style={{
                    padding: '8px 16px', background: '#F3F2EF', color: '#0A66C2', border: '1px solid #D0D0D0',
                    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  + Add New Position
                </button>
              </div>
            )}

            {/* ── Education Tab ── */}
            {activeTab === 'education' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Education</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Your academic background</div>
                {(rd.education || []).map((edu, i) => (
                  <div key={i} style={{ border: '1px solid #E0E0E0', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                    <div style={fieldGap}>
                      <label style={labelStyle}>Institution</label>
                      <input style={inputStyle} value={edu.institution || edu.school || ''} onChange={e => updateEducation(i, 'institution', e.target.value)} />
                    </div>
                    <div style={fieldGap}>
                      <label style={labelStyle}>Degree</label>
                      <input style={inputStyle} value={edu.degree || ''} onChange={e => updateEducation(i, 'degree', e.target.value)} />
                    </div>
                    <div style={fieldGap}>
                      <label style={labelStyle}>Field</label>
                      <input style={inputStyle} value={edu.field || ''} onChange={e => updateEducation(i, 'field', e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 12, ...fieldGap }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Year</label>
                        <input style={inputStyle} value={edu.year || edu.dates || ''} onChange={e => updateEducation(i, 'year', e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>GPA (optional)</label>
                        <input style={inputStyle} value={edu.gpa || ''} onChange={e => updateEducation(i, 'gpa', e.target.value)} />
                      </div>
                    </div>
                    <button
                      onClick={() => removeEducation(i)}
                      style={{ background: 'none', border: 'none', color: '#CC1016', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addEducation}
                  style={{
                    padding: '8px 16px', background: '#F3F2EF', color: '#0A66C2', border: '1px solid #D0D0D0',
                    borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  + Add Education
                </button>
              </div>
            )}

            {/* ── Skills Tab ── */}
            {activeTab === 'skills' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Skills</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Technical and interpersonal competencies</div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Technical Skills</label>
                  <TagInput tags={skillsParsed.technical} onTagsChange={t => updateSkillCategory('technical', t)} placeholder="Add technical skill + Enter" />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Soft Skills</label>
                  <TagInput tags={skillsParsed.soft} onTagsChange={t => updateSkillCategory('soft', t)} placeholder="Add soft skill + Enter" />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Languages</label>
                  <TagInput tags={skillsParsed.languages} onTagsChange={t => updateSkillCategory('languages', t)} placeholder="Add language + Enter" />
                </div>
                <div style={fieldGap}>
                  <label style={labelStyle}>Certifications</label>
                  <TagInput tags={skillsParsed.certifications} onTagsChange={t => updateSkillCategory('certifications', t)} placeholder="Add certification + Enter" />
                </div>

                {/* Missing Keywords Quick-Add */}
                {keywordsMissing.length > 0 && (
                  <div style={{ marginTop: 24, padding: 16, background: '#FFF5F5', borderRadius: 8, border: '1px solid #FEE2E2' }}>
                    <label style={{ ...labelStyle, fontSize: 13, color: '#CC1016', marginBottom: 10 }}>Missing Keywords</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {keywordsMissing.map((kw, i) => (
                        <span key={i} style={{
                          background: '#FEE2E2', color: '#CC1016', borderRadius: 12,
                          padding: '2px 10px', fontSize: 12, display: 'inline-flex', alignItems: 'center',
                        }}>
                          {kw}
                          <button
                            onClick={() => {
                              updateSkillCategory('technical', [...skillsParsed.technical, kw]);
                              setKeywordsMissing(prev => prev.filter((_, j) => j !== i));
                              setKeywordsMatched(prev => [...prev, kw]);
                            }}
                            style={{
                              background: '#CC1016', color: '#fff', borderRadius: '50%', width: 18, height: 18,
                              fontSize: 12, cursor: 'pointer', marginLeft: 4, border: 'none',
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0, lineHeight: 1,
                            }}
                          >+</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Extras Tab ── */}
            {activeTab === 'extras' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Extras</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>Achievements, certifications, and custom sections</div>
                {/* Achievements */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, fontSize: 14, marginBottom: 8 }}>Achievements</label>
                  {(rd.achievements || []).map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <textarea
                        rows={2}
                        style={{ ...inputStyle, resize: 'vertical' }}
                        value={a}
                        onChange={e => updateAchievement(i, e.target.value)}
                      />
                      <button
                        style={{ ...enhanceButtonStyle, flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                        disabled={!!enhancingFields[`achievement-${i}`]}
                        onClick={async () => {
                          if (!a.trim()) return;
                          setEnhancingFields(prev => ({ ...prev, [`achievement-${i}`]: true }));
                          try {
                            const enhanced = await aiEnhance(a, 'achievement');
                            updateAchievement(i, enhanced);
                          } catch { /* silent */ }
                          setEnhancingFields(prev => ({ ...prev, [`achievement-${i}`]: false }));
                        }}
                        title="AI Enhance — Rewrite this text with stronger action verbs and metrics"
                      >
                        {enhancingFields[`achievement-${i}`] ? '...' : '\u2728'}
                      </button>
                      <button
                        onClick={() => removeAchievement(i)}
                        style={{
                          background: 'none', border: 'none', color: '#CC1016', fontSize: 18,
                          cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: '6px 2px',
                        }}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addAchievement}
                    style={{ background: 'none', border: 'none', color: '#0A66C2', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0' }}
                  >
                    + Add Achievement
                  </button>
                </div>

                {/* Custom Sections */}
                <div>
                  <label style={{ ...labelStyle, fontSize: 14, marginBottom: 8 }}>Custom Sections</label>
                  {(rd.customSections || []).map((cs, i) => (
                    <div key={i} style={{ border: '1px solid #E0E0E0', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                      <div style={fieldGap}>
                        <label style={labelStyle}>Section Title</label>
                        <input style={inputStyle} value={cs.title || ''} onChange={e => updateCustomSection(i, 'title', e.target.value)} />
                      </div>
                      <div style={fieldGap}>
                        <label style={labelStyle}>Content</label>
                        <textarea rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={cs.content || ''} onChange={e => updateCustomSection(i, 'content', e.target.value)} />
                      </div>
                      <button
                        onClick={() => removeCustomSection(i)}
                        style={{ background: 'none', border: 'none', color: '#CC1016', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addCustomSection}
                    style={{
                      padding: '8px 16px', background: '#F3F2EF', color: '#0A66C2', border: '1px solid #D0D0D0',
                      borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    + Add Section
                  </button>
                </div>
              </div>
            )}

            {/* ── Styles Tab ── */}
            {activeTab === 'styles' && (
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Advanced Styles</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Fine-tune your resume&apos;s appearance</div>

                {/* Bullet Style */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, marginBottom: 10 }}>Bullet Style</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['\u2022', '-', '\u00BB', '\u2192', '\u25B8', '\u25A0'].map(b => (
                      <button key={b} onClick={() => updateStyle('bullet', '', b)} style={{
                        width: 40, height: 40, borderRadius: 8, border: styleSettings.bullet === b ? '2px solid #0B69C7' : '1.5px solid #D1D5DB',
                        background: styleSettings.bullet === b ? '#EFF6FF' : '#FAFBFC', fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontWeight: 600,
                      }}>{b}</button>
                    ))}
                  </div>
                </div>

                {/* Separator */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, marginBottom: 10 }}>Contact Separator</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['|', '\u2022', '-', ',', '/', '\u00B7'].map(s => (
                      <button key={s} onClick={() => updateStyle('separator', '', s)} style={{
                        width: 40, height: 40, borderRadius: 8, border: styleSettings.separator === s ? '2px solid #0B69C7' : '1.5px solid #D1D5DB',
                        background: styleSettings.separator === s ? '#EFF6FF' : '#FAFBFC', fontSize: 16, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontWeight: 600,
                      }}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#E5E7EB', margin: '8px 0 20px' }} />

                {/* Text Sizes */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Text Sizes</label>
                  {[
                    { key: 'body', label: 'Body Copy' },
                    { key: 'heading1', label: 'Primary Heading' },
                    { key: 'heading2', label: 'Secondary Heading' },
                    { key: 'section', label: 'Section Titles' },
                    { key: 'name', label: 'Full Name' },
                    { key: 'minor', label: 'Minor Copy' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '6px 0' }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => updateStyle('fontSize', item.key, Math.max(8, (styleSettings.fontSize as any)[item.key] - 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#FAFBFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', width: 24, textAlign: 'center' }}>{(styleSettings.fontSize as any)[item.key]}</span>
                        <button onClick={() => updateStyle('fontSize', item.key, Math.min(36, (styleSettings.fontSize as any)[item.key] + 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#FAFBFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        <span style={{ fontSize: 11, color: '#9CA3AF', width: 16 }}>pt</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#E5E7EB', margin: '8px 0 20px' }} />

                {/* Text Weights */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Text Weights</label>
                  {[
                    { key: 'body', label: 'Body Copy' },
                    { key: 'heading1', label: 'Primary Heading' },
                    { key: 'heading2', label: 'Secondary Heading' },
                    { key: 'section', label: 'Section Titles' },
                    { key: 'name', label: 'Full Name' },
                    { key: 'minor', label: 'Minor Copy' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
                      <select value={(styleSettings.fontWeight as any)[item.key]} onChange={e => updateStyle('fontWeight', item.key, e.target.value)} style={{ padding: '6px 10px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 12, background: '#FAFBFC', cursor: 'pointer', minWidth: 110 }}>
                        <option value="100">Thin</option>
                        <option value="200">Extra Light</option>
                        <option value="300">Light</option>
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi-Bold</option>
                        <option value="700">Bold</option>
                        <option value="800">Extra Bold</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#E5E7EB', margin: '8px 0 20px' }} />

                {/* Text Transformations */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Text Transformations</label>
                  {[
                    { key: 'heading1', label: 'Primary Heading' },
                    { key: 'heading2', label: 'Secondary Heading' },
                    { key: 'section', label: 'Section Titles' },
                    { key: 'name', label: 'Full Name' },
                    { key: 'minor', label: 'Minor Copy' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
                      <select value={(styleSettings.textTransform as any)[item.key]} onChange={e => updateStyle('textTransform', item.key, e.target.value)} style={{ padding: '6px 10px', border: '1.5px solid #D1D5DB', borderRadius: 8, fontSize: 12, background: '#FAFBFC', cursor: 'pointer', minWidth: 110 }}>
                        <option value="none">As Written</option>
                        <option value="uppercase">ALL CAPS</option>
                        <option value="capitalize">Capitalize</option>
                        <option value="lowercase">lowercase</option>
                      </select>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#E5E7EB', margin: '8px 0 20px' }} />

                {/* Vertical Spacing */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Vertical Spacing</label>
                  {[
                    { key: 'betweenSections', label: 'Between Sections' },
                    { key: 'titleContent', label: 'Titles & Content' },
                    { key: 'headings', label: 'Between Headings' },
                    { key: 'contentBlocks', label: 'Content Blocks' },
                    { key: 'listItems', label: 'List Items' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => updateStyle('spacing', item.key, Math.max(0, (styleSettings.spacing as any)[item.key] - 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#FAFBFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', width: 24, textAlign: 'center' }}>{(styleSettings.spacing as any)[item.key]}</span>
                        <button onClick={() => updateStyle('spacing', item.key, Math.min(40, (styleSettings.spacing as any)[item.key] + 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#FAFBFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        <span style={{ fontSize: 11, color: '#9CA3AF', width: 16 }}>pt</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#E5E7EB', margin: '8px 0 20px' }} />

                {/* Borders */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ ...labelStyle, fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Borders</label>
                  {[
                    { key: 'aboveHeader', label: 'Above Header' },
                    { key: 'belowHeader', label: 'Below Header' },
                    { key: 'sectionTitles', label: 'Section Titles' },
                  ].map(item => (
                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: '#374151' }}>{item.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => updateStyle('borders', item.key, Math.max(0, (styleSettings.borders as any)[item.key] - 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#FAFBFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', width: 24, textAlign: 'center' }}>{(styleSettings.borders as any)[item.key]}</span>
                        <button onClick={() => updateStyle('borders', item.key, Math.min(5, (styleSettings.borders as any)[item.key] + 1))} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #D1D5DB', background: '#FAFBFC', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        <span style={{ fontSize: 11, color: '#9CA3AF', width: 16 }}>pt</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reset button */}
                <button onClick={() => {
                  const defaults = {
                    bullet: '\u2022', separator: '|',
                    fontSize: { body: 11, heading1: 12, heading2: 11, section: 11, name: 18, minor: 10 },
                    fontWeight: { body: 'normal', heading1: '600', heading2: 'normal', section: '300', name: '600', minor: 'normal' },
                    textTransform: { heading1: 'none', heading2: 'none', section: 'uppercase', name: 'none', minor: 'none' },
                    spacing: { betweenSections: 16, titleContent: 8, headings: 3, contentBlocks: 5, listItems: 2 },
                    borders: { aboveHeader: 0, belowHeader: 1, sectionTitles: 1 },
                  };
                  setStyleSettings(defaults);
                  // Save reset to server immediately
                  fetch(`${API_URL}/api/resume/${resumeId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ resume_data: { ...resumeData, styleSettings: defaults }, template_id: templateId }),
                  }).catch(() => {});
                }} style={{ width: '100%', padding: '12px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Reset to Defaults
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══ PREVIEW WELL ═══ */}
        <div style={{ flex: 1, display: (!isMobile || mobileView === 'preview') ? 'flex' : 'none', flexDirection: 'column', background: 'var(--bg-subtle)', overflowY: 'auto', height: 'calc(100vh - 56px)' }}>
          {/* ATS compact strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', flexShrink: 0, flexWrap: 'wrap' }}>
            <span className="saas-metric" style={{ background: atsScore >= 80 ? 'var(--success-subtle)' : atsScore >= 60 ? 'var(--accent-subtle)' : 'var(--warning-subtle)', color: atsScore >= 80 ? 'var(--success)' : atsScore >= 60 ? 'var(--accent)' : 'var(--warning)' }}>ATS {atsScore}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{matched} keywords matched</span>
            {keywordsMissing.length > 0 && <span style={{ fontSize: 12, color: 'var(--warning)' }}>{keywordsMissing.length} missing</span>}
          </div>
          {/* Paper preview — uses same HTML as PDF for perfect match */}
          <div style={{ flex: 1, padding: 24, overflowY: 'auto', background: '#F1F3F5' }}>
            {isDefaultStyles ? (
              <div ref={previewRef} style={{ maxWidth: 794, margin: '0 auto', background: 'white', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {renderResumeHTML(resumeData, templateId)}
              </div>
            ) : (
              <div ref={previewRef} style={{ maxWidth: 794, margin: '0 auto', background: 'white', borderRadius: 8, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}
                dangerouslySetInnerHTML={{ __html: (() => {
                  const fullHtml = buildStyledHTML();
                  const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/);
                  const styleMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/);
                  return (styleMatch ? `<style>${styleMatch[1]}</style>` : '') + (bodyMatch ? bodyMatch[1] : '');
                })() }}
              />
            )}
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR — template + download */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #E5E7EB', padding: '8px 16px', zIndex: 50, boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, background: 'white' }}>
              {TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <button onClick={handleDownloadPDF} disabled={pdfGenerating} style={{ padding: '10px 18px', background: '#057642', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: pdfGenerating ? 0.6 : 1 }}>
              {pdfGenerating ? '...' : 'PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
type TabName = 'contact' | 'summary' | 'experience' | 'education' | 'skills' | 'extras';

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
  width: '100%', padding: '8px 12px', border: '1px solid #E0E0E0',
  borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 4, display: 'block',
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

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
        body: JSON.stringify({ resume_data: resumeData, template_id: templateId }),
      })
        .then(res => { if (!res.ok) throw new Error('Save failed'); setSavedStatus('saved'); })
        .catch(() => setSavedStatus('unsaved'));
    }, 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [resumeData, resumeId, templateId]);

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
  function handleDownloadPDF() {
    if (!resumeData) return;
    let html = buildPrintHTML(resumeData, templateId);

    // Apply printSize CSS
    const size = resumeData.printSize || 'standard';
    if (size === 'compact') {
      html = html.replace('</style>', '.print-content-root{font-size:92%!important;line-height:1.35!important}.print-content-root div,.print-content-root p{margin-bottom:2px!important}' + '</style>');
    } else if (size === 'spacious') {
      html = html.replace('</style>', '.print-content-root{font-size:108%!important;line-height:1.65!important}' + '</style>');
    }

    // Mobile: reduce @page margins
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) html = html.replace(/@page\s*\{[^}]*\}/, '@page{size:A4;margin:8mm 8mm 8mm 8mm}');

    const win = window.open('', '_blank');
    if (!win) { alert('Please allow popups to download PDF.'); return; }
    win.document.write(html);
    win.document.close();
    win.document.title = ' ';

    const fitOnePage = resumeData.fitOnePage !== false; // default true
    if (!fitOnePage) { setTimeout(() => win.print(), 800); return; }

    // Measure in print tab and scale to fit
    setTimeout(() => {
      const root = win.document.querySelector('.print-content-root') as HTMLElement;
      if (!root) { win.print(); return; }
      const A4_HEIGHT = 1122.5;
      const marginPx = isMobile ? 60 : 83;
      const available = A4_HEIGHT - marginPx - 10;
      const contentHeight = root.scrollHeight;
      if (contentHeight > available && contentHeight < available * 1.5) {
        const scale = Math.max(0.78, available / contentHeight);
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = 'top left';
        root.style.width = `${Math.ceil(100 / scale)}%`;
      }
      setTimeout(() => win.print(), 200);
    }, 800);
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F2EF' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, border: '4px solid #E0E0E0', borderTopColor: '#0A66C2',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 15, color: '#666' }}>Loading editor...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ─── Error ───
  if (error || !resumeData) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F2EF' }}>
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
  ];

  const savedStatusColor = savedStatus === 'saved' ? '#057642' : savedStatus === 'saving' ? '#888' : '#E67E22';
  const savedStatusText = savedStatus === 'saved' ? 'Saved' : savedStatus === 'saving' ? 'Saving...' : 'Unsaved';

  // ─── Render ───
  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ─── TOP BAR ─── */}
      <div style={{
        minHeight: 48, background: '#fff', borderBottom: '1px solid #E0E0E0',
        padding: isMobile ? '8px 12px' : '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {!isMobile && <div style={{ fontSize: 14, fontWeight: 700, color: '#004182' }}>Resume Editor</div>}
          <div style={{ fontSize: 12, fontWeight: 600, color: savedStatusColor }}>{savedStatusText}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {isMobile && (
            <div style={{ display: 'flex', gap: 4, background: '#F3F2EF', borderRadius: 20, padding: 2 }}>
              <button onClick={() => setMobileView('edit')} style={{
                padding: '4px 14px', borderRadius: 18, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: mobileView === 'edit' ? '#0A66C2' : 'transparent',
                color: mobileView === 'edit' ? '#fff' : '#666',
              }}>Edit</button>
              <button onClick={() => setMobileView('preview')} style={{
                padding: '4px 14px', borderRadius: 18, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: mobileView === 'preview' ? '#0A66C2' : 'transparent',
                color: mobileView === 'preview' ? '#fff' : '#666',
              }}>Preview</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={templateId}
            onChange={e => setTemplateId(e.target.value)}
            style={{ padding: '5px 8px', border: '1px solid #D0D0D0', borderRadius: 6, fontSize: 12, outline: 'none', maxWidth: isMobile ? 120 : 200 }}
          >
            {TEMPLATES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {/* Print Size */}
          <select
            value={resumeData?.printSize || 'standard'}
            onChange={e => setResumeData(prev => prev ? { ...prev, printSize: e.target.value as 'compact' | 'standard' | 'spacious' } : prev)}
            style={{ padding: '5px 6px', border: '1px solid #D0D0D0', borderRadius: 6, fontSize: 11, outline: 'none' }}
          >
            <option value="compact">Compact</option>
            <option value="standard">Standard</option>
            <option value="spacious">Spacious</option>
          </select>
          {/* Fit 1 Page */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#555', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input
              type="checkbox"
              checked={resumeData?.fitOnePage !== false}
              onChange={e => setResumeData(prev => prev ? { ...prev, fitOnePage: e.target.checked } : prev)}
              style={{ accentColor: '#0A66C2' }}
            />
            1 Page
          </label>
          <button
            onClick={handleDownloadPDF}
            style={{
              padding: '5px 12px', background: '#0A66C2', color: '#fff', border: 'none',
              borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            PDF
          </button>
          <a
            href={`${API_URL}/api/resume/${resumeId}/download/docx`}
            style={{
              padding: '5px 12px', background: '#374151', color: '#fff', border: 'none',
              borderRadius: 16, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            DOCX
          </a>
          <a
            href={`/resume/${resumeId}`}
            style={{ fontSize: 12, fontWeight: 600, color: '#666', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Back
          </a>
        </div>
      </div>

      {/* ─── TWO PANELS ─── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ─── LEFT PANEL ─── */}
        <div style={{ width: isMobile ? '100%' : '45%', display: (!isMobile || mobileView === 'edit') ? 'block' : 'none', background: '#fff', overflowY: 'auto', height: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 56px)', padding: 16 }}>
          {/* Tab Bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E0E0E0', marginBottom: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: isMobile ? 'none' : 1, padding: isMobile ? '8px 12px' : '10px 0', background: 'none', border: 'none', whiteSpace: 'nowrap',
                  borderBottom: activeTab === tab.key ? '2px solid #0A66C2' : '2px solid transparent',
                  color: activeTab === tab.key ? '#0A66C2' : '#666',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '16px 0' }}>

            {/* ── Contact Tab ── */}
            {activeTab === 'contact' && (
              <div>
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
                <div style={fieldGap}>
                  <label style={labelStyle}>Professional Summary</label>
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
                          onDragStart={(e) => {
                            setDragExp(i);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => { setDragExp(null); setDragOverExp(null); }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            cursor: 'grab', padding: '0 6px', color: '#bbb', fontSize: 14,
                            userSelect: 'none', display: 'flex', alignItems: 'center', marginRight: 8,
                          }}
                          title="Drag to reorder"
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
                            const isCurrent = exp.current || endStr === 'Present';
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
                                      updateExperience(i, 'dates', '');
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
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div style={{ width: isMobile ? '100%' : '55%', display: (!isMobile || mobileView === 'preview') ? 'block' : 'none', background: '#F3F2EF', overflowY: 'auto', height: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 56px)', padding: 20 }}>
          {/* ATS Score Mini Widget */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{
              display: 'inline-block', padding: '4px 12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
              color: '#fff', background: getScoreColor(atsScore),
            }}>
              ATS Score: {atsScore}%
            </span>
            <span style={{ fontSize: 12, color: '#666' }}>{matched} keywords matched</span>
          </div>

          {/* Resume Preview */}
          {renderResumeHTML(resumeData, templateId)}
        </div>
      </div>
    </div>
  );
}

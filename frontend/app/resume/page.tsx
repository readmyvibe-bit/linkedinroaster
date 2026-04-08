'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TEMPLATES } from '../../components/resume/ResumeTemplates';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Calculate total experience from job durations ───
function calcExperienceFromDurations(experience: Array<{ duration?: string | null }>): number {
  let totalMonths = 0;
  for (const exp of experience) {
    if (!exp.duration) continue;
    const d = exp.duration.toLowerCase();
    // Try "X years Y months" pattern
    const yearMatch = d.match(/(\d+)\s*(?:year|yr)/);
    const monthMatch = d.match(/(\d+)\s*(?:month|mo)/);
    if (yearMatch) totalMonths += parseInt(yearMatch[1]) * 12;
    if (monthMatch) totalMonths += parseInt(monthMatch[1]);
    // Try "Jan 2020 - Present" or "2020 - 2023" patterns
    if (!yearMatch && !monthMatch) {
      const years = d.match(/(\d{4})/g);
      if (years && years.length >= 2) {
        totalMonths += (parseInt(years[years.length - 1]) - parseInt(years[0])) * 12;
      } else if (years && years.length === 1 && d.includes('present')) {
        totalMonths += (new Date().getFullYear() - parseInt(years[0])) * 12;
      }
    }
  }
  return totalMonths / 12;
}

// ─── Tag Input Component ───
function TagInput({ tags, setTags, placeholder }: { tags: string[]; setTags: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setInput('');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length ? 8 : 0 }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: '#E8F0FE', color: '#0A66C2', borderRadius: 16,
              padding: '4px 10px', fontSize: 13, fontWeight: 500,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A66C2', fontWeight: 700, fontSize: 14, lineHeight: 1, padding: 0 }}
              aria-label={`Remove ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

// ─── Shared Styles ───
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #CCC',
  borderRadius: 6, fontSize: 14, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 4,
};

const sectionHeading: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#191919', marginBottom: 16, paddingBottom: 8,
  borderBottom: '1px solid #E0E0E0',
};

// ─── Loading Stages ───
const LOADING_STAGES = [
  'Analyzing job description...',
  'Matching keywords...',
  'Building resume...',
  'Scoring ATS...',
];

// ─── Main Page ───
function ResumeFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  // Order state
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState('');
  const [orderPlan, setOrderPlan] = useState('');
  const [orderData, setOrderData] = useState<Record<string, unknown> | null>(null);
  const [quotaUsed, setQuotaUsed] = useState(false);
  const [existingResumes, setExistingResumes] = useState<any[]>([]);
  const [maxResumesQuota, setMaxResumesQuota] = useState(5);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [keyAchievements, setKeyAchievements] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [expYears, setExpYears] = useState(0);
  const [expMonths, setExpMonths] = useState(0);
  const [template, setTemplate] = useState('classic');
  const [templateFilter, setTemplateFilter] = useState('All');
  const [noJd, setNoJd] = useState(false);
  const [resumeLength, setResumeLength] = useState('2');

  // Additional section collapsed
  const [additionalOpen, setAdditionalOpen] = useState(false);

  // Upload section
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedText, setUploadedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loadingStage, setLoadingStage] = useState(0);
  const stageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Fetch order on mount ───
  useEffect(() => {
    if (!orderId) {
      setOrderError('Please access this page from your results.');
      setOrderLoading(false);
      return;
    }
    (async () => {
      try {
        // Try rewrite orders first, then build orders
        let data: any = null;
        let source: 'rewrite' | 'build' = 'rewrite';
        const res = await fetch(`${API_URL}/api/orders/${orderId}`);
        if (res.ok) {
          data = await res.json();
          source = 'rewrite';
        } else {
          const buildRes = await fetch(`${API_URL}/api/build/results/${orderId}`);
          if (buildRes.ok) {
            data = await buildRes.json();
            source = 'build';
          }
        }
        if (!data) throw new Error('Order not found');

        setOrderData({ ...data, _source: source });
        setOrderPlan(data.plan || '');

        // Pre-fill from order data
        if (data.email) setEmail(data.email);
        if (source === 'rewrite') {
          const pp = data.parsed_profile || {};
          // Also try to extract contact info from raw profile_input
          const rawInput = typeof data.profile_input === 'string' ? data.profile_input : data.profile_input?.raw_paste || '';

          if (pp.name || pp.full_name) setFullName(pp.name || pp.full_name);
          if (pp.location) setLocation(pp.location);
          if (pp.phone) setPhone(pp.phone);
          if (pp.linkedin_url || data.linkedin_url) setLinkedinUrl(pp.linkedin_url || data.linkedin_url);
          if (pp.website) setWebsite(pp.website);
          if (pp.headline) setTargetRole(pp.headline.split('|')[0]?.trim() || '');

          // Extract contact info from raw text if parser missed it
          if (!pp.phone && rawInput) {
            const phoneMatch = rawInput.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/);
            if (phoneMatch) setPhone(phoneMatch[0].replace(/[\s-]/g, ''));
          }
          if (!pp.linkedin_url && !data.linkedin_url && rawInput) {
            const liMatch = rawInput.match(/linkedin\.com\/in\/[\w-]+/i);
            if (liMatch) setLinkedinUrl('https://www.' + liMatch[0]);
          }
          if (!pp.location && rawInput) {
            // Common Indian cities
            const cityMatch = rawInput.match(/\b(Mumbai|Delhi|Bangalore|Bengaluru|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad|Jaipur|Lucknow|Noida|Gurgaon|Gurugram|Chandigarh|Indore|Bhopal|Visakhapatnam|Kochi|Coimbatore|Nagpur|Patna|Ranchi|Bhubaneswar|Trivandrum|Thiruvananthapuram)[,\s]?\s*(?:India|Maharashtra|Karnataka|Telangana|Tamil Nadu|West Bengal|Rajasthan|UP|Uttar Pradesh|MP|Madhya Pradesh|Gujarat|Kerala|AP|Andhra Pradesh|Odisha|Bihar|Jharkhand|Haryana|Punjab)?/i);
            if (cityMatch) setLocation(cityMatch[0].trim());
          }

          // Auto-fill achievements from experience (detailed bullets, not just titles)
          if (pp.experience?.length) {
            const achievementLines = pp.experience
              .slice(0, 3)
              .map((e: any) => {
                const header = `${e.title || ''} at ${e.company || ''}`;
                const desc = e.description ? `\n${e.description.slice(0, 200)}` : '';
                return header + desc;
              })
              .filter(Boolean)
              .join('\n\n');
            if (achievementLines) setKeyAchievements(achievementLines);
          }
          // Auto-fill certifications
          if (pp.certifications?.length) setCertifications(pp.certifications.slice(0, 5));
          // Auto-fill languages if available
          if (pp.languages?.length) setLanguages(pp.languages);
          // Calculate experience years from durations
          if (pp.experience?.length) {
            const totalYears = calcExperienceFromDurations(pp.experience);
            if (totalYears > 0) {
              setExpYears(Math.floor(totalYears));
              setExpMonths(Math.round((totalYears % 1) * 12));
            } else {
              // Fallback: estimate from number of jobs
              const est = pp.experience.length <= 1 ? 1 : pp.experience.length <= 2 ? 3 : pp.experience.length <= 4 ? 6 : 10;
              setExpYears(est);
              setExpMonths(0);
            }
          }
        } else {
          // Build order — pre-fill ALL available data
          const fi = data.form_input || {};
          if (fi.full_name) setFullName(fi.full_name);
          if (fi.location) setLocation(fi.location);
          if (fi.phone) setPhone(fi.phone);
          if (fi.target_role) setTargetRole(fi.target_role);
          if (fi.target_industry) setTargetCompany(fi.target_industry);
        }

        // Check resume quota
        const maxResumes = source === 'build'
          ? (data.plan === 'pro' ? 10 : data.plan === 'starter' ? 0 : 5)
          : (data.plan === 'pro' ? 10 : 5);
        setMaxResumesQuota(maxResumes);
        if (maxResumes === 0) { setQuotaUsed(true); }
        else {
          try {
            const resumeRes = await fetch(`${API_URL}/api/resume/by-order/${orderId}`);
            if (resumeRes.ok) {
              const resumeData = await resumeRes.json();
              const resumes = resumeData.resumes || [];
              setExistingResumes(resumes);
              if (resumes.length >= maxResumes) {
                setQuotaUsed(true);
              }
            }
          } catch {}
        }
      } catch {
        setOrderError('Please access this page from your results.');
      } finally {
        setOrderLoading(false);
      }
    })();
  }, [orderId]);

  // ─── Loading stage cycling ───
  useEffect(() => {
    if (submitting) {
      setLoadingStage(0);
      stageInterval.current = setInterval(() => {
        setLoadingStage((prev) => (prev < LOADING_STAGES.length - 1 ? prev + 1 : prev));
      }, 8000);
    } else {
      if (stageInterval.current) clearInterval(stageInterval.current);
    }
    return () => { if (stageInterval.current) clearInterval(stageInterval.current); };
  }, [submitting]);

  // ─── Submit ───
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!noJd && jobDescription.length < 100) {
      setSubmitError('Job description must be at least 100 characters. Or check "I don\'t have a specific JD" below.');
      return;
    }
    // Check if selected template is Pro-only
    const selectedTemplate = TEMPLATES.find(t => t.id === template);
    if (orderPlan !== 'pro' && (selectedTemplate as any)?.proOnly) {
      setSubmitError(`"${selectedTemplate?.name}" is a Pro template. Upgrade to Pro for ₹500 to unlock all 11 templates + more resumes.`);
      return;
    }
    setSubmitError('');
    setSubmitting(true);
    try {
      const body = {
        orderId,
        userDetails: {
          name: fullName,
          email,
          phone,
          location,
          linkedin: linkedinUrl,
          website,
        },
        targetRole,
        targetCompany,
        jobDescription: noJd ? '' : jobDescription,
        noJd,
        additionalAchievements: keyAchievements,
        certifications,
        languages,
        experienceYears: expYears > 0 || expMonths > 0 ? `${expYears} years ${expMonths} months` : '',
        templateId: template,
        pageCount: parseInt(resumeLength) || 2,
        uploadedResumeText: uploadedText || undefined,
      };
      const res = await fetch(`${API_URL}/api/resume/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate resume');
      }
      const data = await res.json();
      router.push(`/resume/${data.resumeId || data.resume_id || data.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  // ─── Upload & Parse Resume ───
  async function handleUploadParse() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await fetch(`${API_URL}/api/resume/upload-parse`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to parse resume');
      }
      const data = await res.json();
      const parsed = data.parsed || {};
      if (parsed.name) setFullName(parsed.name);
      if (parsed.email) setEmail(parsed.email);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.linkedin) setLinkedinUrl(parsed.linkedin);
      if (parsed.website) setWebsite(parsed.website);
      if (parsed.certifications) setCertifications(parsed.certifications);
      if (parsed.languages) setLanguages(parsed.languages);
      if (parsed.summary) setKeyAchievements(parsed.summary);
      // Calculate experience from parsed jobs
      if (parsed.experience?.length) {
        const totalYears = calcExperienceFromDurations(parsed.experience);
        if (totalYears > 0) {
          setExpYears(Math.floor(totalYears));
          setExpMonths(Math.round((totalYears % 1) * 12));
        }
      }
      // Store full parsed text for resume generation
      if (data.rawText) setUploadedText(data.rawText);
      setUploadSuccess(true);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Failed to parse resume');
    } finally {
      setUploading(false);
    }
  }

  function handleFileSelect(file: File | undefined) {
    if (!file) return;
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setUploadError('Please upload a PDF or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File must be under 10MB.');
      return;
    }
    setUploadError('');
    setUploadSuccess(false);
    setUploadFile(file);
  }

  // ─── Error / Loading states ───
  if (orderLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666', fontSize: 15 }}>Loading...</p>
      </div>
    );
  }

  if (orderError) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 12, padding: 32, maxWidth: 440, textAlign: 'center' }}>
          <p style={{ color: '#CC1016', fontSize: 15, margin: 0 }}>{orderError}</p>
        </div>
      </div>
    );
  }

  // Quota full — redirect back to results page (resume section)
  if (quotaUsed) {
    if (typeof window !== 'undefined') {
      const isBuild = (orderData as any)?._source === 'build';
      window.location.href = isBuild ? `/build/results/${orderId}` : `/results/${orderId}#resume-section`;
    }
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666', fontSize: 15 }}>Redirecting to your results...</p>
      </div>
    );
  }

  // ─── Main Form ───
  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF', padding: '32px 16px' }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: '#004182', borderRadius: '12px 12px 0 0', padding: '24px 28px',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Build Your ATS Resume</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.8 }}>profileroaster.in</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{existingResumes.length}/{maxResumesQuota}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>Resumes Used</div>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div style={{
          background: '#fff', border: '1px solid #E0E0E0', borderTop: 'none',
          borderRadius: '0 0 12px 12px', padding: '28px',
        }}>

          {/* UPLOAD SECTION - Optional Resume Upload */}
          <div style={{ marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => setUploadOpen(!uploadOpen)}
              style={{
                ...sectionHeading,
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 0 8px', margin: '0 0 0',
              }}
            >
              <span>Upload Your Existing Resume (Optional)</span>
              <span style={{ fontSize: 18, fontWeight: 400, transition: 'transform 0.2s', transform: uploadOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                &#9660;
              </span>
            </button>

            {uploadOpen && (
              <div style={{ paddingTop: 16 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files?.[0]); }}
                  style={{
                    border: `2px dashed ${dragOver ? '#0A66C2' : '#D1D5DB'}`,
                    borderRadius: 12,
                    padding: 32,
                    textAlign: 'center',
                    background: dragOver ? '#EFF6FF' : '#FAFBFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8, color: '#9CA3AF' }}>&#128196;</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
                    {uploadFile ? uploadFile.name : 'Click or drag & drop your resume here'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF' }}>PDF or DOCX, max 10MB</div>
                </div>

                {uploadFile && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={handleUploadParse}
                      disabled={uploading}
                      style={{
                        padding: '10px 20px', background: uploading ? '#93C5FD' : '#0A66C2', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                        cursor: uploading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                      }}
                    >
                      {uploading ? 'Parsing your resume...' : 'Upload & Auto-Fill'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUploadFile(null); setUploadSuccess(false); setUploadError(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13 }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {uploadSuccess && (
                  <div style={{ marginTop: 12, background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ margin: 0, color: '#057642', fontSize: 14 }}>Resume parsed! Fields auto-filled. Review and edit as needed.</p>
                  </div>
                )}

                {uploadError && (
                  <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px' }}>
                    <p style={{ margin: 0, color: '#CC1016', fontSize: 14 }}>{uploadError}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 1 - Your Details */}
          <h2 style={sectionHeading}>Your Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: '#CC1016' }}>*</span></label>
              <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email <span style={{ color: '#CC1016' }}>*</span></label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone Number <span style={{ color: '#CC1016' }}>*</span></label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Location <span style={{ color: '#CC1016' }}>*</span></label>
              <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Mumbai, Maharashtra" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>LinkedIn URL</label>
              <input type="text" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/yourname" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourwebsite.com" style={inputStyle} />
            </div>
          </div>

          {/* SECTION 2 - Target Job */}
          <h2 style={sectionHeading}>Target Job</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Target Role <span style={{ color: '#CC1016' }}>*</span></label>
              <input type="text" required value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="What role are you applying for?" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Target Company</label>
              <input type="text" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={labelStyle}>Job Description {!noJd && <span style={{ color: '#CC1016' }}>*</span>}</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#0B69C7', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" checked={noJd} onChange={e => setNoJd(e.target.checked)} style={{ accentColor: '#0B69C7' }} />
                No specific JD — make a general resume
              </label>
            </div>
            {!noJd ? (
              <>
                <textarea
                  rows={8}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here (min 100 characters)"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ fontSize: 12, color: jobDescription.length < 100 ? '#CC1016' : '#666', marginTop: 4, textAlign: 'right' }}>
                  {jobDescription.length} characters{jobDescription.length < 100 ? ` (min 100)` : ''}
                </div>
              </>
            ) : (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#057642', lineHeight: 1.6 }}>
                AI will build a general-purpose resume from your profile data — suitable for campus placements, job portals, and general applications. You can always generate a targeted resume later with a specific JD.
              </div>
            )}
          </div>

          {/* SECTION 3 - Additional Details (collapsible) */}
          <div style={{ marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => setAdditionalOpen(!additionalOpen)}
              style={{
                ...sectionHeading,
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 0 8px', margin: '0 0 0',
              }}
            >
              <span>Additional Details</span>
              <span style={{ fontSize: 18, fontWeight: 400, transition: 'transform 0.2s', transform: additionalOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                &#9660;
              </span>
            </button>

            {additionalOpen && (
              <div style={{ paddingTop: 16 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Key Achievements</label>
                  <textarea
                    rows={4}
                    value={keyAchievements}
                    onChange={(e) => setKeyAchievements(e.target.value)}
                    placeholder="List your top achievements, awards, or notable results"
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Certifications</label>
                  <TagInput tags={certifications} setTags={setCertifications} placeholder="Type a certification and press Enter" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Languages</label>
                  <TagInput tags={languages} setTags={setLanguages} placeholder="Type a language and press Enter" />
                </div>
                <div>
                  <label style={labelStyle}>Total Experience</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={expYears}
                      onChange={(e) => setExpYears(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                      style={{ ...inputStyle, width: 70, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 13, color: '#666' }}>years</span>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={expMonths}
                      onChange={(e) => setExpMonths(Math.max(0, Math.min(11, parseInt(e.target.value) || 0)))}
                      style={{ ...inputStyle, width: 70, textAlign: 'center' }}
                    />
                    <span style={{ fontSize: 13, color: '#666' }}>months</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4 - Preferences */}
          <h2 style={sectionHeading}>Preferences</h2>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>Template ({TEMPLATES.length} designs)</label>
            {/* Category filter */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {['All', 'ATS-Friendly', 'Professional', 'Premium', 'Visual'].map(cat => {
                const isAll = cat === 'All';
                const count = isAll ? TEMPLATES.length : TEMPLATES.filter(t => t.category === cat).length;
                return (
                  <button key={cat} type="button" onClick={() => setTemplateFilter(cat)} style={{
                    padding: '4px 10px', borderRadius: 16, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: templateFilter === cat ? '#0A66C2' : '#F3F2EF',
                    color: templateFilter === cat ? '#fff' : '#666',
                    whiteSpace: 'nowrap',
                  }}>{cat} ({count})</button>
                );
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {TEMPLATES.filter(t => {
                const catMatch = templateFilter === 'All' || t.category === templateFilter;
                return catMatch; // Show ALL templates, lock Pro-only for Standard users
              }).map((t) => {
                const isLocked = orderPlan !== 'pro' && (t as any).proOnly;
                const selected = template === t.id;
                return (
                  <label
                    key={t.id}
                    onClick={(e) => {
                      if (isLocked) { e.preventDefault(); setTemplate(t.id); }
                    }}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 4,
                      padding: 12, borderRadius: 8, cursor: 'pointer',
                      border: selected ? '2px solid #0A66C2' : isLocked ? '1px solid #E0E0E0' : '1px solid #CCC',
                      background: selected ? '#F0F7FF' : isLocked ? '#F9FAFB' : '#fff',
                      opacity: isLocked ? 0.75 : 1,
                      transition: 'all 0.15s', position: 'relative',
                    }}
                  >
                    {isLocked && (
                      <div style={{ position: 'absolute', top: 6, right: 6, background: '#FEF3C7', color: '#92400E', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>PRO</div>
                    )}
                    <input
                      type="radio" name="template" value={t.id}
                      checked={selected}
                      onChange={() => setTemplate(t.id)}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: selected ? 700 : 600, color: isLocked ? '#999' : selected ? '#0A66C2' : '#191919' }}>{t.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: t.category === 'ATS-Friendly' ? '#E8F0FE' : t.category === 'Professional' ? '#FEF3C7' : t.category === 'Premium' ? '#FDF2F8' : t.category === 'Visual' ? '#F0FDF4' : '#E8F0FE',
                        color: t.category === 'ATS-Friendly' ? '#0A66C2' : t.category === 'Professional' ? '#92400E' : t.category === 'Premium' ? '#9D174D' : t.category === 'Visual' ? '#057642' : '#0A66C2',
                      }}>{t.category}</span>
                    </div>
                    <span style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{t.description}</span>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {t.ats === 'high' && <span style={{ fontSize: 9, fontWeight: 700, color: '#057642', background: '#F0FDF4', padding: '2px 6px', borderRadius: 4 }}>ATS High</span>}
                      {t.ats === 'medium' && <span style={{ fontSize: 9, fontWeight: 700, color: '#92400E', background: '#FFFBEB', padding: '2px 6px', borderRadius: 4 }}>ATS Medium</span>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1E40AF' }}>
              AI automatically fits your resume to 1 page if possible. 2 pages only when needed for extensive experience.
            </div>
          </div>

          {/* Error message */}
          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
              <p style={{ margin: 0, color: '#CC1016', fontSize: 14 }}>{submitError}</p>
              {(submitError.includes('Pro template') || submitError.includes('Upgrade to Pro')) && orderId && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/api/orders/${orderId}/upgrade`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
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
                      } else { alert(data.error || 'Failed to create upgrade order'); }
                    } catch { alert('Failed to initiate upgrade. Please try again.'); }
                  }}
                  style={{
                    display: 'inline-block', marginTop: 10, padding: '10px 24px',
                    background: '#0A66C2', color: 'white', borderRadius: 50, border: 'none',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Upgrade to Pro — &#8377;500 &rarr;
                </button>
              )}
            </div>
          )}

          {/* Submit Button / Loading */}
          {submitting ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#191919', marginBottom: 6 }}>
                Generating... (30-45 seconds)
              </p>
              {/* Progress bar */}
              <div style={{ width: '100%', background: '#E0E0E0', borderRadius: 8, height: 6, marginBottom: 16, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: '#0A66C2', borderRadius: 8,
                  width: `${((loadingStage + 1) / LOADING_STAGES.length) * 100}%`,
                  transition: 'width 1s ease',
                }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LOADING_STAGES.map((stage, i) => (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', display: 'inline-flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                      background: i <= loadingStage ? '#0A66C2' : '#E0E0E0',
                      color: i <= loadingStage ? '#fff' : '#999',
                      transition: 'all 0.3s',
                    }}>
                      {i < loadingStage ? '\u2713' : i + 1}
                    </span>
                    <span style={{
                      fontSize: 13,
                      color: i <= loadingStage ? '#191919' : '#999',
                      fontWeight: i === loadingStage ? 600 : 400,
                    }}>
                      {stage}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="submit"
              style={{
                width: '100%', background: '#0A66C2', color: '#fff',
                border: 'none', borderRadius: 50, padding: 14,
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = '#004182'; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = '#0A66C2'; }}
            >
              Generate My ATS Resume &rarr;
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function ResumeFormPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F2EF' }}><p style={{ color: '#666' }}>Loading...</p></div>}>
      <ResumeFormContent />
    </Suspense>
  );
}

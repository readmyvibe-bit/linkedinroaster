'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const LOADING_STAGES = [
  'Analyzing your background...',
  'Crafting your headline variations...',
  'Writing your About section...',
  'Polishing experience bullets...',
  'Building LinkedIn setup guide...',
  'Running quality checks...',
  'Almost there...',
];

const CAREER_STAGES = [
  { value: 'student', label: 'Student (still in college)' },
  { value: 'fresher', label: 'Fresher (just graduated, 0-1 year)' },
  { value: '1-3', label: '1-3 years experience' },
  { value: '3-7', label: '3-7 years experience' },
  { value: '7+', label: '7+ years experience' },
  { value: 'career_changer', label: 'Career changer' },
];

const INDUSTRIES = [
  'Technology / IT', 'Data Science / Analytics', 'Finance / Banking', 'Marketing / Advertising',
  'Sales / Business Development', 'Human Resources', 'Operations / Supply Chain',
  'Consulting', 'Healthcare', 'Education', 'Manufacturing', 'E-commerce / Retail',
  'Media / Entertainment', 'Government / Public Sector', 'Aviation', 'Law / Legal', 'Medical', 'Other',
];

// ─── Tag Input Component ───
function TagInput({ tags, setTags, placeholder }: { tags: string[]; setTags: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = input.trim();
      if (val && !tags.includes(val)) setTags([...tags, val]);
      setInput('');
    }
  }
  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tags.map((tag) => (
            <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E8F0FE', color: '#0A66C2', borderRadius: 16, padding: '4px 10px', fontSize: 13, fontWeight: 500 }}>
              {tag}
              <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A66C2', fontWeight: 700, fontSize: 14, padding: 0 }}>&times;</button>
            </span>
          ))}
        </div>
      )}
      <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box' }} />
    </div>
  );
}

// ─── Main Form Content ───
function BuildFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planParam = searchParams.get('plan');
  const plan = planParam || 'standard';
  const prePaidOrderId = searchParams.get('orderId'); // from referral code redemption

  // Redirect to pricing if no plan specified
  useEffect(() => {
    if (!planParam) router.replace('/build#pricing');
  }, [planParam, router]);

  // Personal info
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [careerStage, setCareerStage] = useState('fresher');
  const [targetRole, setTargetRole] = useState('');
  const [targetIndustry, setTargetIndustry] = useState('');
  const [tone, setTone] = useState('professional');

  // Education (dynamic list)
  const [education, setEducation] = useState([{ institution: '', degree: '', field: '', year: '', gpa: '', coursework: '' }]);

  // Experience (dynamic list)
  const [experience, setExperience] = useState([{ company: '', role: '', start_date: '', end_date: '', current: false, description: '' }]);

  // Skills & certs
  const [skills, setSkills] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [achievements, setAchievements] = useState('');
  const [projects, setProjects] = useState('');

  // Upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Enhance
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
    background: 'none', border: 'none', cursor: 'pointer',
    fontSize: 16, padding: '2px 4px', opacity: 0.6,
    transition: 'opacity 0.2s',
  };

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loadingStage, setLoadingStage] = useState(0);
  const stageInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Education helpers ───
  function updateEducation(index: number, field: string, value: string) {
    const updated = [...education];
    (updated[index] as any)[field] = value;
    setEducation(updated);
  }
  function addEducation() { setEducation([...education, { institution: '', degree: '', field: '', year: '', gpa: '', coursework: '' }]); }
  function removeEducation(i: number) { if (education.length > 1) setEducation(education.filter((_, idx) => idx !== i)); }

  // ─── Experience helpers ───
  function updateExperience(index: number, field: string, value: any) {
    const updated = [...experience];
    (updated[index] as any)[field] = value;
    setExperience(updated);
  }
  function addExperience() { setExperience([...experience, { company: '', role: '', start_date: '', end_date: '', current: false, description: '' }]); }
  function removeExperience(i: number) { if (experience.length > 1) setExperience(experience.filter((_, idx) => idx !== i)); }

  // ─── Upload & Parse Resume ───
  async function handleUploadParse() {
    if (!uploadFile) return;
    setUploading(true);
    setUploadError('');
    setUploadSuccess(false);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const res = await fetch(`${API_URL}/api/build/upload-resume`, { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to parse'); }
      const data = await res.json();
      const p = data.parsed || {};
      if (p.full_name) setFullName(p.full_name);
      if (p.email) setEmail(p.email);
      if (p.phone) setPhone(p.phone);
      if (p.location) setLocation(p.location);
      if (p.education?.length) setEducation(p.education.map((e: any) => ({
        institution: e.institution || '', degree: e.degree || '', field: e.field || '', year: e.year || '', gpa: e.gpa || '', coursework: '',
      })));
      if (p.experience?.length) setExperience(p.experience.map((e: any) => ({
        company: e.company || '', role: e.role || '', start_date: e.start_date || '', end_date: e.end_date || '', current: e.current || false, description: e.description || '',
      })));
      if (p.skills?.length) setSkills(p.skills);
      if (p.certifications?.length) setCertifications(p.certifications);
      if (p.achievements) setAchievements(p.achievements);

      // Auto-detect career stage from experience
      if (p.experience?.length) {
        const expCount = p.experience.length;
        // Try to parse years from experience dates
        let totalYears = 0;
        for (const exp of p.experience) {
          const start = exp.start_date || '';
          const end = exp.end_date || exp.current ? String(new Date().getFullYear()) : '';
          const startYear = parseInt(start.match(/\d{4}/)?.[0] || '0');
          const endYear = exp.current ? new Date().getFullYear() : parseInt(end.match(/\d{4}/)?.[0] || '0');
          if (startYear > 0 && endYear > 0) totalYears += endYear - startYear;
        }
        if (totalYears >= 7 || expCount >= 5) setCareerStage('7+');
        else if (totalYears >= 3 || expCount >= 3) setCareerStage('3-7');
        else if (totalYears >= 1 || expCount >= 1) setCareerStage('1-3');
        else setCareerStage('fresher');
      }

      setUploadSuccess(true);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse resume');
    } finally {
      setUploading(false);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  }

  // ─── Submit ───
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setSubmitError('Name is required.'); return; }
    if (!email.trim()) { setSubmitError('Email is required.'); return; }
    if (!targetRole.trim()) { setSubmitError('Target role is required.'); return; }

    const hasContent = education.some(ed => ed.institution || ed.degree) ||
                       experience.some(ex => ex.company || ex.role) ||
                       skills.length > 0;
    if (!hasContent) { setSubmitError('Please fill at least education, experience, or skills.'); return; }

    setSubmitError('');
    setSubmitting(true);
    setLoadingStage(0);
    stageInterval.current = setInterval(() => {
      setLoadingStage(prev => prev < LOADING_STAGES.length - 1 ? prev + 1 : prev);
    }, 8000);

    try {
      const form_input = {
        full_name: fullName, email, phone, location,
        career_stage: careerStage, target_role: targetRole,
        target_industry: targetIndustry, tone,
        education: education.filter(e => e.institution || e.degree),
        experience: experience.filter(e => e.company || e.role),
        skills, certifications, achievements, projects,
      };

      // If pre-paid via referral code, update existing order and process
      if (prePaidOrderId) {
        const updateRes = await fetch(`${API_URL}/api/build/update-and-process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: prePaidOrderId, form_input }),
        });
        if (!updateRes.ok) { const err = await updateRes.json().catch(() => ({})); throw new Error(err.error || 'Failed to process'); }
        router.push(`/build/results/${prePaidOrderId}`);
        return;
      }

      const res = await fetch(`${API_URL}/api/build/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan, form_input }),
      });

      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create order'); }
      const data = await res.json();

      // Open Razorpay
      const options = {
        key: data.razorpay_key,
        amount: data.amount,
        currency: data.currency,
        name: 'ProfileRoaster',
        description: `Build My LinkedIn — ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        order_id: data.razorpay_order_id,
        prefill: { email },
        theme: { color: '#0A66C2' },
        handler: function () {
          router.push(`/build/results/${data.order_id}`);
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            if (stageInterval.current) clearInterval(stageInterval.current);
          },
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong.');
      setSubmitting(false);
      if (stageInterval.current) clearInterval(stageInterval.current);
    }
  }

  const planLabels: Record<string, string> = { standard: 'Standard — Rs 499', pro: 'Pro — Rs 999' };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, boxSizing: 'border-box' as const };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600 as const, color: '#374151', marginBottom: 6 };
  const sectionStyle = { background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' };

  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <a href="/build" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#191919' }}>Roaster</span>
          </a>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>Build My LinkedIn</p>
          <div style={{ display: 'inline-block', background: '#E8F0FE', color: '#0A66C2', borderRadius: 16, padding: '4px 14px', fontSize: 12, fontWeight: 600, marginTop: 8 }}>
            {planLabels[plan] || plan}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Upload Resume */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 4px' }}>Upload Resume (Optional)</h3>
            <p style={{ fontSize: 13, color: '#888', margin: '0 0 14px' }}>Upload your existing resume to auto-fill the form. PDF or DOCX.</p>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ border: `2px dashed ${dragOver ? '#0A66C2' : '#D1D5DB'}`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? '#F0F7FF' : '#FAFAFA' }}
            >
              <input ref={fileInputRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setUploadFile(e.target.files[0]); }} />
              {uploadFile ? (
                <div style={{ fontSize: 14, color: '#191919', fontWeight: 600 }}>{uploadFile.name}</div>
              ) : (
                <div style={{ fontSize: 13, color: '#888' }}>Drag & drop or click to upload (PDF, DOCX)</div>
              )}
            </div>
            {uploadFile && !uploadSuccess && (
              <button type="button" onClick={handleUploadParse} disabled={uploading} style={{ marginTop: 10, padding: '8px 20px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
                {uploading ? 'Parsing...' : 'Parse & Auto-Fill'}
              </button>
            )}
            {uploadSuccess && <p style={{ fontSize: 13, color: '#057642', fontWeight: 600, marginTop: 8 }}>Form auto-filled from your resume!</p>}
            {uploadError && <p style={{ fontSize: 13, color: '#CC1016', marginTop: 8 }}>{uploadError}</p>}
          </div>

          {/* Personal Info */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 16px' }}>About You</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Rahul Sharma" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@email.com" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Bangalore, India" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Career Stage *</label>
                <select value={careerStage} onChange={e => setCareerStage(e.target.value)} style={inputStyle}>
                  {CAREER_STAGES.map(cs => <option key={cs.value} value={cs.value}>{cs.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Target Role *</label>
                <input value={targetRole} onChange={e => setTargetRole(e.target.value)} placeholder="Data Analyst" style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Target Industry</label>
                <select value={targetIndustry} onChange={e => setTargetIndustry(e.target.value)} style={inputStyle}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Profile Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)} style={inputStyle}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly (Recommended for students)</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Education */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 16px' }}>Education</h3>
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 14, background: '#F9FAFB', borderRadius: 10, position: 'relative' }}>
                {education.length > 1 && (
                  <button type="button" onClick={() => removeEducation(i)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#CC1016', cursor: 'pointer', fontSize: 18 }}>&times;</button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  <div><label style={labelStyle}>Institution</label><input value={edu.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} placeholder="IIT Delhi" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Degree</label><input value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} placeholder="B.Tech" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Field of Study</label><input value={edu.field} onChange={e => updateEducation(i, 'field', e.target.value)} placeholder="Computer Science" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Year</label><input value={edu.year} onChange={e => updateEducation(i, 'year', e.target.value)} placeholder="2024" style={inputStyle} /></div>
                  <div><label style={labelStyle}>GPA (optional)</label><input value={edu.gpa} onChange={e => updateEducation(i, 'gpa', e.target.value)} placeholder="8.5/10" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Key Coursework (optional)</label><input value={edu.coursework} onChange={e => updateEducation(i, 'coursework', e.target.value)} placeholder="ML, Data Structures, DBMS" style={inputStyle} /></div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addEducation} style={{ background: '#E8F0FE', color: '#0A66C2', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Education</button>
          </div>

          {/* Experience */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 4px' }}>Experience</h3>
            <p style={{ fontSize: 12, color: '#888', margin: '0 0 16px' }}>Include internships, freelance, college projects, volunteering — anything counts!</p>
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 14, background: '#F9FAFB', borderRadius: 10, position: 'relative' }}>
                {experience.length > 1 && (
                  <button type="button" onClick={() => removeExperience(i)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', color: '#CC1016', cursor: 'pointer', fontSize: 18 }}>&times;</button>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginBottom: 10 }}>
                  <div><label style={labelStyle}>Company / Project</label><input value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} placeholder="TCS / College Hackathon" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Role</label><input value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} placeholder="Data Analyst Intern" style={inputStyle} /></div>
                  <div><label style={labelStyle}>Start Date</label><input value={exp.start_date} onChange={e => updateExperience(i, 'start_date', e.target.value)} placeholder="Jan 2024" style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>End Date</label>
                    <input value={exp.current ? 'Present' : exp.end_date} onChange={e => updateExperience(i, 'end_date', e.target.value)} placeholder="Mar 2024" style={inputStyle} disabled={exp.current} />
                    <label style={{ fontSize: 12, color: '#666', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="checkbox" checked={exp.current} onChange={e => updateExperience(i, 'current', e.target.checked)} /> Current
                    </label>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>What did you do? (Don{"'"}t worry about wording — AI will polish it)</label>
                  <textarea value={exp.description} onChange={e => updateExperience(i, 'description', e.target.value)} placeholder="Built dashboards using Python, analyzed sales data, created weekly reports for the team..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
                </div>
              </div>
            ))}
            <button type="button" onClick={addExperience} style={{ background: '#E8F0FE', color: '#0A66C2', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Experience</button>
          </div>

          {/* Projects (especially useful for students/freshers) */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 16px' }}>Projects & Portfolio <span style={{ fontSize: 12, fontWeight: 400, color: '#888' }}>(optional)</span></h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>Great for students and freshers — list your key projects, hackathons, or portfolio work</p>
              <button
                style={enhanceButtonStyle}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                disabled={!!enhancingFields['projects']}
                onClick={async () => {
                  if (!projects.trim()) return;
                  setEnhancingFields(prev => ({ ...prev, projects: true }));
                  try {
                    const enhanced = await aiEnhance(projects, 'project');
                    setProjects(enhanced);
                  } catch { /* silent */ }
                  setEnhancingFields(prev => ({ ...prev, projects: false }));
                }}
                title="AI Enhance"
                type="button"
              >
                {enhancingFields['projects'] ? '...' : '\u2728'}
              </button>
            </div>
            <textarea value={projects} onChange={e => setProjects(e.target.value)} placeholder={"E-commerce app using React + Node.js — built full-stack shopping cart with payment integration\nCollege placement portal — helped 200+ students find internships\nKaggle competition — top 10% in sentiment analysis challenge"} rows={4} style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>

          {/* Skills & Certifications */}
          <div style={sectionStyle}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 16px' }}>Skills & Certifications</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Skills (press Enter to add)</label>
              <TagInput tags={skills} setTags={setSkills} placeholder="Python, SQL, Excel, Communication..." />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Certifications (press Enter to add)</label>
              <TagInput tags={certifications} setTags={setCertifications} placeholder="AWS Certified, Google Analytics..." />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={labelStyle}>Key Achievements (optional)</label>
                <button
                  style={enhanceButtonStyle}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                  disabled={!!enhancingFields['achievements']}
                  onClick={async () => {
                    if (!achievements.trim()) return;
                    setEnhancingFields(prev => ({ ...prev, achievements: true }));
                    try {
                      const enhanced = await aiEnhance(achievements, 'achievement');
                      setAchievements(enhanced);
                    } catch { /* silent */ }
                    setEnhancingFields(prev => ({ ...prev, achievements: false }));
                  }}
                  title="AI Enhance"
                  type="button"
                >
                  {enhancingFields['achievements'] ? '...' : '\u2728'}
                </button>
              </div>
              <textarea value={achievements} onChange={e => setAchievements(e.target.value)} placeholder="Won college hackathon, published research paper, 500+ LeetCode problems solved, led a team of 5..." rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <p style={{ margin: 0, color: '#CC1016', fontSize: 14 }}>{submitError}</p>
            </div>
          )}

          {/* Submit */}
          {submitting ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 40, height: 40, border: '4px solid #E0E0E0', borderTopColor: '#0A66C2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#191919', marginBottom: 4 }}>Waiting for payment confirmation...</p>
              <p style={{ fontSize: 12, color: '#888' }}>Complete payment in the Razorpay window to continue</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <button type="submit" style={{ width: '100%', padding: '14px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 50, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              Pay & Generate My LinkedIn Profile &rarr;
            </button>
          )}

          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 8 }}>
            Secure payment via Razorpay. Your data is never shared.
          </p>
        </form>
      </div>
    </main>
  );
}

export default function BuildFormPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#666' }}>Loading...</p></div>}>
      <BuildFormContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface HeadlineVariation {
  text: string;
  style: string;
  best_for: string;
}

interface ExperienceEntry {
  role: string;
  company: string;
  duration: string;
  bullets: string[];
  changes_made: string;
}

interface SetupStep {
  step: number;
  title: string;
  menu_path: string;
  description: string;
  common_mistake: string;
  time: string;
}

interface BuildProfile {
  headline_variations: HeadlineVariation[];
  about: string;
  experience: ExperienceEntry[];
  skills: { technical: string[]; soft: string[]; tools: string[] };
  setup_guide: SetupStep[];
  tell_me_about_yourself?: { short_30s: string; medium_60s: string; detailed_2min: string };
  hr_cheat_sheet?: { question: string; answer: string; tip?: string }[];
  project_prep?: { project_name: string; tech_stack: string; elevator_pitch_30s: string; architecture_explanation: string; follow_up_questions?: { question: string; answer: string }[] }[];
}

interface BuildOrder {
  order_id: string;
  email: string;
  plan: string;
  payment_status: string;
  processing_status: string;
  processing_error?: string;
  generated_profile: BuildProfile | null;
  form_input: any;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: '4px 12px', background: copied ? '#057642' : '#E8F0FE', color: copied ? 'white' : '#0A66C2', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

const PROCESSING_MESSAGES: Record<string, string> = {
  pending: 'Preparing your order...',
  queued: 'Your order is in the queue...',
  generating: 'AI is building your resume & LinkedIn profile...',
  checking: 'Running quality checks...',
  done: 'Your results are ready!',
  failed: 'Something went wrong.',
};

export default function BuildResultsPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [data, setData] = useState<BuildOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedGuideStep, setExpandedGuideStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [existingResumes, setExistingResumes] = useState<any[]>([]);
  const [resumeCountLoaded, setResumeCountLoaded] = useState(false);
  const [tmayTab, setTmayTab] = useState<'30s' | '60s' | '2min'>('60s');
  const [expandedHR, setExpandedHR] = useState<number | null>(null);
  const [expandedProject, setExpandedProject] = useState<number | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/build/results/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const result = await res.json();
      setData(result);
    } catch {
      setError('Failed to load results. Please try refreshing.');
    }
  }, [orderId]);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/build/results/${orderId}`);
        if (!res.ok) return;
        const result = await res.json();
        setData(result);
        if (result.processing_status === 'done' || result.processing_status === 'failed') {
          clearInterval(interval);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId, fetchResults]);

  useEffect(() => {
    async function fetchResumes() {
      try {
        const res = await fetch(`${API_URL}/api/resume/by-order/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setExistingResumes(data.resumes || (Array.isArray(data) ? data : []));
        }
      } catch {}
      setResumeCountLoaded(true);
    }
    fetchResumes();
  }, [orderId]);

  function toggleStep(step: number) {
    setExpandedGuideStep(expandedGuideStep === step ? null : step);
  }

  function toggleCompleted(step: number) {
    const updated = new Set(completedSteps);
    if (updated.has(step)) updated.delete(step); else updated.add(step);
    setCompletedSteps(updated);
  }

  async function submitFeedback() {
    if (!rating) return;
    try {
      await fetch(`${API_URL}/api/build/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedbackText }),
      });
      setFeedbackSent(true);
    } catch {}
  }

  // Loading / Error states
  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 32, textAlign: 'center', maxWidth: 400 }}>
          <p style={{ color: '#CC1016', fontSize: 15 }}>{error}</p>
          <button onClick={fetchResults} style={{ padding: '8px 20px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 10 }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data || data.processing_status !== 'done') {
    const status = data?.processing_status || 'pending';
    const formEmpty = data?.form_input && Object.keys(data.form_input).length === 0;
    const isPending = status === 'pending';

    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: 14, padding: '40px 32px', textAlign: 'center', maxWidth: 440 }}>
          {status === 'failed' ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#9888;&#65039;</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#CC1016', margin: '0 0 8px' }}>Generation Failed</h2>
              <p style={{ fontSize: 14, color: '#666' }}>{data?.processing_error || 'Please contact support@profileroaster.in'}</p>
            </>
          ) : isPending && formEmpty ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#128221;</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', margin: '0 0 8px' }}>Complete Your Profile Details</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
                Your order is ready! Fill in your details so we can build your LinkedIn profile.
              </p>
              <a
                href={`/build/form?plan=${data?.plan || 'standard'}&orderId=${orderId}`}
                style={{ display: 'inline-block', background: '#0A66C2', color: 'white', padding: '12px 28px', borderRadius: 50, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
              >
                Fill Your Details &rarr;
              </a>
              <p style={{ fontSize: 12, color: '#999', marginTop: 12 }}>Order ID: {orderId}</p>
            </>
          ) : (
            <>
              <div style={{ width: 48, height: 48, border: '4px solid #E0E0E0', borderTopColor: '#0A66C2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', margin: '0 0 8px' }}>Building Your Resume & LinkedIn Profile</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>{PROCESSING_MESSAGES[status]}</p>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {['queued', 'generating', 'checking', 'done'].map((s, i) => (
                  <div key={s} style={{ width: 40, height: 4, borderRadius: 2, background: ['queued', 'generating', 'checking', 'done'].indexOf(status) >= i ? '#0A66C2' : '#E0E0E0' }} />
                ))}
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          )}
        </div>
      </div>
    );
  }

  // Handle both direct object and possibly stringified JSON
  let profile = data.generated_profile;
  if (typeof profile === 'string') {
    try { profile = JSON.parse(profile); } catch { /* keep as-is */ }
  }
  const plan = data.plan;

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 32, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>&#9888;&#65039;</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#CC1016', margin: '0 0 8px' }}>Profile data missing</h2>
          <p style={{ fontSize: 14, color: '#666' }}>Please contact support@profileroaster.in with your order ID.</p>
          <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{orderId}</p>
        </div>
      </div>
    );
  }

  // Build full profile text for copy
  const fullProfileText = (() => {
    const hl = profile.headline_variations?.[0]?.text || '';
    const about = profile.about || '';
    const exp = (profile.experience || []).map((e: ExperienceEntry) => `${e.role} at ${e.company}\n${(e.bullets || []).map((b: string) => '• ' + b).join('\n')}`).join('\n\n');
    const sk = [...(profile.skills?.technical || []), ...(profile.skills?.soft || []), ...(profile.skills?.tools || [])].join(', ');
    return `HEADLINE:\n${hl}\n\nABOUT:\n${about}\n\nEXPERIENCE:\n${exp}\n\nSKILLS:\n${sk}`;
  })();

  const allSkillsText = [...(profile.skills?.technical || []), ...(profile.skills?.soft || []), ...(profile.skills?.tools || [])].join(', ');

  const userTargetRole = data.form_input?.target_role || profile.experience?.[0]?.role || 'professional';
  const connTemplates = [
    { label: 'For Alumni', text: `Hi! I'm pursuing a career in ${userTargetRole} and noticed we share a similar background. Would love to connect and learn from your journey.` },
    { label: 'For Recruiters', text: `Hi! I'm actively looking for ${userTargetRole} opportunities. I'd love to connect and share how my skills might be a good fit for roles at your organization.` },
    { label: 'For Hiring Managers', text: `Hi! I came across your team's work and I'm very interested in ${userTargetRole} roles. I'd appreciate the chance to connect and learn more about opportunities.` },
    { label: 'For College Seniors', text: `Hi! I'm a junior from your college exploring ${userTargetRole} opportunities. Would love to connect and hear about your experience after graduation.` },
    { label: 'For Internship Coordinators', text: `Hi! I'm interested in internship opportunities in ${userTargetRole}. I've been working on relevant projects and would love to discuss how I can contribute.` },
    { label: 'After a Hackathon/Event', text: `Hi! Great meeting you at the event. I really enjoyed our conversation about ${userTargetRole}. Would love to stay connected and keep the discussion going.` },
  ];

  const userName = data.form_input?.full_name || 'User';
  const userInitial = userName.charAt(0).toUpperCase();
  const isStudent = plan === 'student' || data.form_input?.career_stage === 'student' || data.form_input?.career_stage === 'fresher';
  const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: '20px 24px', marginBottom: 16 };

  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh' }}>
      {/* HEADER BAR */}
      <div style={{ background: '#0B69C7', padding: '10px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <a href="/build" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Profile</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>Roaster</span>
          </a>
          <a href="/dashboard" style={{ fontSize: 13, color: 'white', textDecoration: 'none', fontWeight: 600 }}>&larr; My Dashboard</a>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {/* PROFILE CARD */}
        <div style={{ maxWidth: 1100, margin: '0 auto 20px', background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', overflow: 'hidden' }}>
          {/* Banner */}
          <div style={{ background: 'linear-gradient(135deg, #004182, #0B69C7)', padding: '32px 28px 48px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'white', margin: 0, lineHeight: 1.5, maxWidth: 700, opacity: 0.95 }}>
                {profile.headline_variations?.[0]?.text || (profile as any).headline || data.form_input?.target_role || 'Your LinkedIn Profile is Ready'}
              </p>
              {profile.headline_variations?.[0]?.text && (
                <CopyButton text={profile.headline_variations[0].text} />
              )}
            </div>
          </div>
          {/* Avatar + Info */}
          <div style={{ padding: '0 28px 24px', position: 'relative' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#0B69C7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, border: '3px solid white', marginTop: -36, position: 'relative', zIndex: 1 }}>
              {userInitial}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#191919', margin: '8px 0 2px' }}>{userName}</h1>
            {data.form_input?.target_role && (
              <p style={{ fontSize: 14, color: '#444', margin: '0 0 2px' }}>{data.form_input.target_role}</p>
            )}
            {data.form_input?.location && (
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>{data.form_input.location}</p>
            )}
          </div>
        </div>

        {/* STUDENT SUCCESS BANNER */}
        {isStudent && (
          <div style={{ maxWidth: 1100, margin: '0 auto 16px' }}>
            <div style={{ background: 'linear-gradient(135deg, #057642, #16A34A)', borderRadius: 12, padding: '24px 28px', color: 'white' }}>
              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Your First Resume &amp; LinkedIn Profile is Ready!</div>
              <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, marginBottom: 16 }}>
                Everything you need to start applying — resume, LinkedIn content, setup guide, and interview prep. Follow the steps below.
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href={`/resume?orderId=${orderId}&source=build`} style={{ padding: '10px 24px', background: 'white', color: '#057642', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Build &amp; Download Resume
                </a>
                <button onClick={() => { const text = `I just built my first professional resume and LinkedIn profile in 60 seconds! Try it: profileroaster.in`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }} style={{ padding: '10px 24px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Share with Batchmates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TWO-COLUMN LAYOUT */}
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: '1 1 550px', minWidth: 0 }}>
            {/* About */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: 0 }}>About</h2>
                <CopyButton text={profile.about || ''} />
              </div>
              <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '18px 20px', lineHeight: 1.7, fontSize: 14, color: '#333', whiteSpace: 'pre-wrap' }}>
                {profile.about || <span style={{ color: '#CC1016', fontStyle: 'italic' }}>About section not generated. Please contact support@profileroaster.in</span>}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#888' }}>
                <span>{(profile.about || '').split(/\s+/).length} words</span>
                <span>&bull;</span>
                <span>Recommended: 250-400 words</span>
              </div>
            </div>

            {/* Experience */}
            {profile.experience?.length > 0 && (
              <div style={cardStyle}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: '0 0 16px' }}>Experience</h2>
                {profile.experience.map((exp, i) => (
                  <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '18px 20px', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>{exp.role}</div>
                        <div style={{ fontSize: 13, color: '#666' }}>{exp.company} &bull; {exp.duration}</div>
                      </div>
                      <CopyButton text={exp.bullets.map(b => `• ${b}`).join('\n')} />
                    </div>
                    <ul style={{ margin: 0, padding: '0 0 0 18px' }}>
                      {exp.bullets.map((b, j) => (
                        <li key={j} style={{ fontSize: 14, color: '#333', lineHeight: 1.6, marginBottom: 4 }}>{b}</li>
                      ))}
                    </ul>
                    {exp.changes_made && (
                      <div style={{ fontSize: 12, color: '#0B69C7', marginTop: 8, fontStyle: 'italic' }}>AI improvements: {exp.changes_made}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Skills */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: 0 }}>Skills</h2>
                <CopyButton text={allSkillsText} />
              </div>
              {profile.skills?.technical?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Technical</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile.skills.technical.map((s, i) => (
                      <span key={i} style={{ background: '#E8F0FE', color: '#0B69C7', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.skills?.soft?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Interpersonal</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile.skills.soft.map((s, i) => (
                      <span key={i} style={{ background: '#F0FDF4', color: '#057642', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {profile.skills?.tools?.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Tools & Platforms</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {profile.skills.tools.map((s, i) => (
                      <span key={i} style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tell Me About Yourself */}
            {isStudent && profile.tell_me_about_yourself && (
              <div style={cardStyle}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: '0 0 12px' }}>Tell Me About Yourself</h2>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {(['30s', '60s', '2min'] as const).map(v => (
                    <button key={v} onClick={() => setTmayTab(v)} style={{ padding: '6px 16px', borderRadius: 20, border: tmayTab === v ? '2px solid #0B69C7' : '1px solid #D1D5DB', background: tmayTab === v ? '#EFF6FF' : 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: tmayTab === v ? '#0B69C7' : '#666' }}>
                      {v === '30s' ? '30 Seconds' : v === '60s' ? '1 Minute' : '2 Minutes'}
                    </button>
                  ))}
                </div>
                <div style={{ background: '#F0F7FF', borderRadius: 10, padding: '18px 20px', lineHeight: 1.7, fontSize: 14, color: '#333', whiteSpace: 'pre-wrap', position: 'relative' }}>
                  {tmayTab === '30s' && (profile.tell_me_about_yourself.short_30s || 'Not generated')}
                  {tmayTab === '60s' && (profile.tell_me_about_yourself.medium_60s || 'Not generated')}
                  {tmayTab === '2min' && (profile.tell_me_about_yourself.detailed_2min || 'Not generated')}
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <CopyButton text={tmayTab === '30s' ? profile.tell_me_about_yourself.short_30s : tmayTab === '60s' ? profile.tell_me_about_yourself.medium_60s : profile.tell_me_about_yourself.detailed_2min} />
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                  {tmayTab === '30s' ? 'For group discussions and quick introductions' : tmayTab === '60s' ? 'Standard interview opener — memorize this one' : 'For detailed technical round introductions'}
                </div>
              </div>
            )}

            {/* HR Round Cheat Sheet */}
            {isStudent && profile.hr_cheat_sheet && profile.hr_cheat_sheet.length > 0 && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: 0 }}>HR Round Cheat Sheet</h2>
                  <CopyButton text={profile.hr_cheat_sheet.map((q: any) => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n')} />
                </div>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>10 most common HR questions with YOUR personalized answers</div>
                {profile.hr_cheat_sheet.map((q: any, i: number) => (
                  <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedHR(expandedHR === i ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: expandedHR === i ? '#F9FAFB' : 'white' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#0B69C7', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#191919' }}>{q.question}</span>
                      <span style={{ fontSize: 14, color: '#888' }}>{expandedHR === i ? '\u25B2' : '\u25BC'}</span>
                    </div>
                    {expandedHR === i && (
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F3F4F6' }}>
                        <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '12px 14px', marginTop: 12, fontSize: 14, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.answer}</div>
                        {q.tip && (
                          <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 12, color: '#92400E' }}>
                            <strong>Tip:</strong> {q.tip}
                          </div>
                        )}
                        <div style={{ marginTop: 8, textAlign: 'right' }}>
                          <CopyButton text={`Q: ${q.question}\nA: ${q.answer}`} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Project Explanation Prep */}
            {isStudent && profile.project_prep && profile.project_prep.length > 0 && (
              <div style={cardStyle}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: '0 0 16px' }}>Project Explanation Prep</h2>
                {profile.project_prep.map((proj: any, i: number) => (
                  <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                    <div onClick={() => setExpandedProject(expandedProject === i ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: expandedProject === i ? '#F9FAFB' : 'white' }}>
                      <span style={{ fontSize: 20 }}>{'\uD83D\uDCBB'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#191919' }}>{proj.project_name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{proj.tech_stack}</div>
                      </div>
                      <span style={{ fontSize: 14, color: '#888' }}>{expandedProject === i ? '\u25B2' : '\u25BC'}</span>
                    </div>
                    {expandedProject === i && (
                      <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F3F4F6' }}>
                        {/* 30-Second Pitch */}
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0B69C7', letterSpacing: 1 }}>30-SECOND PITCH</span>
                            <CopyButton text={proj.elevator_pitch_30s} />
                          </div>
                          <div style={{ background: '#F0F7FF', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#333', lineHeight: 1.6 }}>{proj.elevator_pitch_30s}</div>
                        </div>
                        {/* Architecture */}
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#057642', letterSpacing: 1 }}>ARCHITECTURE EXPLANATION</span>
                            <CopyButton text={proj.architecture_explanation} />
                          </div>
                          <div style={{ background: '#F0FDF4', borderRadius: 8, padding: '12px 14px', fontSize: 14, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{proj.architecture_explanation}</div>
                        </div>
                        {/* Follow-up Questions */}
                        <div style={{ marginTop: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#CC1016', letterSpacing: 1 }}>FOLLOW-UP QUESTIONS THEY WILL ASK</span>
                          {(proj.follow_up_questions || []).map((fq: any, j: number) => (
                            <div key={j} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#191919', marginBottom: 4 }}>Q{j + 1}: {fq.question}</div>
                              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{fq.answer}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Headline Variations */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: 0 }}>Headline Variations</h2>
                <span style={{ fontSize: 12, color: '#888' }}>Pick one and paste into LinkedIn</span>
              </div>
              {profile.headline_variations?.map((h, i) => (
                <div key={i} style={{ background: '#F0F7FF', borderRadius: 10, padding: '16px 18px', marginBottom: 10, border: '1px solid #BFDBFE' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#191919', lineHeight: 1.5 }}>{h.text}</div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#0B69C7', background: '#E8F0FE', padding: '2px 8px', borderRadius: 4 }}>{h.style}</span>
                        {h.best_for && <span style={{ fontSize: 11, color: '#666' }}>Best for: {h.best_for}</span>}
                      </div>
                    </div>
                    <CopyButton text={h.text} />
                  </div>
                </div>
              ))}
            </div>

            {/* Company Interview Prep — On-Demand */}
            {isStudent && (
              <div style={{ background: 'linear-gradient(135deg, #004182, #0B69C7)', borderRadius: 12, padding: '24px 28px', color: 'white', marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Prepare for a Specific Company</div>
                <div style={{ fontSize: 14, opacity: 0.9, lineHeight: 1.6, marginBottom: 16 }}>
                  Select a company visiting your campus. AI generates 15 tailored interview questions + company tips + customized &quot;Tell me about yourself&quot; for that company.
                </div>
                <a href={`/build/interview-prep/${orderId}`} style={{ display: 'inline-block', padding: '12px 28px', background: 'white', color: '#0B69C7', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Prepare for Interview &rarr;
                </a>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
                  {plan === 'student_pro' ? '10' : '5'} company prep slots included in your plan
                </div>
              </div>
            )}

            {/* Setup Guide */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#191919', margin: '0 0 4px' }}>LinkedIn Setup Guide</h2>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>Follow these steps to set up your LinkedIn profile. Check off each step as you complete it.</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#057642' }}>{completedSteps.size}/{profile.setup_guide?.length || 10} steps done</span>
                <div style={{ flex: 1, background: '#E5E7EB', borderRadius: 4, height: 8, alignSelf: 'center' }}>
                  <div style={{ width: `${(completedSteps.size / (profile.setup_guide?.length || 10)) * 100}%`, background: '#057642', borderRadius: 4, height: '100%', transition: 'width 0.3s' }} />
                </div>
              </div>

              {profile.setup_guide?.map((step) => (
                <div key={step.step} style={{ marginBottom: 8, border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    onClick={() => toggleStep(step.step)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: completedSteps.has(step.step) ? '#F0FDF4' : 'white' }}
                  >
                    <input
                      type="checkbox"
                      checked={completedSteps.has(step.step)}
                      onChange={(e) => { e.stopPropagation(); toggleCompleted(step.step); }}
                      style={{ width: 18, height: 18, accentColor: '#057642' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: completedSteps.has(step.step) ? '#057642' : '#191919', textDecoration: completedSteps.has(step.step) ? 'line-through' : 'none' }}>
                        Step {step.step}: {step.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>{step.time}</div>
                    </div>
                    <span style={{ fontSize: 14, color: '#888' }}>{expandedGuideStep === step.step ? '▲' : '▼'}</span>
                  </div>
                  {expandedGuideStep === step.step && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid #F3F4F6' }}>
                      <div style={{ background: '#F0F7FF', borderRadius: 8, padding: '10px 14px', marginTop: 12, marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#0B69C7', marginBottom: 2 }}>MENU PATH</div>
                        <div style={{ fontSize: 13, color: '#191919', fontFamily: 'monospace' }}>{step.menu_path}</div>
                      </div>
                      <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, margin: '0 0 10px' }}>{step.description}</p>
                      <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#CC1016', marginBottom: 2 }}>COMMON MISTAKE</div>
                        <div style={{ fontSize: 13, color: '#666' }}>{step.common_mistake}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div style={{ ...cardStyle, textAlign: 'center' as const }}>
              {!feedbackSent ? (
                <>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 12px' }}>How was your experience?</h3>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} onClick={() => setRating(n)} style={{ width: 40, height: 40, borderRadius: '50%', border: rating >= n ? '2px solid #0B69C7' : '1px solid #E0E0E0', background: rating >= n ? '#E8F0FE' : 'white', fontSize: 16, cursor: 'pointer' }}>{n}</button>
                    ))}
                  </div>
                  {rating > 0 && (
                    <>
                      <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Any feedback? (optional)" rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                      <button onClick={submitFeedback} style={{ padding: '8px 20px', background: '#0B69C7', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Submit</button>
                    </>
                  )}
                </>
              ) : (
                <p style={{ fontSize: 15, fontWeight: 600, color: '#057642', margin: 0 }}>Thank you for your feedback!</p>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-auto lg:max-w-[340px]" style={{ flex: '0 0 320px' }}>
            {/* ATS Resume Builder */}
            {(plan === 'student' || plan === 'standard' || plan === 'plus' || plan === 'pro') && (() => {
              const maxResumes = plan === 'pro' ? 10 : plan === 'student' ? 1 : 5;
              const usedCount = existingResumes.length;
              const remaining = Math.max(0, maxResumes - usedCount);
              return (
                <div style={{ ...cardStyle, background: '#EFF6FF', borderLeft: '4px solid #0B69C7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF', margin: 0 }}>ATS Resume Builder</h3>
                    {resumeCountLoaded && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: remaining > 0 ? '#057642' : '#CC1016', background: remaining > 0 ? '#F0FDF4' : '#FEF2F2', padding: '2px 10px', borderRadius: 12 }}>
                        {usedCount}/{maxResumes} used
                      </span>
                    )}
                  </div>

                  {/* Existing resumes list */}
                  {existingResumes.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Your Resumes ({usedCount}/{maxResumes})</div>
                      {existingResumes.map((r: any, i: number) => (
                        <div key={r.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: 8, padding: '8px 12px', marginBottom: 4, border: '1px solid #E5E7EB' }}>
                          <div style={{ fontSize: 13, color: '#191919', fontWeight: 500 }}>
                            {r.target_role || `Resume ${i + 1}`}
                            {r.ats_score ? <span style={{ fontSize: 11, color: '#057642', marginLeft: 6 }}>ATS: {r.ats_score}%</span> : null}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <a href={`/resume/${r.id}/edit`} style={{ fontSize: 12, color: '#0B69C7', textDecoration: 'none', fontWeight: 600 }}>Edit</a>
                            <a href={`/resume/${r.id}`} style={{ fontSize: 12, color: '#0B69C7', textDecoration: 'none', fontWeight: 600 }}>View</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {remaining > 0 ? (
                    <>
                      <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: '0 0 12px' }}>
                        Build a matching ATS-optimized resume using the same data.
                      </p>
                      <a href={`/resume?orderId=${orderId}&source=build`} style={{ display: 'inline-block', background: '#0B69C7', color: 'white', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                        {usedCount > 0 ? `Build another resume (${remaining} remaining)` : 'Build My Resume'} &rarr;
                      </a>
                    </>
                  ) : (
                    <div style={{ background: '#FEF2F2', borderRadius: 8, padding: '10px 14px', marginTop: 4 }}>
                      <p style={{ fontSize: 13, color: '#CC1016', fontWeight: 600, margin: '0 0 4px' }}>Resume limit reached</p>
                      <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
                        You&apos;ve used all {maxResumes} resumes.{' '}
                        {plan !== 'pro' && <span>Upgrade to Pro for 10 resumes.</span>}
                      </p>
                    </div>
                  )}

                  <p style={{ fontSize: 12, color: '#888', marginTop: 8, marginBottom: 0 }}>
                    {plan === 'pro' ? '10 resumes + 10 cover letters + all 11 templates' : plan === 'student' ? '1 resume + 1 cover letter + 11 templates' : '5 resumes + 5 cover letters + 11 templates'} included in your plan
                  </p>
                </div>
              );
            })()}

            {plan === 'starter' && (
              <div style={{ ...cardStyle, background: '#EFF6FF', borderLeft: '4px solid #0B69C7' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E40AF', margin: '0 0 8px' }}>ATS Resume Builder</h3>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6, margin: '0 0 12px' }}>
                  Want an ATS-optimized resume built from your profile data?
                </p>
                <a href={`/resume?orderId=${orderId}&source=build`} style={{ display: 'inline-block', background: '#0B69C7', color: 'white', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Build ATS Resume &rarr;
                </a>
              </div>
            )}

            {/* Copy Full Profile */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#191919', margin: 0 }}>Copy Full Profile</h3>
                <CopyButton text={fullProfileText} />
              </div>
              <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Copies headline, about, experience, and skills in one go.</p>
            </div>

            {/* Connection Templates */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#191919', margin: '0 0 12px' }}>Connection Templates</h3>
              {connTemplates.map((t, i) => (
                <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: '10px 12px', marginBottom: i < connTemplates.length - 1 ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0B69C7', marginBottom: 3 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5 }}>{t.text}</div>
                    </div>
                    <CopyButton text={t.text} />
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Share for Students */}
            {isStudent && (
              <div style={{ ...cardStyle, background: '#F0FDF4', borderLeft: '4px solid #25D366' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#191919', margin: '0 0 8px' }}>Share with Batchmates</h3>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.5, margin: '0 0 12px' }}>
                  Your friends need this too. Share and help them build their first resume.
                </p>
                <button onClick={() => { const text = `Bro I just made my resume and LinkedIn profile in 60 seconds for just Rs 99. My resume looks professional af. Try it: profileroaster.in`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }} style={{ width: '100%', padding: '10px', background: '#25D366', color: 'white', border: 'none', borderRadius: 50, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  Share on WhatsApp
                </button>
              </div>
            )}

            {/* Placement Checklist */}
            {isStudent && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#191919', margin: '0 0 12px' }}>Placement Checklist</h3>
                {[
                  { label: 'Resume built', done: true },
                  { label: 'LinkedIn content ready', done: true },
                  { label: '"Tell me about yourself" memorized', done: !!profile.tell_me_about_yourself },
                  { label: 'HR answers prepared', done: !!profile.hr_cheat_sheet?.length },
                  { label: 'Project explanation practiced', done: !!profile.project_prep?.length },
                  { label: 'LinkedIn profile set up', done: false },
                  { label: 'Company interview prep done', done: false },
                  { label: 'Applied to companies', done: false },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: item.done ? '#057642' : '#191919', padding: '6px 0' }}>
                    <span style={{ fontSize: 14 }}>{item.done ? '\u2705' : '\u2B1C'}</span>
                    <span style={{ fontWeight: item.done ? 600 : 400 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Upgrade CTA for student */}
            {plan === 'student' && (
              <div style={{ background: 'linear-gradient(135deg, #004182, #0B69C7)', borderRadius: 12, padding: '20px 24px', marginBottom: 16, textAlign: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>Need More Resumes?</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 4px' }}>
                  5 resumes for 5 different companies + 15 interview questions + cover letters
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '8px 0 14px' }}>Upgrade — ₹400</p>
                <a href="/?plan=standard" style={{ display: 'inline-block', background: 'white', color: '#0B69C7', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Upgrade to Standard
                </a>
              </div>
            )}

            {/* Upgrade CTA for starter */}
            {plan === 'starter' && (
              <div style={{ background: 'linear-gradient(135deg, #004182, #0B69C7)', borderRadius: 12, padding: '20px 24px', marginBottom: 16, textAlign: 'center' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>Want an ATS Resume?</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 14px' }}>
                  Build a professional resume + cover letter from your profile data.
                </p>
                <a href={`/resume?orderId=${orderId}&source=build`} style={{ display: 'inline-block', background: 'white', color: '#0B69C7', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  Build Resume &rarr;
                </a>
              </div>
            )}
          </div>
        </div>

        {/* DISCLAIMER / Footer */}
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 12, color: '#999' }}>Results emailed to {data.email} &bull; Bookmark this page for future reference</p>
        </div>
      </div>
    </main>
  );
}

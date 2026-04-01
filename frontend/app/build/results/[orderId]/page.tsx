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
  pending: 'Waiting for payment confirmation...',
  queued: 'Your order is in the queue...',
  generating: 'AI is building your LinkedIn profile...',
  checking: 'Running quality checks...',
  done: 'Your profile is ready!',
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
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: 14, padding: '40px 32px', textAlign: 'center', maxWidth: 440 }}>
          {status === 'failed' ? (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>&#9888;&#65039;</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#CC1016', margin: '0 0 8px' }}>Generation Failed</h2>
              <p style={{ fontSize: 14, color: '#666' }}>{data?.processing_error || 'Please contact support@profileroaster.in'}</p>
            </>
          ) : (
            <>
              <div style={{ width: 48, height: 48, border: '4px solid #E0E0E0', borderTopColor: '#0A66C2', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', margin: '0 0 8px' }}>Building Your LinkedIn Profile</h2>
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

  const profile = data.generated_profile;
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

  const connTemplates = [
    { label: 'For Alumni', text: `Hi! I'm a fellow ${profile.experience?.[0]?.role || 'professional'} and noticed we share a similar background. Would love to connect and learn from your journey.` },
    { label: 'For Recruiters', text: `Hi! I'm actively looking for ${profile.experience?.[0]?.role || 'new'} opportunities. I'd love to connect and share how my experience might be a good fit for roles at your organization.` },
    { label: 'For Hiring Managers', text: `Hi! I came across your team's work and I'm very interested in ${profile.experience?.[0]?.role || 'similar'} roles. I'd appreciate the chance to connect and learn more about opportunities on your team.` },
    { label: 'For College Seniors', text: `Hi! I'm a junior from your college and currently exploring ${profile.experience?.[0]?.role || 'career'} opportunities. Would love to connect and hear about your experience after graduation.` },
    { label: 'For Internship Coordinators', text: `Hi! I'm interested in internship opportunities at your organization. I've been working on projects in ${profile.experience?.[0]?.role || 'this'} space and would love to discuss how I can contribute.` },
    { label: 'After a Hackathon/Event', text: `Hi! Great meeting you at the event. I really enjoyed our conversation about ${profile.experience?.[0]?.role || 'technology'}. Would love to stay connected and keep the discussion going.` },
  ];

  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Dashboard link */}
        <div style={{ marginBottom: 12 }}>
          <a href="/dashboard" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>&larr; My Dashboard</a>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <a href="/build" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#191919' }}>Roaster</span>
          </a>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#191919', margin: '12px 0 4px' }}>Your LinkedIn Profile is Ready</h1>
          <p style={{ fontSize: 14, color: '#666' }}>Copy each section and paste it into LinkedIn. Follow the setup guide below.</p>
        </div>

        {/* Section 1: Headlines */}
        <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', margin: 0 }}>Headline Variations</h2>
            <span style={{ fontSize: 12, color: '#888' }}>Pick one and paste into LinkedIn</span>
          </div>
          {profile.headline_variations?.map((h, i) => (
            <div key={i} style={{ background: '#F0F7FF', borderRadius: 10, padding: '16px 18px', marginBottom: 10, border: '1px solid #BFDBFE' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#191919', lineHeight: 1.5 }}>{h.text}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0A66C2', background: '#E8F0FE', padding: '2px 8px', borderRadius: 4 }}>{h.style}</span>
                    {h.best_for && <span style={{ fontSize: 11, color: '#666' }}>Best for: {h.best_for}</span>}
                  </div>
                </div>
                <CopyButton text={h.text} />
              </div>
            </div>
          ))}
          <div style={{ background: '#FEF9F0', borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
              <strong>How to paste:</strong> LinkedIn → Profile → Edit Intro → Headline field → Paste → Save
            </p>
          </div>
        </div>

        {/* Section 2: About */}
        <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', margin: 0 }}>About Section</h2>
            <CopyButton text={profile.about || ''} />
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '18px 20px', lineHeight: 1.7, fontSize: 14, color: '#333', whiteSpace: 'pre-wrap' }}>
            {profile.about}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 12, color: '#888' }}>
            <span>{(profile.about || '').split(/\s+/).length} words</span>
            <span>&bull;</span>
            <span>Recommended: 250-400 words</span>
          </div>
          <div style={{ background: '#FEF9F0', borderRadius: 8, padding: '10px 14px', marginTop: 8 }}>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
              <strong>How to paste:</strong> LinkedIn → Profile → About → Edit (pencil icon) → Paste → Save
            </p>
          </div>
        </div>

        {/* Section 3: Experience */}
        {profile.experience?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', margin: '0 0 16px' }}>Experience Bullets</h2>
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
                  <div style={{ fontSize: 12, color: '#0A66C2', marginTop: 8, fontStyle: 'italic' }}>AI improvements: {exp.changes_made}</div>
                )}
              </div>
            ))}
            <div style={{ background: '#FEF9F0', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
                <strong>How to add:</strong> LinkedIn → Profile → Experience → Add position → Fill role/company → Paste bullets in Description
              </p>
            </div>
          </div>
        )}

        {/* Section 4: Skills */}
        <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', margin: 0 }}>Recommended Skills</h2>
            <CopyButton text={allSkillsText} />
          </div>
          {profile.skills?.technical?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Technical</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {profile.skills.technical.map((s, i) => (
                  <span key={i} style={{ background: '#E8F0FE', color: '#0A66C2', padding: '4px 12px', borderRadius: 16, fontSize: 13, fontWeight: 500 }}>{s}</span>
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
          <div style={{ background: '#FEF9F0', borderRadius: 8, padding: '10px 14px', marginTop: 14 }}>
            <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
              <strong>How to add:</strong> LinkedIn → Profile → Skills → Add skill → Search and add each skill. Top 3 skills appear on your profile card.
            </p>
          </div>
        </div>

        {/* Copy Full Profile */}
        <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', margin: 0 }}>Copy Full Profile</h2>
            <CopyButton text={fullProfileText} />
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Copies your entire generated profile as plain text — headline, about, experience, and skills in one go.</p>
        </div>

        {/* Connection Request Templates */}
        <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', margin: '0 0 16px' }}>Connection Request Templates</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Copy-paste these when sending connection requests on LinkedIn</p>
          {connTemplates.map((t, i) => (
            <div key={i} style={{ background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', marginBottom: i < 2 ? 10 : 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0A66C2', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{t.text}</div>
              </div>
              <CopyButton text={t.text} />
            </div>
          ))}
        </div>

        {/* Section 5: Setup Guide */}
        <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', margin: '0 0 4px' }}>LinkedIn Setup Guide</h2>
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#0A66C2', marginBottom: 2 }}>MENU PATH</div>
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

        {/* Section 6: Resume Builder (plus/pro only) */}
        {(plan === 'plus' || plan === 'pro') && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderLeft: '4px solid #0A66C2', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1E40AF', marginBottom: 8 }}>ATS Resume Builder</h3>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6, marginBottom: 12 }}>
              Your LinkedIn profile is ready. Now build a matching ATS-optimized resume using the same data.
            </p>
            <a href={`/resume?orderId=${orderId}&source=build`} style={{ display: 'inline-block', background: '#0A66C2', color: 'white', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Build My Resume &rarr;
            </a>
            <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
              {plan === 'pro' ? '3 resumes + 3 cover letters + all 23 templates' : '1 resume + 1 cover letter + 15 templates'} included in your plan
            </p>
          </div>
        )}

        {/* Upgrade CTA for starter */}
        {plan === 'starter' && (
          <div style={{ background: 'linear-gradient(135deg, #004182, #0A66C2)', borderRadius: 14, padding: '24px 28px', marginBottom: 16, textAlign: 'center' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>Want an ATS Resume too?</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: '0 0 14px' }}>
              Upgrade to get resume + cover letter built from your LinkedIn profile data.
            </p>
            <a href="/build#pricing" style={{ display: 'inline-block', background: 'white', color: '#0A66C2', padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              See Plans &rarr;
            </a>
          </div>
        )}

        {/* Feedback */}
        <div style={{ background: 'white', borderRadius: 14, padding: '24px 28px', marginBottom: 16, border: '1px solid #E0E0E0', textAlign: 'center' }}>
          {!feedbackSent ? (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 12px' }}>How was your experience?</h3>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRating(n)} style={{ width: 40, height: 40, borderRadius: '50%', border: rating >= n ? '2px solid #0A66C2' : '1px solid #E0E0E0', background: rating >= n ? '#E8F0FE' : 'white', fontSize: 16, cursor: 'pointer' }}>{n}</button>
                ))}
              </div>
              {rating > 0 && (
                <>
                  <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Any feedback? (optional)" rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                  <button onClick={submitFeedback} style={{ padding: '8px 20px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Submit</button>
                </>
              )}
            </>
          ) : (
            <p style={{ fontSize: 15, fontWeight: 600, color: '#057642', margin: 0 }}>Thank you for your feedback!</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: 12, color: '#999' }}>Results emailed to {data.email} &bull; Bookmark this page for future reference</p>
        </div>
      </div>
    </main>
  );
}

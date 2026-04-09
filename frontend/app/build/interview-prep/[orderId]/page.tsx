'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SaasMarketingHeader } from '../../../../components/saas/SaasMarketingHeader';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface CompanyPrep {
  company_name: string;
  role: string;
  technical_questions: Array<{ question: string; answer: string; difficulty: string; topic: string }>;
  project_questions: Array<{ question: string; answer: string }>;
  hr_questions: Array<{ question: string; answer: string; tip: string }>;
  tell_me_about_yourself: string;
  why_should_we_hire_you: string;
  company_tips: { expected_ctc: string; interview_process: string; common_mistakes: string; culture_fit: string };
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ padding: '4px 12px', background: copied ? '#057642' : '#E8F0FE', color: copied ? 'white' : '#0A66C2', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

const POPULAR_COMPANIES = [
  'TCS', 'Infosys', 'Wipro', 'HCLTech', 'Tech Mahindra', 'Cognizant', 'Accenture', 'Capgemini',
  'Amazon', 'Google', 'Microsoft', 'Flipkart', 'Zoho', 'Freshworks',
  'Deloitte', 'EY', 'KPMG', 'PwC',
  'Goldman Sachs', 'JP Morgan', 'ICICI Bank', 'HDFC Bank',
  'Hindustan Unilever', 'ITC', 'Tata Motors', 'L&T', 'Reliance',
  'Swiggy', 'Zomato', 'PhonePe', 'Razorpay', 'CRED', 'Meesho',
  'Samsung', 'Intel', 'Qualcomm',
];

export default function CompanyInterviewPrepPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [companies, setCompanies] = useState<string[]>(POPULAR_COMPANIES);
  const [existingPreps, setExistingPreps] = useState<Array<{ id: string; company_name: string; created_at: string }>>([]);
  const [slotsUsed, setSlotsUsed] = useState(0);
  const [maxSlots, setMaxSlots] = useState(5);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [noJd, setNoJd] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activePrepId, setActivePrepId] = useState<string | null>(null);
  const [activePrepData, setActivePrepData] = useState<CompanyPrep | null>(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'technical' | 'project' | 'hr' | 'tmay' | 'tips'>('technical');

  const fetchPreps = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/build/${orderId}/company-preps`);
      if (res.ok) {
        const data = await res.json();
        setExistingPreps(data.preps || []);
        setSlotsUsed(data.slots_used || 0);
        setMaxSlots(data.max_slots || 5);
      }
    } catch {}
  }, [orderId]);

  useEffect(() => { fetchPreps(); }, [fetchPreps]);

  async function handleGenerate() {
    const company = selectedCompany || customCompany.trim();
    if (!company) { setError('Please select or type a company name'); return; }
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/build/${orderId}/company-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: company, job_description: noJd ? null : jobDescription.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to generate. Try again.'); return; }
      setActivePrepData(data.prep);
      setSlotsUsed(data.slots_used);
      setMaxSlots(data.max_slots);
      setActiveTab('technical');
      setExpandedQ(null);
      fetchPreps();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function loadPrep(prepId: string) {
    setLoadingPrep(true);
    try {
      const res = await fetch(`${API_URL}/api/build/company-prep/${prepId}`);
      if (res.ok) {
        const data = await res.json();
        setActivePrepData(typeof data.prep_data === 'string' ? JSON.parse(data.prep_data) : data.prep_data);
        setActivePrepId(prepId);
        setActiveTab('technical');
        setExpandedQ(null);
      }
    } catch {} finally { setLoadingPrep(false); }
  }

  const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 12, border: '1px solid #E0E0E0', padding: '20px 24px', marginBottom: 16 };

  return (
    <div className="saas-app-canvas" style={{ minHeight: '100vh' }}>
      <SaasMarketingHeader />
      <div style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)', padding: '10px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <a href={`/build/results/${orderId}`} style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>&larr; Back to build results</a>
        </div>
      </div>
      <main style={{ fontFamily: "'Inter', system-ui, sans-serif", padding: '20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Title */}
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#191919', margin: '0 0 4px' }}>Company Interview Prep</h1>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 20px' }}>
          Select a company visiting your campus. AI generates 15 tailored questions + answers + tips.
        </p>

        {/* Slot tracker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E5E7EB' }}>
            <div style={{ width: `${(slotsUsed / maxSlots) * 100}%`, height: '100%', borderRadius: 3, background: slotsUsed >= maxSlots ? '#CC1016' : '#057642', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: slotsUsed >= maxSlots ? '#CC1016' : '#057642' }}>{slotsUsed}/{maxSlots} used</span>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* LEFT — Company selector + generate */}
          <div style={{ flex: '1 1 340px', minWidth: 0 }}>
            {/* Existing preps */}
            {existingPreps.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191919', margin: '0 0 12px' }}>Your Interview Preps ({existingPreps.length})</h3>
                {existingPreps.map((p) => (
                  <button key={p.id} onClick={() => loadPrep(p.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', background: activePrepId === p.id ? '#EFF6FF' : '#F9FAFB', border: activePrepId === p.id ? '2px solid #0B69C7' : '1px solid #E5E7EB', borderRadius: 8, marginBottom: 6, cursor: 'pointer', textAlign: 'left' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{p.company_name}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{new Date(p.created_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}

            {/* New prep form */}
            {slotsUsed < maxSlots ? (
              <div style={cardStyle}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#191919', margin: '0 0 12px' }}>Prepare for a New Company</h3>

                {/* Popular companies grid */}
                <div style={{ fontSize: 12, fontWeight: 600, color: '#666', marginBottom: 8 }}>Popular campus recruiters:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {companies.slice(0, 20).map(c => (
                    <button key={c} onClick={() => { setSelectedCompany(c); setCustomCompany(''); }}
                      style={{ padding: '5px 12px', borderRadius: 16, border: selectedCompany === c ? '2px solid #0B69C7' : '1px solid #D1D5DB', background: selectedCompany === c ? '#EFF6FF' : 'white', fontSize: 12, cursor: 'pointer', color: '#191919', fontWeight: selectedCompany === c ? 600 : 400 }}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* Custom company input */}
                <div style={{ marginBottom: 12 }}>
                  <input value={customCompany} onChange={e => { setCustomCompany(e.target.value); setSelectedCompany(''); }}
                    placeholder="Or type any company name..."
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>

                {/* JD input (optional) */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <input type="checkbox" checked={noJd} onChange={e => setNoJd(e.target.checked)} id="noJd" />
                    <label htmlFor="noJd" style={{ fontSize: 13, color: '#666' }}>No specific JD — generate general prep</label>
                  </div>
                  {!noJd && (
                    <textarea value={jobDescription} onChange={e => setJobDescription(e.target.value)}
                      placeholder="Paste the job description for more targeted questions..."
                      rows={4} style={{ width: '100%', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  )}
                </div>

                {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 13, color: '#CC1016' }}>{error}</div>}

                <button onClick={handleGenerate} disabled={generating || (!selectedCompany && !customCompany.trim())}
                  style={{ width: '100%', padding: '14px', background: generating || (!selectedCompany && !customCompany.trim()) ? '#D1D5DB' : '#057642', color: 'white', border: 'none', borderRadius: 50, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  {generating ? 'Generating 15 questions... (30-60 seconds)' : `Generate Interview Prep${selectedCompany ? ` for ${selectedCompany}` : customCompany.trim() ? ` for ${customCompany.trim()}` : ''}`}
                </button>
              </div>
            ) : (
              <div style={{ ...cardStyle, background: '#FEF2F2', borderLeft: '4px solid #CC1016' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#CC1016', margin: '0 0 6px' }}>All {maxSlots} slots used</h3>
                <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px' }}>Upgrade to Student Pro for 10 company prep slots.</p>
                <a href="/?tab=student&plan=student_pro" style={{ display: 'inline-block', padding: '8px 20px', background: '#0B69C7', color: 'white', borderRadius: 50, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>Upgrade to Pro</a>
              </div>
            )}
          </div>

          {/* RIGHT — Prep results */}
          <div style={{ flex: '1 1 600px', minWidth: 0 }}>
            {loadingPrep && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
                <div style={{ width: 40, height: 40, border: '4px solid #E0E0E0', borderTopColor: '#0B69C7', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: 14, color: '#666' }}>Loading prep...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {generating && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
                <div style={{ width: 40, height: 40, border: '4px solid #E0E0E0', borderTopColor: '#057642', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: '#191919' }}>Generating interview prep for {selectedCompany || customCompany}...</p>
                <p style={{ fontSize: 13, color: '#666' }}>AI is researching this company and creating 15 tailored questions. This takes 30-60 seconds.</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {activePrepData && !generating && !loadingPrep && (
              <>
                {/* Company header */}
                <div style={{ background: 'linear-gradient(135deg, #004182, #0B69C7)', borderRadius: 12, padding: '20px 24px', color: 'white', marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{activePrepData.company_name}</div>
                  <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>Interview Prep for {activePrepData.role} &mdash; 15 Questions</div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto' }}>
                  {([
                    { key: 'technical', label: `Technical (${activePrepData.technical_questions?.length || 0})` },
                    { key: 'project', label: `Project (${activePrepData.project_questions?.length || 0})` },
                    { key: 'hr', label: `HR (${activePrepData.hr_questions?.length || 0})` },
                    { key: 'tmay', label: 'TMAY + Why Hire' },
                    { key: 'tips', label: 'Company Tips' },
                  ] as const).map(t => (
                    <button key={t.key} onClick={() => { setActiveTab(t.key); setExpandedQ(null); }}
                      style={{ padding: '8px 16px', borderRadius: 20, border: activeTab === t.key ? '2px solid #0B69C7' : '1px solid #D1D5DB', background: activeTab === t.key ? '#EFF6FF' : 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeTab === t.key ? '#0B69C7' : '#666', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Technical questions */}
                {activeTab === 'technical' && activePrepData.technical_questions?.map((q, i) => (
                  <div key={i} style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: q.difficulty === 'hard' ? '#CC1016' : q.difficulty === 'medium' ? '#F59E0B' : '#057642', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>{q.question}</div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: q.difficulty === 'hard' ? '#FEF2F2' : q.difficulty === 'medium' ? '#FFFBEB' : '#F0FDF4', color: q.difficulty === 'hard' ? '#CC1016' : q.difficulty === 'medium' ? '#92400E' : '#057642' }}>{q.difficulty}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: '#EFF6FF', color: '#0B69C7' }}>{q.topic}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, color: '#888' }}>{expandedQ === i ? '\u25B2' : '\u25BC'}</span>
                    </div>
                    {expandedQ === i && (
                      <div style={{ marginTop: 12, padding: '14px', background: '#F0FDF4', borderRadius: 8, fontSize: 14, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {q.answer}
                        <div style={{ marginTop: 8, textAlign: 'right' }}><CopyBtn text={`Q: ${q.question}\nA: ${q.answer}`} /></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Project questions */}
                {activeTab === 'project' && activePrepData.project_questions?.map((q, i) => (
                  <div key={i} style={cardStyle} onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#7C3AED', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#191919' }}>{q.question}</div>
                      <span style={{ fontSize: 14, color: '#888' }}>{expandedQ === i ? '\u25B2' : '\u25BC'}</span>
                    </div>
                    {expandedQ === i && (
                      <div style={{ marginTop: 12, padding: '14px', background: '#F5F3FF', borderRadius: 8, fontSize: 14, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {q.answer}
                        <div style={{ marginTop: 8, textAlign: 'right' }}><CopyBtn text={`Q: ${q.question}\nA: ${q.answer}`} /></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* HR questions */}
                {activeTab === 'hr' && activePrepData.hr_questions?.map((q, i) => (
                  <div key={i} style={cardStyle} onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#E16B00', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#191919' }}>{q.question}</div>
                      <span style={{ fontSize: 14, color: '#888' }}>{expandedQ === i ? '\u25B2' : '\u25BC'}</span>
                    </div>
                    {expandedQ === i && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ padding: '14px', background: '#FFF7ED', borderRadius: 8, fontSize: 14, color: '#333', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.answer}</div>
                        {q.tip && (
                          <div style={{ padding: '8px 12px', background: '#FFFBEB', borderRadius: 8, marginTop: 6, fontSize: 12, color: '#92400E' }}><strong>Tip:</strong> {q.tip}</div>
                        )}
                        <div style={{ marginTop: 8, textAlign: 'right' }}><CopyBtn text={`Q: ${q.question}\nA: ${q.answer}`} /></div>
                      </div>
                    )}
                  </div>
                ))}

                {/* TMAY + Why Hire */}
                {activeTab === 'tmay' && (
                  <>
                    <div style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: 0 }}>&ldquo;Tell Me About Yourself&rdquo; &mdash; for {activePrepData.company_name}</h3>
                        <CopyBtn text={activePrepData.tell_me_about_yourself} />
                      </div>
                      <div style={{ background: '#F0F7FF', borderRadius: 10, padding: '16px 18px', fontSize: 14, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {activePrepData.tell_me_about_yourself}
                      </div>
                    </div>
                    <div style={cardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: 0 }}>&ldquo;Why Should We Hire You?&rdquo; &mdash; for {activePrepData.company_name}</h3>
                        <CopyBtn text={activePrepData.why_should_we_hire_you} />
                      </div>
                      <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '16px 18px', fontSize: 14, color: '#333', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                        {activePrepData.why_should_we_hire_you}
                      </div>
                    </div>
                  </>
                )}

                {/* Company Tips */}
                {activeTab === 'tips' && activePrepData.company_tips && (
                  <div style={cardStyle}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: '0 0 16px' }}>{activePrepData.company_name} — Placement Tips</h3>
                    {[
                      { label: 'Expected CTC (Fresher)', value: activePrepData.company_tips.expected_ctc, icon: '\uD83D\uDCB0', bg: '#F0FDF4', color: '#057642' },
                      { label: 'Interview Process', value: activePrepData.company_tips.interview_process, icon: '\uD83D\uDCCB', bg: '#EFF6FF', color: '#0B69C7' },
                      { label: 'Common Mistakes', value: activePrepData.company_tips.common_mistakes, icon: '\u26A0\uFE0F', bg: '#FEF2F2', color: '#CC1016' },
                      { label: 'Culture Fit', value: activePrepData.company_tips.culture_fit, icon: '\uD83C\uDFAF', bg: '#F5F3FF', color: '#7C3AED' },
                    ].map((tip, i) => (
                      <div key={i} style={{ background: tip.bg, borderRadius: 10, padding: '14px 16px', marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: tip.color, marginBottom: 4 }}>{tip.icon} {tip.label}</div>
                        <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6 }}>{tip.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!activePrepData && !generating && !loadingPrep && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{'\uD83C\uDFAF'}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#191919', margin: '0 0 8px' }}>Select a Company to Start</h3>
                <p style={{ fontSize: 14, color: '#666', margin: 0 }}>Pick a company from the list or type any company name. AI will generate 15 tailored interview questions with answers.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

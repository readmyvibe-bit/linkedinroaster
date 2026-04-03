'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───
interface CompanyBrief {
  what_jd_emphasizes: string[];
  interview_style: string;
  what_they_value: string[];
  red_flags: string[];
}

interface Question {
  id: number;
  category: string;
  question: string;
  why_they_ask: string;
  suggested_answer: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  common_mistakes: string[];
  follow_ups: string[];
}

interface AskThem {
  question: string;
  why_it_matters: string;
}

interface PowerStory {
  title: string;
  hook: string;
  jd_theme: string;
}

interface CheatSheet {
  key_numbers: string[];
  power_stories: PowerStory[];
  jd_keywords: string[];
  avoid_phrases: { avoid: string; use_instead: string }[];
}

interface MCQ {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  jd_link: string;
}

interface PrepData {
  company_brief: CompanyBrief;
  questions: Question[];
  ask_them: AskThem[];
  cheat_sheet: CheatSheet;
  mcq: MCQ[];
}

interface PrepResponse {
  id: string;
  status: string;
  prep_data: PrepData | null;
  career_stage: string;
  target_role: string;
  target_company: string;
  resume_id: string;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// ─── Loading stages ───
const LOADING_STAGES = [
  'Analyzing job description...',
  'Generating questions...',
  'Building cheat sheet...',
];

// ─── Category colors ───
const CATEGORY_COLORS: Record<string, string> = {
  behavioral: '#0A66C2',
  role_specific: '#057642',
  situational: '#7C3AED',
  culture: '#E67E22',
};

const CATEGORY_LABELS: Record<string, string> = {
  behavioral: 'Behavioral',
  role_specific: 'Role-Specific',
  situational: 'Situational',
  culture: 'Culture',
};

// ─── STAR colors ───
const STAR_COLORS: Record<string, string> = {
  S: '#0A66C2',
  T: '#057642',
  A: '#7C3AED',
  R: '#E67E22',
};

export default function InterviewPrepPage() {
  const params = useParams();
  const prepId = params.prepId as string;

  const [prep, setPrep] = useState<PrepResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState('questions');
  // Question filter
  const [questionFilter, setQuestionFilter] = useState('all');
  // Expanded questions
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizRevealed, setQuizRevealed] = useState<Set<number>>(new Set());
  const [quizComplete, setQuizComplete] = useState(false);

  const fetchPrep = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/interview-prep/${prepId}`);
      if (!res.ok) throw new Error('Not found');
      const data: PrepResponse = await res.json();
      setPrep(data);
      if (data.status === 'ready' || data.status === 'failed') {
        setLoading(false);
      }
      if (data.status === 'failed') {
        setError(data.error_message || 'Generation failed. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Interview prep not found');
      setLoading(false);
    }
  }, [prepId]);

  // Poll while loading
  useEffect(() => {
    fetchPrep();
    const interval = setInterval(() => {
      if (loading) fetchPrep();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchPrep, loading]);

  // Cycle loading stages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStage(s => (s + 1) % LOADING_STAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loading]);

  function toggleExpand(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleQuizAnswer(mcqIndex: number, optionIndex: number) {
    if (quizRevealed.has(mcqIndex)) return;
    setQuizAnswers(prev => ({ ...prev, [mcqIndex]: optionIndex }));
    setQuizRevealed(prev => new Set(prev).add(mcqIndex));
  }

  function handleQuizNext() {
    const mcqs = prep?.prep_data?.mcq || [];
    if (quizIndex < mcqs.length - 1) {
      setQuizIndex(quizIndex + 1);
    } else {
      setQuizComplete(true);
    }
  }

  // ─── Loading State ───
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{
            width: 48, height: 48, border: '4px solid #E0E0E0', borderTopColor: '#0A66C2',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px',
          }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>Preparing Your Interview Kit</div>
          <div style={{ fontSize: 14, color: '#0A66C2', fontWeight: 600, marginBottom: 8 }}>{LOADING_STAGES[loadingStage]}</div>
          <div style={{ fontSize: 12, color: '#888' }}>This takes 30-60 seconds</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !prep?.prep_data) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', background: '#fff', borderRadius: 12, padding: '40px 32px', border: '1px solid #E0E0E0', maxWidth: 400 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#CC1016', marginBottom: 8 }}>Something went wrong</div>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>{error || 'Failed to generate interview prep.'}</div>
          <button onClick={() => { if (prep?.resume_id) window.location.href = `/resume/${prep.resume_id}`; else window.history.back(); }} style={{
            padding: '10px 24px', background: '#0A66C2', color: '#fff', border: 'none',
            borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>Go Back</button>
        </div>
      </div>
    );
  }

  const data = prep.prep_data;
  const questions = data.questions || [];
  const filteredQuestions = questionFilter === 'all'
    ? questions
    : questions.filter(q => q.category === questionFilter);
  const mcqs = data.mcq || [];
  const quizScore = Object.entries(quizAnswers).filter(
    ([idx, ans]) => mcqs[Number(idx)]?.correct === ans
  ).length;

  const hasAskThem = (data.ask_them || []).length > 0;
  const hasCheatSheet = data.cheat_sheet && (
    (data.cheat_sheet.key_numbers?.length > 0) ||
    (data.cheat_sheet.power_stories?.length > 0) ||
    (data.cheat_sheet.jd_keywords?.length > 0) ||
    (data.cheat_sheet.avoid_phrases?.length > 0)
  );
  const hasMcqs = mcqs.length > 0;

  const tabs = [
    { id: 'brief', label: 'Company Brief' },
    { id: 'questions', label: `Questions (${questions.length})` },
    { id: 'ask_them', label: 'Your Questions' },
    { id: 'cheat_sheet', label: 'Cheat Sheet' },
    { id: 'quiz', label: 'Quiz' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F3F2EF' }}>
      {/* ─── HEADER ─── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E0E0E0', padding: '12px 16px',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#004182' }}>Interview Prep</div>
            {prep.target_role && (
              <div style={{ fontSize: 12, color: '#666' }}>
                {prep.target_role}{prep.target_company ? ` at ${prep.target_company}` : ''}
                {prep.career_stage && <span style={{ marginLeft: 8, background: '#F0F7FF', color: '#0A66C2', padding: '1px 8px', borderRadius: 10, fontSize: 11 }}>{prep.career_stage}</span>}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()} style={{
              padding: '6px 14px', background: '#F3F2EF', color: '#666', border: '1px solid #D0D0D0',
              borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Print / PDF</button>
            <button onClick={() => { if (prep?.resume_id) window.location.href = `/resume/${prep.resume_id}`; else window.history.back(); }} style={{
              padding: '6px 14px', background: '#fff', color: '#666', border: '1px solid #ccc',
              borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>Back</button>
          </div>
        </div>
      </div>

      {/* ─── TABS ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E0E0E0', padding: '0 16px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 0 }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: 'none', borderBottom: activeTab === tab.id ? '3px solid #0B69C7' : '3px solid transparent',
                background: 'none', color: activeTab === tab.id ? '#0B69C7' : '#666',
                whiteSpace: 'nowrap',
              }}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* ─── TAB CONTENT ─── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 60px' }}>

        {/* TAB: Company Brief */}
        {activeTab === 'brief' && data.company_brief && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Interview Style */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 8 }}>Interview Style</div>
              <span style={{
                display: 'inline-block', padding: '4px 14px', background: '#E8F0FE', color: '#0A66C2',
                borderRadius: 20, fontSize: 13, fontWeight: 600,
              }}>{data.company_brief.interview_style}</span>
            </div>

            {/* What JD Emphasizes */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>What the JD Emphasizes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.company_brief.what_jd_emphasizes.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#057642', fontWeight: 700, flexShrink: 0 }}>&#8226;</span>
                    <span style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What They Value */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>What They Value</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.company_brief.what_they_value.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#0A66C2', fontWeight: 700, flexShrink: 0 }}>&#8226;</span>
                    <span style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Red Flags */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#CC1016', marginBottom: 12 }}>Red Flags They Screen For</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.company_brief.red_flags.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#CC1016', fontWeight: 700, flexShrink: 0 }}>&#8226;</span>
                    <span style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: Questions */}
        {activeTab === 'questions' && (
          <div>
            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'behavioral', label: 'Behavioral' },
                { id: 'role_specific', label: 'Role-Specific' },
                { id: 'situational', label: 'Situational' },
                { id: 'culture', label: 'Culture' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setQuestionFilter(f.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', border: 'none',
                    background: questionFilter === f.id ? '#0B69C7' : '#fff',
                    color: questionFilter === f.id ? '#fff' : '#666',
                    boxShadow: questionFilter === f.id ? 'none' : '0 0 0 1px #D0D0D0',
                  }}
                >{f.label}</button>
              ))}
            </div>

            {/* Question Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredQuestions.map((q) => {
                const isExpanded = expandedIds.has(q.id);
                const catColor = CATEGORY_COLORS[q.category] || '#666';
                return (
                  <div key={q.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E0E0E0', overflow: 'hidden' }}>
                    {/* Header — always visible */}
                    <button
                      onClick={() => toggleExpand(q.id)}
                      style={{
                        width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', gap: 12, background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <span style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 700, color: catColor,
                          background: `${catColor}15`, padding: '2px 8px', borderRadius: 10, marginBottom: 6,
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{CATEGORY_LABELS[q.category] || q.category}</span>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.5 }}>{q.question}</div>
                      </div>
                      <span style={{ fontSize: 18, color: '#999', flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        &#9660;
                      </span>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F0F0F0' }}>
                        {/* Why They Ask */}
                        <div style={{ marginTop: 16, marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 4, textTransform: 'uppercase' }}>Why They Ask</div>
                          <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{q.why_they_ask}</div>
                        </div>

                        {/* STAR Answer */}
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8, textTransform: 'uppercase' }}>Suggested Answer (STAR)</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(['S', 'T', 'A', 'R'] as const).map((letter) => {
                              const key = { S: 'situation', T: 'task', A: 'action', R: 'result' }[letter] as keyof typeof q.suggested_answer;
                              const label = { S: 'Situation', T: 'Task', A: 'Action', R: 'Result' }[letter];
                              return (
                                <div key={letter} style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden' }}>
                                  <div style={{
                                    width: 4, background: STAR_COLORS[letter], flexShrink: 0,
                                  }} />
                                  <div style={{ padding: '8px 12px', background: '#FAFAFA', flex: 1 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: STAR_COLORS[letter] }}>{label}</span>
                                    <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, marginTop: 2 }}>{q.suggested_answer[key]}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Common Mistakes */}
                        {q.common_mistakes?.length > 0 && (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#CC1016', marginBottom: 4, textTransform: 'uppercase' }}>Common Mistakes</div>
                            {q.common_mistakes.map((m, i) => (
                              <div key={i} style={{ fontSize: 13, color: '#555', lineHeight: 1.5, paddingLeft: 12 }}>&#8226; {m}</div>
                            ))}
                          </div>
                        )}

                        {/* Follow-ups */}
                        {q.follow_ups?.length > 0 && (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#0A66C2', marginBottom: 4, textTransform: 'uppercase' }}>Likely Follow-ups</div>
                            {q.follow_ups.map((f, i) => (
                              <div key={i} style={{ fontSize: 13, color: '#555', lineHeight: 1.5, paddingLeft: 12 }}>&#8226; {f}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: Ask Them */}
        {activeTab === 'ask_them' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Smart questions to ask at the end of your interview — shows you{"'"}re prepared and thoughtful:</div>
            {(!data.ask_them || data.ask_them.length === 0) && (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>No questions generated for this prep. Try generating a new interview prep with a specific job description for better results.</p>
              </div>
            )}
            {(data.ask_them || []).map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>{item.question}</div>
                <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, background: '#F9FAFB', padding: '8px 12px', borderRadius: 8 }}>
                  <span style={{ fontWeight: 600, color: '#0A66C2' }}>Why it matters: </span>{item.why_it_matters}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: Cheat Sheet */}
        {activeTab === 'cheat_sheet' && data.cheat_sheet && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Key Numbers */}
            {data.cheat_sheet.key_numbers?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>Key Numbers to Remember</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.cheat_sheet.key_numbers.map((num, i) => (
                    <div key={i} style={{ fontSize: 14, fontWeight: 700, color: '#057642', lineHeight: 1.5 }}>
                      &#8226; {num}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Power Stories */}
            {data.cheat_sheet.power_stories?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>Power Stories</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.cheat_sheet.power_stories.map((story, i) => (
                    <div key={i} style={{ background: '#F9FAFB', borderRadius: 8, padding: 14, borderLeft: '4px solid #0A66C2' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>{story.title}</div>
                      <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 6 }}>{story.hook}</div>
                      <span style={{
                        display: 'inline-block', fontSize: 11, color: '#0A66C2', background: '#E8F0FE',
                        padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                      }}>JD Theme: {story.jd_theme}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* JD Keywords */}
            {data.cheat_sheet.jd_keywords?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>JD Keywords to Use</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {data.cheat_sheet.jd_keywords.map((kw, i) => (
                    <span key={i} style={{
                      display: 'inline-block', padding: '4px 12px', background: '#E8F0FE',
                      color: '#0A66C2', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Avoid / Use Instead */}
            {data.cheat_sheet.avoid_phrases?.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 12 }}>Avoid / Use Instead</div>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F3F4F6' }}>
                    <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#CC1016' }}>Avoid</div>
                    <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, color: '#057642' }}>Use Instead</div>
                  </div>
                  {data.cheat_sheet.avoid_phrases.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid #E5E7EB' }}>
                      <div style={{ padding: '8px 12px', fontSize: 13, color: '#CC1016' }}>{item.avoid}</div>
                      <div style={{ padding: '8px 12px', fontSize: 13, color: '#057642' }}>{item.use_instead}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: Quiz */}
        {activeTab === 'quiz' && (
          <div>
            {mcqs.length === 0 ? (
              <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#92400E', margin: 0 }}>No quiz questions generated for this prep. Try generating a new interview prep with a specific job description for better results.</p>
              </div>
            ) : quizComplete ? (
              /* Final Score */
              <div style={{ background: '#fff', borderRadius: 12, padding: 32, border: '1px solid #E0E0E0', textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 800, color: quizScore >= 7 ? '#057642' : quizScore >= 5 ? '#E67E22' : '#CC1016', marginBottom: 8 }}>
                  {quizScore}/{mcqs.length}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#333', marginBottom: 8 }}>
                  {quizScore >= 8 ? 'Excellent! You know this role inside out.' :
                   quizScore >= 6 ? 'Good job! Review the ones you missed.' :
                   quizScore >= 4 ? 'Not bad. Go through the cheat sheet again.' :
                   'Time to study! Review the company brief and questions.'}
                </div>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                  You got {quizScore} out of {mcqs.length} questions correct.
                </div>
                <button
                  onClick={() => { setQuizIndex(0); setQuizAnswers({}); setQuizRevealed(new Set()); setQuizComplete(false); }}
                  style={{
                    padding: '10px 24px', background: '#0A66C2', color: '#fff', border: 'none',
                    borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >Retry Quiz</button>
              </div>
            ) : mcqs.length > 0 ? (
              /* Current Question */
              <div style={{ background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Question {quizIndex + 1} of {mcqs.length}</div>
                {/* Progress bar */}
                <div style={{ height: 4, background: '#E5E7EB', borderRadius: 2, marginBottom: 16 }}>
                  <div style={{ height: '100%', width: `${((quizIndex + 1) / mcqs.length) * 100}%`, background: '#0A66C2', borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a1a', marginBottom: 20, lineHeight: 1.5 }}>
                  {mcqs[quizIndex].question}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {mcqs[quizIndex].options.map((opt, oi) => {
                    const isRevealed = quizRevealed.has(quizIndex);
                    const isCorrect = mcqs[quizIndex].correct === oi;
                    const isSelected = quizAnswers[quizIndex] === oi;
                    let bg = '#fff';
                    let borderColor = '#D0D0D0';
                    let textColor = '#333';
                    if (isRevealed) {
                      if (isCorrect) { bg = '#DCFCE7'; borderColor = '#057642'; textColor = '#057642'; }
                      else if (isSelected) { bg = '#FEE2E2'; borderColor = '#CC1016'; textColor = '#CC1016'; }
                    }
                    return (
                      <button
                        key={oi}
                        onClick={() => handleQuizAnswer(quizIndex, oi)}
                        style={{
                          width: '100%', padding: '12px 16px', textAlign: 'left',
                          background: bg, border: `2px solid ${borderColor}`, borderRadius: 10,
                          fontSize: 14, color: textColor, cursor: isRevealed ? 'default' : 'pointer',
                          fontWeight: isSelected || (isRevealed && isCorrect) ? 600 : 400,
                          transition: 'all 0.2s',
                        }}
                      >{opt}</button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {quizRevealed.has(quizIndex) && (
                  <div style={{ background: '#F0F7FF', borderRadius: 8, padding: 14, marginBottom: 16, borderLeft: '4px solid #0A66C2' }}>
                    <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{mcqs[quizIndex].explanation}</div>
                    {mcqs[quizIndex].jd_link && (
                      <div style={{ fontSize: 12, color: '#0A66C2', marginTop: 6, fontWeight: 600 }}>JD Link: {mcqs[quizIndex].jd_link}</div>
                    )}
                  </div>
                )}

                {/* Next button */}
                {quizRevealed.has(quizIndex) && (
                  <button
                    onClick={handleQuizNext}
                    style={{
                      padding: '10px 24px', background: '#0A66C2', color: '#fff', border: 'none',
                      borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    }}
                  >{quizIndex < mcqs.length - 1 ? 'Next Question' : 'See Results'}</button>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>No quiz questions available.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

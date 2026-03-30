'use client';

import React, { useState, useEffect, useRef, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── ErrorBoundary — catches React render errors in children ───
class SafeRender extends Component<
  { name: string; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { name: string; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SafeRender] ${this.props.name} crashed:`, error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Types ───
interface ScoreBreakdown {
  headline: number;
  about: number;
  experience: number;
  completeness: number;
  ats?: number;
  overall: number;
}

interface RoastPoint {
  point_number: number;
  section_targeted: string;
  roast: string;
  underlying_issue: string;
  humor_mechanism: string;
}

interface RewrittenExperience {
  title: string;
  company: string;
  bullets: string[];
  changes_made: string;
}

interface HeadlineVariation {
  headline: string;
  style: string;
  best_for: string;
}

interface HiddenStrength {
  strength: string;
  evidence: string;
  why_valuable: string;
  how_to_show_it: string;
}

interface OrderResults {
  order_id: string;
  status: string;
  plan: string;
  results: {
    scores: { before: ScoreBreakdown; after: ScoreBreakdown };
    analysis?: {
      ats_intelligence?: {
        top_searched_keywords: string[];
        keywords_present: string[];
        keywords_missing: string[];
        critical_missing: string[];
      };
      weak_verbs_found?: Array<{ verb: string; location: string; suggested_replacement: string }>;
      quantification_breakdown?: { total_bullets: number; quantified_bullets: number; percentage: number; grade: string };
    };
    roast: {
      roast_title: string;
      roast_points: RoastPoint[];
      closing_compliment: string;
      overall_verdict: string;
      linkedin_caption: string;
      hidden_strengths?: HiddenStrength[];
    };
    rewrite: {
      rewritten_headline: string;
      headline_rationale: string;
      rewritten_about: string;
      about_changes: string;
      rewritten_experience: RewrittenExperience[];
      suggested_skills: Array<{ skill: string; reason: string }>;
      placeholders_to_fill: Array<{ location: string; placeholder: string; instruction: string }>;
      personalization_note?: string;
      linkedin_post_hook: string;
      headline_variations?: HeadlineVariation[];
      ats_keywords?: string[];
      jd_analysis?: {
        match_score: number | null;
        matched_keywords: string[];
        missing_keywords: string[];
        gap_summary: string;
        application_recommendation: string;
      };
      cover_letter?: {
        subject_line: string;
        body: string;
        personalization_notes: string;
      };
    };
    card_image_url: string | null;
  };
  referral_code: string;
  referral_url: string;
}

interface PollingResponse {
  status: string;
  progress_pct?: number;
  estimated_seconds?: number;
}

// ─── Helpers ───
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function formatBulletsForCopy(bullets: string[]): string {
  return bullets.map(b => `• ${b}`).join('\n');
}

function formatAboutForCopy(about: string): string {
  // Already has \n\n breaks from Stage 4 output
  return about;
}

function highlightPlaceholders(text: string) {
  if (!text) return text;
  return text.replace(
    /\[X\][%xX+]?/g,
    (match) => `<span style="background:#FEF3C7;color:#92400E;border-radius:3px;padding:1px 4px;font-weight:600">${match}</span>`,
  );
}

const KNOWN_POWER_VERBS = new Set([
  'generated', 'closed', 'negotiated', 'prospected', 'converted', 'exceeded', 'penetrated',
  'captured', 'expanded', 'accelerated', 'drove', 'delivered', 'secured', 'landed', 'grew',
  'spearheaded', 'sourced', 'screened', 'placed', 'headhunted', 'reduced', 'streamlined',
  'implemented', 'built', 'developed', 'transformed', 'optimized', 'led', 'recruited',
  'onboarded', 'retained', 'coached', 'architected', 'engineered', 'deployed', 'shipped',
  'automated', 'scaled', 'integrated', 'launched', 'refactored', 'designed', 'migrated',
  'increased', 'managed', 'created', 'amplified', 'executed', 'produced', 'improved',
  'boosted', 'saved', 'audited', 'forecasted', 'controlled', 'analyzed', 'reported',
  'upsold', 'resolved', 'achieved', 'maintained', 'partnered', 'championed', 'directed',
  'established', 'exceeded', 'pioneered', 'orchestrated', 'revamped', 'consolidated',
]);

function highlightPowerVerbs(html: string): string {
  if (!html || typeof html !== 'string') return html || '';
  // Match bullet lines: "• FirstWord rest..."
  return html.replace(
    /(•\s*)(\w+)/g,
    (match, bullet, firstWord) => {
      if (KNOWN_POWER_VERBS.has(firstWord.toLowerCase())) {
        return `${bullet}<span style="font-weight:800;color:#0A66C2">${firstWord}</span>`;
      }
      return match;
    },
  );
}

function highlightATSKeywords(html: string, keywords: string[]): string {
  if (!html || typeof html !== 'string') return html || '';
  if (!keywords || !keywords.length) return html;
  const highlighted = new Set<string>();
  let result = html;
  for (const kw of keywords) {
    if (highlighted.has(kw.toLowerCase())) continue;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped})\\b`, 'i');
    result = result.replace(regex, (match) => {
      highlighted.add(kw.toLowerCase());
      return `<span style="text-decoration:underline;text-decoration-color:#0A66C2;text-underline-offset:2px">${match}</span>`;
    });
  }
  return result;
}

// ─── Stage Labels ───
const STAGE_LABELS: Record<string, { label: string; emoji: string }> = {
  queued: { label: 'Getting ready...', emoji: '👋' },
  parsing: { label: 'Reading your profile...', emoji: '👀' },
  analyzing: { label: 'Finding the weak spots...', emoji: '🔬' },
  roasting: { label: 'Generating your roast...', emoji: '🔥' },
  rewriting: { label: 'Rewriting your profile...', emoji: '✍️' },
  checking: { label: 'Final quality check...', emoji: '✅' },
};
const STAGES = ['queued', 'parsing', 'analyzing', 'roasting', 'rewriting', 'checking'];

// Stage → percentage mapping (always forward)
const STAGE_PCT: Record<string, number> = {
  queued: 5,
  parsing: 20,
  analyzing: 40,
  roasting: 60,
  rewriting: 80,
  checking: 90,
};

// ═══════════════════════════════════════════
// AnimatedNumber
// ═══════════════════════════════════════════
function AnimatedNumber({
  from,
  to,
  duration,
  delay = 0,
  className,
}: {
  from: number;
  to: number;
  duration: number;
  delay?: number;
  className?: string;
}) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        setValue(Math.round(from + (to - from) * progress));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [from, to, duration, delay]);
  return <span className={className}>{value}</span>;
}

// ═══════════════════════════════════════════
// ScoreReveal
// ═══════════════════════════════════════════
function getVerdict(score: number): string {
  if (score <= 30) return 'Your profile is invisible. Recruiters scroll past in under 2 seconds.';
  if (score <= 50) return 'Decent foundation. But nothing here makes a recruiter stop scrolling.';
  if (score <= 70) return 'Solid but forgettable. You are not standing out in a crowded market.';
  if (score <= 85) return 'Strong profile. A few targeted fixes will make it exceptional.';
  return 'Already excellent. Our rewrite refines what is already working.';
}

function ScoreReveal({ before, after }: { before: ScoreBreakdown; after: ScoreBreakdown }) {
  const atsVerdict = (score: number) => {
    if (score >= 86) return { text: 'Optimized', color: '#057642' };
    if (score >= 71) return { text: 'Strong', color: '#44A340' };
    if (score >= 51) return { text: 'Moderate', color: '#B59F3B' };
    if (score >= 31) return { text: 'Weak', color: '#E16B00' };
    return { text: 'Invisible', color: '#CC1016' };
  };

  const subScores = [
    { label: 'Headline', b: before.headline, a: after.headline },
    { label: 'About', b: before.about, a: after.about },
    { label: 'Experience', b: before.experience, a: after.experience },
    { label: 'Completeness', b: before.completeness, a: after.completeness },
  ];

  return (
    <div className="li-card p-6 mb-6">
      {/* Circles */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 90,
              height: 90,
              border: '6px solid var(--li-red)',
            }}
          >
            <AnimatedNumber from={0} to={before.overall} duration={1500} className="text-2xl font-bold" />
          </div>
          <span className="text-xs font-semibold mt-2 uppercase" style={{ color: 'var(--li-red)' }}>
            Before
          </span>
        </div>

        <span className="text-2xl" style={{ color: 'var(--li-text-secondary)' }}>&rarr;</span>

        <div className="flex flex-col items-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 110,
              height: 110,
              border: '6px solid var(--li-green)',
            }}
          >
            <AnimatedNumber
              from={before.overall}
              to={after.overall}
              duration={2000}
              delay={1600}
              className="text-3xl font-bold"
            />
          </div>
          <span className="text-xs font-semibold mt-2 uppercase" style={{ color: 'var(--li-green)' }}>
            After
          </span>
        </div>
      </div>

      {/* FIX 12 — Verdict line */}
      <p className="text-sm font-bold text-center mb-6" style={{ color: 'var(--li-text-primary)' }}>
        {getVerdict(before.overall)}
      </p>

      {/* Sub-score bars */}
      <div className="space-y-3">
        {subScores.map((s) => (
          <div key={s.label} className="flex items-center gap-3 text-sm">
            <span className="w-28 text-right" style={{ color: 'var(--li-text-secondary)' }}>
              {s.label}:
            </span>
            <span style={{ color: 'var(--li-text-secondary)' }}>{s.b}</span>
            <span style={{ color: 'var(--li-text-secondary)' }}>&rarr;</span>
            <span style={{ color: 'var(--li-text-primary)' }}>{s.a}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--li-border)' }}>
              <div
                className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${s.a}%`, background: 'var(--li-blue)' }}
              />
            </div>
            <span className="font-bold text-xs" style={{ color: 'var(--li-green)' }}>
              +{s.a - s.b}
            </span>
          </div>
        ))}
      </div>

      {/* VIRAL 3 — Ranking Badge */}
      {(() => {
        const afterScore = after.overall;
        const rankLabel = afterScore >= 80 ? 'Top 10%' : afterScore >= 70 ? 'Top 20%' : afterScore >= 60 ? 'Top 35%' : afterScore >= 50 ? 'Top 50%' : 'Room to improve';
        return (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span style={{
              background: afterScore >= 70 ? '#DCFCE7' : '#FEF3C7',
              border: afterScore >= 70 ? '1px solid #057642' : '1px solid #F59E0B',
              borderRadius: 20,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: afterScore >= 70 ? '#057642' : '#92400E',
              display: 'inline-block',
              margin: '0 auto',
            }}>
              After rewrite: {rankLabel} of LinkedIn profiles
            </span>
            <p style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
              Most people score below 40. You are now in the {rankLabel}.
            </p>
          </div>
        );
      })()}

      {/* Score gap explanation */}
      <p className="text-xs leading-relaxed mt-4" style={{ color: 'var(--li-text-secondary)' }}>
        Your before score reflects your current profile. Your after score reflects what our
        rewrite achieves when you add your real numbers. The bigger the gap — the more
        opportunity your profile was hiding.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// RoastCard
// ═══════════════════════════════════════════
function RoastCard({ point, pointNumber, totalPoints }: { point: RoastPoint; pointNumber: number; totalPoints: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div style={{
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid #E0E0E0',
      background: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      marginBottom: 16,
    }}>
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, #004182, #0A66C2)',
        padding: '12px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span role="img" aria-label="fire" style={{ fontSize: 16 }}>🔥</span>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'white' }}>
            LINKEDIN ROAST
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          Point {pointNumber} / {totalPoints}
        </span>
      </div>

      {/* Section tag */}
      <div style={{ background: '#F3F2EF', padding: '10px 18px 0' }}>
        <span style={{
          display: 'inline-block',
          background: 'white',
          border: '1px solid #E0E0E0',
          borderRadius: 10,
          padding: '3px 12px',
          fontSize: 10,
          fontWeight: 700,
          color: '#666',
          letterSpacing: 1,
        }}>
          {point.section_targeted.toUpperCase()}
        </span>
      </div>

      {/* Quote body */}
      <div style={{ background: '#F3F2EF', padding: '16px 20px 12px', position: 'relative' }}>
        <span style={{
          position: 'absolute',
          top: -8,
          left: 10,
          fontSize: 72,
          fontFamily: 'Georgia, serif',
          color: 'rgba(10,102,194,0.10)',
          lineHeight: 1,
          pointerEvents: 'none',
          zIndex: 0,
        }}>
          {'\u201C'}
        </span>
        <p style={{
          fontSize: 14,
          color: '#191919',
          fontStyle: 'italic',
          lineHeight: 1.75,
          paddingLeft: 18,
          position: 'relative',
          zIndex: 1,
          margin: 0,
        }}>
          {point.roast}
        </p>
      </div>

      {/* Expandable panel */}
      {expanded && (
        <div style={{
          background: '#F3F2EF',
          padding: '12px 18px',
          borderTop: '1px solid #E0E0E0',
          fontSize: 13,
          color: '#444',
          lineHeight: 1.6,
        }}>
          {point.underlying_issue}
        </div>
      )}

      {/* Footer */}
      <div style={{
        background: 'white',
        padding: '10px 18px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #F3F2EF',
      }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            fontSize: 11,
            color: '#0A66C2',
            fontWeight: 700,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
        >
          {expanded ? '▲ Hide' : '▼ Why it matters'}
        </button>
        <button
          onClick={() => {
            copyToClipboard(`${point.roast}\n\n— AI roasted my LinkedIn profile 🔥\nGet yours: profileroaster.in`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            fontSize: 11,
            color: '#0A66C2',
            fontWeight: 700,
            border: '1px solid #0A66C2',
            borderRadius: 8,
            padding: '4px 12px',
            background: 'white',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy Roast'}
        </button>
        <span style={{ fontSize: 10, color: '#aaa' }}>profileroaster.in</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RoastSheetPreview (HTML inline preview)
// ═══════════════════════════════════════════
function RoastSheetPreview({
  roastPoints,
  scores,
  roastTitle,
}: {
  roastPoints: RoastPoint[];
  scores: { before: ScoreBreakdown; after: ScoreBreakdown };
  roastTitle: string;
}) {
  const improvement = scores.after.overall - scores.before.overall;
  const subScorePills = [
    { label: 'Headline', value: scores.before.headline, color: '#0A66C2' },
    { label: 'About', value: scores.before.about, color: '#E16B00' },
    { label: 'Experience', value: scores.before.experience, color: '#057642' },
  ];

  return (
    <div style={{
      width: '100%', maxWidth: 720, borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', background: '#F3F2EF', margin: '0 auto',
    }}>
      {/* Header */}
      <div style={{
        background: '#0A66C2', padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 16, fontWeight: 900, color: 'white', letterSpacing: 2 }}>
          LINKEDIN PROFILE ROAST REPORT
        </span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>profileroaster.in</span>
      </div>
      <div style={{ height: 3, background: '#E16B00' }} />

      {/* Score row */}
      <div style={{
        background: 'white', padding: '14px 32px',
        display: 'flex', alignItems: 'center', gap: 16,
        borderBottom: '1px solid #E0E0E0', flexWrap: 'wrap',
      }}>
        {/* Before circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 56, height: 56, border: '5px solid #CC1016', background: '#FEE2E2',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#CC1016' }}>{scores.before.overall}</span>
          </div>
          <span style={{ fontSize: 8, color: '#CC1016', marginTop: 2, fontWeight: 700 }}>BEFORE</span>
        </div>

        <span style={{ fontSize: 16, color: '#aaa' }}>{'\u2192'}</span>

        {/* +pts badge */}
        <span style={{
          background: '#057642', color: 'white', fontSize: 12, fontWeight: 800,
          borderRadius: 12, padding: '4px 12px',
        }}>+{improvement} pts</span>

        {/* After circle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: 68, height: 68, border: '6px solid #057642', background: 'white',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#057642' }}>{scores.after.overall}</span>
          </div>
          <span style={{ fontSize: 8, color: '#057642', marginTop: 2, fontWeight: 700 }}>AFTER</span>
        </div>

        {/* Sub-score pills */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {subScorePills.map((p) => (
            <span key={p.label} style={{
              background: '#F3F2EF', border: '1px solid #E0E0E0', borderRadius: 10,
              padding: '3px 8px', fontSize: 10, color: '#555', display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
              {p.label} {p.value}
            </span>
          ))}
        </div>
      </div>

      {/* Roast grid */}
      <div style={{
        padding: '12px 16px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
      }}>
        {roastPoints.map((point, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 10,
            border: '1px solid #E0E0E0', overflow: 'hidden',
          }}>
            {/* Mini header */}
            <div style={{
              background: 'linear-gradient(135deg, #004182, #0A66C2)',
              padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 8, fontWeight: 700, color: 'white', letterSpacing: 1 }}>ROAST</span>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>Point {i + 1} / {roastPoints.length}</span>
            </div>

            {/* Section tag */}
            <div style={{ background: '#F3F2EF', padding: '5px 10px 0' }}>
              <span style={{
                display: 'inline-block', background: 'white', border: '1px solid #E0E0E0',
                borderRadius: 6, padding: '2px 6px', fontSize: 7, fontWeight: 700, color: '#666',
              }}>
                {point.section_targeted.toUpperCase()}
              </span>
            </div>

            {/* Quote */}
            <div style={{ background: '#F3F2EF', padding: '7px 10px' }}>
              <p style={{
                fontSize: 9.5, color: '#191919', fontStyle: 'italic', lineHeight: 1.55,
                margin: 0, overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
              }}>
                {point.roast}
              </p>
            </div>

            {/* Real issue */}
            {point.underlying_issue && (
              <div style={{
                background: 'white', borderTop: '1px solid #E0E0E0',
                padding: '5px 10px', display: 'flex', gap: 5, alignItems: 'flex-start',
              }}>
                <span style={{
                  background: '#FEE2E2', border: '1px solid #CC1016', color: '#CC1016',
                  fontSize: 6.5, fontWeight: 700, padding: '2px 5px', borderRadius: 4, flexShrink: 0,
                }}>REAL ISSUE</span>
                <span style={{
                  fontSize: 8.5, color: '#555', lineHeight: 1.4,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                }}>
                  {point.underlying_issue}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        background: '#004182', padding: '12px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Get your profile roasted at</span>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>profileroaster.in</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>#LinkedInRoast</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RoastReportSection (preview + download + caption)
// ═══════════════════════════════════════════
function RoastReportSection({
  orderId,
  roast,
  scores,
  rewrite,
}: {
  orderId: string;
  roast: OrderResults['results']['roast'];
  scores: { before: ScoreBreakdown; after: ScoreBreakdown };
  rewrite: OrderResults['results']['rewrite'];
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  const improvement = scores.after.overall - scores.before.overall;
  const firstRoast = roast.roast_points[0]?.roast || '';
  const caption = `I just got my LinkedIn profile brutally roasted by AI \u{1F525}

The verdict: [${roast.roast_title}]

My worst roast point:
"${firstRoast.length > 350 ? firstRoast.slice(0, firstRoast.slice(0, 350).lastIndexOf(' ')) + '...' : firstRoast}"

Score went from ${scores.before.overall} to ${scores.after.overall} (+${improvement} points)

Best \u20B9299 I spent on my career.

Get yours: profileroaster.in

#LinkedInRoast #CareerGrowth #LinkedInTips #ProfileMakeover`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`${API_URL}/api/generate-roast-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const { url } = await res.json();
      if (url) {
        const img = await fetch(`${url}?t=${Date.now()}`);
        const blob = await img.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'linkedin-roast-report.png';
        a.click();
        URL.revokeObjectURL(a.href);
        setDownloadToast(true);
        setTimeout(() => setDownloadToast(false), 3000);
      }
    } catch { /* ignore */ } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Your Complete Roast Report
      </h3>
      <p className="text-sm mb-4" style={{ color: 'var(--li-text-secondary)' }}>
        Preview your full roast card before downloading and sharing
      </p>

      {/* HTML Preview */}
      <RoastSheetPreview
        roastPoints={roast.roast_points}
        scores={scores}
        roastTitle={roast.roast_title}
      />

      {/* Download PNG Button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        style={{
          width: '100%', marginTop: 16, padding: 12,
          background: '#0A66C2', color: 'white',
          fontSize: 15, fontWeight: 700,
          border: 'none', borderRadius: 8, cursor: 'pointer',
          opacity: downloading ? 0.6 : 1,
        }}
      >
        {downloading ? 'Generating...' : 'Download Roast Report PNG'}
      </button>

      {/* Download PDF Report */}
      <button
        onClick={() => {
          const w = window.open('', '_blank');
          if (!w) return;
          w.document.write(`<!DOCTYPE html><html><head><title>LinkedIn Roast Report</title>
            <style>
              body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 24px; color: #191919; }
              h1 { color: #004182; font-size: 24px; border-bottom: 3px solid #0A66C2; padding-bottom: 12px; }
              h2 { color: #0A66C2; font-size: 18px; margin-top: 32px; }
              .score-box { display: flex; gap: 24px; align-items: center; margin: 16px 0; padding: 20px; background: #F3F2EF; border-radius: 8px; }
              .score { font-size: 36px; font-weight: 800; }
              .score-before { color: #CC1016; }
              .score-after { color: #057642; }
              .roast-point { margin: 16px 0; padding: 16px; border-left: 4px solid #E16B00; background: #FFF8F5; border-radius: 0 8px 8px 0; }
              .roast-point .section { font-size: 11px; color: #666; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
              .roast-point .text { font-style: italic; line-height: 1.6; }
              .roast-point .issue { margin-top: 8px; font-size: 13px; color: #CC1016; }
              .rewrite-box { padding: 16px; background: #F0F9FF; border-left: 4px solid #0A66C2; border-radius: 0 8px 8px 0; margin: 12px 0; }
              .compliment { padding: 16px; background: #F0FDF4; border-left: 4px solid #057642; border-radius: 0 8px 8px 0; margin: 16px 0; }
              .exp { margin: 16px 0; }
              .exp-title { font-weight: 700; margin-bottom: 4px; }
              .exp ul { margin: 4px 0; padding-left: 20px; }
              .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E0E0E0; text-align: center; color: #999; font-size: 12px; }
              @media print { body { padding: 0; } }
            </style>
          </head><body>
            <h1>LinkedIn Profile Roast Report</h1>
            <div class="score-box">
              <div><div style="font-size:12px;color:#666;font-weight:700">BEFORE</div><div class="score score-before">${scores.before.overall}</div></div>
              <div style="font-size:24px;color:#aaa">&rarr;</div>
              <div><div style="font-size:12px;color:#666;font-weight:700">AFTER</div><div class="score score-after">${scores.after.overall}</div></div>
              <div style="background:#057642;color:white;padding:6px 16px;border-radius:20px;font-weight:700;font-size:14px">+${scores.after.overall - scores.before.overall} pts</div>
            </div>
            <p style="color:#666;font-size:13px">Headline: ${scores.before.headline} &rarr; ${scores.after.headline} | About: ${scores.before.about} &rarr; ${scores.after.about} | Experience: ${scores.before.experience} &rarr; ${scores.after.experience}</p>

            <h2>Your Roast</h2>
            <p style="font-weight:700;font-size:16px;color:#E16B00">${roast.roast_title || ''}</p>
            ${roast.roast_points.map((p: any, i: number) => `
              <div class="roast-point">
                <div class="section">${p.section_targeted || 'Profile'} &mdash; Point ${i + 1}</div>
                <div class="text">${p.roast}</div>
                ${p.underlying_issue ? `<div class="issue">Real issue: ${p.underlying_issue}</div>` : ''}
              </div>
            `).join('')}

            ${roast.closing_compliment ? `<div class="compliment"><strong>Your Strength:</strong> ${roast.closing_compliment}</div>` : ''}

            <h2>Your Rewrite</h2>
            <h3 style="font-size:14px;color:#666;margin-bottom:4px">New Headline</h3>
            <div class="rewrite-box" style="font-weight:600">${rewrite.rewritten_headline}</div>

            <h3 style="font-size:14px;color:#666;margin-bottom:4px;margin-top:20px">New About</h3>
            <div class="rewrite-box" style="white-space:pre-wrap;font-size:13px;line-height:1.6">${rewrite.rewritten_about}</div>

            <h3 style="font-size:14px;color:#666;margin-bottom:4px;margin-top:20px">Rewritten Experience</h3>
            ${(rewrite.rewritten_experience || []).map((exp: any) => `
              <div class="exp">
                <div class="exp-title">${exp.title} at ${exp.company}</div>
                <ul>${(exp.bullets || []).map((b: string) => `<li style="margin:4px 0;font-size:13px;line-height:1.5">${b}</li>`).join('')}</ul>
              </div>
            `).join('')}

            <div class="footer">
              <p>Generated by <strong>profileroaster.in</strong></p>
              <p>Results valid for 30 days from generation date</p>
            </div>
          </body></html>`);
          w.document.close();
          setTimeout(() => { w.print(); }, 500);
        }}
        style={{
          width: '100%', marginTop: 8, padding: 12,
          background: 'white', color: '#0A66C2',
          fontSize: 14, fontWeight: 600,
          border: '2px solid #0A66C2', borderRadius: 8, cursor: 'pointer',
        }}
      >
        Download Full Report as PDF
      </button>

      {downloadToast && (
        <p className="text-sm text-center mt-2" style={{ color: 'var(--li-green)' }}>
          Roast Report downloaded!
        </p>
      )}

      {/* Caption */}
      <h4 className="text-sm font-bold mt-6 mb-2" style={{ color: 'var(--li-text-primary)' }}>
        Caption for LinkedIn Post
      </h4>
      <div style={{
        background: 'white', border: '1px solid var(--li-border)', borderRadius: 8,
        padding: 16, fontSize: 13, color: 'var(--li-text-primary)', lineHeight: 1.7,
        whiteSpace: 'pre-line', marginBottom: 8,
      }}>
        {caption}
      </div>
      <button
        onClick={() => {
          copyToClipboard(caption);
          setCaptionCopied(true);
          setTimeout(() => setCaptionCopied(false), 2000);
        }}
        style={{
          fontSize: 13, fontWeight: 700, color: '#0A66C2',
          border: '1px solid #0A66C2', borderRadius: 8,
          padding: '8px 20px', background: 'white', cursor: 'pointer',
        }}
      >
        {captionCopied ? 'Copied!' : 'Copy Caption'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// HiddenStrengths
// ═══════════════════════════════════════════
function HiddenStrengths({ strengths }: { strengths: HiddenStrength[] }) {
  if (!strengths?.length) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Your Hidden Strengths
      </h2>
      <p className="text-xs mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        What your profile already has — but is not showing clearly enough
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {strengths.map((s, i) => (
          <div
            key={i}
            className="p-4 rounded-lg"
            style={{
              background: '#DCFCE7',
              borderLeft: '4px solid #057642',
              borderRadius: 8,
            }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
              {s.strength}
            </p>
            <p className="text-xs italic mb-2" style={{ color: 'var(--li-text-secondary)' }}>
              &ldquo;{s.evidence}&rdquo;
            </p>
            <p className="text-xs mb-1" style={{ color: 'var(--li-text-secondary)' }}>
              <span className="font-semibold">Why it matters:</span> {s.why_valuable}
            </p>
            <p className="text-xs" style={{ color: 'var(--li-blue)' }}>
              <span className="font-semibold">How to show it:</span> {s.how_to_show_it}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// RewriteSection
// ═══════════════════════════════════════════
function RewriteSection({
  title,
  before,
  after,
  copyText,
  atsKeywords,
}: {
  title: string;
  before: string;
  after: string;
  copyText?: string;
  atsKeywords?: string[];
}) {
  const [copied, setCopied] = useState(false);
  const charCount = after?.length || 0;

  // Convert newlines to <br>, highlight placeholders, power verbs, and ATS keywords
  const renderHtml = (text: string) => {
    if (!text || typeof text !== 'string') return text || '';
    let html = text.replace(/\n/g, '<br>');
    html = highlightPlaceholders(html);
    html = highlightPowerVerbs(html);
    if (atsKeywords?.length) html = highlightATSKeywords(html, atsKeywords);
    return html;
  };

  return (
    <div className="li-card mb-4 overflow-hidden">
      <div className="px-4 py-2 text-white text-sm font-semibold" style={{ background: 'var(--li-dark-blue)' }}>
        {title}
      </div>
      <div className="p-4">
        {/* Before */}
        {before && (
          <div
            className="p-3 rounded mb-3 text-sm"
            style={{
              background: '#FEE2E2',
              borderLeft: '3px solid var(--li-red)',
            }}
          >
            <span className="text-xs font-bold block mb-1" style={{ color: 'var(--li-red)' }}>
              ✗ BEFORE
            </span>
            <span className="line-through" style={{ color: 'var(--li-text-secondary)' }}>
              {before}
            </span>
          </div>
        )}

        {/* After */}
        <div
          className="p-3 rounded text-sm"
          style={{
            background: '#DCFCE7',
            borderLeft: '3px solid var(--li-green)',
          }}
        >
          <span className="text-xs font-bold block mb-1" style={{ color: 'var(--li-green)' }}>
            ✓ AFTER
          </span>
          <span
            className="font-semibold"
            style={{ color: 'var(--li-text-primary)' }}
            dangerouslySetInnerHTML={{ __html: renderHtml(after) }}
          />
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>
            {charCount} characters
          </span>
          <button
            onClick={() => {
              copyToClipboard(copyText || after);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white"
            style={{ background: 'var(--li-blue)' }}
          >
            {copied ? '✓ Copied!' : `Copy New ${title}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: HeadlineVariants
// ═══════════════════════════════════════════
function HeadlineVariants({ variations }: { variations: HeadlineVariation[] }) {
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        5 Headline Variations (Pro)
      </h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {variations.map((v, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="text-xs px-3 py-1.5 rounded-full cursor-pointer border-none"
            style={{
              background: active === i ? 'var(--li-blue)' : 'var(--li-gray)',
              color: active === i ? 'white' : 'var(--li-text-secondary)',
            }}
          >
            {v.style}
          </button>
        ))}
      </div>
      <div className="p-3 rounded text-sm font-semibold" style={{ background: 'var(--li-gray)' }}>
        {variations[active]?.headline}
      </div>
      <p className="text-xs mt-2" style={{ color: 'var(--li-text-secondary)' }}>
        Best for: {variations[active]?.best_for}
      </p>
      <button
        onClick={() => {
          copyToClipboard(variations[active]?.headline || '');
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="mt-2 text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
        style={{ background: 'var(--li-blue)' }}
      >
        {copied ? '✓ Copied!' : 'Copy Headline'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: ATS Keywords
// ═══════════════════════════════════════════
function ATSSection({ keywords }: { keywords: string[] }) {
  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        ATS Keywords
      </h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((kw, i) => (
          <span
            key={i}
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: '#E8F4FD', color: 'var(--li-blue)' }}
          >
            {kw}
          </span>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ATS Intelligence Card (Phase 1)
// ═══════════════════════════════════════════
function ATSIntelligenceCard({ atsScore, analysis }: {
  atsScore: number;
  analysis: NonNullable<OrderResults['results']['analysis']>;
}) {
  if (!analysis || !analysis.ats_intelligence) return null;
  const atsInt = analysis.ats_intelligence;

  const verdict = (() => {
    if (atsScore >= 86) return { text: 'Optimized', color: '#057642' };
    if (atsScore >= 71) return { text: 'Strong', color: '#44A340' };
    if (atsScore >= 51) return { text: 'Moderate', color: '#B59F3B' };
    if (atsScore >= 31) return { text: 'Weak', color: '#E16B00' };
    return { text: 'Invisible', color: '#CC1016' };
  })();

  return (
    <div className="li-card mb-4 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3" style={{ background: '#004182' }}>
        <span className="text-xs font-bold text-white" style={{ letterSpacing: '2px' }}>
          ATS INTELLIGENCE REPORT
        </span>
      </div>

      <div className="p-5">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Section A — ATS Score */}
          <div className="flex flex-col items-center justify-center" style={{ minWidth: 100 }}>
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 70, height: 70, border: `4px solid ${verdict.color}` }}
            >
              <span className="text-2xl font-bold" style={{ color: verdict.color }}>{atsScore}</span>
            </div>
            <span className="text-xs font-semibold mt-2" style={{ color: 'var(--li-text-secondary)' }}>ATS Score</span>
            <span className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full text-white" style={{ background: verdict.color }}>
              {verdict.text}
            </span>
          </div>

          {/* Section C — Keywords Missing */}
          <div className="flex-1">
            {Array.isArray(atsInt.critical_missing) && atsInt.critical_missing.length > 0 && (
              <div className="mb-4">
                <span className="text-xs font-bold block mb-2" style={{ color: '#CC1016', letterSpacing: '0.5px' }}>
                  Add these keywords to your profile:
                </span>
                <div className="flex flex-wrap gap-2">
                  {atsInt.critical_missing.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs font-semibold px-3 py-1 rounded-full"
                      style={{ border: '1px solid #CC1016', color: '#CC1016', background: '#FEE2E2' }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(atsInt.keywords_present) && atsInt.keywords_present.length > 0 && (
              <div>
                <span className="text-xs font-bold block mb-2" style={{ color: 'var(--li-text-secondary)', letterSpacing: '0.5px' }}>
                  Keywords in your rewrite:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {atsInt.keywords_present.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: '#E8F4FD', color: 'var(--li-blue)' }}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: JD Analysis
// ═══════════════════════════════════════════
function JDAnalysis({ analysis }: { analysis: NonNullable<OrderResults['results']['rewrite']['jd_analysis']> }) {
  if (!analysis || analysis.match_score === null) return null;
  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        Job Description Match (Pro)
      </h3>
      <div className="flex items-center gap-4 mb-3">
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 60,
            height: 60,
            border: `4px solid ${analysis.match_score >= 70 ? 'var(--li-green)' : analysis.match_score >= 40 ? 'var(--li-orange)' : 'var(--li-red)'}`,
          }}
        >
          <span className="text-lg font-bold">{analysis.match_score}%</span>
        </div>
        <div>
          <p className="text-sm font-semibold">{analysis.application_recommendation}</p>
          <p className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>{analysis.gap_summary}</p>
        </div>
      </div>
      {Array.isArray(analysis.missing_keywords) && analysis.missing_keywords.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--li-red)' }}>Missing keywords:</p>
          <div className="flex flex-wrap gap-1">
            {analysis.missing_keywords.map((kw, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: '#FEE2E2', color: 'var(--li-red)' }}>
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Pro-only: Cover Letter
// ═══════════════════════════════════════════
function CoverLetterSection({ coverLetter }: { coverLetter: NonNullable<OrderResults['results']['rewrite']['cover_letter']> }) {
  const [copied, setCopied] = useState(false);

  function download() {
    const blob = new Blob([`Subject: ${coverLetter.subject_line}\n\n${coverLetter.body}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Cover Letter (Pro)
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        Subject: {coverLetter.subject_line}
      </p>
      <div
        className="text-sm p-3 rounded whitespace-pre-wrap mb-3"
        style={{ background: 'var(--li-gray)' }}
        dangerouslySetInnerHTML={{ __html: highlightPlaceholders(coverLetter.body) }}
      />
      <p className="text-xs italic mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        {coverLetter.personalization_notes}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => {
            copyToClipboard(coverLetter.body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
          style={{ background: 'var(--li-blue)' }}
        >
          {copied ? '✓ Copied!' : '📋 Copy'}
        </button>
        <button
          onClick={download}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full border-none"
          style={{ background: 'var(--li-gray)', color: 'var(--li-text-primary)' }}
        >
          ⬇ Download .txt
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// PlaceholderGuide
// ═══════════════════════════════════════════
function PlaceholderGuide({ placeholders }: { placeholders: Array<{ location: string; placeholder: string; instruction: string }> }) {
  if (!placeholders?.length) return null;
  return (
    <div className="li-card p-4 mb-4">
      <p style={{ fontSize: 13, color: '#057642', fontStyle: 'italic', marginBottom: 8 }}>
        We estimated these metrics based on your industry. Update with your actual numbers for maximum accuracy.
      </p>
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        Fill In Your Numbers
      </h3>
      <ol className="space-y-2 list-decimal list-inside">
        {placeholders.map((p, i) => (
          <li key={i} className="text-sm">
            <span
              className="font-mono text-xs px-1 rounded"
              style={{ background: '#FEF3C7', color: '#92400E' }}
            >
              {p.placeholder}
            </span>
            <span className="ml-2" style={{ color: 'var(--li-text-secondary)' }}>
              in {p.location} — {p.instruction}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ═══════════════════════════════════════════
// FeedbackWidget
// ═══════════════════════════════════════════
function FeedbackWidget({ orderId }: { orderId: string }) {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [saved, setSaved] = useState(false);

  async function submit() {
    if (!rating) return;
    try {
      await fetch(`${API_URL}/api/orders/${orderId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback: feedback.trim() || undefined }),
      });
      setSaved(true);
    } catch { /* ignore */ }
  }

  if (saved) {
    return (
      <div className="li-card p-4 mb-4 text-center">
        <p className="text-sm font-semibold" style={{ color: 'var(--li-green)' }}>
          Thanks for your feedback! {'⭐'.repeat(rating)}
        </p>
      </div>
    );
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
        Rate Your Roast
      </h3>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="text-2xl cursor-pointer bg-transparent border-none"
            style={{ opacity: star <= rating ? 1 : 0.3 }}
          >
            ⭐
          </button>
        ))}
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Any thoughts? (optional)"
        rows={2}
        className="w-full px-3 py-2 rounded text-sm outline-none resize-none mb-2"
        style={{ border: '1px solid var(--li-border)' }}
      />
      <button
        onClick={submit}
        disabled={!rating}
        className="text-xs font-semibold cursor-pointer px-4 py-2 rounded-full text-white border-none disabled:opacity-50"
        style={{ background: 'var(--li-blue)' }}
      >
        Submit
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// ReferralWidget
// ═══════════════════════════════════════════
function ReferralWidget({ code, url, cardUrl }: { code: string; url: string; cardUrl?: string | null }) {
  const [copied, setCopied] = useState(false);
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  async function handleWhatsAppReferral() {
    const text = `I just got my LinkedIn profile roasted by AI!\n\nScore went way up after the rewrite.\n\nTry it: ${url}`;
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && cardUrl) {
      try {
        const response = await fetch(`${cardUrl}?t=${Date.now()}`);
        const blob = await response.blob();
        const file = new File([blob], 'linkedin-roast-card.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ title: 'My LinkedIn Roast', text, files: [file] });
          return;
        }
      } catch { /* fall through */ }
    }
    const fallbackText = cardUrl ? `${text}\n\nSee my roast card: ${cardUrl}` : text;
    window.open(`https://wa.me/?text=${encodeURIComponent(fallbackText)}`, '_blank');
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        Share & Earn &#8377;50
      </h3>
      <p className="text-xs mb-3" style={{ color: 'var(--li-text-secondary)' }}>
        Your link: {url}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            copyToClipboard(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
          style={{ background: 'var(--li-blue)' }}
        >
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-full no-underline"
          style={{ background: 'var(--li-gray)', color: 'var(--li-blue)' }}
        >
          Share on LinkedIn
        </a>
        <button
          onClick={handleWhatsAppReferral}
          className="text-xs font-semibold cursor-pointer px-3 py-1.5 rounded-full text-white border-none"
          style={{ background: '#25D366' }}
        >
          Share on WhatsApp
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// ShareButtons
// ═══════════════════════════════════════════
function ShareButtons({ caption, cardUrl, orderId, beforeScore, afterScore, referralUrl }: {
  caption: string; cardUrl: string | null; orderId: string;
  beforeScore: number; afterScore: number; referralUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [igToast, setIgToast] = useState(false);
  const shareText = caption || 'Just got my LinkedIn profile roasted!';

  async function downloadCard() {
    if (!cardUrl) return;
    try {
      const response = await fetch(cardUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `linkedin-roast-${orderId.slice(0, 8)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(cardUrl, '_blank');
    }
  }

  async function handleWhatsAppShare() {
    const whatsAppText = `I just got my LinkedIn profile roasted by AI 🔥 Score: ${beforeScore}\u2192${afterScore}\n\n${shareText}\n\nGet yours: ${referralUrl}`;

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        if (cardUrl) {
          const response = await fetch(cardUrl);
          const blob = await response.blob();
          const file = new File([blob], 'linkedin-roast-card.png', { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'My LinkedIn Profile Roast',
              text: whatsAppText,
              files: [file],
            });
            return;
          }
        }
      } catch {
        // fall through to wa.me
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsAppText)}`, '_blank');
  }

  async function handleInstagramShare() {
    try {
      if (cardUrl) {
        const response = await fetch(cardUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'linkedin-roast-card.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      await navigator.clipboard.writeText(shareText);
      setIgToast(true);
      setTimeout(() => setIgToast(false), 8000);
    } catch {
      setIgToast(true);
      setTimeout(() => setIgToast(false), 5000);
    }
  }

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
        Share Your Results
      </h3>

      {/* Card image */}
      {cardUrl && (
        <div className="mb-4">
          <img src={cardUrl} alt="Roast card" className="w-full rounded-lg" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {cardUrl && (
          <button
            onClick={downloadCard}
            className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-full text-white border-none"
            style={{ background: 'var(--li-blue)', minHeight: 40 }}
          >
            ⬇ Download Card
          </button>
        )}

        {/* LinkedIn — PRIMARY */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://profileroaster.in')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-semibold px-4 py-2.5 rounded-lg no-underline"
          style={{ background: '#0A66C2', color: 'white', minHeight: 40 }}
        >
          📤 Share on LinkedIn
        </a>

        {/* WhatsApp — SECONDARY outlined */}
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-lg"
          style={{
            border: '2px solid #25D366',
            color: '#25D366',
            background: 'white',
            minHeight: 40,
          }}
        >
          💬 WhatsApp
        </button>

        {/* Instagram — SECONDARY outlined gradient */}
        <button
          onClick={handleInstagramShare}
          className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-lg"
          style={{
            border: '2px solid #E1306C',
            color: '#E1306C',
            background: 'white',
            minHeight: 40,
          }}
        >
          📸 Instagram
        </button>

        <button
          onClick={() => {
            copyToClipboard(shareText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 text-sm font-semibold cursor-pointer px-4 py-2.5 rounded-lg border-none"
          style={{ background: 'var(--li-gray)', color: 'var(--li-text-primary)', minHeight: 40 }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Caption'}
        </button>
      </div>

      {/* Instagram toast */}
      {igToast && (
        <div className="mt-3 p-3 rounded-lg flex items-center justify-between" style={{ background: '#FEF3C7', border: '1px solid #F59E0B' }}>
          <span className="text-sm" style={{ color: '#92400E' }}>
            📸 Card downloaded + caption copied!
          </span>
          <button
            onClick={() => window.open('https://www.instagram.com', '_blank')}
            className="text-sm font-semibold cursor-pointer bg-transparent border-none"
            style={{ color: '#E1306C' }}
          >
            Open Instagram &rarr;
          </button>
        </div>
      )}

      {!cardUrl && (
        <div className="p-3 rounded text-center" style={{ background: 'var(--li-gray)' }}>
          <p className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>
            Card is being generated... refresh in 30 seconds
          </p>
          <p className="text-xs mt-1 italic" style={{ color: 'var(--li-text-secondary)' }}>
            My LinkedIn score: {shareText} via profileroaster.in
          </p>
        </div>
      )}

      {/* VIRAL 5 — Challenge Button */}
      <p style={{ fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 8, marginTop: 16 }}>
        Dare your friends to beat your score
      </p>
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={async () => {
            const text = `I just got my LinkedIn roasted by AI\n\nMy score: ${beforeScore} \u2192 ${afterScore}\n\nThink you can beat this?\nTry: ${referralUrl || 'profileroaster.in'}`;
            if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && cardUrl) {
              try {
                const r = await fetch(`${cardUrl}?t=${Date.now()}`);
                const blob = await r.blob();
                const file = new File([blob], 'linkedin-roast.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) { await navigator.share({ title: 'LinkedIn Roast Challenge', text, files: [file] }); return; }
              } catch {}
            }
            const fallback = cardUrl ? `${text}\n\nSee my card: ${cardUrl}` : text;
            window.open(`https://wa.me/?text=${encodeURIComponent(fallback)}`, '_blank');
          }}
          style={{
            background: 'white',
            border: '1px solid #25D366',
            color: '#25D366',
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 20px',
            borderRadius: 50,
            cursor: 'pointer',
          }}
        >
          Challenge a Friend on WhatsApp
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// UpsellBanner (Standard only)
// ═══════════════════════════════════════════
function UpsellBanner({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/upgrade`, { method: 'POST' });
      const data = await res.json();
      if (data.razorpay_order_id) {
        const options = {
          key: data.razorpay_key,
          amount: data.amount,
          currency: data.currency,
          name: 'Profile Roaster',
          description: 'Upgrade to Pro',
          order_id: data.razorpay_order_id,
          theme: { color: '#0A66C2' },
          handler: function () {
            window.location.reload();
          },
          modal: {
            ondismiss: function () {
              alert('Upgrade cancelled.');
            },
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        alert(data.error || 'Failed to create upgrade');
      }
    } catch {
      alert('Could not reach server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="p-4 mb-4 rounded-lg text-center"
      style={{
        background: 'linear-gradient(135deg, #004182, #0A66C2)',
        borderRadius: 'var(--li-radius)',
      }}
    >
      <p className="text-white text-sm font-bold mb-1">Upgrade to Pro for ₹300</p>
      <p className="text-white/80 text-xs mb-3">
        Get 5 headline variants, ATS keywords, JD matcher & cover letter
      </p>
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="px-6 py-2.5 rounded-full text-sm font-semibold cursor-pointer border-none"
        style={{ background: 'white', color: 'var(--li-blue)' }}
      >
        {loading ? 'Creating...' : 'Upgrade Now →'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════
// Error States
// ═══════════════════════════════════════════
function ErrorState({ type, onRetry }: { type: string; onRetry?: () => void }) {
  const messages: Record<string, { title: string; desc: string }> = {
    pipeline_failed: {
      title: 'Processing Failed',
      desc: 'We could not process your profile. Full refund issued within 24 hours.',
    },
    payment_failed: {
      title: 'Payment Failed',
      desc: 'Payment did not go through. No charge was made. Try again.',
    },
    modal_closed: {
      title: 'Payment Cancelled',
      desc: 'Looks like you closed payment. Profile saved — complete when ready.',
    },
    api_down: {
      title: 'High Demand',
      desc: 'High demand right now. Try again in a few minutes.',
    },
    timeout: {
      title: 'Almost There',
      desc: 'Your roast is being perfected. We will email your results shortly. You can safely close this page or keep waiting.',
    },
    card_failed: {
      title: 'Card Generation Failed',
      desc: 'Could not generate your card image.',
    },
  };

  const msg = messages[type] || messages.api_down;

  return (
    <div className="li-card p-6 text-center">
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--li-red)' }}>{msg.title}</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--li-text-secondary)' }}>{msg.desc}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 rounded-full text-white text-sm font-semibold cursor-pointer border-none"
          style={{ background: 'var(--li-blue)' }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Results Page
// ═══════════════════════════════════════════
export default function ResultsPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [data, setData] = useState<OrderResults | null>(null);
  const [polling, setPolling] = useState<PollingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [currentLabel, setCurrentLabel] = useState<{ label: string; emoji: string }>({ label: 'Getting ready...', emoji: '👋' });
  const [stuckSince, setStuckSince] = useState(Date.now());
  const highestProgressRef = useRef(0);
  const pollStartRef = useRef(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`);
      if (!res.ok) {
        setError('api_down');
        return;
      }
      const json = await res.json();

      if (json.status === 'done') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        highestProgressRef.current = 100;
        setDisplayProgress(100);
        setData(json);
        setPolling(null);
        return;
      }

      if (json.status === 'failed') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setError('pipeline_failed');
        return;
      }

      // Still processing — only move forward
      const newPct = STAGE_PCT[json.status] ?? 5;
      const safePct = Math.max(newPct, highestProgressRef.current);

      if (safePct > highestProgressRef.current) {
        // Progress moved forward — update label and reset stuck timer
        highestProgressRef.current = safePct;
        setDisplayProgress(safePct);
        setStuckSince(Date.now());
        const newLabel = STAGE_LABELS[json.status];
        if (newLabel) setCurrentLabel(newLabel);
      }
      // If safePct === highestProgressRef.current, don't update label or progress
      // (backend retry — user sees nothing)

      setPolling(json);

      // Timeout after 10 minutes (pipeline can take 4-6 min with retries)
      if (Date.now() - pollStartRef.current > 600000) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setError('timeout');
      }
    } catch {
      setError('api_down');
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    intervalRef.current = setInterval(fetchOrder, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrder]);

  // ── Error state ──
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <ErrorState type={error} onRetry={error === 'api_down' ? () => { setError(null); fetchOrder(); } : undefined} />
      </main>
    );
  }

  // ── Polling / Processing state ──
  if (!data && polling) {
    const isStuck = Date.now() - stuckSince > 10000;

    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="li-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">{currentLabel.emoji}</div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--li-text-primary)' }}>
            {currentLabel.label}
          </h2>
          <div className="w-full h-2 rounded-full mb-3" style={{ background: 'var(--li-border)' }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${displayProgress}%`,
                background: 'var(--li-blue)',
                transition: 'width 0.8s ease-in-out',
                animation: isStuck ? 'pulse-bar 2s ease-in-out infinite' : 'none',
              }}
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--li-text-secondary)' }}>
            {displayProgress}% complete{isStuck ? ' — AI is thinking hard about your profile...' : ''}
          </p>
          <style>{`
            @keyframes pulse-bar {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}</style>
        </div>
      </main>
    );
  }

  // ── Loading ──
  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl mb-2">⏳</div>
          <p style={{ color: 'var(--li-text-secondary)' }}>Loading results...</p>
        </div>
      </main>
    );
  }

  // ── Results ──
  const { results, plan, referral_code, referral_url } = data;
  const { scores, roast, rewrite, analysis } = results;
  const isPro = plan === 'pro';

  return (
    <main className="min-h-screen pb-16">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
          {roast.roast_title}
        </h1>
        <p className="text-sm" style={{ color: 'var(--li-text-secondary)' }}>
          {roast.overall_verdict}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        {/* VIRAL 1 — Top Share Block */}
        <div style={{
          background: 'linear-gradient(135deg, #004182, #0A66C2)',
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 24,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>
            Your profile improved +{scores.after.overall - scores.before.overall} points.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 16px' }}>
            Now challenge your network to beat this
          </p>
          <div>
            <button
              onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://profileroaster.in')}`, '_blank')}
              style={{
                background: 'white',
                color: '#0A66C2',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 24px',
                borderRadius: 50,
                border: 'none',
                cursor: 'pointer',
                marginRight: 8,
              }}
            >
              Share on LinkedIn
            </button>
            <button
              onClick={async () => {
                const text = `I just improved my LinkedIn profile by ${scores.after.overall - scores.before.overall} points with AI!\n\nThink you can beat this?\nTry: ${referral_url || 'https://profileroaster.in'}`;
                const cUrl = results.card_image_url;
                if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && cUrl) {
                  try {
                    const r = await fetch(`${cUrl}?t=${Date.now()}`);
                    const blob = await r.blob();
                    const file = new File([blob], 'linkedin-roast.png', { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) { await navigator.share({ title: 'LinkedIn Roast Challenge', text, files: [file] }); return; }
                  } catch {}
                }
                const fallback = cUrl ? `${text}\n\nSee my card: ${cUrl}` : text;
                window.open(`https://wa.me/?text=${encodeURIComponent(fallback)}`, '_blank');
              }}
              style={{
                background: 'transparent',
                color: 'white',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 24px',
                borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.5)',
                cursor: 'pointer',
              }}
            >
              Challenge a Friend
            </button>
          </div>
        </div>

        {/* Score Reveal */}
        <ScoreReveal before={scores.before} after={scores.after} />

        {/* Roast Section */}
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
          Your Roast 🔥
        </h2>
        {roast.roast_points.map((point, i) => (
          <RoastCard
            key={i}
            point={point}
            pointNumber={i + 1}
            totalPoints={roast.roast_points.length}
          />
        ))}

        {/* Closing compliment */}
        <div className="li-card p-4 mb-6">
          <p className="text-sm italic" style={{ color: 'var(--li-green)' }}>
            {roast.closing_compliment}
          </p>
        </div>

        {/* ── Your Complete Roast Report ── */}
        <SafeRender name="RoastReport">
          <RoastReportSection
            orderId={orderId}
            roast={roast}
            scores={scores}
            rewrite={rewrite}
          />
        </SafeRender>

        {/* Hidden Strengths */}
        {roast.hidden_strengths && roast.hidden_strengths.length > 0 && (
          <HiddenStrengths strengths={roast.hidden_strengths} />
        )}

        {/* Personalization Note */}
        {rewrite?.personalization_note && (
          <SafeRender name="PersonalizationNote">
            <div
              className="li-card p-4 mb-4"
              style={{ borderLeft: '4px solid var(--li-blue)' }}
            >
              <span className="text-xs font-bold block mb-1" style={{ color: 'var(--li-blue)', letterSpacing: '1px' }}>
                ABOUT YOUR REWRITE
              </span>
              <p className="text-sm italic" style={{ color: 'var(--li-text-primary)', lineHeight: '1.6' }}>
                {rewrite.personalization_note}
              </p>
            </div>
          </SafeRender>
        )}

        {/* Rewrite Section */}
        <SafeRender name="RewriteSections">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
            Your Rewrite ✍️
          </h2>

          <RewriteSection
            title="Headline"
            before={scores.before.headline < 50 ? '(Original headline scored low)' : ''}
            after={rewrite.rewritten_headline}
            atsKeywords={rewrite.ats_keywords}
          />

          <RewriteSection
            title="About"
            before=""
            after={rewrite.rewritten_about}
            copyText={formatAboutForCopy(rewrite.rewritten_about)}
            atsKeywords={rewrite.ats_keywords}
          />

          {rewrite.rewritten_experience?.map((exp, i) => (
            <RewriteSection
              key={i}
              title={`${exp.title} at ${exp.company}`}
              before={exp.changes_made}
              after={formatBulletsForCopy(exp.bullets || [])}
              copyText={formatBulletsForCopy(exp.bullets || [])}
              atsKeywords={rewrite.ats_keywords}
            />
          ))}

          {/* VIRAL 6 — Rescore Loop */}
          <div style={{
            background: '#F0FDF4',
            border: '1px solid #057642',
            borderRadius: 10,
            padding: '14px 18px',
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#057642', margin: 0 }}>
                After updating LinkedIn
              </p>
              <p style={{ fontSize: 12, color: '#444', margin: '4px 0 0' }}>
                Come back and paste your new headline. Can you hit 90+ points?
              </p>
            </div>
          </div>
        </SafeRender>

        {/* Pro-only sections */}
        <SafeRender name="ProSections">
          {isPro && rewrite.headline_variations && (
            <HeadlineVariants variations={rewrite.headline_variations} />
          )}

          {/* ATS Keywords — shown for ALL plans */}
          {rewrite?.ats_keywords && (
            <ATSSection keywords={rewrite.ats_keywords} />
          )}

          {isPro && rewrite.jd_analysis && (
            <JDAnalysis analysis={rewrite.jd_analysis} />
          )}

          {isPro && rewrite.cover_letter && (
            <CoverLetterSection coverLetter={rewrite.cover_letter} />
          )}
        </SafeRender>

        {/* Placeholder Guide */}
        <PlaceholderGuide placeholders={rewrite.placeholders_to_fill} />

        {/* Share */}
        <ShareButtons
          caption={roast.linkedin_caption}
          cardUrl={results.card_image_url ? `${results.card_image_url}?t=${Date.now()}` : null}
          orderId={orderId}
          beforeScore={scores.before.overall}
          afterScore={scores.after.overall}
          referralUrl={referral_url || `https://profileroaster.in?ref=${referral_code || ''}`}
        />

        {/* Feedback */}
        <FeedbackWidget orderId={orderId} />

        {/* Referral */}
        {referral_code && <ReferralWidget code={referral_code} url={referral_url} cardUrl={results.card_image_url ? `${results.card_image_url}?t=${Date.now()}` : null} />}

        {/* Upsell for Standard */}
        {!isPro && <UpsellBanner orderId={orderId} />}

        {/* AI Disclaimer */}
        <div style={{
          background: '#FFFBEB', border: '1px solid #F59E0B', borderLeft: '4px solid #F59E0B',
          borderRadius: 8, padding: '14px 18px', margin: '24px 0',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 20, color: '#D97706', flexShrink: 0 }}>&#x26A0;</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
              AI-Generated Content — Please Review Before Using
            </p>
            <p style={{ fontSize: 12, color: '#78350F', lineHeight: 1.7, margin: 0 }}>
              Everything on this page — the roast, hidden strengths, rewrite, headlines,
              ATS keywords, JD match, and cover letter — was generated by AI.
              {'\n\n'}
              AI can make mistakes. Please carefully verify the following before copying
              anything to your LinkedIn profile:
              {'\n\n'}
              • Company names and job titles are correct{'\n'}
              • Employment dates match your actual history{'\n'}
              • Metrics and numbers are accurate{'\n'}
              • Skills and keywords reflect your real experience{'\n'}
              • The rewrite sounds like your own voice
              {'\n\n'}
              profileroaster.in is not responsible for any inaccuracies in AI-generated
              content. Use your judgment before updating your profile.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

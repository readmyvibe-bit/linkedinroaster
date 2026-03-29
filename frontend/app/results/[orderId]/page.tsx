'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ─── Types ───
interface ScoreBreakdown {
  headline: number;
  about: number;
  experience: number;
  completeness: number;
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

      {/* FIX 13 — Score gap explanation */}
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
function RoastCard({ point, total }: { point: RoastPoint; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="li-card p-4 mb-3">
      <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--li-text-secondary)' }}>
        <span>🔥 LinkedIn Profile Roast</span>
        <span>Point {point.point_number}/{total}</span>
      </div>
      <div
        className="text-base italic pl-3 mb-3"
        style={{
          borderLeft: '3px solid var(--li-orange)',
          paddingLeft: 12,
          color: 'var(--li-text-primary)',
        }}
      >
        {point.roast}
      </div>

      {expanded && (
        <div
          className="text-sm p-3 rounded mb-3"
          style={{ background: 'var(--li-gray)', color: 'var(--li-text-secondary)' }}
        >
          <span className="font-semibold">The real issue: </span>
          {point.underlying_issue}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium cursor-pointer bg-transparent border-none"
          style={{ color: 'var(--li-blue)' }}
        >
          {expanded ? '▲ Hide' : '▼ Why it matters'}
        </button>
        <button
          onClick={() => {
            copyToClipboard(point.roast);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="text-xs font-medium cursor-pointer bg-transparent border-none"
          style={{ color: 'var(--li-blue)' }}
        >
          {copied ? '✓ Copied' : '📋 Copy Roast'}
        </button>
      </div>
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
}: {
  title: string;
  before: string;
  after: string;
  copyText?: string;
}) {
  const [copied, setCopied] = useState(false);
  const charCount = after?.length || 0;

  // Convert newlines to <br> for proper HTML rendering, then highlight placeholders
  const renderHtml = (text: string) => {
    if (!text) return text;
    const withBreaks = text.replace(/\n/g, '<br>');
    return highlightPlaceholders(withBreaks);
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
        ATS Keywords (Pro)
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
// Pro-only: JD Analysis
// ═══════════════════════════════════════════
function JDAnalysis({ analysis }: { analysis: NonNullable<OrderResults['results']['rewrite']['jd_analysis']> }) {
  if (analysis.match_score === null) return null;
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
      {analysis.missing_keywords.length > 0 && (
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
function ReferralWidget({ code, url }: { code: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`I just got my LinkedIn profile roasted! Score went way up. Try it: ${url}`)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="li-card p-4 mb-4">
      <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--li-text-primary)' }}>
        🎁 Share & Earn ₹50
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
          {copied ? '✓ Copied!' : '📋 Copy Link'}
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
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1.5 rounded-full no-underline"
          style={{ background: '#25D366', color: 'white' }}
        >
          Share on WhatsApp
        </a>
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
      title: 'Taking Longer Than Expected',
      desc: 'We will email results within 10 minutes. Safe to close page.',
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

      // Timeout after 3 minutes
      if (Date.now() - pollStartRef.current > 180000) {
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
            {displayProgress}% complete{isStuck ? ' — still working...' : ''}
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
  const { scores, roast, rewrite } = results;
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
        {/* Score Reveal */}
        <ScoreReveal before={scores.before} after={scores.after} />

        {/* Roast Section */}
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
          Your Roast 🔥
        </h2>
        {roast.roast_points.map((point) => (
          <RoastCard key={point.point_number} point={point} total={roast.roast_points.length} />
        ))}

        {/* Closing compliment */}
        <div className="li-card p-4 mb-6">
          <p className="text-sm italic" style={{ color: 'var(--li-green)' }}>
            {roast.closing_compliment}
          </p>
        </div>

        {/* Hidden Strengths */}
        {roast.hidden_strengths && roast.hidden_strengths.length > 0 && (
          <HiddenStrengths strengths={roast.hidden_strengths} />
        )}

        {/* Rewrite Section */}
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--li-text-primary)' }}>
          Your Rewrite ✍️
        </h2>

        <RewriteSection
          title="Headline"
          before={scores.before.headline < 50 ? '(Original headline scored low)' : ''}
          after={rewrite.rewritten_headline}
        />

        <RewriteSection
          title="About"
          before=""
          after={rewrite.rewritten_about}
          copyText={formatAboutForCopy(rewrite.rewritten_about)}
        />

        {rewrite.rewritten_experience?.map((exp, i) => (
          <RewriteSection
            key={i}
            title={`${exp.title} at ${exp.company}`}
            before={exp.changes_made}
            after={formatBulletsForCopy(exp.bullets)}
            copyText={formatBulletsForCopy(exp.bullets)}
          />
        ))}

        {/* Pro-only sections */}
        {isPro && rewrite.headline_variations && (
          <HeadlineVariants variations={rewrite.headline_variations} />
        )}

        {isPro && rewrite.ats_keywords && (
          <ATSSection keywords={rewrite.ats_keywords} />
        )}

        {isPro && rewrite.jd_analysis && (
          <JDAnalysis analysis={rewrite.jd_analysis} />
        )}

        {isPro && rewrite.cover_letter && (
          <CoverLetterSection coverLetter={rewrite.cover_letter} />
        )}

        {/* Placeholder Guide */}
        <PlaceholderGuide placeholders={rewrite.placeholders_to_fill} />

        {/* Share */}
        <ShareButtons
          caption={roast.linkedin_caption}
          cardUrl={results.card_image_url}
          orderId={orderId}
          beforeScore={scores.before.overall}
          afterScore={scores.after.overall}
          referralUrl={referral_url || `https://profileroaster.in?ref=${referral_code || ''}`}
        />

        {/* Feedback */}
        <FeedbackWidget orderId={orderId} />

        {/* Referral */}
        {referral_code && <ReferralWidget code={referral_code} url={referral_url} />}

        {/* Upsell for Standard */}
        {!isPro && <UpsellBanner orderId={orderId} />}
      </div>
    </main>
  );
}

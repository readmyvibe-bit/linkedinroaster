import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/node';
import React from 'react';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'roast-cards';
const PUBLIC_BASE = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}`;

let interRegularBuffer: ArrayBuffer | null = null;
let interBoldBuffer: ArrayBuffer | null = null;

async function getFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (interRegularBuffer && interBoldBuffer) return { regular: interRegularBuffer, bold: interBoldBuffer };
  const [reg, bold] = await Promise.all([
    fetch('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf').then(r => r.arrayBuffer()),
    fetch('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuBWYMZg.ttf').then(r => r.arrayBuffer()),
  ]);
  interRegularBuffer = reg;
  interBoldBuffer = bold;
  return { regular: reg, bold };
}

export interface CardData {
  orderId: string;
  beforeScore: number;
  afterScore: number;
  headlineScore: number;
  aboutScore: number;
  experienceScore: number;
  topRoast: string;
  secondRoast: string;
  hiddenStrength: { strength: string; evidence: string; how_to_show_it: string } | null;
  closingCompliment: string;
  industry: string;
}

function ScoreBar({ width, color }: { width: number; color: string }) {
  return (
    <div style={{ width: 120, height: 5, background: '#E0E0E0', borderRadius: 3, display: 'flex' }}>
      <div style={{ width: Math.round((width / 100) * 120), height: 5, background: color, borderRadius: 3, display: 'flex' }} />
    </div>
  );
}

function CardDesign({ beforeScore, afterScore, topRoast, closingCompliment }: Omit<CardData, 'orderId'>) {
  const improvement = afterScore - beforeScore;
  const truncateAtWord = (text: string, limit: number): string => {
    if (!text || text.length <= limit) return text || '';
    const truncated = text.slice(0, limit);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.slice(0, lastSpace > 0 ? lastSpace : limit) + '...';
  };

  return (
    <div style={{ width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: '#F3F2EF', fontFamily: 'Inter' }}>

      {/* ── Header 64px ── */}
      <div style={{ height: 64, background: '#004182', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 44px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: 1, display: 'flex' }}>WHY THIS PROFILE GETS IGNORED</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', display: 'flex' }}>profileroaster.in</div>
      </div>

      {/* ── Orange line 4px ── */}
      <div style={{ height: 4, background: '#E16B00', display: 'flex' }} />

      {/* ── Content ── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* LEFT PANEL — 36% */}
        <div style={{ width: '36%', background: 'white', borderRight: '1px solid #E0E0E0', padding: '20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
          {/* Score title */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: '#9CA3AF', display: 'flex' }}>PROFILE SCORE</div>
          <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', marginTop: 3 }}>Based on recruiter scan behaviour</div>

          {/* Metric labels */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 10, color: '#111827', fontWeight: 700, display: 'flex' }}>VISIBILITY</div>
            <div style={{ fontSize: 10, color: '#D1D5DB', display: 'flex' }}>&bull;</div>
            <div style={{ fontSize: 10, color: '#111827', fontWeight: 700, display: 'flex' }}>IMPACT</div>
            <div style={{ fontSize: 10, color: '#D1D5DB', display: 'flex' }}>&bull;</div>
            <div style={{ fontSize: 10, color: '#111827', fontWeight: 700, display: 'flex' }}>CLARITY</div>
          </div>

          {/* Divider */}
          <div style={{ width: 40, height: 1, background: '#EEEEEE', display: 'flex' }} />

          {/* BEFORE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#CC1016', lineHeight: 1, display: 'flex' }}>{beforeScore}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#CC1016', letterSpacing: 2, marginTop: 2, display: 'flex' }}>BEFORE</div>
          </div>

          {/* Arrow down */}
          <div style={{ fontSize: 20, color: '#DDD', display: 'flex' }}>{'\u2193'}</div>

          {/* AFTER */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 84, fontWeight: 700, color: '#057642', lineHeight: 1, display: 'flex' }}>{afterScore}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#057642', letterSpacing: 2, marginTop: 2, display: 'flex' }}>AFTER</div>
          </div>

          {/* Points badge */}
          <div style={{ background: '#16A34A', color: 'white', fontSize: 24, fontWeight: 700, padding: '10px 28px', borderRadius: 50, boxShadow: '0 4px 12px rgba(22,163,74,0.4)', marginTop: 2, display: 'flex' }}>
            +{improvement} pts
          </div>
        </div>

        {/* RIGHT PANEL — 64% */}
        <div style={{ width: '64%', background: '#F3F2EF', padding: '18px 30px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>

          {/* Roast box */}
          <div style={{ background: 'white', borderLeft: '5px solid #E16B00', borderRadius: '0 12px 12px 0', padding: '14px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#E16B00', marginBottom: 9, display: 'flex' }}>AI SAID THIS</div>
            <div style={{ fontSize: 16, fontStyle: 'italic', color: '#191919', lineHeight: 1.7, fontWeight: 500, display: 'flex' }}>{truncateAtWord(topRoast, 180)}</div>
          </div>

          {/* Fix box */}
          <div style={{ background: 'white', borderLeft: '5px solid #057642', borderRadius: '0 12px 12px 0', padding: '13px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#057642', marginBottom: 8, display: 'flex' }}>THE FIX</div>
            <div style={{ fontSize: 15, color: '#444', lineHeight: 1.65, display: 'flex' }}>{truncateAtWord(closingCompliment, 160)}</div>
          </div>

          {/* Social proof */}
          <div style={{ background: '#FEF9F0', border: '1.5px solid #F59E0B', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'flex' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', display: 'flex' }}>500+ professionals improved their LinkedIn this week</div>
          </div>

          {/* CTA box */}
          <div style={{ background: '#0A66C2', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white', display: 'flex' }}>Check your LinkedIn score</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, display: 'flex' }}>profileroaster.in</div>
            </div>
            <div style={{ fontSize: 30, color: 'white', display: 'flex' }}>{'\u2192'}</div>
          </div>
        </div>
      </div>

      {/* ── Footer 48px ── */}
      <div style={{ height: 48, background: '#004182', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 44px' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 700, display: 'flex' }}>This is why recruiters finally started replying</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex' }}>profileroaster.in</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex' }}>#LinkedInRoast</div>
      </div>
    </div>
  );
}

export async function generateAndUploadCard(data: CardData): Promise<string | null> {
  try {
    const fonts = await getFonts();

    const svg = await satori(
      React.createElement(CardDesign, {
        beforeScore: data.beforeScore,
        afterScore: data.afterScore,
        headlineScore: data.headlineScore,
        aboutScore: data.aboutScore,
        experienceScore: data.experienceScore,
        topRoast: data.topRoast,
        secondRoast: data.secondRoast,
        hiddenStrength: data.hiddenStrength,
        closingCompliment: data.closingCompliment,
        industry: data.industry,
      }),
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' },
          { name: 'Inter', data: fonts.bold, weight: 700, style: 'normal' },
        ],
      },
    );

    const resvg = new Resvg(svg, { fitTo: { mode: 'zoom', value: 3 } });
    const png = resvg.render().asPng();
    const filePath = `cards/${data.orderId}.png`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, png, {
        contentType: 'image/png',
        cacheControl: '60',
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      return null;
    }

    return `${PUBLIC_BASE}/${filePath}`;
  } catch (err) {
    console.error('Card generation error:', (err as Error).message);
    Sentry.captureException(err, { extra: { orderId: data.orderId } });
    return null;
  }
}

// ═══════════════════════════════════════════
// Roast Sheet — Combined 6-point report PNG
// ═══════════════════════════════════════════
export interface RoastSheetData {
  orderId: string;
  beforeScore: number;
  afterScore: number;
  headlineScore: number;
  aboutScore: number;
  experienceScore: number;
  roastPoints: Array<{
    section_targeted: string;
    roast: string;
    underlying_issue: string;
  }>;
}

// Build the roast sheet element tree using React.createElement directly
// to avoid JSX runtime compatibility issues with Satori
function buildRoastSheetElement(data: {
  beforeScore: number; afterScore: number;
  headlineScore: number; aboutScore: number; experienceScore: number;
  roastPoints: Array<{ section_targeted: string; roast: string; underlying_issue: string }>;
}): React.ReactElement {
  const h = React.createElement;
  const { beforeScore, afterScore, headlineScore, aboutScore, experienceScore, roastPoints } = data;
  const points = roastPoints.slice(0, 6);

  const truncateText = (text: string | undefined, maxChars: number): string => {
    if (!text) return '';
    if (text.length <= maxChars) return text;
    const truncated = text.slice(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    return truncated.slice(0, lastSpace > 0 ? lastSpace : maxChars) + '...';
  };

  const pill = (label: string, value: number, color: string) =>
    h('div', { style: { background: '#F3F2EF', border: '1px solid #E0E0E0', borderRadius: 10, padding: '4px 10px', fontSize: 11, color: '#555', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 } },
      h('div', { style: { width: 6, height: 6, borderRadius: 3, background: color, flexShrink: 0 } }),
      h('div', { style: { display: 'flex' } }, `${label} ${value}`)
    );

  const cards = points.map((point, index) =>
    h('div', { key: index, style: { width: 373, height: 220, margin: '0 6px 12px 0', background: 'white', borderRadius: 10, border: '1px solid #E0E0E0', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 } },
      // TOP — Header 30px
      h('div', { style: { height: 30, background: '#0A66C2', padding: '0 12px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } },
        h('div', { style: { color: 'white', fontSize: 9, fontWeight: 700, letterSpacing: 1 } }, 'ROAST'),
        h('div', { style: { color: 'rgba(255,255,255,0.5)', fontSize: 9 } }, `Point ${index + 1} / ${points.length}`)
      ),
      // TOP — Section Tag 22px
      h('div', { style: { height: 22, background: '#F3F2EF', padding: '4px 12px 0', flexShrink: 0, display: 'flex', flexDirection: 'row' } },
        h('div', { style: { display: 'flex', flexDirection: 'row', background: 'white', border: '1px solid #E0E0E0', borderRadius: 6, padding: '1px 7px' } },
          h('div', { style: { fontSize: 7, fontWeight: 700, color: '#666', letterSpacing: 0.5 } }, (point.section_targeted || 'PROFILE').toUpperCase().slice(0, 12))
        )
      ),
      // MIDDLE — Roast text fills remaining space
      h('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', background: '#F3F2EF', padding: '0 12px', overflow: 'hidden' } },
        h('div', { style: { marginTop: 8, fontSize: 10.5, lineHeight: 1.65, color: '#191919', overflow: 'hidden' } }, truncateText(point.roast, 320))
      ),
      // BOTTOM — Issue block attached below text
      h('div', { style: { borderTop: '1px solid #E5E7EB', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 6, flexShrink: 0, padding: '8px 12px 10px' } },
        h('div', { style: { fontSize: 10, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '3px 6px', borderRadius: 4, flexShrink: 0 } }, 'ISSUE'),
        h('div', { style: { fontSize: 11, color: '#444', lineHeight: 1.45, overflow: 'hidden' } }, truncateText(point.underlying_issue, 150))
      )
    )
  );

  return h('div', { style: { width: 1200, height: 694, display: 'flex', flexDirection: 'column', background: '#F3F2EF', overflow: 'hidden', fontFamily: 'Inter' } },
    // HEADER 70px
    h('div', { style: { width: 1200, height: 70, background: '#0A66C2', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', flexShrink: 0 } },
      h('div', { style: { color: 'white', fontSize: 18, fontWeight: 700, letterSpacing: 2 } }, 'LINKEDIN PROFILE ROAST REPORT'),
      h('div', { style: { color: 'rgba(255,255,255,0.65)', fontSize: 13 } }, 'profileroaster.in')
    ),
    // ORANGE ACCENT 4px
    h('div', { style: { width: 1200, height: 4, background: '#E16B00', flexShrink: 0 } }),
    // SCORE ROW 106px
    h('div', { style: { width: 1200, height: 106, background: 'white', display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0 48px', gap: 20, borderBottom: '1px solid #E0E0E0', flexShrink: 0 } },
      h('div', { style: { width: 64, height: 64, borderRadius: 32, border: '5px solid #CC1016', background: '#FEE2E2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
        h('div', { style: { fontSize: 22, fontWeight: 700, color: '#CC1016', lineHeight: 1 } }, String(beforeScore)),
        h('div', { style: { fontSize: 8, color: '#CC1016', fontWeight: 700, letterSpacing: 1, marginTop: 2 } }, 'BEFORE')
      ),
      h('div', { style: { fontSize: 18, color: '#aaa', flexShrink: 0 } }, '->'),
      h('div', { style: { background: '#057642', color: 'white', fontSize: 14, fontWeight: 700, borderRadius: 12, padding: '6px 16px', flexShrink: 0 } }, `+${afterScore - beforeScore} pts`),
      h('div', { style: { width: 76, height: 76, borderRadius: 38, border: '6px solid #057642', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } },
        h('div', { style: { fontSize: 26, fontWeight: 700, color: '#057642', lineHeight: 1 } }, String(afterScore)),
        h('div', { style: { fontSize: 8, color: '#057642', fontWeight: 700, letterSpacing: 1, marginTop: 2 } }, 'AFTER')
      ),
      h('div', { style: { marginLeft: 'auto', display: 'flex', flexDirection: 'row', gap: 8 } },
        pill('Headline', headlineScore, '#0A66C2'),
        pill('About', aboutScore, '#E16B00'),
        pill('Experience', experienceScore, '#057642')
      )
    ),
    // ROAST GRID 400px
    h('div', { style: { width: 1200, height: 464, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', padding: '12px 20px', gap: 0, background: '#F3F2EF', flexShrink: 0, overflow: 'hidden' } }, ...cards),
    // FOOTER 50px
    h('div', { style: { width: 1200, height: 50, background: '#004182', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', flexShrink: 0 } },
      h('div', { style: { color: 'rgba(255,255,255,0.65)', fontSize: 12 } }, 'Get your profile roasted at'),
      h('div', { style: { color: 'white', fontSize: 15, fontWeight: 700 } }, 'profileroaster.in'),
      h('div', { style: { color: 'rgba(255,255,255,0.5)', fontSize: 12 } }, '#LinkedInRoast')
    )
  );
}

export async function generateAndUploadRoastSheet(data: RoastSheetData): Promise<string | null> {
  try {
    const fonts = await getFonts();

    const element = buildRoastSheetElement({
      beforeScore: data.beforeScore,
      afterScore: data.afterScore,
      headlineScore: data.headlineScore,
      aboutScore: data.aboutScore,
      experienceScore: data.experienceScore,
      roastPoints: data.roastPoints,
    });

    const svg = await satori(element, {
      width: 1200,
      height: 694,
      fonts: [
        { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' as const },
        { name: 'Inter', data: fonts.bold, weight: 700, style: 'normal' as const },
      ],
    });

    const resvg = new Resvg(svg, { fitTo: { mode: 'zoom', value: 3 } });
    const png = resvg.render().asPng();
    const filePath = `sheets/${data.orderId}.png`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, png, {
        contentType: 'image/png',
        cacheControl: '60',
        upsert: true,
      });

    if (error) {
      console.error('Supabase sheet upload error:', error.message);
      return null;
    }

    return `${PUBLIC_BASE}/${filePath}`;
  } catch (err) {
    console.error('Roast sheet generation error:', (err as Error).message, (err as Error).stack);
    Sentry.captureException(err, { extra: { orderId: data.orderId } });
    return null;
  }
}

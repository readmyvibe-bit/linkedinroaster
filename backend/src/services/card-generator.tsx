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
  hiddenStrength: { strength: string; evidence: string; how_to_show_it: string } | null;
  rewrittenHeadline: string;
  industry: string;
}

function ScoreBar({ width, color }: { width: number; color: string }) {
  return (
    <div style={{ width: 120, height: 5, background: '#E0E0E0', borderRadius: 3, display: 'flex' }}>
      <div style={{ width: Math.round((width / 100) * 120), height: 5, background: color, borderRadius: 3, display: 'flex' }} />
    </div>
  );
}

function CardDesign({ beforeScore, afterScore, rewrittenHeadline }: Omit<CardData, 'orderId'>) {
  const improvement = afterScore - beforeScore;

  // Format headline for display (max 18 words)
  function formatHeadline(headline: string): string {
    if (!headline) return '';
    if (headline.length <= 120) return headline;
    return headline.split(' ').slice(0, 18).join(' ') + '...';
  }

  const afterHeadline = formatHeadline(rewrittenHeadline || 'AI-powered LinkedIn transformation');

  return (
    <div style={{ width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: '#F3F2EF', fontFamily: 'Inter' }}>

      {/* ── Header 64px ── */}
      <div style={{ height: 64, background: '#004182', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 44px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'white', letterSpacing: 1, display: 'flex' }}>LINKEDIN PROFILE TRANSFORMATION</div>
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

        {/* RIGHT PANEL — 64% — Compliment only */}
        <div style={{ width: '64%', background: '#F3F2EF', padding: '18px 30px', display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>

          {/* Compliment box */}
          <div style={{ background: 'white', borderLeft: '5px solid #057642', borderRadius: '0 12px 12px 0', padding: '18px 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#057642', marginBottom: 10, display: 'flex' }}>REWRITTEN HEADLINE</div>
            <div style={{ fontSize: 18, color: '#191919', lineHeight: 1.6, fontWeight: 600, display: 'flex' }}>{afterHeadline}</div>
          </div>

          {/* Social proof */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'flex' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#057642', display: 'flex' }}>500+ professionals improved their LinkedIn this week</div>
          </div>

          {/* CTA box */}
          <div style={{ background: '#0A66C2', borderRadius: 10, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'white', display: 'flex' }}>Get your LinkedIn score</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2, display: 'flex' }}>profileroaster.in</div>
            </div>
            <div style={{ fontSize: 30, color: 'white', display: 'flex' }}>{'\u2192'}</div>
          </div>
        </div>
      </div>

      {/* ── Footer 48px ── */}
      <div style={{ height: 48, background: '#004182', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 44px' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 700, display: 'flex' }}>AI-powered LinkedIn optimization</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex' }}>profileroaster.in</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex' }}>#ProfileTransformation</div>
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
        hiddenStrength: data.hiddenStrength,
        rewrittenHeadline: data.rewrittenHeadline,
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

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
  industry: string;
}

function ScoreBar({ width, color }: { width: number; color: string }) {
  return (
    <div style={{ width: 120, height: 5, background: '#E0E0E0', borderRadius: 3, display: 'flex' }}>
      <div style={{ width: Math.round((width / 100) * 120), height: 5, background: color, borderRadius: 3, display: 'flex' }} />
    </div>
  );
}

function CardDesign({ beforeScore, afterScore, headlineScore, aboutScore, experienceScore, topRoast, secondRoast, hiddenStrength, industry }: Omit<CardData, 'orderId'>) {
  const improvement = afterScore - beforeScore;
  const truncRoast = topRoast.length > 200 ? topRoast.substring(0, 200) + '...' : topRoast;
  const hasStrength = hiddenStrength && hiddenStrength.strength;
  const truncEvidence = hasStrength && hiddenStrength.evidence
    ? (hiddenStrength.evidence.length > 100 ? hiddenStrength.evidence.substring(0, 100) + '...' : hiddenStrength.evidence)
    : '';
  const truncHowTo = hasStrength && hiddenStrength.how_to_show_it
    ? (hiddenStrength.how_to_show_it.length > 120 ? hiddenStrength.how_to_show_it.substring(0, 120) + '...' : hiddenStrength.how_to_show_it)
    : '';
  const truncSecond = secondRoast
    ? (secondRoast.length > 200 ? secondRoast.substring(0, 200) + '...' : secondRoast)
    : '';

  const scores = [
    { label: '✏️ Headline', value: headlineScore, color: '#0A66C2' },
    { label: '📝 About', value: aboutScore, color: '#E16B00' },
    { label: '💼 Experience', value: experienceScore, color: '#057642' },
  ];

  return (
    <div style={{ width: 1200, height: 630, display: 'flex', flexDirection: 'column', background: '#F3F2EF', fontFamily: 'Inter' }}>

      {/* ── Header ── */}
      <div style={{
        height: 70, background: '#004182',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 28, display: 'flex' }}>🔥</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: 3, display: 'flex' }}>
              LINKEDIN PROFILE ROAST
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 3, display: 'flex' }}>
              ROAST &bull; REWRITE &bull; IMPROVE
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'white', display: 'flex' }}>
            profileroaster.in
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
            AI-Powered Profile Analysis
          </div>
        </div>
      </div>
      <div style={{ height: 4, background: '#057642', display: 'flex' }} />

      {/* ── Top section — scores ── */}
      <div style={{
        background: 'white', padding: '16px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #E0E0E0',
      }}>
        {/* Left — score transformation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* BEFORE */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: 50,
              border: '7px solid #CC1016', background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 38, fontWeight: 700, color: '#CC1016', display: 'flex' }}>{beforeScore}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#CC1016', letterSpacing: 2, marginTop: 4, display: 'flex' }}>📉 BEFORE</div>
          </div>

          {/* Arrow */}
          <div style={{ fontSize: 24, color: '#AAAAAA', display: 'flex' }}>{'\u2192'}</div>

          {/* AFTER */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 120, height: 120, borderRadius: 60,
              border: '8px solid #057642', background: '#F0FDF4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 48, fontWeight: 700, color: '#057642', display: 'flex' }}>{afterScore}</div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#057642', letterSpacing: 2, marginTop: 4, display: 'flex' }}>📈 AFTER</div>
          </div>

          {/* Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              background: '#057642', color: 'white', borderRadius: 20,
              padding: '7px 18px', fontSize: 16, fontWeight: 700, display: 'flex',
            }}>
              +{improvement} pts
            </div>
            <div style={{ fontSize: 11, color: '#057642', fontWeight: 700, display: 'flex' }}>🎯 improvement</div>
          </div>
        </div>

        {/* Right — sub-score bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scores.map((s) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: 4, background: s.color, display: 'flex' }} />
              <div style={{ fontSize: 13, color: '#333333', width: 115, fontWeight: 700, display: 'flex' }}>{s.label}</div>
              <ScoreBar width={s.value} color={s.color} />
              <div style={{ fontSize: 14, fontWeight: 700, color: s.color, width: 28, display: 'flex' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── What changed — pill badges ── */}
      <div style={{
        background: 'white', borderBottom: '1px solid #E0E0E0',
        padding: '10px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        {[
          { icon: '✍️', text: 'Headline Rewritten' },
          { icon: '📄', text: 'About Optimized' },
          { icon: '🔍', text: `${Math.max(improvement - 10, 3)} Issues Fixed` },
          { icon: '🏷️', text: 'ATS Keywords Added' },
        ].map((p) => (
          <div key={p.text} style={{
            background: '#F3F2EF', border: '1px solid #E0E0E0', borderRadius: 16,
            padding: '4px 12px', fontSize: 12, color: '#555555', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <div style={{ display: 'flex' }}>{p.icon}</div>
            <div style={{ display: 'flex' }}>{p.text}</div>
          </div>
        ))}
      </div>

      {/* ── Bottom two columns ── */}
      <div style={{ display: 'flex', flex: 1 }}>

        {/* Left — Roast */}
        <div style={{
          width: '50%', background: 'white', borderRight: '1px solid #E0E0E0',
          padding: '18px 28px', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 16, display: 'flex' }}>🔥</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#E16B00', letterSpacing: 2, display: 'flex' }}>
              THE BRUTAL TRUTH
            </div>
          </div>
          <div style={{
            background: '#FFF8F5', border: '1px solid #F0E0D6',
            borderLeft: '4px solid #E16B00', borderRadius: 10,
            padding: '14px 16px', flex: 1, display: 'flex',
          }}>
            <div style={{ fontSize: 17, color: '#1A1A1A', fontStyle: 'italic', lineHeight: 1.65, display: 'flex' }}>
              &ldquo;{truncRoast}&rdquo;
            </div>
          </div>
        </div>

        {/* Right — Strength or second roast */}
        {hasStrength ? (
          <div style={{
            width: '50%', background: '#F9FAFB',
            padding: '18px 28px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 16, display: 'flex' }}>💡</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#057642', letterSpacing: 2, display: 'flex' }}>
                HIDDEN STRENGTH
              </div>
            </div>
            <div style={{
              background: 'white', border: '1px solid #D6E9D6',
              borderLeft: '4px solid #057642', borderRadius: 10,
              padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#057642', marginBottom: 8, display: 'flex' }}>
                ⭐ {hiddenStrength!.strength}
              </div>
              {truncEvidence && (
                <div style={{ fontSize: 14, color: '#444444', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.55, display: 'flex' }}>
                  &ldquo;{truncEvidence}&rdquo;
                </div>
              )}
              <div style={{ fontSize: 15, color: '#1A1A1A', lineHeight: 1.6, fontWeight: 500, display: 'flex' }}>
                👉 {truncHowTo}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            width: '50%', background: '#F9FAFB',
            padding: '18px 28px', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 16, display: 'flex' }}>🔥</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E16B00', letterSpacing: 2, display: 'flex' }}>
                MORE FROM YOUR ROAST
              </div>
            </div>
            <div style={{
              background: 'white', border: '1px solid #F0E0D6',
              borderLeft: '4px solid #E16B00', borderRadius: 10,
              padding: '16px 18px', flex: 1, display: 'flex',
            }}>
              <div style={{ fontSize: 17, color: '#1A1A1A', fontStyle: 'italic', lineHeight: 1.65, display: 'flex' }}>
                &ldquo;{truncSecond}&rdquo;
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{
        height: 52, background: '#004182',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 14, display: 'flex' }}>🚀</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', display: 'flex' }}>
            Get yours free at profileroaster.in
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex' }}>
            #{industry.toLowerCase().replace(/\s+/g, '')}
          </div>
          <div style={{ fontSize: 14, display: 'flex' }}>📈</div>
        </div>
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

    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } });
    const png = resvg.render().asPng();
    const filePath = `cards/${data.orderId}.png`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, png, {
        contentType: 'image/png',
        cacheControl: '31536000',
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

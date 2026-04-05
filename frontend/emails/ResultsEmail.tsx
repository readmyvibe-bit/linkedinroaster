import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Link, Preview, Row, Column,
} from '@react-email/components';
import * as React from 'react';

interface ResultsEmailProps {
  beforeScore: { headline: number; about: number; experience: number; completeness: number; overall: number };
  afterScore: { headline: number; about: number; experience: number; completeness: number; overall: number };
  rewrite: {
    rewritten_headline: string;
    rewritten_about: string;
    rewritten_experience: Array<{ title: string; company: string; bullets: string[] }>;
    headline_variations?: Array<{ headline: string; style: string }>;
  };
  cardImageUrl: string | null;
  orderId: string;
  plan: string;
}

export default function ResultsEmail({
  beforeScore,
  afterScore,
  rewrite,
  cardImageUrl,
  orderId,
  plan,
}: ResultsEmailProps) {
  const resultsUrl = `https://profileroaster.in/results/${orderId}`;
  const improvement = afterScore.overall - beforeScore.overall;

  return (
    <Html>
      <Head />
      <Preview>{`Your profile score: ${beforeScore.overall} → ${afterScore.overall} | ProfileRoaster`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>ProfileRoaster</Text>
            <Text style={subheaderText}>Your Resume + LinkedIn Rewrite</Text>
          </Section>

          {/* Score Comparison */}
          <Section style={scoreSection}>
            <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '40%', textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                    <div style={beforeBox}>
                      <Text style={scoreLabel}>BEFORE</Text>
                      <Text style={scoreNumber}>{beforeScore.overall}</Text>
                    </div>
                  </td>
                  <td style={{ width: '20%', textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                    <Text style={{ fontSize: '24px', margin: '0', color: '#999' }}>→</Text>
                  </td>
                  <td style={{ width: '40%', textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                    <div style={afterBox}>
                      <Text style={scoreLabel}>AFTER</Text>
                      <Text style={scoreNumberGreen}>{afterScore.overall}</Text>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            {improvement > 0 && (
              <Text style={improvementText}>
                +{improvement} point improvement
              </Text>
            )}
          </Section>

          <Hr style={divider} />

          {/* Rewrite: Headline */}
          <Section>
            <Text style={sectionTitle}>Your New Headline</Text>
            <div style={rewriteCard}>
              <Text style={rewriteText}>{rewrite.rewritten_headline}</Text>
            </div>
          </Section>

          {/* Rewrite: About (truncated for email) */}
          <Section>
            <Text style={sectionTitle}>Your New About Section</Text>
            <div style={rewriteCard}>
              <Text style={rewriteTextSmall}>
                {rewrite.rewritten_about?.length > 500
                  ? rewrite.rewritten_about.slice(0, 500) + '...'
                  : rewrite.rewritten_about}
              </Text>
            </div>
          </Section>

          {/* Rewrite: Experience (first 2 only for email) */}
          {rewrite.rewritten_experience?.slice(0, 2).map((exp, i) => (
            <Section key={i} style={{ padding: '0 24px' }}>
              <Text style={expTitle}>{exp.title} at {exp.company}</Text>
              {exp.bullets?.slice(0, 3).map((bullet, j) => (
                <Text key={j} style={bulletText}>• {bullet}</Text>
              ))}
            </Section>
          ))}
          {(rewrite.rewritten_experience?.length || 0) > 2 && (
            <Text style={{ fontSize: '12px', color: '#0A66C2', padding: '4px 24px', margin: '0' }}>
              + {rewrite.rewritten_experience.length - 2} more roles — view full results
            </Text>
          )}

          {/* Pro: Headline Variations */}
          {plan === 'pro' && rewrite.headline_variations && rewrite.headline_variations.length > 1 && (
            <Section>
              <Hr style={divider} />
              <Text style={sectionTitle}>Headline Variations (Pro)</Text>
              {rewrite.headline_variations.slice(0, 3).map((v, i) => (
                <div key={i} style={variationRow}>
                  <Text style={variationStyle}>{v.style}</Text>
                  <Text style={variationHeadline}>{v.headline}</Text>
                </div>
              ))}
            </Section>
          )}

          <Hr style={divider} />

          {/* What's Included */}
          <Section style={{ padding: '0 24px' }}>
            <Text style={{ fontSize: '14px', fontWeight: '700' as const, color: '#191919', margin: '0 0 12px' }}>What's ready for you:</Text>
            <table cellPadding="0" cellSpacing="0" style={{ width: '100%' }}>
              <tbody>
                {[
                  'Complete LinkedIn profile rewrite',
                  'ATS-optimized resume builder (11 templates)',
                  'Personalized interview prep (15 questions)',
                  'Cover letter generator',
                ].map((item, i) => (
                  <tr key={i}>
                    <td style={{ padding: '4px 0', fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>
                      ✓ {item}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={divider} />

          {/* CTA */}
          <Section style={{ textAlign: 'center' as const, padding: '8px 24px 24px' }}>
            <Button style={ctaButton} href={resultsUrl}>
              View Full Results →
            </Button>
          </Section>

          {/* Upsell for Standard */}
          {plan === 'standard' && (
            <Section style={upsellSection}>
              <Text style={upsellTitle}>Upgrade to Pro — ₹500</Text>
              <Text style={upsellDesc}>
                5 headline variations, all 11 premium templates, job-tailored cover letter, interview prep.
              </Text>
              <Button style={upsellButton} href={`${resultsUrl}#upgrade`}>
                Upgrade Now →
              </Button>
            </Section>
          )}

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://profileroaster.in" style={footerLink}>profileroaster.in</Link>
              {' | '}
              <Link href="https://profileroaster.in/privacy" style={footerLink}>Privacy</Link>
            </Text>
            <Text style={footerMuted}>
              You received this because you used ProfileRoaster.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───
const main = { backgroundColor: '#F4F6F9', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };
const container: React.CSSProperties = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden' as const, width: '100%', boxSizing: 'border-box' as const };
const header = { backgroundColor: '#004182', padding: '24px 24px 20px', textAlign: 'center' as const };
const headerText = { color: '#FFFFFF', fontSize: '20px', fontWeight: '700' as const, margin: '0' };
const subheaderText = { color: '#FFFFFF', fontSize: '14px', opacity: 0.85, margin: '4px 0 0' };
const scoreSection = { padding: '24px', textAlign: 'center' as const };
const beforeBox: React.CSSProperties = { backgroundColor: '#FEE2E2', borderRadius: '8px', padding: '12px 16px', display: 'inline-block' as const };
const afterBox: React.CSSProperties = { backgroundColor: '#DCFCE7', borderRadius: '8px', padding: '12px 16px', display: 'inline-block' as const };
const scoreLabel = { fontSize: '10px', fontWeight: '700' as const, letterSpacing: '1px', margin: '0', color: '#666666' };
const scoreNumber = { fontSize: '32px', fontWeight: '800' as const, margin: '4px 0 0', color: '#CC1016' };
const scoreNumberGreen = { fontSize: '32px', fontWeight: '800' as const, margin: '4px 0 0', color: '#057642' };
const improvementText = { fontSize: '14px', color: '#057642', fontWeight: '600' as const, marginTop: '12px' };
const divider = { borderColor: '#E0E0E0', margin: '20px 0' };
const sectionTitle = { fontSize: '16px', fontWeight: '700' as const, color: '#191919', padding: '0 24px', margin: '0 0 8px' };
const rewriteCard: React.CSSProperties = { margin: '0 24px 16px', padding: '12px 16px', backgroundColor: '#F0F9FF', borderLeft: '3px solid #0A66C2', borderRadius: '4px', boxSizing: 'border-box' as const, maxWidth: 'calc(100% - 48px)', wordBreak: 'break-word' as const };
const rewriteText = { fontSize: '15px', fontWeight: '600' as const, color: '#191919', margin: '0', lineHeight: '1.4' };
const rewriteTextSmall = { fontSize: '13px', color: '#191919', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const, overflowWrap: 'break-word' as const };
const expTitle = { fontSize: '14px', fontWeight: '600' as const, color: '#191919', margin: '8px 0 2px' };
const bulletText = { fontSize: '12px', color: '#374151', padding: '0 0 0 12px', margin: '3px 0', lineHeight: '1.5' };
const variationRow: React.CSSProperties = { margin: '4px 24px', padding: '8px 12px', backgroundColor: '#F3F2EF', borderRadius: '4px' };
const variationStyle = { fontSize: '10px', fontWeight: '600' as const, color: '#0A66C2', margin: '0', textTransform: 'uppercase' as const };
const variationHeadline = { fontSize: '13px', color: '#191919', margin: '2px 0 0' };
const ctaButton = { backgroundColor: '#0A66C2', color: '#FFFFFF', padding: '12px 32px', borderRadius: '24px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' };
const upsellSection: React.CSSProperties = { margin: '0 24px 24px', padding: '16px', backgroundColor: '#004182', borderRadius: '8px', textAlign: 'center' as const };
const upsellTitle = { color: '#FFFFFF', fontSize: '16px', fontWeight: '700' as const, margin: '0 0 4px' };
const upsellDesc = { color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: '0 0 12px', lineHeight: '1.5' };
const upsellButton = { backgroundColor: '#FFFFFF', color: '#0A66C2', padding: '10px 24px', borderRadius: '24px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none' };
const footer: React.CSSProperties = { padding: '20px 24px', textAlign: 'center' as const, backgroundColor: '#F4F6F9' };
const footerText = { fontSize: '12px', color: '#666666', margin: '0' };
const footerLink = { color: '#0A66C2', textDecoration: 'none' };
const footerMuted = { fontSize: '11px', color: '#999999', marginTop: '8px' };

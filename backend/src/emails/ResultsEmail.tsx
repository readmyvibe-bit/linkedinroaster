import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Link, Preview, Row, Column,
} from '@react-email/components';
import * as React from 'react';

interface ResultsEmailProps {
  beforeScore: { headline: number; about: number; experience: number; completeness: number; ats?: number; overall: number };
  afterScore: { headline: number; about: number; experience: number; completeness: number; ats?: number; overall: number };
  roast: any; // kept for backward compat but not rendered
  rewrite: {
    rewritten_headline: string;
    rewritten_about: string;
    rewritten_experience: Array<{ title: string; company: string; bullets: string[] }>;
    headline_variations?: Array<{ headline: string; style: string }>;
    personalization_note?: string;
  };
  cardImageUrl: string | null; // kept for backward compat but not rendered
  orderId: string;
  plan: string;
}

export default function ResultsEmail({
  beforeScore,
  afterScore,
  rewrite,
  orderId,
  plan,
}: ResultsEmailProps) {
  const resultsUrl = `https://profileroaster.in/results/${orderId}`;

  return (
    <Html>
      <Head />
      <Preview>{`Your LinkedIn profile rewrite is ready! Score: ${beforeScore.overall} → ${afterScore.overall}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>ProfileRoaster</Text>
            <Text style={subheaderText}>Your Profile Rewrite is Ready</Text>
          </Section>

          {/* Score Comparison */}
          <Section style={scoreSection}>
            <Row>
              <Column style={scoreCol}>
                <div style={beforeBox}>
                  <Text style={scoreLabel}>BEFORE</Text>
                  <Text style={scoreNumber}>{beforeScore.overall}</Text>
                </div>
              </Column>
              <Column style={{ width: '40px', textAlign: 'center' as const, verticalAlign: 'middle' as const }}>
                <Text style={{ fontSize: '24px', margin: '0' }}>→</Text>
              </Column>
              <Column style={scoreCol}>
                <div style={afterBox}>
                  <Text style={scoreLabel}>AFTER</Text>
                  <Text style={scoreNumberGreen}>{afterScore.overall}</Text>
                </div>
              </Column>
            </Row>
            <Text style={improvementText}>
              +{afterScore.overall - beforeScore.overall} point improvement
            </Text>
          </Section>

          {/* Save This Email Box */}
          <Section style={saveBox}>
            <Text style={saveTitle}>Save this email — your results link is valid for 30 days</Text>
            <Button style={ctaButton} href={resultsUrl}>
              View My Full Results →
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Rewrite: Headline */}
          <Section>
            <Text style={sectionTitle}>Your New Headline</Text>
            <Section style={rewriteCard}>
              <Text style={rewriteText}>{rewrite.rewritten_headline}</Text>
            </Section>
          </Section>

          {/* Rewrite: About */}
          <Section>
            <Text style={sectionTitle}>Your New About Section</Text>
            <Section style={rewriteCard}>
              <Text style={rewriteTextSmall}>{rewrite.rewritten_about}</Text>
            </Section>
          </Section>

          {/* Rewrite: Experience */}
          {rewrite.rewritten_experience?.map((exp, i) => (
            <Section key={i}>
              <Text style={expTitle}>{exp.title} at {exp.company}</Text>
              {exp.bullets.map((bullet, j) => (
                <Text key={j} style={bulletText}>• {bullet}</Text>
              ))}
            </Section>
          ))}

          {/* Pro: Headline Variations */}
          {plan === 'pro' && rewrite.headline_variations && (
            <Section>
              <Hr style={divider} />
              <Text style={sectionTitle}>Headline Variations (Pro)</Text>
              {rewrite.headline_variations.map((v, i) => (
                <Section key={i} style={variationRow}>
                  <Text style={variationStyle}>{v.style}</Text>
                  <Text style={variationHeadline}>{v.headline}</Text>
                </Section>
              ))}
            </Section>
          )}

          <Hr style={divider} />

          {/* What's included */}
          <Section style={{ padding: '0 24px', marginBottom: '16px' }}>
            <Text style={{ fontSize: '14px', fontWeight: '600' as const, color: '#191919', margin: '0 0 8px' }}>Your plan also includes:</Text>
            <Text style={{ fontSize: '13px', color: '#555', margin: '0', lineHeight: '1.8' }}>
              ✓ ATS Resume Builder ({plan === 'pro' ? '10' : '5'} resumes){'\n'}
              ✓ Cover Letter Generator{'\n'}
              ✓ Interview Prep (15 personalized questions + cheat sheet + quiz)
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center' as const, margin: '24px 0' }}>
            <Button style={ctaButton} href={resultsUrl}>
              View Full Results + Generate Resume →
            </Button>
          </Section>

          {/* Upsell for Standard */}
          {plan === 'standard' && (
            <Section style={upsellSection}>
              <Text style={upsellTitle}>Upgrade to Pro — ₹500</Text>
              <Text style={upsellDesc}>
                All 28 premium templates + priority processing
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
              You received this because you purchased a LinkedIn profile rewrite.
            </Text>
            <Text style={footerMuted}>
              Lost this email? Recover your results at{' '}
              <Link href="https://profileroaster.in/recover" style={footerLink}>profileroaster.in/recover</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───
const main = { backgroundColor: '#F3F2EF', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };
const container = { maxWidth: '580px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden' as const };
const header = { backgroundColor: '#004182', padding: '24px', textAlign: 'center' as const };
const headerText = { color: '#FFFFFF', fontSize: '20px', fontWeight: '700' as const, margin: '0' };
const subheaderText = { color: '#FFFFFF', fontSize: '14px', opacity: 0.9, margin: '4px 0 0' };
const scoreSection = { padding: '24px', textAlign: 'center' as const };
const scoreCol = { width: '45%', textAlign: 'center' as const };
const beforeBox = { backgroundColor: '#FEE2E2', borderRadius: '8px', padding: '16px', display: 'inline-block' as const };
const afterBox = { backgroundColor: '#DCFCE7', borderRadius: '8px', padding: '16px', display: 'inline-block' as const };
const scoreLabel = { fontSize: '11px', fontWeight: '700' as const, letterSpacing: '1px', margin: '0', color: '#666666' };
const scoreNumber = { fontSize: '36px', fontWeight: '800' as const, margin: '4px 0 0', color: '#CC1016' };
const scoreNumberGreen = { fontSize: '36px', fontWeight: '800' as const, margin: '4px 0 0', color: '#057642' };
const improvementText = { fontSize: '14px', color: '#057642', fontWeight: '600' as const, marginTop: '12px' };
const saveBox = { margin: '0 24px', padding: '14px 18px', backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', borderLeft: '4px solid #F59E0B', borderRadius: '8px', textAlign: 'center' as const };
const saveTitle = { fontSize: '14px', fontWeight: '700' as const, color: '#92400E', margin: '0 0 12px' };
const divider = { borderColor: '#E0E0E0', margin: '24px 0' };
const sectionTitle = { fontSize: '18px', fontWeight: '700' as const, color: '#191919', padding: '0 24px' };
const rewriteCard = { margin: '8px 24px', padding: '12px 16px', backgroundColor: '#F0F9FF', borderLeft: '3px solid #0A66C2', borderRadius: '4px' };
const rewriteText = { fontSize: '16px', fontWeight: '600' as const, color: '#191919', margin: '0', lineHeight: '1.4' };
const rewriteTextSmall = { fontSize: '13px', color: '#191919', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const };
const expTitle = { fontSize: '14px', fontWeight: '600' as const, color: '#191919', padding: '8px 24px 0', margin: '0' };
const bulletText = { fontSize: '13px', color: '#191919', padding: '0 24px 0 36px', margin: '4px 0', lineHeight: '1.5' };
const variationRow = { margin: '4px 24px', padding: '8px 12px', backgroundColor: '#F3F2EF', borderRadius: '4px' };
const variationStyle = { fontSize: '10px', fontWeight: '600' as const, color: '#0A66C2', margin: '0', textTransform: 'uppercase' as const };
const variationHeadline = { fontSize: '13px', color: '#191919', margin: '2px 0 0' };
const ctaButton = { backgroundColor: '#0A66C2', color: '#FFFFFF', padding: '12px 32px', borderRadius: '24px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' };
const upsellSection = { margin: '0 24px 24px', padding: '16px', backgroundColor: '#004182', borderRadius: '8px', textAlign: 'center' as const };
const upsellTitle = { color: '#FFFFFF', fontSize: '16px', fontWeight: '700' as const, margin: '0 0 4px' };
const upsellDesc = { color: 'rgba(255,255,255,0.8)', fontSize: '12px', margin: '0 0 12px' };
const upsellButton = { backgroundColor: '#FFFFFF', color: '#0A66C2', padding: '10px 24px', borderRadius: '24px', fontSize: '13px', fontWeight: '600' as const, textDecoration: 'none' };
const footer = { padding: '24px', textAlign: 'center' as const, backgroundColor: '#F3F2EF' };
const footerText = { fontSize: '12px', color: '#666666', margin: '0' };
const footerLink = { color: '#0A66C2', textDecoration: 'none' };
const footerMuted = { fontSize: '11px', color: '#999999', marginTop: '8px' };

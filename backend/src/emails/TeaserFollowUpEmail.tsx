import {
  Html, Head, Body, Container, Section, Text, Button, Hr, Link, Preview,
} from '@react-email/components';
import * as React from 'react';

interface TeaserFollowUpEmailProps {
  score: number;
  headline: string;
  issues: string[];
  ctaUrl: string;
}

export default function TeaserFollowUpEmail({
  score,
  headline,
  issues,
  ctaUrl,
}: TeaserFollowUpEmailProps) {
  const verdict =
    score >= 70 ? 'Good — but could be great' :
    score >= 40 ? 'Needs work' :
    'Needs serious help';

  return (
    <Html>
      <Head />
      <Preview>{`Your LinkedIn score was ${score}/100 — here is how to fix it`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>🔥 Profile Roaster</Text>
          </Section>

          <Section style={content}>
            {/* Score reminder */}
            <Text style={greeting}>Hey there,</Text>
            <Text style={bodyText}>
              You tested your LinkedIn headline recently. Here is what we found:
            </Text>

            <Section style={scoreCard}>
              <Text style={scoreLabel}>YOUR HEADLINE SCORE</Text>
              <Text style={scoreNumber}>{score}/100</Text>
              <Text style={verdictText}>{verdict}</Text>
            </Section>

            {/* Headline */}
            <Text style={headlineLabel}>Your headline:</Text>
            <Text style={headlineText}>"{headline}"</Text>

            {/* Top issues */}
            {issues.length > 0 && (
              <>
                <Text style={issuesTitle}>Top issues we found:</Text>
                {issues.slice(0, 2).map((issue, i) => (
                  <Text key={i} style={issueItem}>⚠️ {issue}</Text>
                ))}
              </>
            )}

            <Hr style={divider} />

            {/* CTA */}
            <Text style={ctaText}>
              Get your full roast + complete rewrite for <strong>₹299</strong>
            </Text>
            <Section style={{ textAlign: 'center' as const, margin: '16px 0' }}>
              <Button style={ctaButton} href={ctaUrl}>
                Get My Full Roast →
              </Button>
            </Section>

            {/* Social proof */}
            <Text style={socialProof}>
              ⭐ 4.8/5 rating from our users
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://profileroaster.in" style={footerLink}>profileroaster.in</Link>
              {' | '}
              <Link href={`https://profileroaster.in/unsubscribe?email=`} style={footerLink}>Unsubscribe</Link>
            </Text>
            <Text style={footerMuted}>
              You received this because you tested your LinkedIn headline on Profile Roaster.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───
const main = { backgroundColor: '#F3F2EF', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };
const container = { maxWidth: '520px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden' as const };
const header = { backgroundColor: '#004182', padding: '20px', textAlign: 'center' as const };
const headerText = { color: '#FFFFFF', fontSize: '18px', fontWeight: '700' as const, margin: '0' };
const content = { padding: '24px' };
const greeting = { fontSize: '16px', fontWeight: '600' as const, color: '#191919', margin: '0 0 8px' };
const bodyText = { fontSize: '14px', color: '#666666', lineHeight: '1.6', margin: '0 0 16px' };
const scoreCard = { backgroundColor: '#F3F2EF', borderRadius: '8px', padding: '16px', textAlign: 'center' as const, margin: '0 0 16px' };
const scoreLabel = { fontSize: '10px', fontWeight: '700' as const, letterSpacing: '1px', color: '#666666', margin: '0' };
const scoreNumber = { fontSize: '32px', fontWeight: '800' as const, color: '#CC1016', margin: '4px 0' };
const verdictText = { fontSize: '13px', color: '#666666', margin: '0' };
const headlineLabel = { fontSize: '12px', fontWeight: '600' as const, color: '#666666', margin: '0 0 4px' };
const headlineText = { fontSize: '14px', color: '#191919', fontStyle: 'italic' as const, margin: '0 0 16px', lineHeight: '1.4' };
const issuesTitle = { fontSize: '13px', fontWeight: '600' as const, color: '#191919', margin: '0 0 8px' };
const issueItem = { fontSize: '13px', color: '#CC1016', margin: '0 0 6px', lineHeight: '1.4' };
const divider = { borderColor: '#E0E0E0', margin: '20px 0' };
const ctaText = { fontSize: '15px', color: '#191919', textAlign: 'center' as const, margin: '0 0 8px' };
const ctaButton = { backgroundColor: '#0A66C2', color: '#FFFFFF', padding: '12px 32px', borderRadius: '24px', fontSize: '14px', fontWeight: '600' as const, textDecoration: 'none' };
const socialProof = { fontSize: '13px', color: '#666666', textAlign: 'center' as const, margin: '16px 0 0' };
const footer = { padding: '20px', textAlign: 'center' as const, backgroundColor: '#F3F2EF' };
const footerText = { fontSize: '12px', color: '#666666', margin: '0' };
const footerLink = { color: '#0A66C2', textDecoration: 'none' };
const footerMuted = { fontSize: '11px', color: '#999999', marginTop: '8px' };

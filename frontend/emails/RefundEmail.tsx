import {
  Html, Head, Body, Container, Section, Text, Hr, Link, Preview,
} from '@react-email/components';
import * as React from 'react';

interface RefundEmailProps {
  orderId: string;
}

export default function RefundEmail({ orderId }: RefundEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your refund has been processed — Profile Roaster</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>🔥 Profile Roaster</Text>
          </Section>

          <Section style={content}>
            <Text style={greeting}>Refund Processed</Text>
            <Text style={bodyText}>
              Your full refund has been processed. The amount will be credited
              back to your original payment method within 5-7 business days.
            </Text>
            <Section style={orderBox}>
              <Text style={orderLabel}>Order ID</Text>
              <Text style={orderValue}>{orderId}</Text>
            </Section>
            <Text style={bodyText}>
              We are sorry we could not deliver your results this time.
              If you would like to try again, visit{' '}
              <Link href="https://profileroaster.in" style={link}>profileroaster.in</Link>.
            </Text>
            <Text style={bodyText}>
              If you have any questions, reply to this email and we will help.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://profileroaster.in" style={footerLink}>profileroaster.in</Link>
              {' | '}
              <Link href="https://profileroaster.in/privacy" style={footerLink}>Privacy</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#F3F2EF', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };
const container = { maxWidth: '480px', margin: '0 auto', backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden' as const };
const header = { backgroundColor: '#004182', padding: '20px', textAlign: 'center' as const };
const headerText = { color: '#FFFFFF', fontSize: '18px', fontWeight: '700' as const, margin: '0' };
const content = { padding: '24px' };
const greeting = { fontSize: '18px', fontWeight: '700' as const, color: '#191919', margin: '0 0 12px' };
const bodyText = { fontSize: '14px', color: '#666666', lineHeight: '1.6', margin: '0 0 12px' };
const orderBox = { backgroundColor: '#F3F2EF', borderRadius: '8px', padding: '12px 16px', margin: '0 0 16px' };
const orderLabel = { fontSize: '10px', fontWeight: '700' as const, letterSpacing: '1px', color: '#666666', margin: '0' };
const orderValue = { fontSize: '13px', fontFamily: 'monospace', color: '#191919', margin: '4px 0 0' };
const link = { color: '#0A66C2' };
const divider = { borderColor: '#E0E0E0', margin: '0' };
const footer = { padding: '20px', textAlign: 'center' as const, backgroundColor: '#F3F2EF' };
const footerText = { fontSize: '12px', color: '#666666', margin: '0' };
const footerLink = { color: '#0A66C2', textDecoration: 'none' };

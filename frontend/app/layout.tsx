import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LinkedIn Profile Roaster — Get Roasted, Get Rewritten',
  description: 'Your LinkedIn profile is invisible to recruiters. Get brutally roasted by AI, then get a complete rewrite. Average improvement: 34 to 84.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body>
        {children}
        <footer style={{ borderTop: '1px solid var(--li-border)', background: 'var(--li-card)' }}>
          <div style={{ maxWidth: 672, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              <a href="/terms" style={{ fontSize: 13, color: 'var(--li-text-secondary)', textDecoration: 'none' }}>Terms &amp; Conditions</a>
              <a href="/privacy" style={{ fontSize: 13, color: 'var(--li-text-secondary)', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="/refund" style={{ fontSize: 13, color: 'var(--li-text-secondary)', textDecoration: 'none' }}>Refund Policy</a>
              <span style={{ fontSize: 13, color: 'var(--li-text-secondary)' }}>Contact: support@profileroaster.in</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--li-text-secondary)', margin: 0 }}>
              &copy; 2026 Profile Roaster. Not affiliated with LinkedIn Corporation.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}

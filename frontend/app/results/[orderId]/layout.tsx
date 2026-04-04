import type { Metadata } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}): Promise<Metadata> {
  const { orderId } = await params;

  try {
    const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
      cache: 'no-store',
    });
    const data = await res.json();

    if (data.status === 'done' && data.results) {
      const before = data.results.scores?.before?.overall || '?';
      const after = data.results.scores?.after?.overall || '?';
      const cardUrl = data.results.card_image_url;

      return {
        title: `My profile score: ${before}→${after} | ProfileRoaster`,
        description: `AI rewrote my profile. Score improved from ${before} to ${after}. Get yours at profileroaster.in`,
        openGraph: {
          title: `My profile score went from ${before}→${after}`,
          description: `AI rewrote my profile. Score improved from ${before} to ${after}. Get yours at profileroaster.in`,
          images: cardUrl
            ? [{ url: cardUrl, width: 1200, height: 630 }]
            : [{ url: 'https://profileroaster.in/og-default.png', width: 1200, height: 630 }],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `My profile score: ${before}→${after}`,
          description: `Score improved from ${before} to ${after}. Get yours at profileroaster.in`,
          images: cardUrl ? [cardUrl] : ['https://profileroaster.in/og-default.png'],
        },
      };
    }
  } catch {
    // API not reachable during build — use defaults
  }

  return {
    title: 'Your Results | ProfileRoaster',
    description: 'Get your profile rewritten by AI — resume, LinkedIn content, and interview prep.',
  };
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuildRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?tab=questionnaire');
  }, [router]);

  return (
    <main className="saas-app-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="saas-card" style={{ padding: '40px 48px', textAlign: 'center', maxWidth: 360 }}>
        <div style={{ fontSize: 32, marginBottom: 16 }} role="presentation">&#128640;</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Redirecting</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Taking you to the profile builder</div>
        <div className="saas-skeleton" style={{ width: 120, height: 4, borderRadius: 2, margin: '20px auto 0' }} aria-hidden />
      </div>
    </main>
  );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BuildRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?tab=questionnaire');
  }, [router]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6F9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>&#128640;</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#191919', marginBottom: 4 }}>Redirecting...</div>
        <div style={{ fontSize: 13, color: '#64748B' }}>Taking you to the profile builder</div>
      </div>
    </main>
  );
}

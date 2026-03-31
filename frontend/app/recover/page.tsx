'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RecoveredOrder {
  orderId: string;
  type: 'roast' | 'build';
  roastTitle?: string;
  beforeScore?: number;
  afterScore?: number;
  headline?: string;
  plan?: string;
  createdAt: string;
}

export default function RecoverPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'results'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [orders, setOrders] = useState<RecoveredOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  async function handleSendOtp() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const res = await fetch(`${API_URL}/api/recover/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.found) {
        setStep('otp');
      } else if (res.ok && !data.found) {
        setNotFound(true);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim() || otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/recover/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      const allOrders = [
        ...(data.orders || []),
        ...(data.buildOrders || []),
      ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (res.ok && allOrders.length) {
        if (allOrders.length === 1) {
          const o = allOrders[0];
          router.push(o.type === 'build' ? `/build/results/${o.orderId}` : `/results/${o.orderId}`);
        } else {
          setOrders(allOrders);
          setStep('results');
        }
      } else {
        setError(data.error || 'Invalid or expired code. Please try again.');
      }
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete all your results? This cannot be undone.')) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/recover/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const deleteOtp = prompt('Enter the new code sent to your email to confirm deletion:');
      if (!deleteOtp) return;
      const res = await fetch(`${API_URL}/api/recover/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: deleteOtp }),
      });
      if (res.ok) {
        alert('Your results have been deleted.');
        setStep('email');
        setOrders([]);
        setEmail('');
        setOtp('');
      } else {
        setError('Deletion failed. Please try again.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Results dashboard (full-width) ───
  if (step === 'results') {
    const roastOrders = orders.filter(o => o.type === 'roast');
    const buildOrders = orders.filter(o => o.type === 'build');

    return (
      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh' }}>
        {/* Header */}
        <header style={{ background: 'white', borderBottom: '1px solid #E0E0E0', padding: '14px 20px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <a href="/" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#191919' }}>Roaster</span>
              </a>
              <span style={{ fontSize: 13, color: '#888', marginLeft: 12 }}>{email}</span>
            </div>
            <button onClick={() => { setStep('email'); setOrders([]); setEmail(''); setOtp(''); }} style={{ fontSize: 13, color: '#666', background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </header>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#191919', marginBottom: 4 }}>Your Results</h1>
          <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
            {orders.length} result{orders.length > 1 ? 's' : ''} found for {email}
          </p>

          {/* Roast Orders */}
          {roastOrders.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>&#128293;</span>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: 0 }}>LinkedIn Roasts ({roastOrders.length})</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {roastOrders.map((o) => (
                  <div
                    key={o.orderId}
                    onClick={() => router.push(`/results/${o.orderId}`)}
                    style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 8, lineHeight: 1.4 }}>
                      {o.roastTitle || 'LinkedIn Roast'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#CC1016' }}>{o.beforeScore}</span>
                        <span style={{ color: '#ccc' }}>&rarr;</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#057642' }}>{o.afterScore}</span>
                      </div>
                      <span style={{ background: '#DCFCE7', color: '#057642', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 12 }}>
                        +{(o.afterScore || 0) - (o.beforeScore || 0)} pts
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Build Orders */}
          {buildOrders.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>&#128187;</span>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#191919', margin: 0 }}>LinkedIn Profile Builds ({buildOrders.length})</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {buildOrders.map((o) => (
                  <div
                    key={o.orderId}
                    onClick={() => router.push(`/build/results/${o.orderId}`)}
                    style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#0A66C2', background: '#E8F0FE', padding: '2px 8px', borderRadius: 4 }}>
                        {o.plan === 'pro' ? 'Pro' : o.plan === 'plus' ? 'Plus' : 'Starter'}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 4, lineHeight: 1.4 }}>
                      {o.headline || 'LinkedIn Profile Build'}
                    </div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16 }}>
            <a href="/" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>Get another roast</a>
            <span style={{ color: '#ccc' }}>|</span>
            <a href="/build" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>Build new LinkedIn profile</a>
            <span style={{ color: '#ccc' }}>|</span>
            <button onClick={handleDelete} style={{ fontSize: 13, color: '#999', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Delete my data</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Email / OTP steps (centered) ───
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ background: '#004182', padding: '16px 24px', borderRadius: '12px 12px 0 0' }}>
          <h1 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>Recover Your Results</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '4px 0 0' }}>profileroaster.in</p>
        </div>

        <div style={{ background: 'white', padding: 32, borderRadius: '0 0 12px 12px', border: '1px solid #E0E0E0', borderTop: 'none' }}>
          {step === 'email' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>Find Your Results</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                Enter the email you used when purchasing. We{"'"}ll send a verification code.
              </p>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              />
              <button onClick={handleSendOtp} disabled={loading || !email.trim()}
                style={{ width: '100%', padding: '12px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
              {notFound && (
                <div style={{ marginTop: 16, padding: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
                  <p style={{ fontSize: 14, color: '#991B1B', margin: 0, fontWeight: 600 }}>No results found for this email.</p>
                  <p style={{ fontSize: 13, color: '#991B1B', margin: '6px 0 0' }}>Results are stored for 30 days.</p>
                </div>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>Enter Verification Code</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <input
                type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6}
                style={{ width: '100%', padding: '14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 12, outline: 'none', boxSizing: 'border-box', fontWeight: 700 }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              />
              <button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}
                style={{ width: '100%', padding: '12px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#666', border: 'none', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                Use a different email
              </button>
            </>
          )}

          {error && <p style={{ color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 16 }}>
          <a href="/" style={{ color: '#0A66C2', textDecoration: 'none' }}>profileroaster.in</a>
          {' '}&middot;{' '}
          <a href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

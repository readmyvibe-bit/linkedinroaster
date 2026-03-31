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
      // Need a fresh OTP for delete
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

  return (
    <div style={{ background: '#F3F2EF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Header */}
        <div style={{ background: '#004182', padding: '16px 24px', borderRadius: '12px 12px 0 0' }}>
          <h1 style={{ color: 'white', fontSize: 16, fontWeight: 700, margin: 0 }}>
            Recover Your Results
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '4px 0 0' }}>
            profileroaster.in
          </p>
        </div>

        {/* Body */}
        <div style={{ background: 'white', padding: 32, borderRadius: '0 0 12px 12px', border: '1px solid #E0E0E0', borderTop: 'none' }}>

          {step === 'email' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>
                Find Your Results
              </h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                Enter the email you used when purchasing your roast. We{"'"}ll send a verification code.
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
              />
              <button
                onClick={handleSendOtp}
                disabled={loading || !email.trim()}
                style={{ width: '100%', padding: '12px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Sending...' : 'Send Me My Results'}
              </button>

              {notFound && (
                <div style={{ marginTop: 16, padding: 14, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
                  <p style={{ fontSize: 14, color: '#991B1B', margin: 0, fontWeight: 600 }}>No results found for this email.</p>
                  <p style={{ fontSize: 13, color: '#991B1B', margin: '6px 0 0' }}>Results are stored for 30 days. If you paid recently, check your email for the results link.</p>
                </div>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>
                Enter Verification Code
              </h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                style={{ width: '100%', padding: '14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 12, outline: 'none', boxSizing: 'border-box', fontWeight: 700 }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              />
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                style={{ width: '100%', padding: '12px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              <button
                onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                style={{ width: '100%', padding: '10px', background: 'transparent', color: '#666', border: 'none', fontSize: 13, cursor: 'pointer', marginTop: 8 }}
              >
                Use a different email
              </button>
            </>
          )}

          {step === 'results' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>
                Your Results
              </h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                We found {orders.length} result{orders.length > 1 ? 's' : ''} for this email.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map((o) => (
                  <button
                    key={o.orderId}
                    onClick={() => router.push(o.type === 'build' ? `/build/results/${o.orderId}` : `/results/${o.orderId}`)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#F3F2EF', border: '1px solid #E0E0E0', borderRadius: 10, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#191919' }}>
                        {o.type === 'build' ? (o.headline || 'LinkedIn Profile Build') : (o.roastTitle || 'LinkedIn Roast')}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: o.type === 'build' ? '#0A66C2' : '#E16B00', background: o.type === 'build' ? '#E8F0FE' : '#FEF3C7', padding: '1px 8px', borderRadius: 4 }}>
                          {o.type === 'build' ? 'Build' : 'Roast'}
                        </span>
                        <span style={{ fontSize: 12, color: '#666' }}>
                          {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {o.type === 'roast' && o.beforeScore != null && (
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#057642' }}>
                        {o.beforeScore} &rarr; {o.afterScore}
                      </div>
                    )}
                    {o.type === 'build' && (
                      <span style={{ fontSize: 12, color: '#0A66C2' }}>&rarr;</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {error && (
            <p style={{ color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>
          )}

          {/* Delete option */}
          {step === 'results' && (
            <button
              onClick={handleDelete}
              style={{ display: 'block', margin: '20px auto 0', background: 'transparent', border: 'none', color: '#999', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Delete my results
            </button>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 16 }}>
          <a href="/" style={{ color: '#0A66C2', textDecoration: 'none' }}>profileroaster.in</a>
          {' '}&middot;{' '}
          <a href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

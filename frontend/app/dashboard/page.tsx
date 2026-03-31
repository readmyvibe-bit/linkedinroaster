'use client';

import { useState, useEffect, useCallback } from 'react';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() { if (typeof window !== 'undefined') return localStorage.getItem('dash_token'); return null; }
function setToken(t: string) { localStorage.setItem('dash_token', t); }
function clearToken() { localStorage.removeItem('dash_token'); localStorage.removeItem('dash_email'); }

async function dashFetch(path: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) { clearToken(); throw new Error('Session expired'); }
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}

// ─── Login Form ───
function LoginForm({ onLogin }: { onLogin: (email: string) => void }) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  async function handleSendOtp() {
    if (!email.trim()) return;
    setLoading(true); setError(''); setNotFound(false);
    try {
      const res = await fetch(`${API_URL}/api/dashboard/send-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.found) setStep('otp');
      else if (res.ok && !data.found) setNotFound(true);
      else setError(data.error || 'Something went wrong');
    } catch { setError('Could not reach server.'); }
    finally { setLoading(false); }
  }

  async function handleVerify() {
    if (otp.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/api/dashboard/verify-otp`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('dash_email', data.email);
        onLogin(data.email);
      } else { setError(data.error || 'Invalid code'); }
    } catch { setError('Verification failed.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ background: 'linear-gradient(135deg, #004182, #0A66C2)', padding: '20px 24px', borderRadius: '14px 14px 0 0', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>My Dashboard</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>profileroaster.in</div>
        </div>
        <div style={{ background: 'white', padding: 32, borderRadius: '0 0 14px 14px', border: '1px solid #E0E0E0', borderTop: 'none' }}>
          {step === 'email' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>Login to your dashboard</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Enter the email you used for your purchase. We{"'"}ll send a verification code.</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={handleSendOtp} disabled={loading || !email.trim()}
                style={{ width: '100%', padding: 12, background: '#0A66C2', color: 'white', border: 'none', borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
              {notFound && (
                <div style={{ marginTop: 14, padding: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
                  <p style={{ fontSize: 14, color: '#991B1B', margin: 0, fontWeight: 600 }}>No orders found for this email.</p>
                  <p style={{ fontSize: 13, color: '#991B1B', margin: '4px 0 0' }}>Make sure you{"'"}re using the email from your purchase.</p>
                </div>
              )}
            </>
          )}
          {step === 'otp' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>Enter verification code</h2>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Code sent to <strong>{email}</strong></p>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{ width: '100%', padding: 14, border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 12, outline: 'none', boxSizing: 'border-box', fontWeight: 700 }} />
              <button onClick={handleVerify} disabled={loading || otp.length !== 6}
                style={{ width: '100%', padding: 12, background: '#0A66C2', color: 'white', border: 'none', borderRadius: 24, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Verifying...' : 'Login'}
              </button>
              <button onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                style={{ width: '100%', padding: 10, background: 'transparent', color: '#666', border: 'none', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
                Use a different email
              </button>
            </>
          )}
          {error && <p style={{ color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 16 }}>
          <a href="/" style={{ color: '#0A66C2', textDecoration: 'none' }}>Home</a>
          {' '}&middot;{' '}
          <a href="/privacy" style={{ color: '#999', textDecoration: 'none' }}>Privacy</a>
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard Content ───
function DashboardContent({ email, onLogout }: { email: string; onLogout: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [tab, setTab] = useState<'all' | 'roasts' | 'builds' | 'resumes'>('all');

  const load = useCallback(async () => {
    try {
      const d = await dashFetch('/api/dashboard/data');
      setData(d);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 32, textAlign: 'center', maxWidth: 400, border: '1px solid #E0E0E0' }}>
          <p style={{ color: '#CC1016', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Failed to load dashboard</p>
          <button onClick={() => { setLoading(true); setLoadError(false); load(); }} style={{ padding: '8px 20px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginRight: 8 }}>Retry</button>
          <button onClick={onLogout} style={{ padding: '8px 20px', background: '#F3F4F6', color: '#666', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const roasts = data.roastOrders || [];
  const builds = data.buildOrders || [];
  const resumes = data.resumes || [];
  const totalOrders = roasts.length + builds.length;

  const tabs = [
    { key: 'all' as const, label: `All (${totalOrders})` },
    { key: 'roasts' as const, label: `Roasts (${roasts.length})` },
    { key: 'builds' as const, label: `Builds (${builds.length})` },
    { key: 'resumes' as const, label: `Resumes (${resumes.length})` },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#F3F2EF', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E0E0E0', padding: '14px 20px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#191919' }}>Roaster</span>
            </a>
            <span style={{ fontSize: 12, color: '#888', background: '#F3F4F6', padding: '2px 8px', borderRadius: 4 }}>Dashboard</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#666' }}>{email}</span>
            <button onClick={onLogout} style={{ fontSize: 12, color: '#666', background: '#F3F4F6', border: 'none', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0A66C2' }}>{totalOrders}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Total Orders</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#E16B00' }}>{roasts.length}</div>
            <div style={{ fontSize: 12, color: '#888' }}>LinkedIn Roasts</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#057642' }}>{builds.length}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Profile Builds</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: '16px 18px', border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#191919' }}>{resumes.length}</div>
            <div style={{ fontSize: 12, color: '#888' }}>Resumes</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'white', borderRadius: 10, padding: 4, border: '1px solid #E0E0E0' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.key ? '#0A66C2' : 'transparent', color: tab === t.key ? 'white' : '#666' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Roast Orders */}
        {(tab === 'all' || tab === 'roasts') && roasts.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {tab === 'all' && <h2 style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span>&#128293;</span> LinkedIn Roasts</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {roasts.map((o: any) => (
                <div key={o.id} onClick={() => window.open(`/results/${o.id}`, '_blank')}
                  style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 4 }}>{o.roastTitle || 'LinkedIn Roast'}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#E16B00', background: '#FEF3C7', padding: '1px 8px', borderRadius: 4 }}>{o.plan}</span>
                        <span style={{ fontSize: 11, color: '#888' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: o.status === 'done' ? '#057642' : '#E16B00', background: o.status === 'done' ? '#DCFCE7' : '#FEF3C7', padding: '2px 8px', borderRadius: 4 }}>{o.status}</span>
                  </div>
                  {o.beforeScore != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#CC1016' }}>{o.beforeScore}</span>
                      <span style={{ color: '#ccc' }}>&rarr;</span>
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#057642' }}>{o.afterScore}</span>
                      <span style={{ background: '#DCFCE7', color: '#057642', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, marginLeft: 'auto' }}>+{o.afterScore - o.beforeScore} pts</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Build Orders */}
        {(tab === 'all' || tab === 'builds') && builds.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {tab === 'all' && <h2 style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span>&#128187;</span> LinkedIn Profile Builds</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {builds.map((o: any) => (
                <div key={o.id} onClick={() => window.open(`/build/results/${o.id}`, '_blank')}
                  style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0A66C2', background: '#E8F0FE', padding: '2px 8px', borderRadius: 4 }}>{o.plan}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: o.status === 'done' ? '#057642' : '#E16B00', background: o.status === 'done' ? '#DCFCE7' : '#FEF3C7', padding: '2px 8px', borderRadius: 4 }}>{o.status}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 4 }}>{o.headline || 'LinkedIn Profile Build'}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumes */}
        {(tab === 'all' || tab === 'resumes') && resumes.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {tab === 'all' && <h2 style={{ fontSize: 16, fontWeight: 700, color: '#191919', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><span>&#128196;</span> Resumes</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {resumes.map((r: any) => (
                <div key={r.id}
                  style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 12, padding: '18px 20px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#191919', marginBottom: 4 }}>
                    {r.targetRole}{r.targetCompany ? ` at ${r.targetCompany}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#888' }}>{r.templateId}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>&bull;</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: (r.atsScore || 0) >= 80 ? '#057642' : (r.atsScore || 0) >= 60 ? '#0A66C2' : '#E16B00' }}>ATS: {r.atsScore ?? '—'}%</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <a href={`/resume/${r.id}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: '#0A66C2', fontWeight: 600, textDecoration: 'none' }}>View</a>
                      <a href={`/resume/${r.id}/edit`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: '#057642', fontWeight: 600, textDecoration: 'none' }}>Edit</a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalOrders === 0 && (
          <div style={{ background: 'white', borderRadius: 14, padding: '40px 24px', textAlign: 'center', border: '1px solid #E0E0E0' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>&#128064;</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#191919', marginBottom: 8 }}>No orders yet</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>Get started with a roast or build your LinkedIn profile from scratch.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a href="/" style={{ padding: '10px 24px', background: '#0A66C2', color: 'white', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Roast My Profile</a>
              <a href="/build" style={{ padding: '10px 24px', background: '#057642', color: 'white', borderRadius: 50, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Build My LinkedIn</a>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <a href="/" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>Get another roast</a>
          <span style={{ color: '#E0E0E0' }}>|</span>
          <a href="/build" style={{ fontSize: 13, color: '#0A66C2', textDecoration: 'none', fontWeight: 600 }}>Build new LinkedIn</a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function DashboardPage() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getToken();
    const savedEmail = localStorage.getItem('dash_email');
    if (token && savedEmail) {
      dashFetch('/api/dashboard/me')
        .then(() => { setAuthed(true); setEmail(savedEmail); })
        .catch(() => { clearToken(); })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  function handleLogout() {
    clearToken();
    setAuthed(false);
    setEmail('');
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#F3F2EF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  if (!authed) {
    return <LoginForm onLogin={(e) => { setAuthed(true); setEmail(e); }} />;
  }

  return <DashboardContent email={email} onLogout={handleLogout} />;
}

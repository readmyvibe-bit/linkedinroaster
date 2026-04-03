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
  const [tab, setTab] = useState<'all' | 'roasts' | 'builds' | 'resumes' | 'preps'>('all');

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
  const interviewPreps = data.interviewPreps || [];
  const totalOrders = roasts.length + builds.length;

  const tabs = [
    { key: 'all' as const, label: `All (${totalOrders})` },
    { key: 'roasts' as const, label: `Rewrites (${roasts.length})` },
    { key: 'builds' as const, label: `Builds (${builds.length})` },
    { key: 'resumes' as const, label: `Resumes (${resumes.length})` },
    { key: 'preps' as const, label: `Interview Preps (${interviewPreps.length})` },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'linear-gradient(180deg, #F0F4FF 0%, #F3F2EF 40%)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#0A66C2' }}>Profile</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#191919' }}>Roaster</span>
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                {email.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>{email}</span>
            </div>
            <button onClick={onLogout} style={{ fontSize: 12, color: '#888', background: 'transparent', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 500 }}>Logout</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px' }}>
        {/* Welcome + Quick Actions */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Manage your profile rewrites, resumes, and interview preps</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { value: totalOrders, label: 'Total Orders', color: '#0A66C2', bg: '#EFF6FF' },
            { value: roasts.length, label: 'Rewrites', color: '#7C3AED', bg: '#F5F3FF' },
            { value: builds.length, label: 'Builds', color: '#057642', bg: '#F0FDF4' },
            { value: resumes.length, label: 'Resumes', color: '#EA580C', bg: '#FFF7ED' },
            { value: interviewPreps.length, label: 'Preps', color: '#0891B2', bg: '#ECFEFF' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 14, padding: '18px 20px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(10,102,194,0.2)' }}>
            + New Rewrite
          </a>
          <a href="/build" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'white', color: '#057642', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid #BBF7D0' }}>
            + New Build
          </a>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'white', borderRadius: 12, padding: 4, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                background: tab === t.key ? 'linear-gradient(135deg, #0A66C2, #004182)' : 'transparent',
                color: tab === t.key ? 'white' : '#64748B',
                boxShadow: tab === t.key ? '0 2px 6px rgba(10,102,194,0.2)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Rewrite Orders */}
        {(tab === 'all' || tab === 'roasts') && roasts.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {tab === 'all' && <h2 style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 12 }}>LinkedIn Rewrites</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {roasts.map((o: any) => (
                <div key={o.id} onClick={() => window.open(`/results/${o.id}`, '_blank')}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', padding: '2px 10px', borderRadius: 6 }}>{o.plan}</span>
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: o.status === 'done' ? '#057642' : '#EA580C', background: o.status === 'done' ? '#F0FDF4' : '#FFF7ED', padding: '3px 10px', borderRadius: 6 }}>{o.status === 'done' ? 'Complete' : o.status}</span>
                  </div>
                  {o.beforeScore != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 28, fontWeight: 800, color: '#CC1016' }}>{o.beforeScore}</span>
                        <span style={{ fontSize: 16, color: '#CBD5E1' }}>&rarr;</span>
                        <span style={{ fontSize: 28, fontWeight: 800, color: '#057642' }}>{o.afterScore}</span>
                      </div>
                      <span style={{ background: '#DCFCE7', color: '#057642', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, marginLeft: 'auto' }}>+{o.afterScore - o.beforeScore}</span>
                    </div>
                  )}
                  {o.maxResumes > 0 && (
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                      <span>Resumes: <strong>{o.resumesUsed || 0}/{o.maxResumes}</strong></span>
                      <span>Preps: <strong>{o.interviewPrepsUsed || 0}/{o.maxResumes}</strong></span>
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
            {tab === 'all' && <h2 style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 12 }}>LinkedIn Profile Builds</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {builds.map((o: any) => (
                <div key={o.id} onClick={() => window.open(`/build/results/${o.id}`, '_blank')}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#0A66C2', background: '#EFF6FF', padding: '2px 10px', borderRadius: 6 }}>{o.plan}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: o.status === 'done' ? '#057642' : '#EA580C', background: o.status === 'done' ? '#F0FDF4' : '#FFF7ED', padding: '3px 10px', borderRadius: 6 }}>{o.status === 'done' ? 'Complete' : o.status}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{o.headline || 'LinkedIn Profile Build'}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  {o.maxResumes > 0 && (
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748B', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                      <span>Resumes: <strong>{o.resumesUsed || 0}/{o.maxResumes}</strong></span>
                      <span>Preps: <strong>{o.interviewPrepsUsed || 0}/{o.maxResumes}</strong></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumes */}
        {(tab === 'all' || tab === 'resumes') && resumes.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {tab === 'all' && <h2 style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Resumes</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {resumes.map((r: any) => (
                <div key={r.id}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{r.targetRole}</div>
                      {r.targetCompany && <div style={{ fontSize: 13, color: '#0A66C2', fontWeight: 600 }}>{r.targetCompany.trim()}</div>}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: (r.atsScore || 0) >= 80 ? '#057642' : (r.atsScore || 0) >= 60 ? '#0A66C2' : '#EA580C', background: (r.atsScore || 0) >= 80 ? '#F0FDF4' : (r.atsScore || 0) >= 60 ? '#EFF6FF' : '#FFF7ED', padding: '3px 10px', borderRadius: 8, whiteSpace: 'nowrap' as const }}>
                      ATS {r.atsScore ?? '—'}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>{r.templateId}</span>
                    {r.hasCoverLetter && <span style={{ fontSize: 10, fontWeight: 600, color: '#057642', background: '#F0FDF4', padding: '2px 8px', borderRadius: 6 }}>Cover Letter</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={`/resume/${r.id}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#EFF6FF', color: '#0A66C2', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>View</a>
                    <a href={`/resume/${r.id}/edit`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ flex: 1, textAlign: 'center', padding: '8px 0', background: '#F0FDF4', color: '#057642', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Edit</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interview Preps */}
        {(tab === 'all' || tab === 'preps') && interviewPreps.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            {tab === 'all' && <h2 style={{ fontSize: 15, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Interview Preps</h2>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {interviewPreps.map((ip: any) => (
                <div key={ip.id} onClick={() => window.open(`/interview-prep/${ip.id}`, '_blank')}
                  style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 14, padding: '20px 22px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)'; e.currentTarget.style.transform = 'none'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{ip.targetRole || 'Interview Prep'}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: ip.status === 'ready' ? '#057642' : ip.status === 'failed' ? '#CC1016' : '#EA580C', background: ip.status === 'ready' ? '#F0FDF4' : ip.status === 'failed' ? '#FEF2F2' : '#FFF7ED', padding: '3px 10px', borderRadius: 6 }}>{ip.status === 'ready' ? 'Ready' : ip.status}</span>
                  </div>
                  {ip.targetCompany && <div style={{ fontSize: 13, color: '#0A66C2', fontWeight: 600, marginBottom: 6 }}>{ip.targetCompany}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(ip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span style={{ fontSize: 12, color: '#0A66C2', fontWeight: 600 }}>View &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalOrders === 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>&#128064;</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>No orders yet</h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>Get started with a profile rewrite or build your LinkedIn from scratch.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <a href="/" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #0A66C2, #004182)', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(10,102,194,0.2)' }}>Rewrite My Profile</a>
              <a href="/build" style={{ padding: '12px 28px', background: 'white', color: '#057642', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid #BBF7D0' }}>Build My LinkedIn</a>
            </div>
          </div>
        )}
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

'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken() { if (typeof window !== 'undefined') return localStorage.getItem('dash_token'); return null; }
function setToken(t: string) { localStorage.setItem('dash_token', t); }
function clearToken() { localStorage.removeItem('dash_token'); localStorage.removeItem('dash_email'); }

async function dashFetch(path: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
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
      const res = await fetch(`${API_URL}/api/dashboard/send-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim() }) });
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
      const res = await fetch(`${API_URL}/api/dashboard/verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), otp: otp.trim() }) });
      const data = await res.json();
      if (res.ok && data.token) { setToken(data.token); localStorage.setItem('dash_email', data.email); onLogin(data.email); }
      else { setError(data.error || 'Invalid code'); }
    } catch { setError('Verification failed.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'var(--bg-canvas)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ background: 'var(--accent)', padding: '24px', borderRadius: '16px 16px 0 0', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>Dashboard</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>profileroaster.in</div>
        </div>
        <div className="saas-card" style={{ padding: 32, borderRadius: '0 0 16px 16px', borderTop: 'none' }}>
          {step === 'email' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Login to your dashboard</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Enter the email you used for your purchase.</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: 15, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={handleSendOtp} disabled={loading || !email.trim()} className="saas-btn saas-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, borderRadius: 'var(--radius-pill)', fontSize: 15, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
              {notFound && (
                <div style={{ marginTop: 14, padding: 12, background: 'var(--danger-subtle)', border: '1px solid #FCA5A5', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ fontSize: 14, color: 'var(--danger)', margin: 0, fontWeight: 600 }}>No orders found for this email.</p>
                </div>
              )}
            </>
          )}
          {step === 'otp' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Enter verification code</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Code sent to <strong>{email}</strong></p>
              <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} onKeyDown={e => e.key === 'Enter' && handleVerify()}
                style={{ width: '100%', padding: 14, border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: 24, textAlign: 'center', letterSpacing: 8, marginBottom: 12, outline: 'none', boxSizing: 'border-box', fontWeight: 700 }} />
              <button onClick={handleVerify} disabled={loading || otp.length !== 6} className="saas-btn saas-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12, borderRadius: 'var(--radius-pill)', fontSize: 15, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Verifying...' : 'Login'}
              </button>
              <button onClick={() => { setStep('email'); setOtp(''); setError(''); }} style={{ width: '100%', padding: 10, background: 'transparent', color: 'var(--text-muted)', border: 'none', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>Use a different email</button>
            </>
          )}
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
          <a href="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Home</a> &middot; <a href="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy</a>
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
  const [section, setSection] = useState('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const load = useCallback(async () => {
    try { const d = await dashFetch('/api/dashboard/data'); setData(d); setLoadError(false); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Loading — skeleton
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="saas-skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }} />
        <div className="saas-skeleton" style={{ width: 200, height: 16, borderRadius: 8, margin: '0 auto 8px' }} />
        <div className="saas-skeleton" style={{ width: 140, height: 12, borderRadius: 6, margin: '0 auto' }} />
      </div>
    </div>
  );

  if (loadError) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="saas-card" style={{ padding: 32, textAlign: 'center', maxWidth: 400 }}>
        <p style={{ color: 'var(--danger)', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Failed to load dashboard</p>
        <button onClick={() => { setLoading(true); setLoadError(false); load(); }} className="saas-btn saas-btn-primary" style={{ marginRight: 8 }}>Retry</button>
        <button onClick={onLogout} className="saas-btn saas-btn-ghost">Logout</button>
      </div>
    </div>
  );

  if (!data) return null;

  const roasts = data.roastOrders || [];
  const builds = data.buildOrders || [];
  const resumes = data.resumes || [];
  const preps = data.interviewPreps || [];
  const totalOrders = roasts.length + builds.length;
  const firstName = email.split('@')[0].split('.')[0];

  // Unified activity list
  const activity = [
    ...roasts.map((o: any) => ({ type: 'rewrite', id: o.id, title: o.roastTitle || 'LinkedIn Rewrite', status: o.status, date: o.createdAt, plan: o.plan, url: `/results/${o.id}`, score: o.beforeScore != null ? `${o.beforeScore}→${o.afterScore}` : null, usage: o.maxResumes > 0 ? `${o.resumesUsed || 0}/${o.maxResumes}` : null })),
    ...builds.map((o: any) => ({ type: 'build', id: o.id, title: o.headline || 'LinkedIn Build', status: o.status, date: o.createdAt, plan: o.plan, url: `/build/results/${o.id}`, score: null, usage: o.maxResumes > 0 ? `${o.resumesUsed || 0}/${o.maxResumes}` : null })),
    ...resumes.map((r: any) => ({ type: 'resume', id: r.id, title: r.targetRole || 'Resume', status: 'generated', date: r.createdAt, plan: null, url: `/resume/${r.id}`, score: r.atsScore ? `ATS ${r.atsScore}%` : null, usage: null })),
    ...preps.map((p: any) => ({ type: 'prep', id: p.id, title: p.targetRole || 'Interview Prep', status: p.status, date: p.createdAt, plan: null, url: `/interview-prep/${p.id}`, score: null, usage: null })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const sections = [
    { key: 'overview', label: 'Overview' },
    { key: 'activity', label: 'Activity' },
    { key: 'rewrites', label: `Rewrites (${roasts.length})` },
    { key: 'builds', label: `Builds (${builds.length})` },
    { key: 'resumes', label: `Resumes (${resumes.length})` },
    { key: 'preps', label: `Preps (${preps.length})` },
  ];

  const typeColors: Record<string, { color: string; bg: string }> = {
    rewrite: { color: '#7C3AED', bg: '#F5F3FF' },
    build: { color: '#0A66C2', bg: '#EFF6FF' },
    resume: { color: '#EA580C', bg: '#FFF7ED' },
    prep: { color: '#0891B2', bg: '#ECFEFF' },
  };

  const statusColors: Record<string, { color: string; bg: string }> = {
    done: { color: 'var(--success)', bg: 'var(--success-subtle)' },
    complete: { color: 'var(--success)', bg: 'var(--success-subtle)' },
    generated: { color: 'var(--success)', bg: 'var(--success-subtle)' },
    ready: { color: 'var(--success)', bg: 'var(--success-subtle)' },
    failed: { color: 'var(--danger)', bg: 'var(--danger-subtle)' },
    processing: { color: 'var(--warning)', bg: 'var(--warning-subtle)' },
    queued: { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
    pending: { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' },
  };

  // Filtered items for section views
  const sectionItems = section === 'rewrites' ? roasts : section === 'builds' ? builds : section === 'resumes' ? resumes : section === 'preps' ? preps : [];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: 'var(--bg-canvas)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ═══ HEADER ═══ */}
      <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', boxShadow: 'var(--shadow-sm)', flexShrink: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href="/" style={{ textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent)' }}>Profile</span><span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)' }}>Roaster</span>
            </a>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '2px 10px', borderRadius: 'var(--radius-pill)', fontWeight: 600 }}>Dashboard</span>
          </div>
          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', cursor: 'pointer', transition: 'all var(--transition)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{email.charAt(0).toUpperCase()}</div>
              <span className="hidden sm:inline" style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>&#9662;</span>
            </button>
            {showUserMenu && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', minWidth: 200, zIndex: 100, animation: 'fadeIn 150ms ease' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bg-subtle)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{email}</div>
                </div>
                <a href="/" style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }} onClick={() => setShowUserMenu(false)}>Home</a>
                <a href="/pricing" style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }} onClick={() => setShowUserMenu(false)}>Pricing</a>
                <div style={{ borderTop: '1px solid var(--bg-subtle)' }}>
                  <button onClick={() => { setShowUserMenu(false); onLogout(); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 13, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ═══ LEFT NAV (desktop) ═══ */}
        <nav className="hidden md:flex" style={{ width: 200, flexShrink: 0, flexDirection: 'column', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-default)', padding: '16px 0', overflowY: 'auto' }}>
          {sections.map(s => (
            <button key={s.key} onClick={() => setSection(s.key)} style={{
              display: 'block', width: '100%', padding: '10px 20px', background: section === s.key ? 'var(--accent-subtle)' : 'transparent',
              border: 'none', borderLeft: section === s.key ? '3px solid var(--accent)' : '3px solid transparent',
              color: section === s.key ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', textAlign: 'left', transition: 'all var(--transition)', whiteSpace: 'nowrap',
            }}>{s.label}</button>
          ))}
          <div style={{ borderTop: '1px solid var(--border-default)', margin: '12px 20px', paddingTop: 12 }}>
            <a href="/" style={{ display: 'block', padding: '8px 0', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>+ New Rewrite</a>
            <a href="/build" style={{ display: 'block', padding: '8px 0', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}>+ New Build</a>
          </div>
        </nav>

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 48px' }}>
          <div style={{ maxWidth: 960, margin: '0 auto' }}>

            {/* Mobile nav */}
            <div className="md:hidden" style={{ display: 'flex', gap: 2, marginBottom: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border-default)' }}>
              {sections.map(s => (
                <button key={s.key} onClick={() => setSection(s.key)} style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', transition: 'all var(--transition)',
                  background: section === s.key ? 'var(--accent)' : 'transparent', color: section === s.key ? '#fff' : 'var(--text-secondary)',
                }}>{s.label}</button>
              ))}
            </div>

            {/* ═══ OVERVIEW ═══ */}
            {section === 'overview' && (
              <>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Welcome back{firstName ? `, ${firstName}` : ''}</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 24px' }}>Your profile rewrites, resumes, and interview preps</p>

                {/* KPI pills */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
                  {[
                    { v: totalOrders, l: 'Orders', c: 'var(--accent)', bg: 'var(--accent-subtle)' },
                    { v: roasts.length, l: 'Rewrites', c: '#7C3AED', bg: '#F5F3FF' },
                    { v: builds.length, l: 'Builds', c: 'var(--success)', bg: 'var(--success-subtle)' },
                    { v: resumes.length, l: 'Resumes', c: '#EA580C', bg: '#FFF7ED' },
                    { v: preps.length, l: 'Preps', c: '#0891B2', bg: '#ECFEFF' },
                  ].map((k, i) => (
                    <div key={i} className="saas-card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 140px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: k.c }}>{k.v}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{k.l}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
                  <a href="/" className="saas-btn saas-btn-primary" style={{ borderRadius: 'var(--radius-sm)' }}>+ New Rewrite</a>
                  <a href="/build" className="saas-btn saas-btn-ghost" style={{ color: 'var(--success)' }}>+ New Build</a>
                </div>

                {/* Recent activity */}
                {activity.length > 0 && (
                  <>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>Recent Activity</h2>
                    <div className="saas-card" style={{ overflow: 'hidden' }}>
                      {activity.slice(0, 8).map((item, i) => {
                        const tc = typeColors[item.type] || { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' };
                        const sc = statusColors[item.status] || statusColors.pending;
                        return (
                          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none',
                            borderBottom: i < Math.min(activity.length, 8) - 1 ? '1px solid var(--bg-subtle)' : 'none',
                            transition: 'background var(--transition)',
                          }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0, letterSpacing: '0.03em' }}>{item.type}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                            {item.score && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', flexShrink: 0 }}>{item.score}</span>}
                            <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>{item.status === 'done' ? 'Complete' : item.status}</span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </a>
                        );
                      })}
                    </div>
                    {activity.length > 8 && <button onClick={() => setSection('activity')} className="saas-btn saas-btn-ghost" style={{ marginTop: 12, fontSize: 12 }}>View all activity &rarr;</button>}
                  </>
                )}

                {totalOrders === 0 && (
                  <div className="saas-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>&#128064;</div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>No orders yet</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Get started with a profile rewrite or build from scratch.</p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                      <a href="/" className="saas-btn saas-btn-primary" style={{ borderRadius: 'var(--radius-pill)' }}>Rewrite My Profile</a>
                      <a href="/build" className="saas-btn saas-btn-ghost">Build My LinkedIn</a>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ ACTIVITY TABLE ═══ */}
            {section === 'activity' && (
              <>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>All Activity</h1>
                <div className="saas-card" style={{ overflow: 'hidden' }}>
                  {activity.map((item, i) => {
                    const tc = typeColors[item.type] || { color: 'var(--text-muted)', bg: 'var(--bg-subtle)' };
                    const sc = statusColors[item.status] || statusColors.pending;
                    return (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', textDecoration: 'none',
                        borderBottom: i < activity.length - 1 ? '1px solid var(--bg-subtle)' : 'none',
                        transition: 'background var(--transition)',
                      }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>{item.type}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                        {item.score && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', flexShrink: 0 }}>{item.score}</span>}
                        {item.usage && <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{item.usage} used</span>}
                        <span style={{ fontSize: 10, fontWeight: 600, color: sc.color, background: sc.bg, padding: '2px 8px', borderRadius: 4, flexShrink: 0 }}>{item.status === 'done' ? 'Complete' : item.status}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      </a>
                    );
                  })}
                  {activity.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No activity yet</div>}
                </div>
              </>
            )}

            {/* ═══ SECTION VIEWS (Rewrites, Builds, Resumes, Preps) ═══ */}
            {['rewrites', 'builds', 'resumes', 'preps'].includes(section) && (
              <>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>{sections.find(s => s.key === section)?.label}</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                  {section === 'rewrites' && roasts.map((o: any) => (
                    <a key={o.id} href={`/results/${o.id}`} target="_blank" rel="noreferrer" className="saas-card" style={{ padding: '18px 20px', textDecoration: 'none', display: 'block' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED', background: '#F5F3FF', padding: '2px 10px', borderRadius: 6 }}>{o.plan}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: o.status === 'done' ? 'var(--success)' : 'var(--warning)', background: o.status === 'done' ? 'var(--success-subtle)' : 'var(--warning-subtle)', padding: '2px 10px', borderRadius: 6 }}>{o.status === 'done' ? 'Complete' : o.status}</span>
                      </div>
                      {o.beforeScore != null && <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{o.beforeScore} &rarr; {o.afterScore} <span style={{ color: 'var(--success)' }}>+{o.afterScore - o.beforeScore}</span></div>}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </a>
                  ))}
                  {section === 'builds' && builds.map((o: any) => (
                    <a key={o.id} href={`/build/results/${o.id}`} target="_blank" rel="noreferrer" className="saas-card" style={{ padding: '18px 20px', textDecoration: 'none', display: 'block' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{o.headline || 'LinkedIn Build'}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{o.plan}</span><span>{o.status === 'done' ? 'Complete' : o.status}</span>
                      </div>
                    </a>
                  ))}
                  {section === 'resumes' && resumes.map((r: any) => (
                    <div key={r.id} className="saas-card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{r.targetRole}</div>{r.targetCompany && <div style={{ fontSize: 12, color: 'var(--accent)' }}>{r.targetCompany}</div>}</div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: (r.atsScore||0) >= 80 ? 'var(--success)' : 'var(--accent)', background: (r.atsScore||0) >= 80 ? 'var(--success-subtle)' : 'var(--accent-subtle)', padding: '3px 10px', borderRadius: 8 }}>ATS {r.atsScore ?? '—'}%</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span>{new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span style={{ background: 'var(--bg-subtle)', padding: '1px 6px', borderRadius: 4 }}>{r.templateId}</span>
                        {r.hasCoverLetter && <span style={{ color: 'var(--success)', background: 'var(--success-subtle)', padding: '1px 6px', borderRadius: 4 }}>Cover Letter</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a href={`/resume/${r.id}`} target="_blank" rel="noreferrer" className="saas-btn saas-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 0' }}>View</a>
                        <a href={`/resume/${r.id}/edit`} target="_blank" rel="noreferrer" className="saas-btn saas-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 0', color: 'var(--success)' }}>Edit</a>
                      </div>
                    </div>
                  ))}
                  {section === 'preps' && preps.map((p: any) => (
                    <a key={p.id} href={`/interview-prep/${p.id}`} target="_blank" rel="noreferrer" className="saas-card" style={{ padding: '18px 20px', textDecoration: 'none', display: 'block' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{p.targetRole || 'Interview Prep'}</div>
                      {p.targetCompany && <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 4 }}>{p.targetCompany}</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                        <span>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span style={{ fontWeight: 600, color: p.status === 'ready' ? 'var(--success)' : 'var(--warning)' }}>{p.status === 'ready' ? 'Ready' : p.status}</span>
                      </div>
                    </a>
                  ))}
                </div>
                {sectionItems.length === 0 && <div className="saas-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No {section} yet</div>}
              </>
            )}
          </div>
        </main>
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
    } else { setChecking(false); }
  }, []);

  if (checking) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="saas-skeleton" style={{ width: 120, height: 16, borderRadius: 8 }} />
    </div>
  );

  if (!authed) return <LoginForm onLogin={e => { setAuthed(true); setEmail(e); }} />;
  return <DashboardContent email={email} onLogout={() => { clearToken(); setAuthed(false); setEmail(''); }} />;
}

'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_token');
}

function setToken(token: string) {
  sessionStorage.setItem('admin_token', token);
}

function clearToken() {
  sessionStorage.removeItem('admin_token');
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((opts?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers,
  });
  if (res.status === 401) {
    clearToken();
    // Return a signal so callers can handle it
    throw new Error('Unauthorized');
  }
  return res;
}

async function apiFetchJson(path: string, opts?: RequestInit) {
  const res = await apiFetch(path, opts);
  return res.json();
}

function formatIST(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) + ' IST';
  } catch {
    return dateStr;
  }
}

function Stars({ count }: { count: number }) {
  return <span>{count > 0 ? '⭐'.repeat(count) : '-'}</span>;
}

// ─── Toast ───
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg shadow-lg text-sm font-medium"
      style={{
        background: type === 'success' ? '#059669' : '#DC2626',
        color: 'white',
      }}
    >
      {message}
    </div>
  );
}

// ─── Login ───
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('support@profileroaster.in');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || 'Invalid credentials');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        onLogin();
      } else {
        setError('No token returned');
      }
    } catch {
      setError('Login failed. Check your connection.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--li-gray)' }}>
      <div className="li-card p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--li-text-primary)' }}>Admin Login</h1>
        {error && <p className="text-sm mb-3 p-2 rounded" style={{ color: '#DC2626', background: '#FEE2E2' }}>{error}</p>}
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="admin@example.com"
          className="w-full px-4 py-3 rounded-lg text-sm outline-none mb-3"
          style={{ border: '1px solid var(--li-border)' }}
        />
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-lg text-sm outline-none mb-4"
          style={{ border: '1px solid var(--li-border)' }}
        />
        <button
          onClick={submit}
          disabled={loading}
          className="w-full py-3 rounded-full text-white font-semibold cursor-pointer border-none"
          style={{ background: loading ? '#93C5FD' : 'var(--li-blue)' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="li-card p-4">
      <p className="text-xs font-semibold uppercase" style={{ color: 'var(--li-text-secondary)' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: 'var(--li-text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--li-text-secondary)' }}>{sub}</p>}
    </div>
  );
}

// ─── Overview Screen ───
function OverviewScreen() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetchJson('/api/admin/overview').then(setData).catch(() => {}); }, []);
  if (!data) return <p>Loading...</p>;

  const avgMins = data.avg_processing_seconds != null
    ? Math.round(data.avg_processing_seconds / 60)
    : null;

  const funnel = data.funnel;
  const funnelSteps = funnel ? [
    { label: 'Teasers', value: funnel.teasers },
    { label: 'Emails', value: funnel.emails_captured },
    { label: 'Pay Started', value: funnel.payments_initiated },
    { label: 'Completed', value: funnel.payments_completed },
    { label: 'Delivered', value: funnel.results_delivered },
  ] : [];
  const funnelMax = funnelSteps.length > 0 ? Math.max(...funnelSteps.map(s => s.value), 1) : 1;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today Orders" value={data.today.orders} sub={`₹${(data.today.revenue_paise / 100).toFixed(0)}`} />
        <StatCard label="Today Teasers" value={data.total_teasers_today} sub={`${data.today.conversion_pct}% conversion`} />
        <StatCard label="Week Orders" value={data.week.orders} sub={`₹${(data.week.revenue_paise / 100).toFixed(0)}`} />
        <StatCard label="Month Orders" value={data.month.orders} sub={`₹${(data.month.revenue_paise / 100).toFixed(0)}`} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Jobs" value={data.active_jobs} />
        <StatCard label="Refund Rate"
          value={`${data.refund_rate}%`}
          sub={data.refund_rate > 5 ? '⚠️ ALERT: Above 5%' : 'Healthy'}
        />
        {avgMins != null && <StatCard label="Avg Processing Time" value={`${avgMins} min`} />}
        <StatCard label="Emails Sent Today" value={data.today.emails_sent ?? 0} />
      </div>

      {data.today.auto_cancelled != null && data.today.auto_cancelled > 0 && (
        <div className="mb-6">
          <StatCard label="Auto-Cancelled Today" value={data.today.auto_cancelled} sub="Unpaid orders cleaned up" />
        </div>
      )}

      {/* Pipeline Status */}
      {data.pipeline_stages && data.pipeline_stages.length > 0 && (
        <div className="li-card p-4 mb-6">
          <h3 className="text-sm font-bold mb-3">Pipeline Status</h3>
          <div className="flex flex-wrap gap-2">
            {data.pipeline_stages.map((s: any) => {
              const colors: Record<string, string> = {
                parsing: '#2563EB',
                roasting: '#D97706',
                rewriting: '#7C3AED',
                scoring: '#0891B2',
                card_generating: '#059669',
                sending_email: '#DC2626',
                done: '#16A34A',
                failed: '#DC2626',
              };
              const bg = colors[s.processing_status] || 'var(--li-blue)';
              return (
                <span key={s.processing_status} className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background: bg }}>
                  {s.processing_status}: {s.cnt}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      {funnel && (
        <div className="li-card p-4 mb-6">
          <h3 className="text-sm font-bold mb-3">Conversion Funnel (Last 7 Days)</h3>
          <div className="space-y-2">
            {funnelSteps.map((step, i) => {
              const pct = funnelMax > 0 ? (step.value / funnelMax) * 100 : 0;
              const convPct = i > 0 && funnelSteps[0].value > 0
                ? ((step.value / funnelSteps[0].value) * 100).toFixed(1)
                : '100.0';
              return (
                <div key={step.label} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-right text-xs font-semibold" style={{ color: 'var(--li-text-secondary)' }}>{step.label}</span>
                  <div className="flex-1 h-6 rounded" style={{ background: 'var(--li-border)' }}>
                    <div className="h-6 rounded flex items-center px-2" style={{
                      width: `${Math.max(pct, 3)}%`,
                      background: 'var(--li-blue)',
                      transition: 'width 0.3s',
                    }}>
                      <span className="text-xs font-semibold text-white whitespace-nowrap">{step.value}</span>
                    </div>
                  </div>
                  <span className="w-14 text-xs" style={{ color: 'var(--li-text-secondary)' }}>{convPct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Order Detail Modal ───
// ─── Admin Resume Section (inside order detail) ───
function AdminResumeSection({ orderId, email, onToast }: { orderId: string; email: string; onToast: (msg: string, type: 'success' | 'error') => void }) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetchJson(`/api/admin/resumes/${orderId}`).then(d => { setResumes(d.resumes || []); setLoaded(true); }).catch(() => setLoaded(true));
  }, [orderId]);

  if (!loaded) return null;

  async function sendResumeEmail(resumeId: string) {
    try {
      const res = await apiFetch(`/api/admin/send-resume-email/${resumeId}`, { method: 'POST', body: JSON.stringify({ email }) });
      if (res.ok) { onToast('Resume email sent!', 'success'); }
      else { const b = await res.json().catch(() => ({})); onToast(b.error || 'Failed', 'error'); }
    } catch { onToast('Failed to send', 'error'); }
  }

  async function deleteResume(resumeId: string) {
    if (!confirm('Delete this resume?')) return;
    try {
      const res = await apiFetch(`/api/admin/resumes/${resumeId}`, { method: 'DELETE' });
      if (res.ok) { setResumes(prev => prev.filter(r => r.id !== resumeId)); onToast('Resume deleted', 'success'); }
      else { onToast('Failed to delete', 'error'); }
    } catch { onToast('Failed', 'error'); }
  }

  return (
    <div className="mb-4 p-3 rounded" style={{ background: '#F0F7FF', border: '1px solid #BFDBFE' }}>
      <h4 className="font-semibold text-sm mb-2" style={{ color: '#1E40AF' }}>Resumes ({resumes.length})</h4>
      {resumes.length === 0 ? (
        <p className="text-xs" style={{ color: '#888' }}>No resumes generated yet</p>
      ) : (
        <div className="space-y-2">
          {resumes.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded text-sm" style={{ background: 'white', border: '1px solid #E0E0E0' }}>
              <div>
                <div className="font-semibold text-xs">{r.target_role || 'Resume'}{r.target_company ? ` — ${r.target_company}` : ''}</div>
                <div className="text-xs" style={{ color: '#888' }}>
                  ATS: <span style={{ color: r.ats_score >= 80 ? '#057642' : '#0A66C2', fontWeight: 700 }}>{r.ats_score}%</span>
                  {' · '}{r.template_id || 'classic'}
                  {' · '}{formatIST(r.created_at)}
                </div>
              </div>
              <div className="flex gap-2">
                <a href={`https://profileroaster.in/resume/${r.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold px-2 py-1 rounded" style={{ background: 'var(--li-gray)', color: 'var(--li-blue)', textDecoration: 'none' }}>View</a>
                <button onClick={() => sendResumeEmail(r.id)}
                  className="text-xs font-semibold px-2 py-1 rounded text-white border-none cursor-pointer" style={{ background: '#0A66C2' }}>Email</button>
                <button onClick={() => deleteResume(r.id)}
                  className="text-xs font-semibold px-2 py-1 rounded border-none cursor-pointer" style={{ background: '#FEE2E2', color: '#CC1016' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <a href={`https://profileroaster.in/resume?orderId=${orderId}`} target="_blank" rel="noopener noreferrer"
        className="inline-block mt-2 text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ background: '#057642', textDecoration: 'none' }}>
        + Generate Resume for Client
      </a>
    </div>
  );
}

function OrderDetailModal({
  order,
  onClose,
  onToast,
}: {
  order: any;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [sendingEmail, setSendingEmail] = useState(false);

  async function sendEmail() {
    setSendingEmail(true);
    try {
      const res = await apiFetch(`/api/admin/send-email/${order.id}`, { method: 'POST' });
      if (res.ok) {
        onToast('Results email sent successfully!', 'success');
      } else {
        const body = await res.json().catch(() => ({}));
        onToast(body.error || 'Failed to send email', 'error');
      }
    } catch {
      onToast('Failed to send email', 'error');
    }
    setSendingEmail(false);
  }

  const s = order || {};
  const roast = s.roast || null;
  const rewrite = s.rewrite || null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="li-card p-6 max-w-3xl w-full"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg">Order: {s.id}</h3>
          <button onClick={onClose} className="text-lg cursor-pointer bg-transparent border-none p-1">✕</button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4 p-3 rounded" style={{ background: 'var(--li-gray)' }}>
          <div><span className="font-semibold">Email:</span> {s.email}</div>
          <div><span className="font-semibold">Plan:</span> <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: s.plan === 'pro' ? '#E8F4FD' : '#f3f4f6', color: s.plan === 'pro' ? 'var(--li-blue)' : 'var(--li-text-secondary)' }}>{s.plan}</span></div>
          <div><span className="font-semibold">Payment:</span> {s.payment_status}</div>
          <div><span className="font-semibold">Processing:</span> {s.processing_status}</div>
          <div><span className="font-semibold">Created:</span> {formatIST(s.created_at)}</div>
          <div><span className="font-semibold">Paid:</span> {formatIST(s.paid_at)}</div>
          <div><span className="font-semibold">Completed:</span> {formatIST(s.processing_done_at)}</div>
          <div>
            <span className="font-semibold">Rating:</span>{' '}
            {s.user_rating ? <><Stars count={s.user_rating} /> ({s.user_rating}/5)</> : '-'}
          </div>
          {s.user_feedback && (
            <div className="col-span-2"><span className="font-semibold">Feedback:</span> {s.user_feedback}</div>
          )}
        </div>

        {/* Score */}
        {(s.before_score || s.after_score) && (
          <div className="mb-4 p-3 rounded" style={{ background: 'var(--li-gray)' }}>
            <h4 className="font-semibold text-sm mb-2">Score: {s.before_score?.overall ?? '-'} → {s.after_score?.overall ?? '-'}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>Headline: {s.before_score?.headline ?? '-'} → {s.after_score?.headline ?? '-'}</div>
              <div>About: {s.before_score?.about ?? '-'} → {s.after_score?.about ?? '-'}</div>
              <div>Experience: {s.before_score?.experience ?? '-'} → {s.after_score?.experience ?? '-'}</div>
              <div>Completeness: {s.before_score?.completeness ?? '-'} → {s.after_score?.completeness ?? '-'}</div>
            </div>
          </div>
        )}

        {/* Roast */}
        {roast && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--li-blue)' }}>
              Roast: {roast.roast_title}
            </h4>
            <div className="space-y-3">
              {roast.roast_points?.map((p: any, i: number) => (
                <div key={i} className="p-3 rounded text-sm" style={{ background: i % 2 === 0 ? '#FFF7ED' : '#FFFBEB' }}>
                  <div className="font-semibold text-xs mb-1" style={{ color: 'var(--li-text-secondary)' }}>
                    #{p.point_number} — {p.section_targeted}
                  </div>
                  <div className="mb-1">{p.roast}</div>
                  {p.underlying_issue && (
                    <div className="text-xs italic" style={{ color: 'var(--li-text-secondary)' }}>
                      Issue: {p.underlying_issue}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {roast.closing_compliment && (
              <div className="mt-3 p-3 rounded text-sm" style={{ background: '#F0FDF4' }}>
                <span className="font-semibold text-xs">Closing compliment:</span> {roast.closing_compliment}
              </div>
            )}
          </div>
        )}

        {/* Rewrite */}
        {rewrite && (
          <div className="mb-4">
            <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--li-blue)' }}>Rewrite</h4>

            {rewrite.rewritten_headline && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>Headline</div>
                <div className="text-sm p-2 rounded" style={{ background: 'var(--li-gray)' }}>{rewrite.rewritten_headline}</div>
              </div>
            )}

            {rewrite.rewritten_about && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>About</div>
                <div className="text-sm p-2 rounded whitespace-pre-wrap" style={{ background: 'var(--li-gray)' }}>{rewrite.rewritten_about}</div>
              </div>
            )}

            {rewrite.rewritten_experience && rewrite.rewritten_experience.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>Experience</div>
                <div className="space-y-2">
                  {rewrite.rewritten_experience.map((exp: any, i: number) => (
                    <div key={i} className="p-2 rounded text-sm" style={{ background: 'var(--li-gray)' }}>
                      <div className="font-semibold">{exp.title || exp.role}{exp.company ? ` at ${exp.company}` : ''}</div>
                      {exp.bullets && (
                        <ul className="list-disc ml-4 mt-1 text-xs space-y-0.5">
                          {exp.bullets.map((b: string, j: number) => <li key={j}>{b}</li>)}
                        </ul>
                      )}
                      {exp.description && !exp.bullets && (
                        <p className="text-xs mt-1 whitespace-pre-wrap">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rewrite.placeholders_to_fill && rewrite.placeholders_to_fill.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>Placeholders to Fill</div>
                <ul className="list-disc ml-4 text-sm">
                  {rewrite.placeholders_to_fill.map((p: any, i: number) => (
                    <li key={i}>
                      <span className="font-mono text-xs" style={{ color: '#E16B00' }}>{typeof p === 'string' ? p : p.placeholder || ''}</span>
                      {typeof p === 'object' && p.location && <span className="text-xs" style={{ color: 'var(--li-text-secondary)' }}> in {p.location}</span>}
                      {typeof p === 'object' && p.instruction && <span className="text-xs" style={{ color: 'var(--li-text-secondary)' }}> — {p.instruction}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Card Image */}
        {s.card_image_url && (
          <div className="mb-4">
            <span className="text-xs font-semibold" style={{ color: 'var(--li-text-secondary)' }}>Card Image: </span>
            <a href={s.card_image_url} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: 'var(--li-blue)' }}>
              {s.card_image_url}
            </a>
          </div>
        )}

        {/* Resumes */}
        {s.processing_status === 'done' && <AdminResumeSection orderId={s.id} email={s.email} onToast={onToast} />}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-3" style={{ borderTop: '1px solid var(--li-border)' }}>
          {s.processing_status !== 'done' && s.payment_status !== 'paid' && (
            <button
              onClick={async () => {
                if (!confirm('Approve this order? It will be marked as paid and start processing.')) return;
                try {
                  const res = await apiFetch(`/api/admin/approve-order/${s.id}`, { method: 'POST' });
                  if (res.ok) { onToast('Order approved and queued for processing!', 'success'); onClose(); }
                  else { const b = await res.json().catch(() => ({})); onToast(b.error || 'Failed', 'error'); }
                } catch { onToast('Failed to approve order', 'error'); }
              }}
              className="px-5 py-2 rounded-full text-white font-semibold text-sm cursor-pointer border-none"
              style={{ background: '#057642' }}
            >
              Approve Order
            </button>
          )}
          {s.processing_status !== 'done' && s.processing_status !== 'failed' && (
            <button
              onClick={async () => {
                if (!confirm('Cancel this order? This cannot be undone.')) return;
                try {
                  const res = await apiFetch(`/api/admin/cancel-order/${s.id}`, { method: 'POST' });
                  if (res.ok) { onToast('Order cancelled', 'success'); onClose(); }
                  else { const b = await res.json().catch(() => ({})); onToast(b.error || 'Failed', 'error'); }
                } catch { onToast('Failed to cancel order', 'error'); }
              }}
              className="px-5 py-2 rounded-full font-semibold text-sm cursor-pointer border-none"
              style={{ background: '#FEE2E2', color: '#CC1016' }}
            >
              Cancel Order
            </button>
          )}
          <button
            onClick={sendEmail}
            disabled={sendingEmail || s.processing_status !== 'done'}
            className="px-5 py-2 rounded-full text-white font-semibold text-sm cursor-pointer border-none"
            style={{
              background: (sendingEmail || s.processing_status !== 'done') ? '#93C5FD' : 'var(--li-blue)',
              cursor: (sendingEmail || s.processing_status !== 'done') ? 'not-allowed' : 'pointer',
            }}
          >
            {sendingEmail ? 'Sending...' : 'Send Results Email'}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-sm cursor-pointer font-semibold"
            style={{ background: 'var(--li-gray)', border: '1px solid var(--li-border)', color: 'var(--li-text-secondary)' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Orders Screen ───
function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetchJson(`/api/admin/orders?page=${page}&limit=20`);
      if (data?.orders) {
        setOrders(data.orders);
        setTotal(data.total || 0);
      }
    } catch {
      setToast({ message: 'Failed to load orders', type: 'error' });
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(orderId: string) {
    try {
      const data = await apiFetchJson(`/api/admin/orders/${orderId}`);
      if (!data || data.error) {
        setToast({ message: data?.error || 'Failed to load order', type: 'error' });
        return;
      }
      setSelected(data);
    } catch (err) {
      setToast({ message: 'Failed to load order details', type: 'error' });
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Orders ({total})</h2>
      </div>
      <div className="li-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--li-gray)' }}>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Paid At</th>
              <th className="text-left p-3">Completed</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, idx) => (
              <tr
                key={o.id}
                className="cursor-pointer"
                style={{
                  borderBottom: '1px solid var(--li-border)',
                  background: idx % 2 === 0 ? 'white' : 'var(--li-gray)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'white' : 'var(--li-gray)')}
                onClick={() => openDetail(o.id)}
              >
                <td className="p-3 text-xs whitespace-nowrap">{formatIST(o.created_at)}</td>
                <td className="p-3 text-xs whitespace-nowrap">{formatIST(o.paid_at)}</td>
                <td className="p-3 text-xs whitespace-nowrap">{formatIST(o.processing_done_at)}</td>
                <td className="p-3">{o.email}</td>
                <td className="p-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: o.plan === 'pro' ? '#E8F4FD' : 'var(--li-gray)',
                      color: o.plan === 'pro' ? 'var(--li-blue)' : 'var(--li-text-secondary)',
                    }}
                  >
                    {o.plan}
                  </span>
                </td>
                <td className="p-3">{o.payment_status}</td>
                <td className="p-3 whitespace-nowrap">{o.before_score ?? '-'} → {o.after_score ?? '-'}</td>
                <td className="p-3">
                  {o.user_rating ? (
                    <div>
                      <Stars count={o.user_rating} />
                      {o.user_feedback && (
                        <div className="text-xs mt-0.5 truncate max-w-[150px]" style={{ color: 'var(--li-text-secondary)' }}>
                          {o.user_feedback}
                        </div>
                      )}
                    </div>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-1 rounded text-sm cursor-pointer border-none"
          style={{ background: 'var(--li-gray)' }}
        >
          ← Prev
        </button>
        <span className="text-sm py-1">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          disabled={orders.length < 20}
          className="px-3 py-1 rounded text-sm cursor-pointer border-none"
          style={{ background: 'var(--li-gray)' }}
        >
          Next →
        </button>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onToast={(msg, type) => setToast({ message: msg, type })}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Teasers Screen ───
function TeasersScreen() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetchJson('/api/admin/teasers').then(setData).catch(() => {}); }, []);
  if (!data) return <p>Loading...</p>;

  const avgScoreColor = data.avg_score != null
    ? data.avg_score >= 70 ? 'var(--li-green)' : data.avg_score >= 40 ? '#D97706' : 'var(--li-red)'
    : 'var(--li-text-primary)';

  const hourlyMax = data.hourly_distribution
    ? Math.max(...data.hourly_distribution.map((h: any) => h.cnt), 1)
    : 1;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Teaser Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Teasers" value={data.total} />
        <StatCard label="Converted" value={data.converted} sub={`${data.conversion_pct}%`} />
        <StatCard label="With Email" value={data.with_email} />
        <StatCard label="Without Email" value={data.without_email} />
      </div>

      {/* Avg Score + Email Capture Rate */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {data.avg_score != null && (
          <div className="li-card p-4 text-center">
            <p className="text-xs font-semibold uppercase" style={{ color: 'var(--li-text-secondary)' }}>Avg Teaser Score</p>
            <p className="text-4xl font-bold mt-2" style={{ color: avgScoreColor }}>{data.avg_score.toFixed(1)}</p>
          </div>
        )}
        {data.email_capture_rate != null && (
          <StatCard label="Email Capture Rate" value={`${data.email_capture_rate.toFixed(1)}%`} sub="of teasers leave email" />
        )}
      </div>

      {/* Conversion by Score Tier */}
      {data.conversion_by_score && data.conversion_by_score.length > 0 && (
        <div className="li-card p-4 mb-6">
          <h3 className="text-sm font-bold mb-3">Conversion by Score Tier</h3>
          <div className="space-y-3">
            {data.conversion_by_score.map((tier: any) => {
              const rate = tier.total > 0 ? ((tier.converted / tier.total) * 100).toFixed(1) : '0.0';
              const tierColors: Record<string, string> = { low: 'var(--li-red)', mid: '#D97706', high: 'var(--li-green)' };
              return (
                <div key={tier.tier}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold" style={{ color: tierColors[tier.tier] || 'var(--li-text-primary)' }}>
                      {tier.tier.toUpperCase()} ({tier.converted}/{tier.total})
                    </span>
                    <span style={{ color: 'var(--li-text-secondary)' }}>{rate}%</span>
                  </div>
                  <div className="h-4 rounded" style={{ background: 'var(--li-border)' }}>
                    <div className="h-4 rounded" style={{
                      width: `${Math.max(parseFloat(rate), 1)}%`,
                      background: tierColors[tier.tier] || 'var(--li-blue)',
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="li-card p-4 mb-6">
        <h3 className="text-sm font-bold mb-3">Score Distribution</h3>
        <div className="space-y-2">
          {data.score_distribution.map((d: any) => (
            <div key={d.range} className="flex items-center gap-3 text-sm">
              <span className="w-16 text-right" style={{ color: 'var(--li-text-secondary)' }}>{d.range}</span>
              <div className="flex-1 h-4 rounded" style={{ background: 'var(--li-border)' }}>
                <div className="h-4 rounded" style={{
                  width: `${Math.min(100, (d.count / Math.max(data.total, 1)) * 100 * 5)}%`,
                  background: 'var(--li-blue)',
                }} />
              </div>
              <span className="w-8">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Headlines */}
      {data.recent_headlines && data.recent_headlines.length > 0 && (
        <div className="li-card p-4 mb-6 overflow-x-auto">
          <h3 className="text-sm font-bold mb-3">Recent Headlines</h3>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--li-gray)' }}>
                <th className="text-left p-2">Headline</th>
                <th className="text-left p-2">Score</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Converted</th>
                <th className="text-left p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_headlines.map((h: any, idx: number) => (
                <tr key={idx} style={{
                  borderBottom: '1px solid var(--li-border)',
                  background: idx % 2 === 0 ? 'white' : 'var(--li-gray)',
                }}>
                  <td className="p-2 max-w-xs truncate">{h.headline_text || '-'}</td>
                  <td className="p-2">{h.score ?? '-'}</td>
                  <td className="p-2 text-xs">{h.email || '-'}</td>
                  <td className="p-2">
                    {h.converted ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold text-white" style={{ background: 'var(--li-green)' }}>Yes</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: 'var(--li-gray)', color: 'var(--li-text-secondary)' }}>No</span>
                    )}
                  </td>
                  <td className="p-2 text-xs whitespace-nowrap">{formatIST(h.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Peak Hours */}
      {data.hourly_distribution && data.hourly_distribution.length > 0 && (
        <div className="li-card p-4">
          <h3 className="text-sm font-bold mb-3">Peak Hours (Teaser Generation)</h3>
          <div className="space-y-1">
            {data.hourly_distribution.map((h: any) => {
              const pct = (h.cnt / hourlyMax) * 100;
              const hourLabel = `${h.hour.toString().padStart(2, '0')}:00`;
              return (
                <div key={h.hour} className="flex items-center gap-2 text-xs">
                  <span className="w-12 text-right font-mono" style={{ color: 'var(--li-text-secondary)' }}>{hourLabel}</span>
                  <div className="flex-1 h-4 rounded" style={{ background: 'var(--li-border)' }}>
                    <div className="h-4 rounded" style={{
                      width: `${Math.max(pct, 1)}%`,
                      background: 'var(--li-blue)',
                    }} />
                  </div>
                  <span className="w-8" style={{ color: 'var(--li-text-secondary)' }}>{h.cnt}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Quality Screen ───
function QualityScreen() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try dedicated ratings endpoint first, fall back to orders
    apiFetchJson('/api/admin/ratings')
      .then(data => {
        setRatings(Array.isArray(data) ? data : data.ratings || []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: fetch from orders
        apiFetchJson('/api/admin/orders?limit=100').then(data => {
          const rated = (data?.orders || []).filter((o: any) => o.user_rating);
          setRatings(rated);
          setLoading(false);
        }).catch(() => setLoading(false));
      });
  }, []);

  const avgRating = ratings.length > 0
    ? (ratings.reduce((s: number, o: any) => s + (o.user_rating || o.rating || 0), 0) / ratings.length).toFixed(1)
    : '-';
  const lowRated = ratings.filter((o: any) => (o.user_rating || o.rating || 0) <= 2);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Quality Metrics</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Average Rating" value={`${avgRating} ⭐`} sub={`${ratings.length} ratings`} />
        <StatCard label="Low Ratings (1-2)" value={lowRated.length}
          sub={lowRated.length > 0 ? '⚠️ Review needed' : 'All good'} />
      </div>

      {/* Full ratings table */}
      <div className="li-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--li-gray)' }}>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Rating</th>
              <th className="text-left p-3">Feedback</th>
              <th className="text-left p-3">Score</th>
            </tr>
          </thead>
          <tbody>
            {ratings
              .sort((a: any, b: any) => new Date(b.created_at || b.rated_at || 0).getTime() - new Date(a.created_at || a.rated_at || 0).getTime())
              .map((r: any, idx: number) => {
                const rating = r.user_rating || r.rating || 0;
                const feedback = r.user_feedback || r.feedback || '';
                const email = r.email || r.user_email || '-';
                const dateStr = r.created_at || r.rated_at;
                return (
                  <tr
                    key={r.id || idx}
                    style={{
                      borderBottom: '1px solid var(--li-border)',
                      background: idx % 2 === 0 ? 'white' : 'var(--li-gray)',
                    }}
                  >
                    <td className="p-3 text-xs whitespace-nowrap">{formatIST(dateStr)}</td>
                    <td className="p-3">{email}</td>
                    <td className="p-3"><Stars count={rating} /></td>
                    <td className="p-3 max-w-xs">{feedback || '-'}</td>
                    <td className="p-3 whitespace-nowrap">{r.before_score ?? '-'} → {r.after_score ?? '-'}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        {ratings.length === 0 && (
          <p className="text-sm text-center p-6" style={{ color: 'var(--li-text-secondary)' }}>No ratings yet.</p>
        )}
      </div>

      {/* Low rated highlight */}
      {lowRated.length > 0 && (
        <div className="li-card p-4 mt-4">
          <h3 className="text-sm font-bold mb-2">Low-rated orders (needs review)</h3>
          {lowRated.map((o: any, idx: number) => (
            <div key={o.id || idx} className="text-xs p-2 mb-1 rounded" style={{ background: '#FEE2E2' }}>
              {o.email || o.user_email} — {o.user_rating || o.rating}⭐ — Score: {o.before_score ?? '-'}→{o.after_score ?? '-'}
              {(o.user_feedback || o.feedback) && <span className="ml-2 italic">"{o.user_feedback || o.feedback}"</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Revenue Screen ───
function RevenueScreen() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetchJson('/api/admin/revenue').then(setData).catch(() => {}); }, []);
  if (!data) return <p>Loading...</p>;

  const totalRevenue = data.daily.reduce((s: number, d: any) => s + d.revenue, 0);
  const stdRev = data.standard_revenue ?? 0;
  const proRev = data.pro_revenue ?? 0;
  const revSplitTotal = stdRev + proRev || 1;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Revenue</h2>

      {/* MRR highlight */}
      {data.mrr != null && (
        <div className="li-card p-6 mb-6 text-center">
          <p className="text-xs font-semibold uppercase" style={{ color: 'var(--li-text-secondary)' }}>Monthly Recurring Revenue (30-day rolling)</p>
          <p className="text-4xl font-bold mt-2" style={{ color: 'var(--li-green)' }}>
            ₹{(data.mrr / 100).toLocaleString('en-IN')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="30-Day Revenue" value={`₹${(totalRevenue / 100).toLocaleString('en-IN')}`} />
        <StatCard label="Standard Orders" value={data.standard_count} />
        <StatCard label="Pro Orders" value={data.pro_count} />
        <StatCard label="Avg Order Value" value={`₹${(data.avg_order_value / 100).toFixed(0)}`} />
      </div>

      {/* Revenue Split */}
      {(data.standard_revenue != null || data.pro_revenue != null) && (
        <div className="li-card p-4 mb-6">
          <h3 className="text-sm font-bold mb-3">Revenue Split</h3>
          <div className="flex gap-4 mb-2 text-sm">
            <span style={{ color: 'var(--li-blue)' }}>Standard: ₹{(stdRev / 100).toLocaleString('en-IN')}</span>
            <span style={{ color: '#7C3AED' }}>Pro: ₹{(proRev / 100).toLocaleString('en-IN')}</span>
          </div>
          <div className="h-6 rounded flex overflow-hidden" style={{ background: 'var(--li-border)' }}>
            <div className="h-6" style={{ width: `${(stdRev / revSplitTotal) * 100}%`, background: 'var(--li-blue)', transition: 'width 0.3s' }} />
            <div className="h-6" style={{ width: `${(proRev / revSplitTotal) * 100}%`, background: '#7C3AED', transition: 'width 0.3s' }} />
          </div>
        </div>
      )}

      {/* Refunds + Upgrades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Refunds" value={data.total_refunds} />
        {data.refund_amount != null && (
          <StatCard label="Refund Amount" value={`₹${(data.refund_amount / 100).toLocaleString('en-IN')}`} />
        )}
        {data.upgrades != null && (
          <StatCard label="Std → Pro Upgrades" value={data.upgrades} />
        )}
      </div>

      <div className="li-card p-4 mb-6">
        <h3 className="text-sm font-bold mb-3">Daily Revenue (Last 30 Days)</h3>
        <div className="flex items-end gap-1 h-32">
          {data.daily.map((d: any, i: number) => {
            const maxRev = Math.max(...data.daily.map((x: any) => x.revenue), 1);
            const h = (d.revenue / maxRev) * 100;
            return (
              <div key={i} className="flex-1 rounded-t" title={`${d.date}: ₹${(d.revenue / 100).toFixed(0)}`}
                style={{ height: `${Math.max(h, 2)}%`, background: 'var(--li-blue)', minWidth: 4 }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Referrals Screen ───
function ReferralsScreen() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [payoutModal, setPayoutModal] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [txnRef, setTxnRef] = useState('');

  useEffect(() => { apiFetchJson('/api/admin/referrals').then(setReferrals).catch(() => {}); }, []);

  async function processPayout() {
    if (!amount || !txnRef || !payoutModal) return;
    await apiFetchJson(`/api/admin/referrals/${payoutModal.referral_code}/payout`, {
      method: 'POST',
      body: JSON.stringify({ amount_paise: parseInt(amount) * 100, txn_ref: txnRef }),
    });
    setPayoutModal(null);
    setAmount('');
    setTxnRef('');
    apiFetchJson('/api/admin/referrals').then(setReferrals);
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Referral Payouts</h2>
      <div className="li-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--li-gray)' }}>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Uses</th>
              <th className="text-left p-3">Earnings</th>
              <th className="text-left p-3">Pending</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r, idx) => (
              <tr key={r.referral_code} style={{
                borderBottom: '1px solid var(--li-border)',
                background: idx % 2 === 0 ? 'white' : 'var(--li-gray)',
              }}>
                <td className="p-3">{r.referrer_email}</td>
                <td className="p-3 font-mono text-xs">{r.referral_code}</td>
                <td className="p-3">{r.uses_count}</td>
                <td className="p-3">₹{(r.earnings_paise / 100).toFixed(0)}</td>
                <td className="p-3 font-semibold">₹{(r.pending_payout_paise / 100).toFixed(0)}</td>
                <td className="p-3">
                  {r.pending_payout_paise >= 50000 && (
                    <button onClick={() => setPayoutModal(r)}
                      className="text-xs px-2 py-1 rounded text-white cursor-pointer border-none"
                      style={{ background: 'var(--li-green)' }}>Mark Paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payout Modal */}
      {payoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPayoutModal(null)}>
          <div className="li-card p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-3">Process Payout: {payoutModal.referral_code}</h3>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Amount (₹)" className="w-full px-3 py-2 rounded text-sm outline-none mb-2"
              style={{ border: '1px solid var(--li-border)' }} />
            <input type="text" value={txnRef} onChange={e => setTxnRef(e.target.value)}
              placeholder="Transaction Reference" className="w-full px-3 py-2 rounded text-sm outline-none mb-3"
              style={{ border: '1px solid var(--li-border)' }} />
            <button onClick={processPayout} className="w-full py-2 rounded-full text-white font-semibold cursor-pointer border-none"
              style={{ background: 'var(--li-blue)' }}>Confirm Payout</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Dashboard ───
type Screen = 'overview' | 'orders' | 'teasers' | 'quality' | 'revenue' | 'referrals';

const NAV: { key: Screen; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'teasers', label: 'Teasers' },
  { key: 'quality', label: 'Quality' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'referrals', label: 'Referrals' },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [screen, setScreen] = useState<Screen>('overview');

  useEffect(() => {
    const token = getToken();
    if (token) {
      apiFetchJson('/api/admin/overview')
        .then(() => setAuthed(true))
        .catch(() => {
          clearToken();
          setAuthed(false);
        })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  function handleLogout() {
    clearToken();
    setAuthed(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--li-gray)' }}>
        <p style={{ color: 'var(--li-text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return (
    <main className="min-h-screen" style={{ background: 'var(--li-gray)' }}>
      {/* Nav */}
      <nav className="px-4 py-3 flex gap-2 flex-wrap items-center" style={{ background: 'var(--li-card)', borderBottom: '1px solid var(--li-border)' }}>
        <span className="font-bold mr-4" style={{ color: 'var(--li-blue)' }}>Admin</span>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setScreen(n.key)}
            className="text-sm px-3 py-1 rounded-full cursor-pointer border-none"
            style={{
              background: screen === n.key ? 'var(--li-blue)' : 'transparent',
              color: screen === n.key ? 'white' : 'var(--li-text-secondary)',
            }}>{n.label}</button>
        ))}
        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1 rounded-full cursor-pointer border-none"
          style={{ background: 'var(--li-gray)', color: 'var(--li-text-secondary)' }}
        >
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {screen === 'overview' && <OverviewScreen />}
        {screen === 'orders' && <OrdersScreen />}
        {screen === 'teasers' && <TeasersScreen />}
        {screen === 'quality' && <QualityScreen />}
        {screen === 'revenue' && <RevenueScreen />}
        {screen === 'referrals' && <ReferralsScreen />}
      </div>
    </main>
  );
}

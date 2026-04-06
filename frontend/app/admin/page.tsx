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
          {s.payment_status === 'paid' && s.processing_status !== 'done' && (
            <button
              onClick={async () => {
                if (!confirm('Reprocess this order? It will be re-queued for AI processing.')) return;
                try {
                  const res = await apiFetch(`/api/admin/reprocess-order/${s.id}`, { method: 'POST' });
                  if (res.ok) { onToast('Order reprocessing started!', 'success'); onClose(); }
                  else { const b = await res.json().catch(() => ({})); onToast(b.error || 'Failed', 'error'); }
                } catch { onToast('Failed to reprocess', 'error'); }
              }}
              className="px-5 py-2 rounded-full text-white font-semibold text-sm cursor-pointer border-none"
              style={{ background: '#0A66C2' }}
            >
              Reprocess Order
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
// ═══ Email Sequences Screen ═══
function EmailsScreen() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [optoutEmail, setOptoutEmail] = useState('');
  const [optoutReason, setOptoutReason] = useState('');
  const [sendOrderId, setSendOrderId] = useState('');
  const [sendKey, setSendKey] = useState('');
  const [msg, setMsg] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const data = await apiFetchJson('/api/admin/email-sequences/status');
      setStatus(data);
    } catch { setStatus(null); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  async function toggleEnabled() {
    const data = await apiFetchJson('/api/admin/email-sequences/toggle', { method: 'POST', body: JSON.stringify({ enabled: !status?.enabled }) });
    setMsg(data.message); fetchStatus();
  }

  async function addOptout() {
    if (!optoutEmail) return;
    await apiFetchJson('/api/admin/email-sequences/optout', { method: 'POST', body: JSON.stringify({ email: optoutEmail, reason: optoutReason || 'admin' }) });
    setOptoutEmail(''); setOptoutReason(''); setMsg(`${optoutEmail} opted out`); fetchStatus();
  }

  async function removeOptout(email: string) {
    await apiFetchJson('/api/admin/email-sequences/optout', { method: 'DELETE', body: JSON.stringify({ email }) });
    setMsg(`${email} removed from opt-out`); fetchStatus();
  }

  async function sendOne() {
    if (!sendOrderId || !sendKey) return;
    const data = await apiFetchJson('/api/admin/email-sequences/send', { method: 'POST', body: JSON.stringify({ orderId: sendOrderId, emailKey: sendKey }) });
    setMsg(data.message || data.error); setSendOrderId(''); setSendKey('');
  }

  async function runNow() {
    setMsg('Running...');
    const data = await apiFetchJson('/api/admin/email-sequences/run-now', { method: 'POST' });
    setMsg(`Done: ${data.sent} sent, ${data.errors} errors`);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Email Sequences</h2>
      {msg && <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#1E40AF' }}>{msg}</div>}

      {/* Global Toggle */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Sequence Status</div>
            <div style={{ fontSize: 13, color: '#666' }}>
              {status?.enabled ? '✅ Emails are being sent automatically (daily 10:30 AM IST)' : '⏸️ All sequence emails are PAUSED'}
            </div>
          </div>
          <button onClick={toggleEnabled} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: status?.enabled ? '#FEE2E2' : '#DCFCE7', color: status?.enabled ? '#CC1016' : '#057642' }}>
            {status?.enabled ? 'Pause All' : 'Resume All'}
          </button>
        </div>
      </div>

      {/* Run Now */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Manual Run</div>
        <button onClick={runNow} style={{ padding: '8px 20px', background: '#0A66C2', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Run Sequence Processor Now
        </button>
      </div>

      {/* Send to Specific User */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Send to Specific User</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 2 }}>Order ID</label>
            <input value={sendOrderId} onChange={e => setSendOrderId(e.target.value)} placeholder="order-id-here" style={{ padding: '6px 10px', border: '1px solid #D0D0D0', borderRadius: 6, fontSize: 12, width: 280 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 2 }}>Email Key</label>
            <select value={sendKey} onChange={e => setSendKey(e.target.value)} style={{ padding: '6px 10px', border: '1px solid #D0D0D0', borderRadius: 6, fontSize: 12 }}>
              <option value="">Select...</option>
              {(status?.availableKeys || []).map((k: any) => <option key={k.key} value={k.key}>Day {k.day}: {k.key}</option>)}
            </select>
          </div>
          <button onClick={sendOne} style={{ padding: '6px 16px', background: '#057642', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Send</button>
        </div>
      </div>

      {/* Opt-Out Management */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Opt-Out List ({status?.optouts?.length || 0})</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <input value={optoutEmail} onChange={e => setOptoutEmail(e.target.value)} placeholder="email@example.com" style={{ padding: '6px 10px', border: '1px solid #D0D0D0', borderRadius: 6, fontSize: 12, width: 220 }} />
          <input value={optoutReason} onChange={e => setOptoutReason(e.target.value)} placeholder="Reason (optional)" style={{ padding: '6px 10px', border: '1px solid #D0D0D0', borderRadius: 6, fontSize: 12, width: 160 }} />
          <button onClick={addOptout} style={{ padding: '6px 14px', background: '#CC1016', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Block</button>
        </div>
        {status?.optouts?.length > 0 && (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #E0E0E0' }}><th style={{ textAlign: 'left', padding: 6 }}>Email</th><th style={{ textAlign: 'left', padding: 6 }}>Reason</th><th style={{ textAlign: 'left', padding: 6 }}>Date</th><th style={{ padding: 6 }}></th></tr></thead>
            <tbody>
              {status.optouts.map((o: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F3F3' }}>
                  <td style={{ padding: 6 }}>{o.email}</td>
                  <td style={{ padding: 6, color: '#888' }}>{o.reason}</td>
                  <td style={{ padding: 6, color: '#888' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: 6 }}><button onClick={() => removeOptout(o.email)} style={{ fontSize: 11, color: '#0A66C2', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Sends */}
      <div style={{ background: 'white', borderRadius: 12, padding: 20, border: '1px solid #E0E0E0' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Recent Sends</div>
        {status?.recentSends?.length > 0 ? (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid #E0E0E0' }}><th style={{ textAlign: 'left', padding: 6 }}>Email</th><th style={{ textAlign: 'left', padding: 6 }}>Emails Sent</th><th style={{ textAlign: 'left', padding: 6 }}>Done At</th></tr></thead>
            <tbody>
              {status.recentSends.map((s: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #F3F3F3' }}>
                  <td style={{ padding: 6 }}>{s.email}</td>
                  <td style={{ padding: 6 }}>{Object.keys(s.sequence_emails_sent || {}).filter(k => s.sequence_emails_sent[k]).join(', ') || '—'}</td>
                  <td style={{ padding: 6, color: '#888' }}>{s.processing_done_at ? new Date(s.processing_done_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div style={{ fontSize: 13, color: '#888' }}>No sequence emails sent yet</div>}
      </div>
    </div>
  );
}

// ─── Influencers Screen ───
function InfluencersScreen() {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [infEmail, setInfEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [referralOrders, setReferralOrders] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    apiFetchJson('/api/admin/influencers').then(data => setInfluencers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  async function createInfluencer() {
    if (!name || !slug) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/admin/influencers/create', {
        method: 'POST',
        body: JSON.stringify({ name, slug: slug.toLowerCase(), email: infEmail || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setInfluencers(prev => [data, ...prev]);
        setName(''); setSlug(''); setInfEmail('');
        setToast({ message: 'Influencer created!', type: 'success' });
      } else {
        setToast({ message: data.error || 'Failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to create influencer', type: 'error' });
    }
    setCreating(false);
  }

  async function viewReferrals(s: string) {
    setSelectedSlug(s);
    try {
      const data = await apiFetchJson(`/api/admin/influencers/${s}/referrals`);
      setReferralOrders(data);
    } catch {
      setReferralOrders(null);
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Influencers</h2>

      {/* Create form */}
      <div className="li-card p-4 mb-6">
        <h3 className="text-sm font-bold mb-3">Create Influencer</h3>
        <div className="flex flex-wrap gap-2">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name"
            className="px-3 py-2 rounded text-sm outline-none" style={{ border: '1px solid var(--li-border)', width: 160 }} />
          <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="slug (URL)"
            className="px-3 py-2 rounded text-sm outline-none font-mono" style={{ border: '1px solid var(--li-border)', width: 160 }} />
          <input type="email" value={infEmail} onChange={e => setInfEmail(e.target.value)} placeholder="Email (optional)"
            className="px-3 py-2 rounded text-sm outline-none" style={{ border: '1px solid var(--li-border)', width: 200 }} />
          <button onClick={createInfluencer} disabled={creating || !name || !slug}
            className="px-4 py-2 rounded-full text-white font-semibold text-sm cursor-pointer border-none disabled:opacity-50"
            style={{ background: 'var(--li-blue)' }}>
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="li-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--li-gray)' }}>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Slug</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Referrals</th>
              <th className="text-left p-3">Earnings</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Link</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {influencers.map((inf, idx) => (
              <tr key={inf.id} style={{
                borderBottom: '1px solid var(--li-border)',
                background: idx % 2 === 0 ? 'white' : 'var(--li-gray)',
              }}>
                <td className="p-3 font-semibold">{inf.name}</td>
                <td className="p-3 font-mono text-xs">{inf.slug}</td>
                <td className="p-3 text-xs">{inf.email || '-'}</td>
                <td className="p-3">{inf.total_referrals}</td>
                <td className="p-3 font-semibold">Rs {inf.total_earnings}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ background: inf.status === 'active' ? '#DCFCE7' : '#FEE2E2', color: inf.status === 'active' ? '#057642' : '#CC1016' }}>
                    {inf.status}
                  </span>
                </td>
                <td className="p-3 text-xs">
                  <a href={`https://profileroaster.in/?ref=${inf.slug}`} target="_blank" rel="noreferrer" className="font-mono" style={{ color: '#0B69C7', textDecoration: 'none' }}>profileroaster.in/?ref={inf.slug}</a>
                </td>
                <td className="p-3">
                  <button onClick={() => viewReferrals(inf.slug)}
                    className="text-xs px-2 py-1 rounded cursor-pointer border-none"
                    style={{ background: 'var(--li-gray)', color: 'var(--li-blue)' }}>View Orders</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {influencers.length === 0 && <p className="text-sm text-center p-6" style={{ color: 'var(--li-text-secondary)' }}>No influencers yet.</p>}
      </div>

      {/* Referral orders modal */}
      {selectedSlug && referralOrders && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSlug(null)}>
          <div className="li-card p-6 max-w-2xl w-full" style={{ maxHeight: '70vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Referrals: {selectedSlug}</h3>
              <button onClick={() => setSelectedSlug(null)} className="text-lg cursor-pointer bg-transparent border-none p-1">x</button>
            </div>
            <h4 className="text-sm font-bold mb-2">Orders ({(referralOrders.roast_orders?.length || 0) + (referralOrders.build_orders?.length || 0)})</h4>
            {[...(referralOrders.roast_orders || []), ...(referralOrders.build_orders || [])].map((o: any) => (
              <div key={o.id} className="text-xs p-2 mb-1 rounded" style={{ background: 'var(--li-gray)' }}>
                {o.email} - {o.plan} - Rs {(o.amount_paise / 100).toFixed(0)} - {formatIST(o.created_at)}
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Codes Screen ───
function CodesScreen() {
  const [codes, setCodes] = useState<any[]>([]);
  const [plan, setPlan] = useState('standard');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    apiFetchJson('/api/admin/referral-codes').then(data => setCodes(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const planOptions = ['standard', 'pro'];

  async function generateCode() {
    setGenerating(true);
    try {
      const res = await apiFetch('/api/admin/referral-codes/generate', {
        method: 'POST',
        body: JSON.stringify({ product: 'rewrite', plan, notes: notes || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: `Code generated: ${data.code}`, type: 'success' });
        setNotes('');
        // Refresh list
        apiFetchJson('/api/admin/referral-codes').then(d => setCodes(Array.isArray(d) ? d : []));
      } else {
        setToast({ message: data.error || 'Failed', type: 'error' });
      }
    } catch {
      setToast({ message: 'Failed to generate code', type: 'error' });
    }
    setGenerating(false);
  }

  async function deactivateCode(code: string) {
    if (!confirm(`Deactivate code ${code}?`)) return;
    try {
      const res = await apiFetch('/api/admin/referral-codes/deactivate', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (res.ok) {
        setCodes(prev => prev.map(c => c.code === code ? { ...c, status: 'deactivated' } : c));
        setToast({ message: 'Code deactivated', type: 'success' });
      }
    } catch {
      setToast({ message: 'Failed to deactivate', type: 'error' });
    }
  }

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Referral Codes</h2>

      {/* Generate form */}
      <div className="li-card p-4 mb-6">
        <h3 className="text-sm font-bold mb-3">Generate Code</h3>
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>Plan</label>
            <select value={plan} onChange={e => setPlan(e.target.value)}
              className="px-3 py-2 rounded text-sm outline-none" style={{ border: '1px solid var(--li-border)' }}>
              {planOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--li-text-secondary)' }}>Notes</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes"
              className="px-3 py-2 rounded text-sm outline-none" style={{ border: '1px solid var(--li-border)', width: 200 }} />
          </div>
          <button onClick={generateCode} disabled={generating}
            className="px-4 py-2 rounded-full text-white font-semibold text-sm cursor-pointer border-none disabled:opacity-50"
            style={{ background: 'var(--li-blue)' }}>
            {generating ? 'Generating...' : 'Generate Code'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="li-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--li-gray)' }}>
              <th className="text-left p-3">Code</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Redeemed By</th>
              <th className="text-left p-3">Redeemed At</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c, idx) => (
              <tr key={c.id} style={{
                borderBottom: '1px solid var(--li-border)',
                background: idx % 2 === 0 ? 'white' : 'var(--li-gray)',
              }}>
                <td className="p-3 font-mono text-xs font-semibold">{c.code}</td>
                <td className="p-3">{c.plan}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: c.status === 'active' ? '#DCFCE7' : c.status === 'redeemed' ? '#E8F4FD' : '#FEE2E2',
                      color: c.status === 'active' ? '#057642' : c.status === 'redeemed' ? '#0A66C2' : '#CC1016',
                    }}>
                    {c.status}
                  </span>
                </td>
                <td className="p-3 text-xs">{c.redeemed_by_email || '-'}</td>
                <td className="p-3 text-xs whitespace-nowrap">{c.redeemed_at ? formatIST(c.redeemed_at) : '-'}</td>
                <td className="p-3 text-xs">{c.notes || '-'}</td>
                <td className="p-3">
                  {c.status === 'active' && (
                    <button onClick={() => deactivateCode(c.code)}
                      className="text-xs px-2 py-1 rounded cursor-pointer border-none"
                      style={{ background: '#FEE2E2', color: '#CC1016' }}>Deactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {codes.length === 0 && <p className="text-sm text-center p-6" style={{ color: 'var(--li-text-secondary)' }}>No codes generated yet.</p>}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ─── Colleges (Bulk Student Codes) ───
function CollegesScreen() {
  const [colleges, setColleges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [batchCodes, setBatchCodes] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Bulk generation form
  const [showForm, setShowForm] = useState(false);
  const [collegeName, setCollegeName] = useState('');
  const [emailsText, setEmailsText] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [sendEmails, setSendEmails] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => { fetchColleges(); }, []);

  async function fetchColleges() {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/colleges');
      if (res.ok) { const data = await res.json(); setColleges(data.colleges || []); }
    } catch {} finally { setLoading(false); }
  }

  async function fetchBatchCodes(batchId: string) {
    setBatchLoading(true);
    setSelectedBatch(batchId);
    try {
      const res = await apiFetch(`/api/admin/colleges/${batchId}/codes`);
      if (res.ok) { const data = await res.json(); setBatchCodes(data.codes || []); }
    } catch {} finally { setBatchLoading(false); }
  }

  async function handleGenerate() {
    if (!collegeName.trim()) return alert('College name required');
    setGenerating(true);
    setResult(null);
    try {
      let students: Array<{ email: string; name?: string }> = [];

      if (excelFile) {
        // Parse Excel/CSV client-side
        const text = await excelFile.text();
        const lines = text.split('\n').filter(l => l.trim());
        // Skip header if it looks like one
        const startIdx = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
        students = lines.slice(startIdx).map(line => {
          const parts = line.split(/[,\t]/).map(p => p.trim().replace(/"/g, ''));
          return { email: parts[0] || '', name: parts[1] || '' };
        }).filter(s => s.email && s.email.includes('@'));
      } else if (emailsText.trim()) {
        students = emailsText.split('\n').filter(l => l.trim()).map(line => {
          const parts = line.split(/[,\t]/).map(p => p.trim());
          return { email: parts[0], name: parts[1] || '' };
        }).filter(s => s.email && s.email.includes('@'));
      }

      if (!students.length) return alert('No valid emails found');

      const res = await apiFetch('/api/admin/bulk-student-codes', {
        method: 'POST',
        body: JSON.stringify({ college_name: collegeName.trim(), students, send_emails: sendEmails }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed'); return; }
      setResult(data);
      fetchColleges(); // refresh list
    } catch { alert('Failed to generate codes'); } finally { setGenerating(false); }
  }

  function downloadCSV(codes: Array<{ email: string; code: string; name: string }>, filename: string) {
    const csv = 'Email,Code,Name\n' + codes.map(c => `${c.email},${c.code},${c.name || ''}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function resendEmails(batchId: string) {
    if (!confirm('Resend welcome emails to all unredeemed students?')) return;
    try {
      const res = await apiFetch(`/api/admin/colleges/${batchId}/resend-emails`, { method: 'POST' });
      const data = await res.json();
      alert(`Sending emails to ${data.sent} students`);
    } catch { alert('Failed to resend'); }
  }

  // Batch detail view
  if (selectedBatch) {
    const batch = colleges.find(c => c.batch_id === selectedBatch);
    return (
      <div>
        <button onClick={() => { setSelectedBatch(null); setBatchCodes([]); }} style={{ marginBottom: 16, padding: '6px 14px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>&larr; Back to Colleges</button>
        <h2 className="text-lg font-bold mb-2">{batch?.college_name || 'College'}</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => downloadCSV(batchCodes.map((c: any) => ({ email: c.student_email, code: c.code, name: c.student_name })), `${batch?.college_name || 'codes'}.csv`)} className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">Download CSV</button>
          <button onClick={() => resendEmails(selectedBatch)} className="text-sm px-3 py-1 bg-green-50 text-green-700 rounded border border-green-200">Resend Emails</button>
        </div>
        {batchLoading ? <p>Loading...</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500 border-b">
              <th className="pb-2">Email</th><th className="pb-2">Code</th><th className="pb-2">Name</th><th className="pb-2">Status</th><th className="pb-2">Redeemed</th>
            </tr></thead>
            <tbody>
              {batchCodes.map((c: any, i: number) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2">{c.student_email}</td>
                  <td className="py-2 font-mono font-bold">{c.code}</td>
                  <td className="py-2">{c.student_name || '-'}</td>
                  <td className="py-2"><span style={{ color: c.status === 'redeemed' ? '#057642' : '#666', fontWeight: 600 }}>{c.status}</span></td>
                  <td className="py-2 text-xs text-gray-400">{c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">College Student Codes</h2>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold">
          {showForm ? 'Cancel' : '+ Generate Bulk Codes'}
        </button>
      </div>

      {/* Bulk Generation Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-5 mb-6">
          <h3 className="font-bold text-sm mb-3">Generate Student Codes</h3>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">College Name *</label>
              <input value={collegeName} onChange={e => setCollegeName(e.target.value)} placeholder="e.g., JNTU Hyderabad" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Upload Excel/CSV (email, name columns)</label>
              <input type="file" accept=".csv,.xlsx,.xls,.txt" onChange={e => setExcelFile(e.target.files?.[0] || null)} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Or paste emails (one per line, optionally: email, name)</label>
              <textarea value={emailsText} onChange={e => setEmailsText(e.target.value)} rows={5} placeholder={"student1@college.edu\nstudent2@gmail.com, Ravi Kumar\nstudent3@college.edu, Priya Sharma"} className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={sendEmails} onChange={e => setSendEmails(e.target.checked)} id="sendEmails" />
              <label htmlFor="sendEmails" className="text-sm">Send welcome email with code + steps to each student</label>
            </div>
            <button onClick={handleGenerate} disabled={generating} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              {generating ? 'Generating...' : 'Generate Codes'}
            </button>
          </div>

          {result && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="font-bold text-green-700 text-sm mb-2">{result.codes_generated} codes generated for {result.college_name}</div>
              <button onClick={() => downloadCSV(result.codes, `${result.college_name}-codes.csv`)} className="px-3 py-1 bg-green-600 text-white rounded text-sm font-semibold">
                Download CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* College List */}
      {loading ? <p>Loading...</p> : colleges.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No college codes generated yet</div>
      ) : (
        <div className="space-y-3">
          {colleges.map((c: any, i: number) => (
            <div key={i} className="bg-white rounded-lg border p-4 cursor-pointer hover:border-blue-300" onClick={() => fetchBatchCodes(c.batch_id)}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm">{c.college_name}</div>
                  <div className="text-xs text-gray-400 mt-1">Batch: {c.batch_id} &bull; Created: {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: '#057642' }}>{c.redeemed_codes}/{c.total_codes} redeemed</div>
                  <div className="text-xs text-gray-400">{Math.round((c.redeemed_codes / c.total_codes) * 100)}% conversion</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Screen = 'overview' | 'orders' | 'teasers' | 'quality' | 'revenue' | 'referrals' | 'emails' | 'influencers' | 'codes' | 'colleges';

const NAV: { key: Screen; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'teasers', label: 'Teasers' },
  { key: 'quality', label: 'Quality' },
  { key: 'revenue', label: 'Revenue' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'influencers', label: 'Influencers' },
  { key: 'codes', label: 'Codes' },
  { key: 'colleges', label: 'Colleges' },
  { key: 'emails', label: 'Emails' },
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
        {screen === 'influencers' && <InfluencersScreen />}
        {screen === 'codes' && <CodesScreen />}
        {screen === 'colleges' && <CollegesScreen />}
        {screen === 'emails' && <EmailsScreen />}
      </div>
    </main>
  );
}

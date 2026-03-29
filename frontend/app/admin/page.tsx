'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('admin_token');
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts?.headers },
  });
  if (res.status === 401) {
    sessionStorage.removeItem('admin_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  return res.json();
}

// ─── Login ───
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  async function submit() {
    sessionStorage.setItem('admin_token', pw);
    try {
      await apiFetch('/api/admin/overview');
      onLogin();
    } catch {
      setError('Invalid password');
      sessionStorage.removeItem('admin_token');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--li-gray)' }}>
      <div className="li-card p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4" style={{ color: 'var(--li-text-primary)' }}>Admin Login</h1>
        {error && <p className="text-sm mb-2" style={{ color: 'var(--li-red)' }}>{error}</p>}
        <input
          type="password" value={pw} onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Password" className="w-full px-4 py-3 rounded-lg text-sm outline-none mb-3"
          style={{ border: '1px solid var(--li-border)' }}
        />
        <button onClick={submit} className="w-full py-3 rounded-full text-white font-semibold cursor-pointer border-none"
          style={{ background: 'var(--li-blue)' }}>Login</button>
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
  useEffect(() => { apiFetch('/api/admin/overview').then(setData); }, []);
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today Orders" value={data.today.orders} sub={`₹${(data.today.revenue_paise / 100).toFixed(0)}`} />
        <StatCard label="Today Teasers" value={data.total_teasers_today} sub={`${data.today.conversion_pct}% conversion`} />
        <StatCard label="Week Orders" value={data.week.orders} sub={`₹${(data.week.revenue_paise / 100).toFixed(0)}`} />
        <StatCard label="Month Orders" value={data.month.orders} sub={`₹${(data.month.revenue_paise / 100).toFixed(0)}`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Active Jobs" value={data.active_jobs} />
        <StatCard label="Refund Rate"
          value={`${data.refund_rate}%`}
          sub={data.refund_rate > 5 ? '⚠️ ALERT: Above 5%' : 'Healthy'}
        />
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

  const load = useCallback(async () => {
    const data = await apiFetch(`/api/admin/orders?page=${page}&limit=20`);
    setOrders(data.orders);
    setTotal(data.total);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Orders ({total})</h2>
      </div>
      <div className="li-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--li-gray)' }}>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Score</th>
              <th className="text-left p-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="cursor-pointer" style={{ borderBottom: '1px solid var(--li-border)' }}
                onClick={() => apiFetch(`/api/admin/orders/${o.id}`).then(setSelected)}>
                <td className="p-3">{new Date(o.created_at).toLocaleDateString()}</td>
                <td className="p-3">{o.email}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-xs font-semibold"
                  style={{ background: o.plan === 'pro' ? '#E8F4FD' : 'var(--li-gray)', color: o.plan === 'pro' ? 'var(--li-blue)' : 'var(--li-text-secondary)' }}>{o.plan}</span></td>
                <td className="p-3">{o.payment_status}</td>
                <td className="p-3">{o.before_score ?? '-'} → {o.after_score ?? '-'}</td>
                <td className="p-3">{o.user_rating ? '⭐'.repeat(o.user_rating) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="px-3 py-1 rounded text-sm cursor-pointer border-none" style={{ background: 'var(--li-gray)' }}>← Prev</button>
        <span className="text-sm py-1">Page {page}</span>
        <button onClick={() => setPage(p => p + 1)} disabled={orders.length < 20}
          className="px-3 py-1 rounded text-sm cursor-pointer border-none" style={{ background: 'var(--li-gray)' }}>Next →</button>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="li-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-bold">Order: {selected.id?.slice(0, 8)}</h3>
              <button onClick={() => setSelected(null)} className="text-lg cursor-pointer bg-transparent border-none">✕</button>
            </div>
            <p className="text-sm mb-2">Plan: {selected.plan} | Status: {selected.processing_status}</p>
            {selected.roast && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm mb-1">Roast: {selected.roast.roast_title}</h4>
                {selected.roast.roast_points?.map((p: any, i: number) => (
                  <p key={i} className="text-xs mb-1 italic" style={{ color: 'var(--li-text-secondary)' }}>
                    {p.point_number}. {p.roast}
                  </p>
                ))}
              </div>
            )}
            {selected.rewrite && (
              <div>
                <h4 className="font-semibold text-sm mb-1">Rewrite</h4>
                <p className="text-xs font-medium">{selected.rewrite.rewritten_headline}</p>
                <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: 'var(--li-text-secondary)' }}>
                  {selected.rewrite.rewritten_about?.substring(0, 500)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Teasers Screen ───
function TeasersScreen() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { apiFetch('/api/admin/teasers').then(setData); }, []);
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Teaser Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Teasers" value={data.total} />
        <StatCard label="Converted" value={data.converted} sub={`${data.conversion_pct}%`} />
        <StatCard label="With Email" value={data.with_email} />
        <StatCard label="Without Email" value={data.without_email} />
      </div>
      <div className="li-card p-4">
        <h3 className="text-sm font-bold mb-3">Score Distribution</h3>
        <div className="space-y-2">
          {data.score_distribution.map((d: any) => (
            <div key={d.range} className="flex items-center gap-3 text-sm">
              <span className="w-16 text-right" style={{ color: 'var(--li-text-secondary)' }}>{d.range}</span>
              <div className="flex-1 h-4 rounded" style={{ background: 'var(--li-border)' }}>
                <div className="h-4 rounded" style={{
                  width: `${Math.min(100, (d.count / Math.max(data.total, 1)) * 100 * 5)}%`,
                  background: 'var(--li-blue)'
                }} />
              </div>
              <span className="w-8">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Quality Screen ───
function QualityScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    apiFetch('/api/admin/orders?limit=100').then(data => {
      const rated = data.orders.filter((o: any) => o.user_rating);
      setOrders(rated);
    });
  }, []);

  const avgRating = orders.length > 0
    ? (orders.reduce((s: number, o: any) => s + o.user_rating, 0) / orders.length).toFixed(1)
    : '-';
  const lowRated = orders.filter((o: any) => o.user_rating <= 2);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Quality Metrics</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard label="Average Rating" value={`${avgRating} ⭐`} sub={`${orders.length} ratings`} />
        <StatCard label="Low Ratings (1-2)" value={lowRated.length}
          sub={lowRated.length > 0 ? '⚠️ Review needed' : 'All good'} />
      </div>
      {lowRated.length > 0 && (
        <div className="li-card p-4">
          <h3 className="text-sm font-bold mb-2">Low-rated orders (needs review)</h3>
          {lowRated.map((o: any) => (
            <div key={o.id} className="text-xs p-2 mb-1 rounded" style={{ background: '#FEE2E2' }}>
              {o.email} — {o.user_rating}⭐ — Score: {o.before_score}→{o.after_score}
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
  useEffect(() => { apiFetch('/api/admin/revenue').then(setData); }, []);
  if (!data) return <p>Loading...</p>;

  const totalRevenue = data.daily.reduce((s: number, d: any) => s + d.revenue, 0);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Revenue</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="30-Day Revenue" value={`₹${(totalRevenue / 100).toFixed(0)}`} />
        <StatCard label="Standard Orders" value={data.standard_count} />
        <StatCard label="Pro Orders" value={data.pro_count} />
        <StatCard label="Avg Order Value" value={`₹${(data.avg_order_value / 100).toFixed(0)}`} />
      </div>
      <div className="li-card p-4">
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
      <StatCard label="Total Refunds" value={data.total_refunds} />
    </div>
  );
}

// ─── Referrals Screen ───
function ReferralsScreen() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [payoutModal, setPayoutModal] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [txnRef, setTxnRef] = useState('');

  useEffect(() => { apiFetch('/api/admin/referrals').then(setReferrals); }, []);

  async function processPayout() {
    if (!amount || !txnRef || !payoutModal) return;
    await apiFetch(`/api/admin/referrals/${payoutModal.referral_code}/payout`, {
      method: 'POST',
      body: JSON.stringify({ amount_paise: parseInt(amount) * 100, txn_ref: txnRef }),
    });
    setPayoutModal(null);
    setAmount('');
    setTxnRef('');
    apiFetch('/api/admin/referrals').then(setReferrals);
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
            {referrals.map(r => (
              <tr key={r.referral_code} style={{ borderBottom: '1px solid var(--li-border)' }}>
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
  const [screen, setScreen] = useState<Screen>('overview');

  useEffect(() => {
    if (getToken()) {
      apiFetch('/api/admin/overview').then(() => setAuthed(true)).catch(() => setAuthed(false));
    }
  }, []);

  if (!authed) return <LoginForm onLogin={() => setAuthed(true)} />;

  return (
    <main className="min-h-screen" style={{ background: 'var(--li-gray)' }}>
      {/* Nav */}
      <nav className="px-4 py-3 flex gap-2 flex-wrap" style={{ background: 'var(--li-card)', borderBottom: '1px solid var(--li-border)' }}>
        <span className="font-bold mr-4" style={{ color: 'var(--li-blue)' }}>🔥 Admin</span>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setScreen(n.key)}
            className="text-sm px-3 py-1 rounded-full cursor-pointer border-none"
            style={{
              background: screen === n.key ? 'var(--li-blue)' : 'transparent',
              color: screen === n.key ? 'white' : 'var(--li-text-secondary)',
            }}>{n.label}</button>
        ))}
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

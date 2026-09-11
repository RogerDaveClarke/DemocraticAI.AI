import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../config/firebase';
import {
  Users, Inbox, BarChart2, Settings2, CheckCircle2,
  XCircle, UserPlus, Trash2, ShieldOff, ShieldCheck,
  LogOut, RefreshCw, ChevronDown, ChevronUp, CircleDollarSign,
  MessageSquare, ScanSearch,
  type LucideIcon,
} from 'lucide-react';
import { API_URL } from '@/config/runtime';
import { terminateAuthenticatedSession } from '@/utils/authSession';

// ── helpers ──────────────────────────────────────────────────────────────────

const API = (import.meta.env.VITE_API_URL || API_URL).replace(/\/$/, '');

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  const response = await fetch(`${API}${path}`, {
    ...options,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (response.status === 401) await terminateAuthenticatedSession();
  return response;
}

// ── types ─────────────────────────────────────────────────────────────────────

interface AccessRequest { id: string; email: string; requestedAt: any; status: string }
interface AdminUser {
  uid: string; email: string; displayName: string; disabled: boolean;
  accessStatus: 'active' | 'deleted' | 'forced_out' | 'suspected' | 'suspended';
  isAdmin: boolean; createdAt: string; lastSignIn: string;
  dailyQueryLimit: number; dailyTokenLimit: number;
}
interface UsageRow { uid: string; email?: string; queries: number; tokensIn: number; tokensOut: number; cost: number }
interface FeatureFlags { [key: string]: boolean }
interface ServiceCosts { day: number; week: number; month: number; currency: string; source: string; updatedAt: string }
interface FeedbackRow { id: string; executionId?: string; sentiment?: 'up' | 'down'; category?: string; comment?: string; query?: string; timestamp?: { seconds?: number }; source: 'structured' | 'chat' }
interface TraceResult { requestId: string; message?: string; execution: { id: string; status: string; modelUsed: string; tokensInput: number; tokensOutput: number; cost: number; processingTimeMs?: number; retrievedDocuments: number; error?: string } | null }

// ── sub-components ─────────────────────────────────────────────────────────────

function Btn({ children, onClick, variant = 'default', disabled = false, small = false }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'default'|'danger'|'success'|'ghost';
  disabled?: boolean; small?: boolean;
}) {
  const base = `inline-flex items-center gap-1 font-medium rounded-lg transition disabled:opacity-40 ${small ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`;
  const styles = {
    default: 'bg-[#14b8a6] text-white hover:bg-[#0d9488]',
    danger:  'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
    success: 'bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100',
    ghost:   'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100',
  };
  return <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]}`}>{children}</button>;
}

function Badge({ label, color }: { label: string; color: 'teal'|'amber'|'red'|'slate'|'green' }) {
  const colors = { teal:'bg-teal-100 text-teal-700', amber:'bg-amber-100 text-amber-700', red:'bg-red-100 text-red-600', slate:'bg-slate-100 text-slate-500', green:'bg-green-100 text-green-700' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{label}</span>;
}

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon: LucideIcon; badge?: number }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-1 border-b border-slate-200 mb-6">
      {tabs.map(t => {
        const Icon = t.icon;
        return (
          <button key={t.id} type="button" onClick={() => onChange(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${active === t.id ? 'border-[#14b8a6] text-[#14b8a6]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Icon className="h-4 w-4" />
            {t.label}
            {!!t.badge && <span className="ml-1 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">{t.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Requests tab ──────────────────────────────────────────────────────────────

function RequestsTab() {
  const [rows, setRows] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [approveResult, setApproveResult] = useState<{ email: string; signInLink: string | null; emailSent?: boolean; emailError?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch('/api/admin/access-requests');
    if (r.ok) setRows(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (id: string, status: string) => {
    const r = await adminFetch(`/api/admin/access-requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (status === 'approved' && r.ok) {
      const data = await r.json();
      if (data.uid) setApproveResult({ email: data.email, signInLink: data.signInLink ?? null, emailSent: data.emailSent, emailError: data.emailError });
    }
    load();
  };

  const pending = rows.filter(r => r.status === 'pending');
  const past    = rows.filter(r => r.status !== 'pending');

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Pending requests ({pending.length})</h3>
        {pending.length === 0 ? <p className="text-sm text-slate-400">No pending requests.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b">
              <th className="pb-2 pr-4">Email</th><th className="pb-2 pr-4">Requested</th><th className="pb-2">Actions</th>
            </tr></thead>
            <tbody>{pending.map(req => (
              <tr key={req.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-4 font-medium text-slate-800">{req.email}</td>
                <td className="py-2.5 pr-4 text-slate-500">{req.requestedAt?.seconds ? new Date(req.requestedAt.seconds * 1000).toLocaleString() : '—'}</td>
                <td className="py-2.5 flex gap-2">
                  <Btn variant="success" small onClick={() => update(req.id, 'approved')}><CheckCircle2 className="h-3 w-3" />Approve</Btn>
                  <Btn variant="danger" small onClick={() => update(req.id, 'rejected')}><XCircle className="h-3 w-3" />Reject</Btn>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {approveResult && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-teal-800">Access approved — invite link</p>
            <button type="button" onClick={() => setApproveResult(null)} className="text-teal-400 hover:text-teal-600 text-xs">Dismiss</button>
          </div>
          <p className="text-xs text-teal-700 mb-2">{approveResult.email} — {approveResult.emailSent ? 'Email sent automatically.' : (approveResult.emailError ? 'Email failed: ' + approveResult.emailError : 'Email could not be sent — share this link manually.')}</p>
          <div className="flex gap-2 items-center">
            <input readOnly value={approveResult.signInLink ?? ''} className="flex-1 text-xs border border-teal-200 rounded-lg px-3 py-1.5 bg-white font-mono text-slate-600 truncate" />
            <button type="button" onClick={() => { if (approveResult.signInLink) navigator.clipboard.writeText(approveResult.signInLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="px-3 py-1.5 bg-teal-500 text-white text-xs font-semibold rounded-lg">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
            <div>
        <button type="button" onClick={() => setShowPast(p => !p)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
          {showPast ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Past requests ({past.length})
        </button>
        {showPast && past.length > 0 && (
          <table className="w-full text-sm mt-3">
            <thead><tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b">
              <th className="pb-2 pr-4">Email</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Requested</th>
            </tr></thead>
            <tbody>{past.map(req => (
              <tr key={req.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-700">{req.email}</td>
                <td className="py-2 pr-4"><Badge label={req.status} color={req.status === 'approved' ? 'green' : 'red'} /></td>
                <td className="py-2 text-slate-400 text-xs">{req.requestedAt?.seconds ? new Date(req.requestedAt.seconds * 1000).toLocaleString() : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Users tab ──────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviteLink, setInviteLink] = useState<{ email: string; signInLink?: string; emailSent: boolean; emailError?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [savingLimitFor, setSavingLimitFor] = useState<string | null>(null);

  const [fetchError, setFetchError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const r = await adminFetch('/api/admin/users');
      if (r.ok) { setUsers(await r.json()); }
      else { setFetchError("API error " + r.status + " — admin routes may not be deployed yet."); }
    } catch { setFetchError('Could not reach the admin API. Deploy the Cloud Run API first.'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const action = async (path: string, method = 'POST') => {
    await adminFetch(path, { method });
    load();
  };

  const flagAsSuspected = async (user: AdminUser) => {
    const reason = window.prompt(`Why is ${user.email} being flagged? Leave blank if the reason is recorded elsewhere.`);
    if (reason === null) return;
    await adminFetch(`/api/admin/users/${user.uid}/suspect`, { method: 'POST', body: JSON.stringify({ reason }) });
    load();
  };

  const handleCreate = async () => {
    if (!newEmail) return;
    setCreating(true);
    try {
    const r = await adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ email: newEmail, displayName: newName }) });
    if (r.ok) {
      const data = await r.json();
      setInviteLink({ email: data.email, signInLink: data.signInLink, emailSent: data.emailSent ?? false, emailError: data.emailError });
      setNewEmail(''); setNewName('');
      load();
    }
    } finally {
    setCreating(false);
    }
  };

  const saveUsageLimit = async (user: AdminUser, dailyQueryLimit: number, dailyTokenLimit: number) => {
    setSavingLimitFor(user.uid);
    try {
      const response = await adminFetch(`/api/admin/users/${user.uid}/usage-limit`, {
        method: 'PATCH',
        body: JSON.stringify({ dailyQueryLimit, dailyTokenLimit }),
      });
      if (response.ok) await load();
      else setFetchError(`Could not save limits for ${user.email}.`);
    } finally {
      setSavingLimitFor(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  const adminCount = users.filter((user) => user.isAdmin).length;

  return (
    <div className="space-y-6">
      {inviteLink && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 text-sm space-y-2">
          <p className="font-semibold text-teal-800">Account created for {inviteLink.email}</p>
          {inviteLink.emailSent
            ? <p className="text-xs text-teal-700">Invitation email sent successfully.</p>
            : <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">Email not sent{inviteLink.emailError ? ': ' + inviteLink.emailError : ''}. Copy and share this link manually.</p>
          }
          {inviteLink.signInLink && (
          <div className="flex gap-2 items-center">
            <input readOnly value={inviteLink.signInLink}
              className="flex-1 text-xs font-mono bg-white border border-teal-200 rounded-lg px-2 py-1.5 text-slate-600 truncate" />
            <button type="button" onClick={() => {
              navigator.clipboard.writeText(inviteLink.signInLink!).catch(() => {});
              setCopied(true); setTimeout(() => setCopied(false), 2000);
            }} className="px-3 py-1.5 bg-[#14b8a6] text-white text-xs font-semibold rounded-lg hover:bg-[#0d9488] transition whitespace-nowrap">
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          )}
          <button type="button" onClick={() => setInviteLink(null)} className="text-xs text-teal-600 hover:underline">Dismiss</button>
        </div>
      )}

      {fetchError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fetchError}</p>}
      <p className="text-xs text-slate-400 mb-3">Shows Firebase Authentication accounts only. Google Workspace users appear here after their first sign-in to Democratic AI.</p>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b">
          <th className="pb-2 pr-3">Email</th><th className="pb-2 pr-3">Created</th><th className="pb-2 pr-3">Last sign-in</th><th className="pb-2 pr-3">Daily limits</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Actions</th>
        </tr></thead>
        <tbody>{users.map(u => {
          const isSoleAdmin = u.isAdmin && adminCount === 1;
          return (
          <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-2.5 pr-3">
              <p className="font-medium text-slate-800">{u.email}</p>
              {u.displayName && <p className="text-xs text-slate-400">{u.displayName}</p>}
              {u.isAdmin && <Badge label="Admin" color="teal" />}
            </td>
            <td className="py-2.5 pr-3 text-xs text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
            <td className="py-2.5 pr-3 text-xs text-slate-400">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleString() : 'Never'}</td>
            <td className="py-2.5 pr-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <input type="number" min="1" defaultValue={u.dailyQueryLimit} aria-label={`Daily query limit for ${u.email}`} className="w-14 rounded border border-slate-200 px-1.5 py-1 text-center" onBlur={(event) => saveUsageLimit(u, Number(event.target.value), u.dailyTokenLimit)} />
                <span className="text-slate-400">queries</span>
                <input type="number" min="1000" step="1000" defaultValue={u.dailyTokenLimit} aria-label={`Daily token limit for ${u.email}`} className="w-20 rounded border border-slate-200 px-1.5 py-1 text-center" onBlur={(event) => saveUsageLimit(u, u.dailyQueryLimit, Number(event.target.value))} />
                <span className="text-slate-400">tokens</span>
                {savingLimitFor === u.uid && <span className="text-teal-600">Saving</span>}
              </div>
            </td>
            <td className="py-2.5 pr-3"><Badge label={u.accessStatus === 'suspected' ? 'Flagged & suspended' : u.disabled ? 'Suspended' : 'Active'} color={u.accessStatus === 'suspected' ? 'red' : u.disabled ? 'amber' : 'green'} /></td>
            <td className="py-2.5">
              <div className="flex flex-wrap gap-1">
                {u.disabled
                  ? <Btn variant="success" small onClick={() => action(`/api/admin/users/${u.uid}/enable`)}><ShieldCheck className="h-3 w-3" />Reactivate</Btn>
                  : !isSoleAdmin && <Btn variant="ghost" small onClick={() => action(`/api/admin/users/${u.uid}/disable`)}><ShieldOff className="h-3 w-3" />Suspend</Btn>
                }
                {!u.disabled && !isSoleAdmin && <Btn variant="danger" small onClick={() => flagAsSuspected(u)}><ShieldOff className="h-3 w-3" />Flag &amp; suspend</Btn>}
                {!u.disabled && !isSoleAdmin && <Btn variant="ghost" small onClick={() => action(`/api/admin/users/${u.uid}/revoke-tokens`)}><LogOut className="h-3 w-3" />Force out &amp; block</Btn>}
                {!u.isAdmin && <Btn variant="danger" small onClick={() => { if (confirm(`Delete ${u.email}?`)) action(`/api/admin/users/${u.uid}`, 'DELETE'); }}><Trash2 className="h-3 w-3" />Delete</Btn>}
              </div>
            </td>
          </tr>
          );
        })}</tbody>
      </table>

      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-600 mb-2">Create account</p>
        <div className="flex gap-2 flex-wrap">
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address" type="email"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Display name (optional)" type="text"
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
          <Btn onClick={handleCreate} disabled={!newEmail || creating}><UserPlus className="h-4 w-4" />{creating ? 'Creating…' : 'Create'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Usage tab ──────────────────────────────────────────────────────────────────

function UsageTab() {
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const ur = await adminFetch('/api/admin/usage');
        if (ur.ok) {
          const data = await ur.json();
          const rows: UsageRow[] = Object.entries(data).map(([uid, v]: [string, any]) => ({ uid, ...v }));
          setUsage(rows.sort((a, b) => b.cost - a.cost));
        } else {
          setError(`Could not load usage data (HTTP ${ur.status}).`);
        }
      } catch {
        setError('Could not reach the admin usage API.');
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  const totalCost = usage.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Token usage (all time)</h3>
          <span className="text-xs text-slate-400">Total estimated cost: <strong className="text-slate-700">${totalCost.toFixed(4)}</strong></span>
        </div>
        {error ? <p className="text-sm text-rose-600">{error}</p> : usage.length === 0 ? <p className="text-sm text-slate-500">No completed research requests have been recorded yet.</p> : <table className="w-full text-sm">
          <thead><tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b">
            <th className="pb-2 pr-4">User</th><th className="pb-2 pr-4">Queries</th><th className="pb-2 pr-4">Tokens in</th><th className="pb-2 pr-4">Tokens out</th><th className="pb-2">Est. cost</th>
          </tr></thead>
          <tbody>{usage.map(r => (
            <tr key={r.uid} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2.5 pr-4 font-mono text-xs text-slate-600 truncate max-w-[200px]">{r.email ?? r.uid}</td>
              <td className="py-2.5 pr-4">{r.queries.toLocaleString()}</td>
              <td className="py-2.5 pr-4 text-slate-500">{r.tokensIn.toLocaleString()}</td>
              <td className="py-2.5 pr-4 text-slate-500">{r.tokensOut.toLocaleString()}</td>
              <td className="py-2.5 font-medium">${r.cost.toFixed(4)}</td>
            </tr>
          ))}</tbody>
        </table>}
      </div>
    </div>
  );
}

// ── Service costs tab ─────────────────────────────────────────────────────────

function ServiceCostsTab() {
  const [costs, setCosts] = useState<ServiceCosts | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/service-costs').then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (response.ok) setCosts(data as ServiceCosts);
      else setError(data.error || `Could not load service costs (HTTP ${response.status}).`);
    }).catch(() => setError('Could not reach the service cost API.'));
  }, []);

  if (error) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-medium">Service costs unavailable</p><p className="mt-1 text-xs">{error}</p><p className="mt-2 text-xs">Enable Cloud Billing export to BigQuery, then set `GCP_BILLING_EXPORT_TABLE` on the API service.</p></div>;
  if (!costs) return <p className="text-sm text-slate-400">Loading service costs...</p>;

  const periods = [
    { label: 'Last 24 hours', value: costs.day },
    { label: 'Last 7 days', value: costs.week },
    { label: 'Last 30 days', value: costs.month },
  ];
  const money = new Intl.NumberFormat('en-IE', { style: 'currency', currency: costs.currency, maximumFractionDigits: 2 });

  return <div className="space-y-5">
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {periods.map((period) => <div key={period.label} className="rounded-lg border border-[var(--dai-border)] bg-white p-4">
        <p className="text-xs font-medium text-[var(--dai-slate)]">{period.label}</p>
        <p className="mt-2 text-2xl font-semibold text-[var(--dai-ink)]">{money.format(period.value)}</p>
      </div>)}
    </div>
    <div className="border-t border-[var(--dai-border)] pt-3 text-xs text-[var(--dai-slate)]">
      <p>Source: {costs.source}. Includes billed GCP service usage and applied credits; it can lag behind real-time use.</p>
      <p className="mt-1">Last queried: {new Date(costs.updatedAt).toLocaleString()}</p>
    </div>
  </div>;
}

// ── Feedback tab ──────────────────────────────────────────────────────────────

function FeedbackTab() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/api/admin/feedback').then(async (response) => {
      if (response.ok) setFeedback(await response.json());
      else setError(`Could not load feedback (HTTP ${response.status}).`);
    }).catch(() => setError('Could not reach the feedback API.'));
  }, []);

  if (error) return <p className="text-sm text-rose-600">{error}</p>;
  if (feedback.length === 0) return <p className="text-sm text-slate-500">No feedback has been submitted yet.</p>;

  return <div className="overflow-x-auto rounded-lg border border-[var(--dai-border)] bg-white">
    <table className="w-full min-w-[760px] text-sm">
      <thead className="border-b border-[var(--dai-border)] bg-[var(--dai-muted)] text-left text-xs font-semibold text-[var(--dai-slate)]"><tr><th className="px-3 py-2">Response</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Comment</th><th className="px-3 py-2">Query</th><th className="px-3 py-2">Submitted</th></tr></thead>
      <tbody>{feedback.map((item) => <tr key={`${item.source}-${item.id}`} className="border-b border-slate-100 align-top last:border-0">
        <td className="px-3 py-3"><Badge label={item.sentiment === 'up' ? 'Helpful' : item.sentiment === 'down' ? 'Not helpful' : 'Feedback'} color={item.sentiment === 'up' ? 'green' : item.sentiment === 'down' ? 'red' : 'slate'} /></td>
        <td className="max-w-40 px-3 py-3 text-xs text-[var(--dai-slate)]">{item.category || '—'}</td>
        <td className="max-w-xs px-3 py-3 text-xs leading-relaxed text-[var(--dai-ink)]">{item.comment || '—'}</td>
        <td className="max-w-xs px-3 py-3 text-xs leading-relaxed text-[var(--dai-slate)]">{item.query || 'Not retained'}</td>
        <td className="whitespace-nowrap px-3 py-3 text-xs text-[var(--dai-slate)]">{item.timestamp?.seconds ? new Date(item.timestamp.seconds * 1000).toLocaleString() : '—'}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function ObservabilityTab() {
  const [requestId, setRequestId] = useState('');
  const [result, setResult] = useState<TraceResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const lookup = async () => {
    if (!requestId.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const response = await adminFetch(`/api/admin/observability?requestId=${encodeURIComponent(requestId.trim())}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setResult(await response.json());
    } catch (lookupError) { setError(lookupError instanceof Error ? `Could not retrieve trace (${lookupError.message}).` : 'Could not retrieve trace.'); }
    finally { setLoading(false); }
  };
  return <div className="space-y-4">
    <div className="flex max-w-xl gap-2"><input value={requestId} onChange={(event) => setRequestId(event.target.value)} placeholder="Paste Request ID from a UI error" className="min-w-0 flex-1 rounded-lg border border-[var(--dai-border)] px-3 py-2 text-sm" /><Btn onClick={lookup} disabled={!requestId.trim() || loading}>{loading ? 'Searching...' : 'Trace request'}</Btn></div>
    {error && <p className="text-sm text-rose-600">{error}</p>}
    {result && (result.execution ? <div className="rounded-lg border border-[var(--dai-border)] bg-white p-4 text-sm"><p className="font-semibold text-[var(--dai-ink)]">Execution {result.execution.id}</p><dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[var(--dai-slate)]"><dt>Status</dt><dd>{result.execution.status}</dd><dt>Model</dt><dd>{result.execution.modelUsed}</dd><dt>Tokens</dt><dd>{result.execution.tokensInput + result.execution.tokensOutput}</dd><dt>Estimated cost</dt><dd>${result.execution.cost.toFixed(4)}</dd><dt>Latency</dt><dd>{result.execution.processingTimeMs ?? 0}ms</dd><dt>Retrieved records</dt><dd>{result.execution.retrievedDocuments}</dd>{result.execution.error && <><dt>Error</dt><dd className="text-rose-600">{result.execution.error}</dd></>}</dl></div> : <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-[var(--dai-slate)]">{result.message}</p>)}
  </div>;
}

// ── Features tab ───────────────────────────────────────────────────────────────

const FLAG_LABELS: Record<string, string> = {
  ff_access_analytics_page: 'Analytics page',
  ff_access_feedback: 'Feedback controls on Research page',
  ff_quota_daily_limit: 'Per-user daily query limit enforcement',
};

const KNOWN_FLAGS: Record<string, boolean> = Object.fromEntries(Object.keys(FLAG_LABELS).map(k => [k, false]));

type UserOverride = { uid: string; email: string };
type UserOverrides = Record<string, UserOverride[]>;

function FeaturesTab() {
  const [flags, setFlags] = useState<FeatureFlags>(KNOWN_FLAGS);
  const [userOverrides, setUserOverrides] = useState<UserOverrides>({});
  const [allUsers, setAllUsers] = useState<UserOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/feature-flags').then(r => r.ok ? r.json() : null).catch(() => null),
      adminFetch('/api/admin/feature-flag-users').then(r => r.ok ? r.json() : null).catch(() => null),
      adminFetch('/api/admin/users').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([flagData, overrideData, userData]) => {
      if (flagData) setFlags({ ...KNOWN_FLAGS, ...flagData });
      else setApiError('Admin API not reachable — showing local defaults. Deploy the Cloud Run API to enable saving.');
      if (overrideData) setUserOverrides(overrideData as UserOverrides);
      if (userData) setAllUsers((userData as AdminUser[]).map(u => ({ uid: u.uid, email: u.email })));
    }).finally(() => setLoading(false));
  }, []);

  const toggle = async (key: string, value: boolean) => {
    setSaving(key); setError('');
    setFlags(f => ({ ...f, [key]: value }));
    const r = await adminFetch('/api/admin/feature-flags', { method: 'PATCH', body: JSON.stringify({ key, value }) });
    if (!r.ok) {
      setError('Failed to save. Remote Config may require IAM role remoteconfig.admin on the service account.');
      setFlags(f => ({ ...f, [key]: !value }));
    }
    setSaving(null);
  };

  const saveOverride = async (flagKey: string, users: UserOverride[]) => {
    setUserOverrides(o => ({ ...o, [flagKey]: users }));
    const r = await adminFetch('/api/admin/feature-flag-users/' + flagKey, {
      method: 'PUT', body: JSON.stringify({ uids: users.map(u => u.uid) }),
    });
    if (!r.ok) setError('Failed to save user override.');
  };

  const removeUser = (flagKey: string, uid: string) =>
    saveOverride(flagKey, (userOverrides[flagKey] ?? []).filter(u => u.uid !== uid));

  const addUser = (flagKey: string, user: UserOverride) => {
    const current = userOverrides[flagKey] ?? [];
    if (!current.some(u => u.uid === user.uid)) saveOverride(flagKey, [...current, user]);
    setPickerFor(null); setSearch('');
  };

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="space-y-3">
      {apiError && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{apiError}</p>}
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      {Object.keys(FLAG_LABELS).map(key => {
        const value = flags[key] ?? false;
        const overrides = userOverrides[key] ?? [];
        const overrideUids = new Set(overrides.map(u => u.uid));
        const available = allUsers.filter(u => !overrideUids.has(u.uid) && u.email.toLowerCase().includes(search.toLowerCase()));
        const showPicker = pickerFor === key;

        return (
          <div key={key} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-white">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{FLAG_LABELS[key]}</p>
                <p className="text-xs text-slate-400 font-mono">{key}</p>
              </div>
              <span className="text-xs text-slate-400">Global</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={value} onChange={e => toggle(key, e.target.checked)} className="sr-only" disabled={saving === key} />
                <div className={`w-9 h-5 rounded-full transition-colors ${value ? 'bg-[#14b8a6]' : 'bg-slate-300'}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : ''}`} />
              </label>
              <span className="text-xs font-semibold w-6 text-right" style={{ color: value ? '#14b8a6' : '#94a3b8' }}>{value ? 'ON' : 'OFF'}</span>
            </div>

            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">
                Early access — on for specific users regardless of global setting
                {overrides.length > 0 && <span className="ml-1.5 text-teal-600">({overrides.length})</span>}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {overrides.map(u => (
                  <span key={u.uid} className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {u.email}
                    <button type="button" onClick={() => removeUser(key, u.uid)} className="text-teal-400 hover:text-red-500 ml-0.5 leading-none" aria-label="Remove">×</button>
                  </span>
                ))}
                {overrides.length === 0 && !showPicker && <span className="text-xs text-slate-400 italic">No user overrides</span>}
              </div>

              {showPicker ? (
                <div className="relative">
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search users…"
                    className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#14b8a6] bg-white" />
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {available.length === 0
                      ? <p className="px-3 py-2 text-xs text-slate-400">No users available</p>
                      : available.map(u => (
                          <button key={u.uid} type="button" onClick={() => addUser(key, u)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0">
                            {u.email}
                          </button>
                        ))}
                  </div>
                  <button type="button" onClick={() => { setPickerFor(null); setSearch(''); }}
                    className="mt-1 text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                </div>
              ) : (
                <Btn variant="ghost" small onClick={() => { setPickerFor(key); setSearch(''); }}>+ Add user</Btn>
              )}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-slate-400 pt-1">Global changes propagate via Remote Config (12 h in production, 10 s in dev). Per-user overrides are immediate.</p>
    </div>
  );
}


// ── Main Admin page ────────────────────────────────────────────────────────────

export default function Admin() {
  const [tab, setTab] = useState('requests');
  const [pendingCount, setPendingCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    adminFetch('/api/admin/access-requests').then(async r => {
      if (r.ok) {
        const data: AccessRequest[] = await r.json();
        setPendingCount(data.filter(d => d.status === 'pending').length);
      }
    });
  }, []);

  const tabs = [
    { id: 'requests', label: 'Access Requests', icon: Inbox, badge: pendingCount },
    { id: 'users',    label: 'Users',            icon: Users },
    { id: 'usage',    label: 'Usage',             icon: BarChart2 },
    { id: 'feedback', label: 'Feedback',          icon: MessageSquare },
    { id: 'observability', label: 'Observability', icon: ScanSearch },
    { id: 'service-costs', label: 'Service Costs', icon: CircleDollarSign },
    { id: 'features', label: 'Features',          icon: Settings2 },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Platform Admin</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage users, access requests, features, and usage.</p>
        </div>
        <button type="button" onClick={() => window.location.reload()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'requests' && <RequestsTab />}
      {tab === 'users'    && <UsersTab />}
      {tab === 'usage'    && <UsageTab />}
      {tab === 'feedback' && <FeedbackTab />}
      {tab === 'observability' && <ObservabilityTab />}
      {tab === 'service-costs' && <ServiceCostsTab />}
      {tab === 'features' && <FeaturesTab />}
    </div>
  );
}

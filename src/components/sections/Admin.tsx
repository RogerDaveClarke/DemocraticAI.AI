import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../config/firebase';
import {
  Users, Inbox, BarChart2, Settings2, CheckCircle2,
  XCircle, UserPlus, Trash2, ShieldOff, ShieldCheck,
  LogOut, RefreshCw, ChevronDown, ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import { API_URL } from '@/config/runtime';

// ── helpers ──────────────────────────────────────────────────────────────────

const API = (import.meta.env.VITE_API_URL || API_URL).replace(/\/$/, '');

async function adminFetch(path: string, options: RequestInit = {}) {
  const token = await auth.currentUser?.getIdToken();
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

// ── types ─────────────────────────────────────────────────────────────────────

interface AccessRequest { id: string; email: string; requestedAt: any; status: string }
interface AdminUser {
  uid: string; email: string; displayName: string; disabled: boolean;
  isAdmin: boolean; createdAt: string; lastSignIn: string;
}
interface UsageRow { uid: string; email?: string; queries: number; tokensIn: number; tokensOut: number; cost: number }
interface FeatureFlags { [key: string]: boolean }

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

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

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
      <p className="text-xs text-slate-400 mb-3">Shows Firebase Authentication accounts only. Google Workspace users appear here after their first sign-in to Parliament AI.</p>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b">
          <th className="pb-2 pr-3">Email</th><th className="pb-2 pr-3">Created</th><th className="pb-2 pr-3">Last sign-in</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Actions</th>
        </tr></thead>
        <tbody>{users.map(u => (
          <tr key={u.uid} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-2.5 pr-3">
              <p className="font-medium text-slate-800">{u.email}</p>
              {u.displayName && <p className="text-xs text-slate-400">{u.displayName}</p>}
              {u.isAdmin && <Badge label="Admin" color="teal" />}
            </td>
            <td className="py-2.5 pr-3 text-xs text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
            <td className="py-2.5 pr-3 text-xs text-slate-400">{u.lastSignIn ? new Date(u.lastSignIn).toLocaleString() : 'Never'}</td>
            <td className="py-2.5 pr-3"><Badge label={u.disabled ? 'Suspended' : 'Active'} color={u.disabled ? 'amber' : 'green'} /></td>
            <td className="py-2.5">
              <div className="flex flex-wrap gap-1">
                {u.disabled
                  ? <Btn variant="success" small onClick={() => action(`/api/admin/users/${u.uid}/enable`)}><ShieldCheck className="h-3 w-3" />Reactivate</Btn>
                  : <Btn variant="ghost" small onClick={() => action(`/api/admin/users/${u.uid}/disable`)}><ShieldOff className="h-3 w-3" />Suspend</Btn>
                }
                <Btn variant="ghost" small onClick={() => action(`/api/admin/users/${u.uid}/revoke-tokens`)}><LogOut className="h-3 w-3" />Force out</Btn>
                {!u.isAdmin && <Btn variant="danger" small onClick={() => { if (confirm(`Delete ${u.email}?`)) action(`/api/admin/users/${u.uid}`, 'DELETE'); }}><Trash2 className="h-3 w-3" />Delete</Btn>}
              </div>
            </td>
          </tr>
        ))}</tbody>
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
  const [limit, setLimit] = useState(50);
  const [limitInput, setLimitInput] = useState('50');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [ur, lr] = await Promise.all([adminFetch('/api/admin/usage'), adminFetch('/api/admin/token-limit')]);
      if (ur.ok) {
        const data = await ur.json();
        const rows: UsageRow[] = Object.entries(data).map(([uid, v]: [string, any]) => ({ uid, ...v }));
        setUsage(rows.sort((a, b) => b.cost - a.cost));
      }
      if (lr.ok) {
        const d = await lr.json();
        setLimit(d.dailyQueryLimit);
        setLimitInput(String(d.dailyQueryLimit));
      }
      setLoading(false);
    })();
  }, []);

  const saveLimit = async () => {
    setSaving(true);
    await adminFetch('/api/admin/token-limit', { method: 'PATCH', body: JSON.stringify({ dailyQueryLimit: Number(limitInput) }) });
    setLimit(Number(limitInput));
    setSaving(false);
  };

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  const totalCost = usage.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
        <span className="text-sm font-medium text-slate-700">Daily query limit per user</span>
        <input type="number" value={limitInput} onChange={e => setLimitInput(e.target.value)} min="1" max="500"
          className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
        <Btn onClick={saveLimit} disabled={saving || Number(limitInput) === limit}>{saving ? 'Saving…' : 'Save'}</Btn>
        <span className="text-xs text-slate-400 ml-2">Current: {limit} queries/day</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Token usage (all time)</h3>
          <span className="text-xs text-slate-400">Total estimated cost: <strong className="text-slate-700">${totalCost.toFixed(4)}</strong></span>
        </div>
        <table className="w-full text-sm">
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
        </table>
      </div>
    </div>
  );
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
      {tab === 'features' && <FeaturesTab />}
    </div>
  );
}

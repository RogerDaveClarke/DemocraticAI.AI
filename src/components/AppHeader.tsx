import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Mail, UserRound, LogOut, Trash2, ShieldCheck, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { terminateAuthenticatedSession } from '../utils/authSession';
import { makeAPIRequest } from '../utils/api';

interface AppHeaderProps {
  onBackToHome: () => void;
}

export default function AppHeader({ onBackToHome: _onBackToHome }: AppHeaderProps) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [promptRetentionOptOut, setPromptRetentionOptOut] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const getPrivacySettings = async () => {
    const token = await auth.currentUser?.getIdToken();
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/privacy`, { cache: 'no-store', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (response.status === 401) await terminateAuthenticatedSession();
    if (!response.ok) throw new Error('Could not load privacy settings.');
    return response.json() as Promise<{ exists: boolean; promptRetentionOptOut: boolean }>;
  };

  const openPrivacySettings = async () => {
    setMenuOpen(false);
    setPrivacyError('');
    try {
      const settings = await getPrivacySettings();
      setPromptRetentionOptOut(settings.exists ? settings.promptRetentionOptOut : true);
      setShowPrivacySettings(true);
    } catch (error) {
      setPrivacyError(error instanceof Error ? error.message : 'Could not load privacy settings.');
      setShowPrivacySettings(true);
    }
  };

  const savePrivacySettings = async () => {
    setSavingPrivacy(true);
    setPrivacyError('');
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/privacy`, {
        method: 'PATCH',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ promptRetentionOptOut }),
      });
      if (response.status === 401) await terminateAuthenticatedSession();
      if (!response.ok) throw new Error('Could not save privacy settings.');
      setShowPrivacySettings(false);
    } catch (error) {
      setPrivacyError(error instanceof Error ? error.message : 'Could not save privacy settings.');
    } finally {
      setSavingPrivacy(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    getPrivacySettings().then((settings) => {
      if (!settings.exists) {
        setPromptRetentionOptOut(true);
        setShowPrivacySettings(true);
      }
    }).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut(auth);
  };

  const openDeleteConfirm = () => {
    setMenuOpen(false);
    setConfirmEmail('');
    setDeleteError('');
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!user || confirmEmail !== user.email) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await makeAPIRequest('/api/user/account', { method: 'DELETE' });
      await terminateAuthenticatedSession();
    } catch (e: any) {
      setDeleteError(
        e.code === 'auth/requires-recent-login' || e.message?.includes('Recent sign-in required')
          ? 'For security, sign out and use a new email link and authenticator code, then try again.'
          : `Deletion failed (${e.code}).`
      );
      setDeleting(false);
    }
  };

  const emailMatch = confirmEmail === (user?.email ?? '');

  return (
    <>
      <header className="fixed left-[285px] right-0 top-0 z-10 border-b border-slate-200 bg-white text-slate-800 shadow-sm">
        <div className="px-8 py-3.5 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-5 text-sm text-slate-700">
            <button type="button" className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors">
              <Mail className="h-4 w-4" />
              Subscribe
            </button>

            {user ? <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors"
              >
                <UserRound className="h-4 w-4" />
                Account
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-800 truncate">{user?.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {isAdmin
                        ? <><ShieldCheck className="h-3 w-3 text-[#14b8a6]" /><span className="text-xs text-[#14b8a6] font-medium">Admin</span></>
                        : <><UserRound className="h-3 w-3 text-slate-400" /><span className="text-xs text-slate-400">User</span></>
                      }
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openPrivacySettings}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Privacy settings
                  </button>
                  {!isAdmin && (
                    <button
                      type="button"
                      onClick={openDeleteConfirm}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete account
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              )}
            </div> : <button type="button" onClick={() => { window.location.href = '/research'; }} className="inline-flex items-center gap-1.5 rounded-md border border-[var(--dai-border)] px-3 py-1.5 text-sm font-medium text-[var(--dai-ink)] hover:bg-slate-50"><UserRound className="h-4 w-4" />Sign in</button>}
          </div>
        </div>
      </header>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-1">Delete account</h2>
            <p className="text-xs text-slate-500 mb-4">
              This permanently deletes your account. Enter the email address you signed in with to confirm.
            </p>

            <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              value={confirmEmail}
              onChange={e => setConfirmEmail(e.target.value)}
              placeholder={user?.email ?? ''}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400"
            />


            {deleteError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {deleteError}
              </p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!emailMatch || deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-40"
              >
                {deleting ? 'Deleting…' : 'Delete account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacySettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="privacy-settings-title" className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-2 text-teal-700"><Shield size={18} /></div>
              <div>
                <h2 id="privacy-settings-title" className="text-base font-semibold text-slate-900">Privacy settings</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Choose how your research activity is retained.</p>
              </div>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <p>We store your account identifier, submission time, model, token count, and estimated cost to enforce limits and let administrators monitor service costs.</p>
              <p>By default, we also retain the submitted prompt to support research history and operational review. We do not use prompts to train the service.</p>
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <input type="checkbox" checked={promptRetentionOptOut} onChange={(event) => setPromptRetentionOptOut(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <span><span className="font-medium">Do not retain my submitted prompts</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">Usage metrics and cost data will still be retained for account limits and service administration.</span></span>
            </label>
            {privacyError && <p className="mt-3 text-xs text-rose-600">{privacyError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowPrivacySettings(false)} disabled={savingPrivacy} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={savePrivacySettings} disabled={savingPrivacy} className="rounded-lg bg-[#14b8a6] px-3 py-2 text-sm font-medium text-white hover:bg-[#0d9488] disabled:opacity-50">{savingPrivacy ? 'Saving...' : 'Save preference'}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

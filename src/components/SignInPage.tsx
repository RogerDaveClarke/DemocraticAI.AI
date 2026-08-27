import { useEffect, useState } from 'react';
import {
  getMultiFactorResolver,
  isSignInWithEmailLink,
  MultiFactorResolver,
  signInWithEmailLink,
  TotpMultiFactorGenerator,
} from 'firebase/auth';
import { Mail, ShieldCheck } from 'lucide-react';
import { auth } from '../config/firebase';
import { API_URL } from '@/config/runtime';

interface Props {
  redirectError?: string | null;
}

const API = (import.meta.env.VITE_API_URL || API_URL).replace(/\/$/, '');
const EMAIL_STORAGE_KEY = 'parliamentEmailForSignIn';

export default function SignInPage({ redirectError }: Props) {
  const [email, setEmail] = useState(() => window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [completingLink] = useState(() => isSignInWithEmailLink(auth, window.location.href));
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | null>(null);
  const [mfaOtp, setMfaOtp] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);

  const clearEmailLink = () => {
    window.localStorage.removeItem(EMAIL_STORAGE_KEY);
    window.history.replaceState({}, '', '/');
  };

  const completeEmailLink = async (address: string) => {
    setLoading(true);
    setError('');
    try {
      await signInWithEmailLink(auth, address.trim().toLowerCase(), window.location.href);
      clearEmailLink();
    } catch (caught: any) {
      if (caught.code === 'auth/multi-factor-auth-required') {
        setMfaResolver(getMultiFactorResolver(auth, caught));
        return;
      }
      setError(friendlyError(caught.code));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!completingLink) return;
    const storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (storedEmail) void completeEmailLink(storedEmail);
  }, []);

  const handleEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (completingLink) {
      await completeEmailLink(email);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/auth/email-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!response.ok) throw new Error('request-failed');
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email.trim().toLowerCase());
      setLinkSent(true);
    } catch {
      setError('We could not request a sign-in link. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async () => {
    if (!mfaResolver || mfaOtp.length !== 6) return;
    setMfaLoading(true);
    setMfaError('');
    try {
      const hint = mfaResolver.hints[0];
      const assertion = TotpMultiFactorGenerator.assertionForSignIn(hint.uid, mfaOtp);
      await mfaResolver.resolveSignIn(assertion);
      clearEmailLink();
    } catch (caught: any) {
      setMfaError(caught.code === 'auth/invalid-verification-code'
        ? 'Incorrect code. Try again.'
        : 'Verification failed. Please try again.');
      setMfaLoading(false);
    }
  };

  if (mfaResolver) {
    return (
      <AuthFrame title="Two-factor authentication" subtitle="Check your authenticator app for a code">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">6-digit code</label>
          <input
            value={mfaOtp}
            onChange={event => { setMfaOtp(event.target.value.replace(/\D/g, '').slice(0, 6)); setMfaError(''); }}
            onKeyDown={event => event.key === 'Enter' && handleMfaSubmit()}
            placeholder="000 000"
            maxLength={6}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="w-full text-center text-2xl font-mono tracking-[0.5em] border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#14b8a6] transition"
          />
          {mfaError && <p role="alert" className="text-xs text-red-600 mt-1.5">{mfaError}</p>}
        </div>
        <button onClick={handleMfaSubmit} disabled={mfaOtp.length !== 6 || mfaLoading}
          className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm font-semibold rounded-lg py-2.5 transition disabled:opacity-50">
          {mfaLoading ? 'Verifying...' : 'Verify'}
        </button>
      </AuthFrame>
    );
  }

  const displayError = error || (redirectError ? friendlyError(redirectError) : '');

  return (
    <AuthFrame title="Parliament AI" subtitle="Research platform for democratic institutions">
      {linkSent ? (
        <div className="text-center space-y-3">
          <Mail className="h-8 w-8 text-[#14b8a6] mx-auto" />
          <p className="text-sm font-semibold text-slate-800">Check your email</p>
          <p className="text-xs text-slate-500">If this address has an approved account, a secure sign-in link has been sent.</p>
          <button type="button" onClick={() => setLinkSent(false)} className="text-xs text-[#14b8a6] hover:underline">Use another email</button>
        </div>
      ) : (
        <form onSubmit={handleEmail} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] focus:border-transparent"
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus={completingLink && !email}
            />
          </div>
          {completingLink && <p className="text-xs text-slate-500">Confirm your email address to complete sign-in.</p>}
          {displayError && <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{displayError}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white text-sm font-semibold rounded-lg py-2.5 transition disabled:opacity-50">
            {loading ? 'Please wait...' : completingLink ? 'Complete sign in' : 'Email me a sign-in link'}
          </button>
        </form>
      )}

      {!completingLink && !linkSent && (
        <div className="mt-5 text-center text-xs text-slate-400">
          {requestSent ? (
            <p className="text-[#14b8a6]">Request received. We will be in touch.</p>
          ) : showRequestForm ? (
            <div className="text-left mt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your email address</label>
              <div className="flex gap-2">
                <input type="email" value={requestEmail} onChange={event => setRequestEmail(event.target.value)} placeholder="you@example.com"
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
                <button type="button" disabled={!requestEmail.includes('@') || requestLoading} onClick={async () => {
                  setRequestLoading(true); setRequestError('');
                  try {
                    const response = await fetch(`${API}/api/access-requests`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: requestEmail }),
                    });
                    if (!response.ok) throw new Error('failed');
                    const data = await response.json();
                    if (data.alreadySubmitted) {
                      setRequestError(data.status === 'approved'
                        ? 'This email already has access. Request a sign-in link above.'
                        : 'Your request has already been submitted. You will be notified when it is reviewed.');
                    } else setRequestSent(true);
                  } catch { setRequestError('Could not send request. Try emailing support@democraticai.ai.'); }
                  finally { setRequestLoading(false); }
                }} className="px-3 py-2 bg-[#14b8a6] text-white text-xs font-semibold rounded-lg disabled:opacity-40">
                  {requestLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
              {requestError && <p className="text-red-500 text-xs mt-1">{requestError}</p>}
            </div>
          ) : (
            <p>Access is by invitation only. <button type="button" onClick={() => setShowRequestForm(true)} className="text-[#14b8a6] hover:underline">Request account</button>.</p>
          )}
        </div>
      )}
    </AuthFrame>
  );
}

function AuthFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-lg border border-slate-200">
        <div className="bg-gradient-to-br from-[#0b1f3a] to-[#1b3a5c] px-8 py-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#14b8a6] flex items-center justify-center mx-auto mb-3"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <h1 className="text-white text-lg font-bold tracking-tight">{title}</h1>
          <p className="text-white/60 text-xs mt-1">{subtitle}</p>
        </div>
        <div className="bg-white px-8 py-7 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'This sign-in link is invalid or has expired. Request a new one.';
    case 'auth/invalid-email':
      return 'Enter the same email address used to request this link.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for sign-in.';
    default:
      return `Sign-in failed (${code}). Please request a new link.`;
  }
}

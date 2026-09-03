import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import {
  TotpMultiFactorGenerator,
  multiFactor,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { ShieldCheck, Eye, EyeOff, Copy } from 'lucide-react';

type TotpSecretVal = Awaited<ReturnType<typeof TotpMultiFactorGenerator.generateSecret>>;
type Step = 'loading' | 'verify-email' | 'scan' | 'verifying' | 'error';

interface Props { user: User; onComplete: () => void }

export default function MfaEnrollModal({ user, onComplete }: Props) {
  const [step, setStep]         = useState<Step>('loading');
  const [secret, setSecret]     = useState<TotpSecretVal | null>(null);
  const [qrUrl, setQrUrl]       = useState('');
  const [manualKey, setManualKey] = useState('');
  const [showKey, setShowKey]   = useState(false);
  const [otp, setOtp]           = useState('');
  const [error, setError]       = useState('');
  const [copied, setCopied]     = useState(false);

  const startSetup = async () => {
    setStep('loading');
    try {
      const session    = await multiFactor(user).getSession();
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
      setSecret(totpSecret);
      setQrUrl(totpSecret.generateQrCodeUrl(user.email ?? 'user', 'Democratic AI'));
      setManualKey(totpSecret.secretKey);
      setStep('scan');
    } catch (e: any) {
      console.error('[MFA setup error]', e.code, e.message);
      if (e.code === 'auth/requires-recent-login') {
        setError('Your session is no longer recent enough. Sign out and request a new email link before setting up two-factor authentication.');
        setStep('error');
      } else if (e.code === 'auth/unverified-email') {
        try { await sendEmailVerification(user); } catch { /* best-effort */ }
        setStep('verify-email');
      } else if (e.code === 'auth/unsupported-first-factor' || e.code === 'auth/operation-not-allowed') {
        setError('TOTP MFA is not enabled. Go to Firebase Console → Authentication → Multi-factor auth → Add a second factor → Authenticator app (TOTP).');
        setStep('error');
      } else {
        setError('Could not start two-factor setup (' + (e.code ?? e.message) + '). Reload the page and try again.');
        setStep('error');
      }
    }
  };

  useEffect(() => { startSetup(); }, [user]);

  const copyKey = () => {
    navigator.clipboard.writeText(manualKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enroll = async () => {
    if (!secret || otp.length !== 6 || step === 'verifying') return;
    setStep('verifying');
    setError('');
    try {
      const assertion = TotpMultiFactorGenerator.assertionForEnrollment(secret, otp);
      await multiFactor(user).enroll(assertion, 'Authenticator app');
      onComplete();
    } catch (e: any) {
      setStep('scan');
      setError(e.code === 'auth/invalid-verification-code'
        ? 'Incorrect code. Make sure your device clock is accurate and try again.'
        : 'Verification failed — please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0b1f3a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        <div className="bg-gradient-to-br from-[#0b1f3a] to-[#1b3a5c] px-6 py-5 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#14b8a6] flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Set up two-factor authentication</h2>
            <p className="text-white/60 text-xs mt-0.5">Required before continuing</p>
          </div>
        </div>

        <div className="px-6 py-6">

          {step === 'loading' && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#14b8a6]" />
            </div>
          )}

          {step === 'error' && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
          )}

          {/* Email not verified — verification email sent automatically */}
          {step === 'verify-email' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <span className="text-xl leading-none">✉️</span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Verify your email first</p>
                  <p className="text-xs text-amber-700 mt-1">
                    We sent a verification link to <strong>{user.email}</strong>. Click it, then come back and reload this page to continue setting up two-factor authentication.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  try { await sendEmailVerification(user); } catch { /* ignore rate-limit */ }
                }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-1">
                Resend verification email
              </button>
              <button onClick={() => window.location.reload()}
                className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold rounded-xl py-2.5 text-sm transition">
                I have verified — reload
              </button>
            </div>
          )}

          {(step === 'scan' || step === 'verifying') && (
            <div className="space-y-5">

              <StepRow n={1} title="Open your authenticator app"
                detail="Google Authenticator, Authy, 1Password, Bitwarden, or any TOTP app" />

              <div className="flex gap-3">
                <StepNum n={2} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 mb-3">Scan this QR code</p>
                  <div className="flex justify-center p-4 bg-white border-2 border-slate-200 rounded-xl w-fit mx-auto">
                    {qrUrl && <QRCode value={qrUrl} size={164} />}
                  </div>
                  <button type="button" onClick={() => setShowKey(v => !v)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mx-auto">
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showKey ? 'Hide manual key' : "Can't scan? Enter key manually"}
                  </button>
                  {showKey && (
                    <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Account: {user.email} · Time-based (TOTP)</span>
                        <button type="button" onClick={copyKey}
                          className="flex items-center gap-1 text-xs text-[#14b8a6] hover:underline">
                          <Copy className="w-3 h-3" />{copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="font-mono text-xs break-all text-slate-700 select-all leading-relaxed">{manualKey}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <StepNum n={3} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 mb-2">Enter the 6-digit code from your app</p>
                  <input
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                    onKeyDown={e => e.key === 'Enter' && enroll()}
                    placeholder="000 000"
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    className="w-full text-center text-2xl font-mono tracking-[0.5em] border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#14b8a6] transition"
                  />
                  {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
                </div>
              </div>

              <button onClick={enroll} disabled={otp.length !== 6 || step === 'verifying'}
                className="w-full bg-[#14b8a6] hover:bg-[#0d9488] text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-40">
                {step === 'verifying' ? 'Verifying…' : 'Enable two-factor authentication'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepNum({ n }: { n: number }) {
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#14b8a6] text-white text-xs font-bold flex items-center justify-center mt-0.5">
      {n}
    </span>
  );
}

function StepRow({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <StepNum n={n} />
      <div>
        <p className="text-sm font-medium text-slate-800">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}

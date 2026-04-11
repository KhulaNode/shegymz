'use client';

import { Suspense, useEffect, useState, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type TokenState  = 'checking' | 'valid' | 'invalid';
type SetupMethod = 'choose'   | 'credentials';

const INVALID_REASONS: Record<string, string> = {
  not_found:      'This activation link is invalid.',
  already_used:   'This activation link has already been used. Please log in.',
  expired:        'This activation link has expired. Please contact support.',
  invalid_status: 'This activation link is no longer valid.',
};

function ActivateContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get('token');

  const [tokenState,    setTokenState]    = useState<TokenState>('checking');
  const [invalidReason, setInvalidReason] = useState('');
  const [intentEmail,   setIntentEmail]   = useState('');
  const [intentName,    setIntentName]    = useState('');

  const [method,          setMethod]          = useState<SetupMethod>('choose');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName,        setFullName]        = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  // ── Validate token on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTokenState('invalid');
      setInvalidReason('No activation token found. Check your email for the activation link.');
      return;
    }
    fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setIntentEmail(data.email ?? '');
          setIntentName(data.name  ?? '');
          setFullName(data.name    ?? '');
          setTokenState('valid');
        } else {
          setTokenState('invalid');
          setInvalidReason(INVALID_REASONS[data.reason] ?? 'This activation link is invalid.');
        }
      })
      .catch(() => {
        setTokenState('invalid');
        setInvalidReason('Could not validate the activation link. Please try again.');
      });
  }, [token]);

  // ── Credentials activation ────────────────────────────────────────────────
  async function handleCredentialsActivation(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/activate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password, fullName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Activation failed. Please try again.');
        return;
      }
      // Auto sign-in with newly created credentials
      const result = await signIn('credentials', { email: intentEmail, password, redirect: false });
      if (result?.error) {
        setError('Account created — sign-in failed. Please go to the login page.');
      } else {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Google activation ─────────────────────────────────────────────────────
  async function handleGoogleActivation() {
    // auth.ts signIn callback will find the PAID_ACCOUNT_PENDING intent by email
    // and handle User + Subscription creation automatically.
    await signIn('google', { callbackUrl: '/' });
  }

  // ── Shared UI helpers ─────────────────────────────────────────────────────
  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <>
      <Navigation />
      <main className="flex-1 flex items-center justify-center px-4 py-16 bg-neutral-50">
        <div className="w-full max-w-md">
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-8">

            {/* Checking */}
            {tokenState === 'checking' && (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-10 w-10 border-4 border-warmgray-300 border-t-plum-900 rounded-full" />
              </div>
            )}

            {/* Invalid */}
            {tokenState === 'invalid' && (
              <div className="text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <h1 className="text-xl font-bold text-plum-900 mb-2">Activation Link Invalid</h1>
                <p className="text-sm text-neutral-600 mb-6">{invalidReason}</p>
                <div className="flex flex-col gap-2">
                  <Link href="/login"     className="text-plum-900 font-medium text-sm hover:underline">Sign in →</Link>
                  <Link href="/subscribe" className="text-neutral-500 text-sm hover:underline">Start a new subscription →</Link>
                </div>
              </div>
            )}

            {/* Valid — choose method */}
            {tokenState === 'valid' && method === 'choose' && (
              <>
                <h1 className="text-2xl font-bold text-plum-900 text-center mb-1">Activate Your Account</h1>
                <p className="text-sm text-neutral-500 text-center mb-1">
                  {intentName ? `Welcome, ${intentName}!` : 'Welcome!'} Your payment is confirmed.
                </p>
                <p className="text-sm font-medium text-neutral-700 text-center mb-6">{intentEmail}</p>

                <p className="text-sm text-neutral-600 text-center mb-4">Choose how you&apos;d like to sign in going forward:</p>

                <button
                  onClick={handleGoogleActivation}
                  className="w-full flex items-center justify-center gap-3 border border-neutral-300 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors mb-3"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="relative mb-3">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200" /></div>
                  <div className="relative flex justify-center text-xs text-neutral-400"><span className="bg-white px-2">or</span></div>
                </div>

                <button
                  onClick={() => setMethod('credentials')}
                  className="w-full bg-plum-900 text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-plum-800 transition-colors"
                >
                  Set Up Password
                </button>
              </>
            )}

            {/* Valid — credentials setup */}
            {tokenState === 'valid' && method === 'credentials' && (
              <>
                <h1 className="text-xl font-bold text-plum-900 text-center mb-1">Set Your Password</h1>
                <p className="text-sm text-neutral-500 text-center mb-6">{intentEmail}</p>

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleCredentialsActivation} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Full Name <span className="text-neutral-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-plum-900 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-plum-900 focus:border-transparent"
                      placeholder="Min. 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-plum-900 focus:border-transparent ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-400 bg-red-50'
                          : 'border-neutral-300'
                      }`}
                      placeholder="Repeat your password"
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-plum-900 text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-plum-800 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Activating…' : 'Activate Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMethod('choose'); setError(''); }}
                    className="w-full text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    ← Back
                  </button>
                </form>
              </>
            )}

          </div>

          <p className="mt-4 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link href="/login" className="text-plum-900 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <ActivateContent />
    </Suspense>
  );
}

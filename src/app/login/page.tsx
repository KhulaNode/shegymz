'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

type Tab = 'signin' | 'join';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab]     = useState<Tab>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // ── Shared fields ──────────────────────────────────────────────────────────
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // ── Google SSO ─────────────────────────────────────────────────────────────
  async function handleGoogle() {
    setError('');
    await signIn('google', { callbackUrl: '/' });
  }

  // ── Credentials sign-in ────────────────────────────────────────────────────
  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Invalid email or password.');
      } else {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navigation />

      <main className="flex-1 flex items-center justify-center px-4 py-16 bg-neutral-50">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-8">

            {/* Brand heading */}
            <h1 className="text-2xl font-bold text-plum-900 text-center mb-1">Welcome to SheGymZ</h1>
            <p className="text-sm text-neutral-500 text-center mb-6">Private Women&apos;s Wellness Club</p>

            {/* Tabs */}
            <div className="flex rounded-lg bg-neutral-100 p-1 mb-6">
              {(['signin', 'join'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors ${
                    tab === t
                      ? 'bg-white text-plum-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {t === 'signin' ? 'Sign In' : 'Join'}
                </button>
              ))}
            </div>

            {/* Google SSO */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 border border-neutral-300 rounded-lg px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors mb-4 disabled:opacity-50"
            >
              {/* Google icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-xs text-neutral-400">
                <span className="bg-white px-2">or</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Sign In form */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-plum-900 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-neutral-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-plum-900 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-plum-900 text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-plum-800 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )}

            {/* Create Account form */}
            {tab === 'join' && (
              <div className="text-center space-y-5">
                <div className="bg-plum-50 border border-plum-900/10 rounded-xl p-6">
                  <p className="text-2xl mb-3">🏋️‍♀️</p>
                  <h2 className="text-base font-semibold text-plum-900 mb-2">
                    Membership is invitation-only
                  </h2>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    SheGymZ is a private women&apos;s wellness club. New accounts are
                    created only after verified payment.
                  </p>
                </div>

                <div className="text-left bg-neutral-50 rounded-xl p-5 space-y-3">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">How to join</p>
                  <div className="flex gap-3 items-start">
                    <span className="text-plum-900 font-bold text-sm w-5 shrink-0">1</span>
                    <p className="text-sm text-neutral-700">Fill in the subscription form</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-plum-900 font-bold text-sm w-5 shrink-0">2</span>
                    <p className="text-sm text-neutral-700">Complete payment via Yoco</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-plum-900 font-bold text-sm w-5 shrink-0">3</span>
                    <p className="text-sm text-neutral-700">Click the activation link sent to your email</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-plum-900 font-bold text-sm w-5 shrink-0">4</span>
                    <p className="text-sm text-neutral-700">Sign in and enjoy access</p>
                  </div>
                </div>

                <Link
                  href="/subscribe"
                  className="block w-full bg-plum-900 text-white font-semibold rounded-lg px-4 py-2.5 text-sm hover:bg-plum-800 transition-colors text-center"
                >
                  Start My Subscription →
                </Link>

                <p className="text-xs text-neutral-400">
                  Already received an activation email?{' '}
                  <Link href="/activate" className="text-plum-900 hover:underline">
                    Activate your account
                  </Link>
                </p>
              </div>
            )}

          </div>

          <p className="mt-4 text-center text-sm text-neutral-500">
            Back to{' '}
            <Link href="/" className="text-plum-900 font-medium hover:underline">
              home
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}

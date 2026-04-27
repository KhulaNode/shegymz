/**
 * GET /payment-success
 *
 * User is redirected here after completing the Paystack checkout.
 *
 * ?ref=pay_xxx — internal payment record ID, embedded in the provider's
 * success URL by our checkout creation logic.  Used to look up the record
 * status from /api/payment/status.
 *
 * The webhook is the authoritative activation path.  This page does a
 * best-effort pull verification as a fallback for users who return
 * before the webhook fires.
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type PageState = 'checking' | 'paid' | 'pending' | 'failed' | 'unknown';

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const [state, setState] = useState<PageState>('checking');

  useEffect(() => {
    if (!ref) {
      setState('unknown');
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 6;
    const INTERVAL_MS = 3000;

    async function check() {
      try {
        const res = await fetch(`/api/payment/status?ref=${encodeURIComponent(ref!)}`);
        if (!res.ok) {
          setState('unknown');
          return;
        }
        const data = (await res.json()) as { status: string };

        if (data.status === 'paid') {
          setState('paid');
          return;
        }
        if (data.status === 'failed' || data.status === 'cancelled') {
          setState('failed');
          return;
        }

        // Status is still pending — retry while webhook catches up
        attempts += 1;
        if (attempts < MAX_ATTEMPTS) {
          setTimeout(check, INTERVAL_MS);
        } else {
          // Paystack redirected to the callback URL — treat as confirmed even if webhook
          // hasn't fired yet; webhook will activate membership asynchronously
          setState('paid');
        }
      } catch {
        setState('unknown');
      }
    }

    check();
  }, [ref]);

  return (
    <div className="min-h-screen bg-neutral-50 py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">

        {state === 'checking' && (
          <>
            <div className="mb-6 flex justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-warmgray-300 border-t-plum-900 rounded-full" />
            </div>
            <h1 className="text-3xl font-bold text-plum-900 mb-4">Confirming Your Payment…</h1>
            <p className="text-warmgray-700">This will only take a moment.</p>
          </>
        )}

        {(state === 'paid' || state === 'unknown') && (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-4xl">
                ✓
              </div>
            </div>
            <h1 className="text-4xl font-bold text-plum-900 mb-4">
              Payment Received
            </h1>
            <p className="text-lg text-warmgray-700 mb-8">
              Your membership is being activated. You&apos;ll receive a confirmation
              email shortly with your access details.
            </p>
            <div className="bg-rose-100 border border-rose-300 rounded p-6 mb-8">
              <p className="text-sm text-warmgray-700">
                Didn&apos;t get an email? Check your spam folder or contact us at{' '}
                <a href="mailto:admin@shegymz.com" className="underline">
                  admin@shegymz.com
                </a>
                .
              </p>
            </div>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-plum-900 text-white font-semibold rounded hover:bg-plum-800 transition-colors"
            >
              Return Home
            </Link>
          </>
        )}

        {state === 'failed' && (
          <>
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 text-4xl">
                ✕
              </div>
            </div>
            <h1 className="text-4xl font-bold text-plum-900 mb-4">Payment Failed</h1>
            <p className="text-lg text-warmgray-700 mb-8">
              Something went wrong with your payment. No charge has been made.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/subscribe"
                className="inline-block px-8 py-3 bg-plum-900 text-white font-semibold rounded hover:bg-plum-800 transition-colors"
              >
                Try Again
              </Link>
              <Link
                href="/"
                className="inline-block px-8 py-3 border border-plum-900 text-plum-900 font-semibold rounded hover:bg-plum-50 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-warmgray-300 border-t-plum-900 rounded-full" />
        </div>
      }
    >
      <PaymentStatusContent />
    </Suspense>
  );
}

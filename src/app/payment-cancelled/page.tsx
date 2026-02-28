import Link from 'next/link';

/**
 * GET /payment-cancelled
 *
 * User is redirected here when they cancel at the checkout, or when the
 * provider reports a payment failure.  The ?reason=failure query param
 * is set by the Yoco failureUrl to distinguish the two cases.
 */
export default function PaymentCancelledPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warmgray-100 text-4xl">
            ⊘
          </div>
        </div>
        <h1 className="text-4xl font-bold text-plum-900 mb-4">
          Payment Cancelled
        </h1>
        <p className="text-lg text-warmgray-700 mb-8">
          Your payment was cancelled and no charge has been made.
          You can try again at any time or contact us for help.
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
        <p className="mt-8 text-sm text-warmgray-600">
          Need help?{' '}
          <a href="mailto:admin@shegymz.com" className="underline hover:text-plum-800">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

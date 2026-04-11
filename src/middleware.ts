import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Route protection middleware.
 *
 * /booking/*   — requires authenticated user with an ACTIVE subscription.
 * /dashboard/* — requires authenticated user (subscription check can be added later).
 *
 * All other routes are public.
 *
 * The `hasActiveSubscription` flag is embedded in the JWT by auth.ts and
 * refreshed on every sign-in, so no extra DB call is needed here.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    // Subscription gate for booking pages
    if (req.nextUrl.pathname.startsWith('/booking')) {
      if (!token?.hasActiveSubscription) {
        return NextResponse.redirect(
          new URL('/subscribe?reason=membership-required', req.url),
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // `authorized` returning false → NextAuth redirects to /login
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  matcher: [
    '/booking/:path*',
    '/dashboard/:path*',
  ],
};

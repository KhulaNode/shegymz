import NextAuth from 'next-auth';
import { type NextRequest } from 'next/server';
import { makeAuthOptions } from '@/lib/auth';

/**
 * Read the activation_hash cookie from the request and inject it into
 * authOptions so the signIn callback can authorise Google users whose
 * Google account email differs from their subscription email.
 *
 * Using NextRequest here (instead of importing next/headers in auth.ts)
 * keeps auth.ts free of dynamic APIs, which means pages that call
 * getServerSession() can still be statically rendered/cached.
 */
function makeHandler(req: NextRequest) {
  const activationHash = req.cookies.get('activation_hash')?.value;
  return NextAuth(makeAuthOptions(activationHash));
}

export function GET(req: NextRequest) {
  return makeHandler(req)(req);
}

export function POST(req: NextRequest) {
  return makeHandler(req)(req);
}

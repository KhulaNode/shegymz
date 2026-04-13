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
 *
 * Next.js 15 makes route params async (a Promise), so we must await
 * context.params before passing it to the NextAuth handler. NextAuth v4
 * uses context.params.nextauth (e.g. ['error'], ['callback','google'])
 * to determine which action to run — without it every route 500s.
 */

type RouteContext = { params: Promise<{ nextauth: string[] }> };

function makeHandler(req: NextRequest) {
  const activationHash = req.cookies.get('activation_hash')?.value;
  return NextAuth(makeAuthOptions(activationHash));
}

export async function GET(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return makeHandler(req)(req, { params });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const params = await context.params;
  return makeHandler(req)(req, { params });
}

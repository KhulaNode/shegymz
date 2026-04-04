import NextAuth, { type NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

// ─── Role codes ───────────────────────────────────────────────────────────────
export const ROLE = {
  ADMIN:   'ADMIN',
  TRAINER: 'TRAINER',
  CLIENT:  'CLIENT',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Ensure the three standard roles exist in the database. Idempotent.
 */
async function ensureRoles() {
  const roles = [
    { code: ROLE.ADMIN,   description: 'Full administrative access' },
    { code: ROLE.TRAINER, description: 'Trainer / coach access' },
    { code: ROLE.CLIENT,  description: 'Standard member access' },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where:  { code: role.code },
      update: {},
      create: role,
    });
  }
}

/**
 * Assign roleCode to the user if they do not already have it.
 */
async function assignRoleIfMissing(userId: string, roleCode: string) {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) return;

  await prisma.userRole.upsert({
    where:  { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
}

/**
 * Post-sign-in lifecycle: update lastLoginAt, assign default role, bootstrap admin.
 */
async function handlePostLogin(userId: string, email: string | null | undefined) {
  await prisma.user.update({
    where: { id: userId },
    data:  { lastLoginAt: new Date() },
  });

  // Check if user already has any role
  const existingRoles = await prisma.userRole.findMany({ where: { userId } });
  if (existingRoles.length === 0) {
    await assignRoleIfMissing(userId, ROLE.CLIENT);
  }

  // Admin bootstrap: if email matches env var, ensure ADMIN role
  const adminBootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL;
  if (adminBootstrapEmail && email && email.toLowerCase() === adminBootstrapEmail.toLowerCase()) {
    await assignRoleIfMissing(userId, ROLE.ADMIN);
  }
}

// ─── NextAuth config ──────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'Username / Password',
      credentials: {
        login:    { label: 'Email or Username', type: 'text' },
        password: { label: 'Password',          type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) return null;

        const login = credentials.login.trim().toLowerCase();

        // Look up by email or username
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email:    login },
              { username: login },
            ],
          },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!passwordMatch) return null;

        return {
          id:    user.id,
          email: user.email ?? undefined,
          name:  user.name  ?? undefined,
          image: user.imageUrl ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      await ensureRoles();

      // For OAuth (Google) providers: if an account with this email already
      // exists but was created via credentials, link them by email.
      if (account?.provider === 'google' && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true },
        });

        if (existing) {
          const alreadyLinked = existing.accounts.some(
            (a) => a.provider === 'google',
          );
          if (!alreadyLinked) {
            // Link the Google account to the existing user
            await prisma.account.create({
              data: {
                userId:           existing.id,
                type:             account.type,
                provider:         account.provider,
                providerAccountId: account.providerAccountId,
                access_token:     account.access_token,
                refresh_token:    account.refresh_token,
                expires_at:       account.expires_at,
                token_type:       account.token_type,
                scope:            account.scope,
                id_token:         account.id_token,
              },
            });
            // Return false so NextAuth doesn't create a duplicate user;
            // we just linked the account manually.
            // We need to set user.id so the jwt callback can use it.
            user.id = existing.id;
          }
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        // First sign-in — user object is present
        token.userId = user.id;
        await handlePostLogin(user.id, user.email);
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;

        // Attach roles to the session so the UI can use them
        const userRoles = await prisma.userRole.findMany({
          where:   { userId: token.userId as string },
          include: { role: true },
        });
        session.user.roles = userRoles.map((ur) => ur.role.code);
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler };

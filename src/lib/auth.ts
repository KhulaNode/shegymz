import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// Assign the CLIENT role to a user if they have no roles yet.
async function ensureClientRole(userId: string): Promise<void> {
  const clientRole = await prisma.role.findUnique({ where: { code: 'CLIENT' } });
  if (!clientRole) return;

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: clientRole.id } },
    create: { userId, roleId: clientRole.id },
    update: {},
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id:    user.id,
          email: user.email,
          name:  user.fullName ?? user.username ?? null,
          image: user.imageUrl ?? null,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * signIn — runs after every successful authentication attempt.
     *
     * Google  : find-or-create User + Account, ensure CLIENT role, update lastLoginAt.
     * Credentials : user already exists (authorize validated it). Ensure CLIENT role +
     *               update lastLoginAt.
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const email = user.email;
        if (!email) return false;

        // Find or create the user record
        let dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) {
          // New Google user — must have a verified, paid SubscriptionIntent.
          // Primary lookup: by Google email (common case — same email used to subscribe).
          let intent = await prisma.subscriptionIntent.findFirst({
            where: {
              email,
              status: 'PAID_ACCOUNT_PENDING',
              activationUsedAt: null,
              activationTokenExpiresAt: { gt: new Date() },
            },
            orderBy: { createdAt: 'desc' },
          });

          // Fallback: by activation cookie (handles Google email ≠ subscription email).
          // The cookie is set by POST /api/auth/activate/google just before OAuth starts.
          if (!intent) {
            try {
              const cookieStore = await cookies();
              const hashCookie  = cookieStore.get('activation_hash')?.value;
              if (hashCookie) {
                intent = await prisma.subscriptionIntent.findFirst({
                  where: {
                    activationTokenHash:      hashCookie,
                    status:                   'PAID_ACCOUNT_PENDING',
                    activationUsedAt:         null,
                    activationTokenExpiresAt: { gt: new Date() },
                  },
                });
              }
            } catch {
              // cookies() unavailable in this context — ignore
            }
          }

          if (!intent) return false;

          dbUser = await prisma.user.create({
            data: {
              email,
              fullName: user.name ?? intent.fullName ?? null,
              imageUrl: user.image ?? null,
              isActive: true,
            },
          });

          // Create Subscription for the newly activated member
          await prisma.subscription.create({
            data: {
              userId:            dbUser.id,
              status:            'ACTIVE',
              provider:          'yoco',
              providerReference: intent.providerReference ?? null,
              startedAt:         new Date(),
              intentId:          intent.id,
            },
          });

          // Finalise the intent
          await prisma.subscriptionIntent.update({
            where: { id: intent.id },
            data:  { status: 'ACCOUNT_CREATED', userId: dbUser.id, activationUsedAt: new Date() },
          });
        }

        // Find or create the Account record
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider:          'google',
              providerAccountId: account.providerAccountId,
            },
          },
          create: {
            userId:            dbUser.id,
            provider:          'google',
            providerAccountId: account.providerAccountId,
          },
          update: {},
        });

        await ensureClientRole(dbUser.id);
        await prisma.user.update({
          where: { id: dbUser.id },
          data:  { lastLoginAt: new Date() },
        });

        // Overwrite the NextAuth user ID with the DB user ID so it flows into jwt()
        user.id = dbUser.id;
      }

      if (account?.provider === 'credentials') {
        // user.id is already the DB primary key (returned by authorize)
        await ensureClientRole(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        });
      }

      return true;
    },

    /**
     * jwt — called whenever a JWT is created (sign-in) or read (API requests).
     *
     * On first sign-in `user` is populated; attach userId + roles to the token.
     */
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where:   { email: user.email },
          include: {
            roles:         { include: { role: true } },
            subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
          },
        });
        if (dbUser) {
          token.userId                = dbUser.id;
          token.roles                 = dbUser.roles.map((ur) => ur.role.code);
          token.hasActiveSubscription = dbUser.subscriptions.length > 0;
        }
      }
      return token;
    },

    /**
     * session — shape the client-visible session from the JWT payload.
     */
    async session({ session, token }) {
      session.user.id                    = token.userId as string;
      session.user.roles                 = token.roles  as string[];
      session.user.hasActiveSubscription = (token.hasActiveSubscription as boolean) ?? false;
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: { strategy: 'jwt' },

  secret: process.env.NEXTAUTH_SECRET,
};

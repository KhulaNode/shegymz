/**
 * CLI script to create a credentials-login user.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/create-user.ts \
 *     --email alice@example.com \
 *     --username alice \
 *     --password secretpass \
 *     --name "Alice Smith"
 *
 * All flags except --password are optional if you provide the other.
 * At least one of --email or --username must be supplied.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function arg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : undefined;
}

async function main() {
  const email    = arg('--email');
  const username = arg('--username');
  const password = arg('--password');
  const name     = arg('--name');

  if (!password) {
    console.error('Error: --password is required');
    process.exit(1);
  }
  if (!email && !username) {
    console.error('Error: at least one of --email or --username is required');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email:        email    ? email.toLowerCase().trim()    : null,
      username:     username ? username.toLowerCase().trim() : null,
      passwordHash,
      name:         name ?? username ?? email,
      isActive:     true,
    },
  });

  console.log(`Created user: ${user.id} (email: ${user.email ?? 'none'}, username: ${user.username ?? 'none'})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

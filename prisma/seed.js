// @ts-check
'use strict';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const roles = [
  { code: 'ADMIN',   description: 'Full system access' },
  { code: 'TRAINER', description: 'Trainer access' },
  { code: 'CLIENT',  description: 'Member/client access' },
];

async function main() {
  for (const role of roles) {
    await prisma.role.upsert({
      where:  { code: role.code },
      update: {},
      create: role,
    });
  }
  console.log('[seed] Roles upserted:', roles.map(r => r.code).join(', '));
}

main()
  .catch((err) => {
    console.error('[seed] Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

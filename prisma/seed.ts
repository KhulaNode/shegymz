/**
 * Prisma seed script
 * Seeds the Role table with the three standard roles.
 * Run: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    { code: 'ADMIN',   description: 'Full administrative access' },
    { code: 'TRAINER', description: 'Trainer / coach access' },
    { code: 'CLIENT',  description: 'Standard member access' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where:  { code: role.code },
      update: { description: role.description },
      create: role,
    });
    console.log(`Upserted role: ${role.code}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

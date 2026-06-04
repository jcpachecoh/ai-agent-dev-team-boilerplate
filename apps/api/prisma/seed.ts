/**
 * Development seed — creates deterministic fixtures for local testing and
 * the Postman collection.
 *
 * IDs are fixed so the Postman environment values never change:
 *   tenantId   = SEED_TENANT_ID   (used as x-tenant-id header)
 *   categoryId = SEED_CATEGORY_ID (used in POST /api/supply-items body)
 *   user email = test@restopsiq.dev  /  password = TestPass123!
 *
 * Run:  cd apps/api && pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const SEED_TENANT_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const SEED_CATEGORY_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
const SEED_USER_ID = 'cccccccc-0000-0000-0000-000000000003';

async function main() {
  console.log('Seeding database…');

  // ── Test user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('TestPass123!', SALT_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email: 'test@restopsiq.dev' },
    update: { passwordHash },
    create: {
      id: SEED_USER_ID,
      email: 'test@restopsiq.dev',
      name: 'Test User',
      passwordHash,
    },
  });
  console.log('User:', user.email, '—', user.id);

  // ── Supply category ───────────────────────────────────────────────────────
  const category = await prisma.supplyCategory.upsert({
    where: { id: SEED_CATEGORY_ID },
    update: {},
    create: {
      id: SEED_CATEGORY_ID,
      tenantId: SEED_TENANT_ID,
      nombre: 'Abarrotes',
    },
  });
  console.log('SupplyCategory:', category.nombre, '—', category.id);

  console.log('\n✅ Postman environment values:');
  console.log('  tenantId  =', SEED_TENANT_ID);
  console.log('  categoryId=', SEED_CATEGORY_ID);
  console.log('  email     = test@restopsiq.dev');
  console.log('  password  = TestPass123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

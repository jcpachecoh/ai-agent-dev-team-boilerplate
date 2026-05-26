/**
 * Development seed — creates deterministic fixtures for local testing and
 * the Postman collection.
 *
 * IDs are fixed so the Postman environment values never change:
 *   tenantId   = SEED_TENANT_ID   (used as x-tenant-id header)
 *   categoryId = SEED_CATEGORY_ID (used in POST /api/supply-items body)
 *   user email = test@restopsiq.dev  /  password = TestPass123!
 *
 * MES operational users (local/dev only — synthetic cédulas, never use in production):
 *   tenantId = palos-de-lena  (send as x-tenant-id on POST /api/mes/auth/login)
 *   owner:    cédula 12345678 / PIN 1234  (OWNER)
 *   operator: cédula 87654321 / PIN 4321  (OPERATOR, sede sede-principal)
 *
 * Run:  cd apps/api && pnpm db:seed
 */

import { OperationalRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const SEED_TENANT_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const SEED_CATEGORY_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
const SEED_USER_ID = 'cccccccc-0000-0000-0000-000000000003';

const MES_TENANT_ID = 'palos-de-lena';
const MES_OWNER_ID = 'dddddddd-0000-0000-0000-000000000004';
const MES_OPERATOR_ID = 'eeeeeeee-0000-0000-0000-000000000005';

/** Matches MesAuthService cédula hashing (HMAC-SHA256 or SHA-256 fallback). */
function hashCedula(cedula: string): string {
  const hmacSecret = process.env.CEDULA_HMAC_SECRET;
  if (hmacSecret) {
    return crypto.createHmac('sha256', hmacSecret).update(cedula).digest('hex');
  }
  return crypto.createHash('sha256').update(cedula).digest('hex');
}

async function main() {
  console.log('Seeding database…');

  // ── Test user ────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('TestPass123!', SALT_ROUNDS);

  const user = await prisma.userTestLab.upsert({
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

  // ── MES operational users (palos-de-lena) ─────────────────────────────────
  const ownerPinHash = await bcrypt.hash('1234', SALT_ROUNDS);
  const ownerCedulaHash = hashCedula('12345678');

  const owner = await prisma.operationalUser.upsert({
    where: {
      tenantId_cedulaHash: { tenantId: MES_TENANT_ID, cedulaHash: ownerCedulaHash },
    },
    update: {
      pinHash: ownerPinHash,
      role: OperationalRole.OWNER,
      isActive: true,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      id: MES_OWNER_ID,
      tenantId: MES_TENANT_ID,
      cedulaHash: ownerCedulaHash,
      pinHash: ownerPinHash,
      role: OperationalRole.OWNER,
      sedeId: null,
      isActive: true,
    },
  });
  console.log('MES operational user:', owner.role, '—', owner.id);

  const operatorPinHash = await bcrypt.hash('4321', SALT_ROUNDS);
  const operatorCedulaHash = hashCedula('87654321');

  const operator = await prisma.operationalUser.upsert({
    where: {
      tenantId_cedulaHash: { tenantId: MES_TENANT_ID, cedulaHash: operatorCedulaHash },
    },
    update: {
      pinHash: operatorPinHash,
      role: OperationalRole.OPERATOR,
      sedeId: 'sede-principal',
      isActive: true,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      id: MES_OPERATOR_ID,
      tenantId: MES_TENANT_ID,
      cedulaHash: operatorCedulaHash,
      pinHash: operatorPinHash,
      role: OperationalRole.OPERATOR,
      sedeId: 'sede-principal',
      isActive: true,
    },
  });
  console.log('MES operational user:', operator.role, '—', operator.id);

  console.log('\n✅ Postman environment values:');
  console.log('  tenantId  =', SEED_TENANT_ID);
  console.log('  categoryId=', SEED_CATEGORY_ID);
  console.log('  email     = test@restopsiq.dev');
  console.log('  password  = TestPass123!');
  console.log('\n✅ MES auth (local/dev only):');
  console.log('  x-tenant-id =', MES_TENANT_ID);
  console.log('  See file header for synthetic cédula + PIN test credentials');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

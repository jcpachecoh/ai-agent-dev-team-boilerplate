/**
 * Development seed — creates deterministic fixtures for local testing and
 * the Postman collection.
 *
 * Email auth (global User — x-tenant-id: palos-de-lena):
 *   mes-owner@palos-de-lena.dev    / TestPass123!
 *   mes-operator@palos-de-lena.dev / TestPass123!
 *
 * Operational tenant palos-de-lena (supply catalog + MES + plant):
 *   tenantId / mesTenantId = palos-de-lena  (x-tenant-id on supply-items & MES login)
 *   categoryId = SEED_CATEGORY_ID (POST /api/supply-items body)
 *   supplyItemId = SEED_SUPPLY_ITEM_ID (optional; also captured by Create Supply Item)
 *
 * Global User + Role (USR-01):
 *   Roles: OWNER, SUPERVISOR, MANAGER, OPERATOR (tenant-scoped)
 *
 * MES operational users (local/dev only — synthetic cédulas, never use in production):
 *   owner:    cédula 12345678 / PIN 1234  (OWNER) — linked to global User
 *   operator: cédula 87654321 / PIN 4321  (OPERATOR, sede sede-principal) — linked to global User
 *
 * Run:  cd apps/api && pnpm db:seed
 */

import { DocumentType, OperationalRole, PrismaClient, StockUnit } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/** Shared tenant for supply items, MES auth, and plant master data. */
const OPERATIONAL_TENANT_ID = 'palos-de-lena';

const SEED_CATEGORY_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
const SEED_SUPPLY_ITEM_ID = 'ffffffff-0000-0000-0000-000000000006';

const ROLE_OWNER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const ROLE_SUPERVISOR_ID = 'aaaaaaaa-0000-0000-0000-000000000002';
const ROLE_MANAGER_ID = 'aaaaaaaa-0000-0000-0000-000000000003';
const ROLE_OPERATOR_ID = 'aaaaaaaa-0000-0000-0000-000000000004';

const GLOBAL_MES_OWNER_USER_ID = '11111111-0000-0000-0000-000000000004';
const GLOBAL_MES_OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';

const MES_OWNER_ID = 'dddddddd-0000-0000-0000-000000000004';
const MES_OPERATOR_ID = 'eeeeeeee-0000-0000-0000-000000000005';

const ROLE_SEEDS = [
  { id: ROLE_OWNER_ID, code: 'OWNER', name: 'Owner' },
  { id: ROLE_SUPERVISOR_ID, code: 'SUPERVISOR', name: 'Supervisor' },
  { id: ROLE_MANAGER_ID, code: 'MANAGER', name: 'Manager' },
  { id: ROLE_OPERATOR_ID, code: 'OPERATOR', name: 'Operator' },
] as const;

/** Matches MesAuthService cédula hashing (HMAC-SHA256 or SHA-256 fallback). */
function hashCedula(cedula: string): string {
  const hmacSecret = process.env.CEDULA_HMAC_SECRET;
  if (hmacSecret) {
    return crypto.createHmac('sha256', hmacSecret).update(cedula).digest('hex');
  }
  return crypto.createHash('sha256').update(cedula).digest('hex');
}

async function seedRoles() {
  const roles: Record<string, { id: string; code: string }> = {};

  for (const roleSeed of ROLE_SEEDS) {
    const role = await prisma.role.upsert({
      where: {
        tenantId_code: { tenantId: OPERATIONAL_TENANT_ID, code: roleSeed.code },
      },
      update: { name: roleSeed.name, isActive: true },
      create: {
        id: roleSeed.id,
        tenantId: OPERATIONAL_TENANT_ID,
        code: roleSeed.code,
        name: roleSeed.name,
        isActive: true,
      },
    });
    roles[roleSeed.code] = role;
    console.log('Role:', role.code, '—', role.id);
  }

  return roles;
}

async function main() {
  console.log('Seeding database…');

  const roles = await seedRoles();

  // ── Supply category (operational tenant) ─────────────────────────────────
  const category = await prisma.supplyCategory.upsert({
    where: { id: SEED_CATEGORY_ID },
    update: { tenantId: OPERATIONAL_TENANT_ID, nombre: 'Abarrotes' },
    create: {
      id: SEED_CATEGORY_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      nombre: 'Abarrotes',
    },
  });
  console.log(
    'SupplyCategory:',
    category.nombre,
    '—',
    category.id,
    `(tenant ${category.tenantId})`,
  );

  // ── Sample supply item (for MES phase inputs + Postman) ───────────────────
  const supplyItem = await prisma.supplyItem.upsert({
    where: { id: SEED_SUPPLY_ITEM_ID },
    update: {
      tenantId: OPERATIONAL_TENANT_ID,
      categoriaId: SEED_CATEGORY_ID,
      nombre: 'Aceite de Cocina (seed)',
      isActive: true,
    },
    create: {
      id: SEED_SUPPLY_ITEM_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      nombre: 'Aceite de Cocina (seed)',
      codigoInterno: 'SEED-ACEITE',
      categoriaId: SEED_CATEGORY_ID,
      descripcion: 'Aceite vegetal refinado — fixture local',
      unidadBase: StockUnit.LITERS,
      factorConversion: 1,
      costoPromedioPonderado: 8500,
      stockMinimoBodega: 5,
      stockMaximoBodega: 50,
      aplicaVencimiento: false,
      aplicaLote: false,
      isActive: true,
    },
  });
  console.log('SupplyItem:', supplyItem.codigoInterno, '—', supplyItem.id);

  // ── MES operational users + linked global User rows ───────────────────────
  const mesUserPasswordHash = await bcrypt.hash('TestPass123!', SALT_ROUNDS);

  const ownerPinHash = await bcrypt.hash('1234', SALT_ROUNDS);
  const ownerCedulaHash = hashCedula('12345678');

  const ownerGlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '12345678' },
    },
    update: {
      email: 'mes-owner@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.OWNER.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_MES_OWNER_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '12345678',
      documentType: DocumentType.CC,
      email: 'mes-owner@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.OWNER.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('Global User (MES owner):', ownerGlobalUser.email, '—', ownerGlobalUser.id);

  const owner = await prisma.operationalUser.upsert({
    where: {
      tenantId_cedulaHash: { tenantId: OPERATIONAL_TENANT_ID, cedulaHash: ownerCedulaHash },
    },
    update: {
      userId: ownerGlobalUser.id,
      pinHash: ownerPinHash,
      role: OperationalRole.OWNER,
      isActive: true,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      id: MES_OWNER_ID,
      userId: ownerGlobalUser.id,
      tenantId: OPERATIONAL_TENANT_ID,
      cedulaHash: ownerCedulaHash,
      pinHash: ownerPinHash,
      role: OperationalRole.OWNER,
      sedeId: null,
      isActive: true,
    },
  });
  console.log('MES operational user:', owner.role, '—', owner.id, `(userId ${owner.userId})`);

  const operatorPinHash = await bcrypt.hash('4321', SALT_ROUNDS);
  const operatorCedulaHash = hashCedula('87654321');

  const operatorGlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '87654321' },
    },
    update: {
      email: 'mes-operator@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.OPERATOR.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_MES_OPERATOR_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '87654321',
      documentType: DocumentType.CC,
      email: 'mes-operator@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.OPERATOR.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('Global User (MES operator):', operatorGlobalUser.email, '—', operatorGlobalUser.id);

  const operator = await prisma.operationalUser.upsert({
    where: {
      tenantId_cedulaHash: { tenantId: OPERATIONAL_TENANT_ID, cedulaHash: operatorCedulaHash },
    },
    update: {
      userId: operatorGlobalUser.id,
      pinHash: operatorPinHash,
      role: OperationalRole.OPERATOR,
      sedeId: 'sede-principal',
      isActive: true,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      id: MES_OPERATOR_ID,
      userId: operatorGlobalUser.id,
      tenantId: OPERATIONAL_TENANT_ID,
      cedulaHash: operatorCedulaHash,
      pinHash: operatorPinHash,
      role: OperationalRole.OPERATOR,
      sedeId: 'sede-principal',
      isActive: true,
    },
  });
  console.log(
    'MES operational user:',
    operator.role,
    '—',
    operator.id,
    `(userId ${operator.userId})`,
  );

  console.log('\n✅ Email auth (global User — x-tenant-id: palos-de-lena):');
  console.log('  mes-owner    = mes-owner@palos-de-lena.dev / TestPass123!');
  console.log('  mes-operator = mes-operator@palos-de-lena.dev / TestPass123!');
  console.log('\n✅ Operational tenant (supply-items, MES, plant):');
  console.log('  tenantId / mesTenantId =', OPERATIONAL_TENANT_ID);
  console.log('  categoryId             =', SEED_CATEGORY_ID);
  console.log('  supplyItemId           =', SEED_SUPPLY_ITEM_ID);
  console.log('\n✅ Global User fixtures (USR-01):');
  console.log('  mes-owner userId    =', ownerGlobalUser.id);
  console.log('  mes-operator userId =', operatorGlobalUser.id);
  console.log('\n✅ MES auth (local/dev only):');
  console.log('  See file header for synthetic cédula + PIN test credentials');

  // ── USR-01 Task 09: link any orphan OperationalUser rows when cédula mapping exists ──
  const { backfillOperationalUserLinks } =
    await import('../../../scripts/backfill-operational-user-links');
  const backfillResult = await backfillOperationalUserLinks(prisma);
  console.log('\n✅ OperationalUser → User backfill:', backfillResult);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

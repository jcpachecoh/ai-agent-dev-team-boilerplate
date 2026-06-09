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
 *   Roles: OWNER, SUPERVISOR, MANAGER, OPERATOR, OPERATIONS_ADMIN (tenant-scoped)
 *
 * Global Permission catalog (USR-02):
 *   13 permission codes — see PERMISSION_SEEDS (ids cccccccc-0000-0000-0000-000000000001…013)
 *
 * Role-permission matrix (USR-02, tenant palos-de-lena):
 *   OWNER — all 13 permissions
 *   MANAGER / SUPERVISOR — 11 permissions (no mes.users.*)
 *   OPERATOR — plant.orders.read, supply.items.read
 *
 * MES operational users (local/dev only — synthetic cédulas, never use in production):
 *   owner:    cédula 12345678 / PIN 1234  (OWNER) — linked to global User
 *   operator: cédula 87654321 / PIN 4321  (OPERATOR, sede sede-principal) — linked to global User
 *
 * Run:  cd apps/api && pnpm db:seed
 */

import {
  ArlRiskLevel,
  CondicionPago,
  DocumentType,
  EmployeeContractType,
  OperationalRole,
  PrismaClient,
  SalaryType,
  StockUnit,
  SupplierTipo,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/** Shared tenant for supply items, MES auth, and plant master data. */
const OPERATIONAL_TENANT_ID = 'palos-de-lena';

const SEED_CATEGORY_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
const SEED_CATEGORY_GRANOS_ID = 'bbbbbbbb-0000-0000-0000-000000000003';
/** Canonical supply categories (epic examples) — flexible model, fixed seed IDs for Postman. */
const SEED_CATEGORY_CARNICOS_ID = 'bbbbbbbb-0000-0000-0000-000000000004';
const SEED_CATEGORY_LACTEOS_ID = 'bbbbbbbb-0000-0000-0000-000000000005';
const SEED_CATEGORY_BEBIDAS_ID = 'bbbbbbbb-0000-0000-0000-000000000006';
const SEED_CATEGORY_ASEO_ID = 'bbbbbbbb-0000-0000-0000-000000000007';
const SEED_CATEGORY_EMPAQUE_ID = 'bbbbbbbb-0000-0000-0000-000000000008';
const SEED_SUPPLY_ITEM_ID = 'ffffffff-0000-0000-0000-000000000006';
const SEED_SUPPLY_ITEM_ARROZ_ID = 'ffffffff-0000-0000-0000-000000000007';
const SEED_SUPPLIER_ID = 'dddddddd-0000-0000-0000-000000000001';
const SEED_SUPPLIER_PRODUCT_ID = 'eeeeeeee-0000-0000-0000-000000000001';

const ROLE_OWNER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const ROLE_SUPERVISOR_ID = 'aaaaaaaa-0000-0000-0000-000000000002';
const ROLE_MANAGER_ID = 'aaaaaaaa-0000-0000-0000-000000000003';
const ROLE_OPERATOR_ID = 'aaaaaaaa-0000-0000-0000-000000000004';
const ROLE_OPERATIONS_ADMIN_ID = 'aaaaaaaa-0000-0000-0000-000000000005';

const GLOBAL_MES_OWNER_USER_ID = '11111111-0000-0000-0000-000000000004';
const GLOBAL_MES_OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';

const MES_OWNER_ID = 'dddddddd-0000-0000-0000-000000000004';
const MES_OPERATOR_ID = 'eeeeeeee-0000-0000-0000-000000000005';

const ROLE_SEEDS = [
  { id: ROLE_OWNER_ID, code: 'OWNER', name: 'Owner' },
  { id: ROLE_SUPERVISOR_ID, code: 'SUPERVISOR', name: 'Supervisor' },
  { id: ROLE_MANAGER_ID, code: 'MANAGER', name: 'Manager' },
  { id: ROLE_OPERATOR_ID, code: 'OPERATOR', name: 'Operator' },
  {
    id: ROLE_OPERATIONS_ADMIN_ID,
    code: 'OPERATIONS_ADMIN',
    name: 'Administrador de Operaciones',
  },
] as const;

const PERMISSION_SEEDS = [
  {
    id: 'cccccccc-0000-0000-0000-000000000001',
    code: 'mes.users.create',
    name: 'Create operational user',
    description: 'Create a new MES operational user in the tenant',
    module: 'mes',
    resource: 'users',
    action: 'create',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000002',
    code: 'mes.users.role.read',
    name: 'Read operational user role',
    description: 'Read the role assigned to an MES operational user',
    module: 'mes',
    resource: 'users.role',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000003',
    code: 'plant.workstations.manage',
    name: 'Manage workstations',
    description: 'Create, update, and deactivate plant work stations',
    module: 'plant',
    resource: 'workstations',
    action: 'manage',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000004',
    code: 'plant.recipes.manage',
    name: 'Manage recipes',
    description: 'Create, update, clone, and deactivate production recipes',
    module: 'plant',
    resource: 'recipes',
    action: 'manage',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000005',
    code: 'plant.orders.read',
    name: 'Read production orders',
    description: 'List and view production orders',
    module: 'plant',
    resource: 'orders',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000006',
    code: 'plant.orders.create',
    name: 'Create production order',
    description: 'Create a new production order',
    module: 'plant',
    resource: 'orders',
    action: 'create',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000007',
    code: 'plant.orders.plan',
    name: 'Plan production order',
    description: 'Move a production order to planned status',
    module: 'plant',
    resource: 'orders',
    action: 'plan',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000008',
    code: 'plant.orders.pause',
    name: 'Pause production order',
    description: 'Pause an in-progress production order',
    module: 'plant',
    resource: 'orders',
    action: 'pause',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000009',
    code: 'plant.orders.resume',
    name: 'Resume production order',
    description: 'Resume a paused production order',
    module: 'plant',
    resource: 'orders',
    action: 'resume',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000010',
    code: 'plant.orders.cancel',
    name: 'Cancel production order',
    description: 'Cancel a production order',
    module: 'plant',
    resource: 'orders',
    action: 'cancel',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000011',
    code: 'plant.executions.qa_approve',
    name: 'QA approve execution',
    description: 'Approve a phase execution pending QA',
    module: 'plant',
    resource: 'executions',
    action: 'qa_approve',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000012',
    code: 'supply.items.read',
    name: 'Read supply items',
    description: 'List and view supply catalog items',
    module: 'supply',
    resource: 'items',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000013',
    code: 'supply.items.manage',
    name: 'Manage supply items',
    description: 'Create, update, and deactivate supply catalog items',
    module: 'supply',
    resource: 'items',
    action: 'manage',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000014',
    code: 'plant.committees.read',
    name: 'Read production committees',
    description: 'List and view production committees',
    module: 'plant',
    resource: 'committees',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000015',
    code: 'plant.committees.manage',
    name: 'Manage production committees',
    description: 'Create, update, and close production committees',
    module: 'plant',
    resource: 'committees',
    action: 'manage',
  },
] as const;

const MANAGER_SUPERVISOR_PERMISSION_CODES = [
  'plant.workstations.manage',
  'plant.recipes.manage',
  'plant.orders.read',
  'plant.orders.create',
  'plant.orders.plan',
  'plant.orders.pause',
  'plant.orders.resume',
  'plant.orders.cancel',
  'plant.executions.qa_approve',
  'supply.items.read',
  'supply.items.manage',
  'plant.committees.read',
  'plant.committees.manage',
] as const;

const OPERATOR_PERMISSION_CODES = ['plant.orders.read', 'supply.items.read'] as const;

const OPERATIONS_ADMIN_PERMISSION_CODES = ['plant.orders.read', 'plant.committees.read'] as const;

const ROLE_PERMISSION_MATRIX: Record<string, readonly string[]> = {
  OWNER: PERMISSION_SEEDS.map((permissionSeed) => permissionSeed.code),
  MANAGER: MANAGER_SUPERVISOR_PERMISSION_CODES,
  SUPERVISOR: MANAGER_SUPERVISOR_PERMISSION_CODES,
  OPERATOR: OPERATOR_PERMISSION_CODES,
  OPERATIONS_ADMIN: OPERATIONS_ADMIN_PERMISSION_CODES,
};

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

async function seedPermissions() {
  const permissions: Record<string, { id: string; code: string }> = {};

  for (const permissionSeed of PERMISSION_SEEDS) {
    const permission = await prisma.permission.upsert({
      where: { code: permissionSeed.code },
      update: {
        name: permissionSeed.name,
        description: permissionSeed.description,
        module: permissionSeed.module,
        resource: permissionSeed.resource,
        action: permissionSeed.action,
        isActive: true,
      },
      create: {
        id: permissionSeed.id,
        code: permissionSeed.code,
        name: permissionSeed.name,
        description: permissionSeed.description,
        module: permissionSeed.module,
        resource: permissionSeed.resource,
        action: permissionSeed.action,
        isActive: true,
      },
    });
    permissions[permissionSeed.code] = permission;
    console.log('Permission:', permission.code, '—', permission.id);
  }

  return permissions;
}

async function seedRolePermissions() {
  const countsByRole: Record<string, number> = {};

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_MATRIX)) {
    const role = await prisma.role.findUnique({
      where: {
        tenantId_code: { tenantId: OPERATIONAL_TENANT_ID, code: roleCode },
      },
      select: { id: true, code: true },
    });
    if (!role) {
      throw new Error(
        `[seedRolePermissions] Role "${roleCode}" not found for tenant "${OPERATIONAL_TENANT_ID}"`,
      );
    }

    let linkedCount = 0;
    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode },
        select: { id: true, code: true },
      });
      if (!permission) {
        throw new Error(
          `[seedRolePermissions] Permission "${permissionCode}" not found in catalog`,
        );
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
      linkedCount++;
    }

    countsByRole[roleCode] = linkedCount;
    console.log(`RolePermission: ${roleCode} — ${linkedCount} permissions linked`);
  }

  return countsByRole;
}

async function seedLocations() {
  const locations = [];
  for (let i = 1; i <= 10; i++) {
    const name = `Sede Palos de Leña ${i}`;
    const code = `PL-${i.toString().padStart(2, '0')}`;
    const location = await prisma.location.upsert({
      where: {
        tenantId_code: { tenantId: OPERATIONAL_TENANT_ID, code },
      },
      update: { name, isActive: true },
      create: {
        tenantId: OPERATIONAL_TENANT_ID,
        name,
        code,
        isActive: true,
      },
    });
    locations.push(location);
    console.log('Location:', location.name, '—', location.id);
  }
  return locations;
}

async function seedEmployeeDetails(
  ownerUserId: string,
  operatorUserId: string,
  locationId: string,
) {
  // Seed for owner
  await prisma.employeeDetails.upsert({
    where: { userId: ownerUserId },
    update: { isActive: true },
    create: {
      userId: ownerUserId,
      tenantId: OPERATIONAL_TENANT_ID,
      locationId: locationId,
      position: 'Gerente General',
      area: 'Administración',
      department: 'Gerencia',
      contractType: EmployeeContractType.INDEFINIDO,
      hireDate: new Date('2024-01-01'),
      contractStart: new Date('2024-01-01'),
      salaryType: SalaryType.INTEGRAL,
      salaryAmount: 15000000.0,
      hasTransportSubsidy: false,
      isExemptFromTax: false,
      epsName: 'Sura',
      pensionFundName: 'Protección',
      cesantiasFundName: 'Protección',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_I,
      cajaCompensacion: 'Comfama',
      isActive: true,
    },
  });

  // Seed for operator
  await prisma.employeeDetails.upsert({
    where: { userId: operatorUserId },
    update: { isActive: true },
    create: {
      userId: operatorUserId,
      tenantId: OPERATIONAL_TENANT_ID,
      locationId: locationId,
      position: 'Operario de Planta',
      area: 'Producción',
      department: 'Cocina',
      contractType: EmployeeContractType.FIJO,
      hireDate: new Date('2024-02-15'),
      contractStart: new Date('2024-02-15'),
      contractEnd: new Date('2025-02-14'),
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: 1800000.0,
      hasTransportSubsidy: true,
      isExemptFromTax: false,
      epsName: 'Sanitas',
      pensionFundName: 'Porvenir',
      cesantiasFundName: 'Porvenir',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_II,
      cajaCompensacion: 'Compensar',
      isActive: true,
    },
  });

  console.log('EmployeeDetails: Seeded for owner and operator');
}

async function main() {
  console.log('Seeding database…');

  // ── Tenant (Global) ──────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { id: OPERATIONAL_TENANT_ID },
    update: {
      name: 'Palos de Leña',
      legalName: 'Palos de Leña S.A.S.',
      tradeName: 'Palos de Leña',
      nit: '900000000-1',
      legalRepresentativeName: 'Representante Legal Palos de Leña',
      legalRepresentativeDocumentType: DocumentType.CC,
      legalRepresentativeDocumentNumber: '1000000000',
      email: 'admin@palosdelena.test',
      phone: '+57 300 000 0000',
      address: 'Dirección de prueba',
      city: 'Bogotá',
      department: 'Cundinamarca',
      country: 'CO',
      taxRegime: 'RESPONSABLE_IVA',
      isActive: true,
    },
    create: {
      id: OPERATIONAL_TENANT_ID,
      name: 'Palos de Leña',
      legalName: 'Palos de Leña S.A.S.',
      tradeName: 'Palos de Leña',
      nit: '900000000-1',
      legalRepresentativeName: 'Representante Legal Palos de Leña',
      legalRepresentativeDocumentType: DocumentType.CC,
      legalRepresentativeDocumentNumber: '1000000000',
      email: 'admin@palosdelena.test',
      phone: '+57 300 000 0000',
      address: 'Dirección de prueba',
      city: 'Bogotá',
      department: 'Cundinamarca',
      country: 'CO',
      taxRegime: 'RESPONSABLE_IVA',
      isActive: true,
    },
  });
  console.log('Tenant:', tenant.name, '—', tenant.id);

  const roles = await seedRoles();
  await seedPermissions();
  const rolePermissionCounts = await seedRolePermissions();

  const locations = await seedLocations();
  const firstLocationId = locations[0].id;

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
      stockActualBodega: 25,
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
      stockActualBodega: 25,
      aplicaVencimiento: false,
      aplicaLote: false,
      isActive: true,
    },
  });
  console.log('SupplyItem:', supplyItem.codigoInterno, '—', supplyItem.id);

  const categoryGranos = await prisma.supplyCategory.upsert({
    where: { id: SEED_CATEGORY_GRANOS_ID },
    update: { tenantId: OPERATIONAL_TENANT_ID, nombre: 'Granos' },
    create: {
      id: SEED_CATEGORY_GRANOS_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      nombre: 'Granos',
      descripcion: 'Cereales y legumbres',
    },
  });
  console.log('SupplyCategory:', categoryGranos.nombre, '—', categoryGranos.id);

  const canonicalCategories = [
    { id: SEED_CATEGORY_CARNICOS_ID, nombre: 'Cárnicos' },
    { id: SEED_CATEGORY_LACTEOS_ID, nombre: 'Lácteos' },
    { id: SEED_CATEGORY_BEBIDAS_ID, nombre: 'Bebidas' },
    { id: SEED_CATEGORY_ASEO_ID, nombre: 'Aseo' },
    { id: SEED_CATEGORY_EMPAQUE_ID, nombre: 'Empaque' },
  ] as const;
  for (const cat of canonicalCategories) {
    const row = await prisma.supplyCategory.upsert({
      where: { id: cat.id },
      update: { tenantId: OPERATIONAL_TENANT_ID, nombre: cat.nombre, isActive: true },
      create: {
        id: cat.id,
        tenantId: OPERATIONAL_TENANT_ID,
        nombre: cat.nombre,
      },
    });
    console.log('SupplyCategory:', row.nombre, '—', row.id);
  }

  const supplyItemArroz = await prisma.supplyItem.upsert({
    where: { id: SEED_SUPPLY_ITEM_ARROZ_ID },
    update: {
      tenantId: OPERATIONAL_TENANT_ID,
      categoriaId: SEED_CATEGORY_GRANOS_ID,
      nombre: 'Arroz Premium (seed)',
      stockMinimoBodega: 20,
      stockActualBodega: 50,
      isActive: true,
    },
    create: {
      id: SEED_SUPPLY_ITEM_ARROZ_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      nombre: 'Arroz Premium (seed)',
      codigoInterno: 'SEED-ARROZ',
      categoriaId: SEED_CATEGORY_GRANOS_ID,
      unidadBase: StockUnit.KILOGRAMS,
      factorConversion: 1,
      costoPromedioPonderado: 4200,
      stockMinimoBodega: 20,
      stockMaximoBodega: 200,
      stockActualBodega: 50,
      isActive: true,
    },
  });
  console.log('SupplyItem:', supplyItemArroz.codigoInterno, '—', supplyItemArroz.id);

  const supplier = await prisma.supplier.upsert({
    where: { id: SEED_SUPPLIER_ID },
    update: {
      tenantId: OPERATIONAL_TENANT_ID,
      razonSocial: 'Agrosuper Seed',
      isActive: true,
    },
    create: {
      id: SEED_SUPPLIER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      razonSocial: 'Agrosuper Seed',
      nit: '900123456',
      tipo: SupplierTipo.PERSONA_JURIDICA,
      condicionPago: CondicionPago.DIAS_30,
      cupoCredito: 5000000,
      calificacion: 4,
      isActive: true,
    },
  });
  console.log('Supplier:', supplier.razonSocial, '—', supplier.id);

  await prisma.supplierProduct.upsert({
    where: { id: SEED_SUPPLIER_PRODUCT_ID },
    update: {
      precioUnitario: 8200,
      esProveedorPrincipal: true,
    },
    create: {
      id: SEED_SUPPLIER_PRODUCT_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      supplierId: SEED_SUPPLIER_ID,
      supplyItemId: SEED_SUPPLY_ITEM_ID,
      precioUnitario: 8200,
      unidadCompra: StockUnit.LITERS,
      factorConversion: 1,
      tiempoEntregaDias: 3,
      esProveedorPrincipal: true,
    },
  });

  await prisma.supplyItemPriceHistory.upsert({
    where: { id: 'hhhhhhhh-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'hhhhhhhh-0000-0000-0000-000000000001',
      tenantId: OPERATIONAL_TENANT_ID,
      supplyItemId: SEED_SUPPLY_ITEM_ID,
      costoAnterior: 8000,
      costoNuevo: 8500,
      motivo: 'seed_initial',
    },
  });

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
  console.log('\n✅ Global Permission catalog (USR-02):');
  console.log('  permissions seeded =', PERMISSION_SEEDS.length);
  console.log('\n✅ Role-permission matrix (USR-02, tenant palos-de-lena):');
  for (const [roleCode, count] of Object.entries(rolePermissionCounts)) {
    console.log(`  ${roleCode}: ${count} permissions`);
  }
  console.log('\n✅ MES auth (local/dev only):');
  console.log('  See file header for synthetic cédula + PIN test credentials');

  // ── USR-01 Task 09: link any orphan OperationalUser rows when cédula mapping exists ──
  const { backfillOperationalUserLinks } =
    await import('../../../scripts/backfill-operational-user-links');
  const backfillResult = await backfillOperationalUserLinks(prisma);
  console.log('\n✅ OperationalUser → User backfill:', backfillResult);

  // ── NOM-01: Seed EmployeeDetails ─────────────────────────────────────────
  await seedEmployeeDetails(ownerGlobalUser.id, operatorGlobalUser.id, firstLocationId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

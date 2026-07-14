/**
 * Development seed — creates deterministic fixtures for local testing and
 * the Postman collection.
 *
 * Email auth (global User — x-tenant-id: palos-de-lena):
 *   mes-owner@palos-de-lena.dev           / TestPass123!
 *   mes-operator@palos-de-lena.dev        / TestPass123!
 *   operations.admin@palos-de-lena.dev    / TestPass123!  (OPERATIONS_ADMIN — committee modal)
 *   nomina@palos-de-lena.dev              / TestPass123!  (NOMINA — payroll read-only)
 *   overtime-gg@palos-de-lena.dev         / TestPass123!  (CONN-04a — Gerente General demo)
 *
 * Operational tenant palos-de-lena (supply catalog + MES + plant):
 *   tenantId / mesTenantId = palos-de-lena  (x-tenant-id on supply-items & MES login)
 *   categoryId = SEED_CATEGORY_ID (POST /api/supply-items body)
 *   supplyItemId = SEED_SUPPLY_ITEM_ID (optional; also captured by Create Supply Item)
 *
 * Global User + Role (USR-01):
 *   Roles: OWNER, SUPERVISOR, MANAGER, OPERATOR, OPERATIONS_ADMIN, NOMINA (tenant-scoped)
 *
 * Global Permission catalog (USR-02 + USR-03 + OS-499/OS-505/OS-559/OS-560):
 *   38 permission codes — see PERMISSION_SEEDS (ids cccccccc-0000-0000-0000-000000000001…048,
 *   non-contiguous: 001-031 + 037-038 + 039-048; see inline comments for OS-ticket mapping)
 *
 * Role-permission matrix (USR-02 + USR-03, tenant palos-de-lena):
 *   OWNER      — all permissions (ALL_PERMISSION_CODES)
 *   SUPERVISOR — 17 permissions (base 13 + 4 admin.users/roles.read)
 *   MANAGER    — 14 permissions (base 13 + admin.users.read)
 *   OPERATOR   — plant.orders.read, supply.items.read
 *   NOMINA     — no global permissions (module access via RolesGuard — OS-478)
 *
 * MES operational users (local/dev only — synthetic cédulas, never use in production):
 *   owner:    cédula 12345678 / PIN 1234  (OWNER) — linked to global User
 *   operator: cédula 87654321 / PIN 4321  (OPERATOR, 3 sedes asignadas) — linked to global User
 *
 * Run:  cd apps/api && pnpm db:seed
 *
 * Plant supervisor demo (6 estaciones, recetas, OP activas, alarmas):
 *   Re-run seed after migrations — creates EST-01…EST-06 fixtures for /supervisor/mapa
 */

import {
  ArlRiskLevel,
  CondicionPago,
  CostCenter,
  DocumentType,
  EmployeeContractType,
  EmployeeRelationshipType,
  LaborClassification,
  Location,
  OperationalRole,
  PrismaClient,
  SalaryType,
  StockUnit,
  SupplierTipo,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { syncEmployeeCompensationHistory } from './seeds/employee-compensation-history.seed-util';

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
const SEED_CATEGORY_DOTACION_ID = 'bbbbbbbb-0000-0000-0000-000000000025';
const SEED_SUPPLY_ITEM_CAMISA_ID = 'ffffffff-0000-0000-0000-000000000008';
const SEED_SUPPLY_ITEM_PANTALON_ID = 'ffffffff-0000-0000-0000-000000000009';
const SEED_SUPPLY_ITEM_BOTAS_ID = 'ffffffff-0000-0000-0000-000000000010';
const SEED_SUPPLIER_ID = 'dddddddd-0000-0000-0000-000000000001';
const SEED_SUPPLIER_PRODUCT_ID = 'eeeeeeee-0000-0000-0000-000000000001';

const ROLE_OWNER_ID = 'aaaaaaaa-0000-0000-0000-000000000001';
const ROLE_SUPERVISOR_ID = 'aaaaaaaa-0000-0000-0000-000000000002';
const ROLE_MANAGER_ID = 'aaaaaaaa-0000-0000-0000-000000000003';
const ROLE_OPERATOR_ID = 'aaaaaaaa-0000-0000-0000-000000000004';
const ROLE_OPERATIONS_ADMIN_ID = 'aaaaaaaa-0000-0000-0000-000000000005';
const ROLE_NOMINA_ID = 'aaaaaaaa-0000-0000-0000-000000000006';
const ROLE_SUPER_ADMIN_ID = 'aaaaaaaa-0000-0000-0000-000000000007';

const GLOBAL_MES_OWNER_USER_ID = '11111111-0000-0000-0000-000000000004';
const GLOBAL_MES_OPERATOR_USER_ID = '11111111-0000-0000-0000-000000000005';
const GLOBAL_SUPER_ADMIN_USER_ID = '11111111-0000-0000-0000-000000000009';

const MES_OWNER_ID = 'dddddddd-0000-0000-0000-000000000004';
const MES_OPERATOR_ID = 'eeeeeeee-0000-0000-0000-000000000005';
const MES_OPERATOR2_ID = 'eeeeeeee-0000-0000-0000-000000000006';

const GLOBAL_MES_OPERATOR2_USER_ID = '11111111-0000-0000-0000-000000000006';
const GLOBAL_MES_OPERATIONS_ADMIN_USER_ID = '11111111-0000-0000-0000-000000000007';
const GLOBAL_NOMINA_USER_ID = '11111111-0000-0000-0000-000000000008';
// Bug fix OS-550 — filtro Supervisor sin opciones: el seed nunca creaba usuarios con rol
// SUPERVISOR/MANAGER, así que `findSupervisorOptions` (correctamente) siempre devolvía [].
const GLOBAL_MES_SUPERVISOR_USER_ID = '11111111-0000-0000-0000-000000000010';
const GLOBAL_MES_MANAGER_USER_ID = '11111111-0000-0000-0000-000000000011';

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
  { id: ROLE_NOMINA_ID, code: 'NOMINA', name: 'Nómina' },
  { id: ROLE_SUPER_ADMIN_ID, code: 'SUPER_ADMIN', name: 'Super Admin' },
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
  {
    id: 'cccccccc-0000-0000-0000-000000000016',
    code: 'admin.users.read',
    name: 'Read admin users',
    description: 'List and view global users in the tenant',
    module: 'admin',
    resource: 'users',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000017',
    code: 'admin.users.create',
    name: 'Create admin user',
    description: 'Create a new global user in the tenant',
    module: 'admin',
    resource: 'users',
    action: 'create',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000018',
    code: 'admin.users.update',
    name: 'Update admin user',
    description: 'Update profile, role, or status of a global user',
    module: 'admin',
    resource: 'users',
    action: 'update',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000019',
    code: 'admin.users.deactivate',
    name: 'Deactivate admin user',
    description: 'Soft-delete (deactivate) a global user in the tenant',
    module: 'admin',
    resource: 'users',
    action: 'deactivate',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000020',
    code: 'admin.roles.read',
    name: 'Read roles',
    description: 'List and view roles in the tenant',
    module: 'admin',
    resource: 'roles',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000021',
    code: 'admin.roles.manage',
    name: 'Manage roles',
    description: 'Create, update, and deactivate roles in the tenant',
    module: 'admin',
    resource: 'roles',
    action: 'manage',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000022',
    code: 'admin.roles.permissions.assign',
    name: 'Assign role permissions',
    description: 'Assign or revoke permissions on a role',
    module: 'admin',
    resource: 'roles.permissions',
    action: 'assign',
  },
  // OS-559 — Employee Financial Profile
  // IDs 049-053: DB already had 027-031 occupied by nomina.roles/users (from a9e66b8 commit).
  {
    id: 'cccccccc-0000-0000-0000-000000000049',
    code: 'nomina.financial.read',
    name: 'Read employee financial profile',
    description: 'View financial profile and bank accounts of an employee',
    module: 'nomina',
    resource: 'financial',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000050',
    code: 'nomina.financial.write',
    name: 'Write employee financial profile',
    description: 'Create and update financial profile and bank accounts of an employee',
    module: 'nomina',
    resource: 'financial',
    action: 'write',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000051',
    code: 'nomina.financial.tax.read',
    name: 'Read employee tax information',
    description: 'View tax withholding configuration of an employee',
    module: 'nomina',
    resource: 'financial.tax',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000052',
    code: 'nomina.financial.tax.write',
    name: 'Write employee tax information',
    description: 'Create or update tax withholding configuration of an employee',
    module: 'nomina',
    resource: 'financial.tax',
    action: 'write',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000053',
    code: 'nomina.financial.history.read',
    name: 'Read employee payment history',
    description: 'View payment history ledger of an employee',
    module: 'nomina',
    resource: 'financial.history',
    action: 'read',
  },
  // OS-582 — Asignación de Turnos (vista semanal colaborador x día)
  // IDs 061-062: prod already had 054-055 occupied by attendance.turnos.read/write
  // (seeded 2026-07-02, before this block existed), which caused P2002 on create.
  {
    id: 'cccccccc-0000-0000-0000-000000000061',
    code: 'attendance.turnos.assignment.read',
    name: 'Read turno assignments',
    description: 'View the weekly shift assignment calendar for employees',
    module: 'attendance',
    resource: 'turnos.assignment',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000062',
    code: 'attendance.turnos.assignment.write',
    name: 'Write turno assignments',
    description: 'Create, reassign, mark rest, and delete shift assignments',
    module: 'attendance',
    resource: 'turnos.assignment',
    action: 'write',
  },
  // OS-582 follow-up — NOM-08 catalog permissions (attendance.turnos.*) were referenced by
  // TurnosController but never seeded, so PermissionsGuard blocked every role, including
  // OWNER/SUPER_ADMIN, in any environment where the seed runs. Fixing the gap here.
  {
    id: 'cccccccc-0000-0000-0000-000000000056',
    code: 'attendance.turnos.read',
    name: 'Read turnos catalog',
    description: 'List, view, and export the shift catalog (Turnos)',
    module: 'attendance',
    resource: 'turnos',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000057',
    code: 'attendance.turnos.write',
    name: 'Write turnos catalog',
    description: 'Create, edit, and toggle status of shifts in the catalog (Turnos)',
    module: 'attendance',
    resource: 'turnos',
    action: 'write',
  },
  // PROV-DOC — documentación de proveedores
  {
    id: 'cccccccc-0000-0000-0000-000000000058',
    code: 'suppliers.documents.read',
    name: 'Read supplier documents',
    description: 'View and download supplier legal and compliance documents',
    module: 'suppliers',
    resource: 'documents',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000059',
    code: 'suppliers.documents.write',
    name: 'Write supplier documents',
    description: 'Upload, replace, and remove supplier legal and compliance documents',
    module: 'suppliers',
    resource: 'documents',
    action: 'write',
  },
  // OS-560 — Employee Social Profile (familiares directos)
  {
    id: 'cccccccc-0000-0000-0000-000000000023',
    code: 'payroll.social_profile.read',
    name: 'Read employee social profiles',
    description: 'List and view family members registered for an employee',
    module: 'payroll',
    resource: 'social_profile',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000024',
    code: 'payroll.social_profile.create',
    name: 'Create employee social profile',
    description: 'Register a new family member for an employee',
    module: 'payroll',
    resource: 'social_profile',
    action: 'create',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000025',
    code: 'payroll.social_profile.update',
    name: 'Update employee social profile',
    description: 'Update a family member record for an employee',
    module: 'payroll',
    resource: 'social_profile',
    action: 'update',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000026',
    code: 'payroll.social_profile.delete',
    name: 'Delete employee social profile',
    description: 'Soft-delete a family member record for an employee',
    module: 'payroll',
    resource: 'social_profile',
    action: 'delete',
  },
  // Nómina — roles, usuarios, nóminas y configuración
  // IDs start at 039 to avoid collision with OS-559 block above (027–031).
  {
    id: 'cccccccc-0000-0000-0000-000000000039',
    code: 'nomina.roles.manage',
    name: 'Gestionar roles',
    description: 'Crear, actualizar y eliminar roles de nómina en el sistema.',
    module: 'nomina',
    resource: 'roles',
    action: 'manage',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000040',
    code: 'nomina.roles.read',
    name: 'Leer roles',
    description: 'Listar todos los roles de nómina en el sistema.',
    module: 'nomina',
    resource: 'roles',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000041',
    code: 'nomina.roles.permissions.assign',
    name: 'Asignar permisos a roles',
    description: 'Asignar o eliminar permisos a un rol de nómina.',
    module: 'nomina',
    resource: 'roles.permissions',
    action: 'assign',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000042',
    code: 'nomina.users.create',
    name: 'Crear usuario nómina',
    description: 'Crear un nuevo usuario en el módulo de nómina.',
    module: 'nomina',
    resource: 'users',
    action: 'create',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000043',
    code: 'nomina.users.read',
    name: 'Leer usuarios nómina',
    description: 'Listar y ver los usuarios del módulo de nómina.',
    module: 'nomina',
    resource: 'users',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000044',
    code: 'nomina.users.update',
    name: 'Actualizar usuario nómina',
    description: 'Actualizar los datos de un usuario de nómina.',
    module: 'nomina',
    resource: 'users',
    action: 'update',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000045',
    code: 'nomina.users.deactivate',
    name: 'Desactivar usuario nómina',
    description: 'Desactivar (dar de baja) un usuario de nómina.',
    module: 'nomina',
    resource: 'users',
    action: 'deactivate',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000046',
    code: 'nomina.payrolls.process',
    name: 'Procesar nómina',
    description: 'Ejecutar el cálculo, procesamiento y generación de archivos de nómina.',
    module: 'nomina',
    resource: 'payrolls',
    action: 'process',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000047',
    code: 'nomina.payrolls.read',
    name: 'Leer nóminas procesadas',
    description: 'Visualizar reportes, resultados y planillas de nómina generadas.',
    module: 'nomina',
    resource: 'payrolls',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000048',
    code: 'nomina.configs.manage',
    name: 'Gestionar configuración',
    description: 'Gestionar configuraciones globales del módulo de nómina.',
    module: 'nomina',
    resource: 'configs',
    action: 'manage',
  },
  // OS-499 / OS-505 — Marcaciones móviles
  {
    id: 'cccccccc-0000-0000-0000-000000000037',
    code: 'attendance.mobile.create',
    name: 'Registrar marcación móvil',
    description: 'Registrar entrada o salida desde la app móvil (solo marcación propia).',
    module: 'attendance',
    resource: 'mobile',
    action: 'create',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000038',
    code: 'attendance.mobile.read',
    name: 'Consultar marcaciones móviles',
    description: 'Consultar marcaciones de todos los empleados por sede o por empleado.',
    module: 'attendance',
    resource: 'mobile',
    action: 'read',
  },
  // CONN-04a — bandeja de aprobación de tiempo extra
  {
    id: 'cccccccc-0000-0000-0000-000000000063',
    code: 'attendance.overtime.read',
    name: 'Consultar tiempo extra',
    description: 'Consultar bandeja y resumen de solicitudes de tiempo extra por aprobación.',
    module: 'attendance',
    resource: 'overtime',
    action: 'read',
  },
  // OS-585 / NOM-06 — Parámetros legales con vigencia (SuperAdmin/Owner only, ver ROLE_PERMISSION_MATRIX)
  {
    id: 'cccccccc-0000-0000-0000-000000000027',
    code: 'configuracion.legal.read',
    name: 'Leer parámetros legales',
    description: 'Consultar parámetros legales vigentes y su histórico de vigencias.',
    module: 'configuracion',
    resource: 'legal',
    action: 'read',
  },
  {
    id: 'cccccccc-0000-0000-0000-000000000028',
    code: 'configuracion.legal.write',
    name: 'Administrar parámetros legales',
    description: 'Crear, actualizar y eliminar vigencias de parámetros legales.',
    module: 'configuracion',
    resource: 'legal',
    action: 'write',
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

const SUPERVISOR_PERMISSION_CODES = [
  ...MANAGER_SUPERVISOR_PERMISSION_CODES,
  'admin.users.read',
  'admin.users.create',
  'admin.users.update',
  'admin.roles.read',
] as const;

const MANAGER_PERMISSION_CODES = [
  ...MANAGER_SUPERVISOR_PERMISSION_CODES,
  'admin.users.read',
] as const;

const OPERATOR_PERMISSION_CODES = ['plant.orders.read', 'supply.items.read'] as const;

const OPERATIONS_ADMIN_PERMISSION_CODES = ['plant.orders.read', 'plant.committees.read'] as const;

// OS-499/OS-505 — marcaciones móviles (crear = self-service desde app; leer = admin/nómina)
const MOBILE_ATTENDANCE_CREATE_CODES = ['attendance.mobile.create'] as const;
const MOBILE_ATTENDANCE_READ_CODES = ['attendance.mobile.read'] as const;
const OVERTIME_READ_CODES = ['attendance.overtime.read'] as const;

// OS-560 — todos los roles de nómina gestionan perfiles sociales
const SOCIAL_PROFILE_PERMISSION_CODES = [
  'payroll.social_profile.read',
  'payroll.social_profile.create',
  'payroll.social_profile.update',
  'payroll.social_profile.delete',
] as const;

// OS-559 — permisos de perfil financiero por nivel de rol
const FINANCIAL_READ_PERMISSION_CODES = [
  'nomina.financial.read',
  'nomina.financial.history.read',
] as const;

const FINANCIAL_TAX_READ_PERMISSION_CODES = ['nomina.financial.tax.read'] as const;

const FINANCIAL_WRITE_PERMISSION_CODES = [
  'nomina.financial.write',
  'nomina.financial.tax.write',
] as const;

// OS-582 — Asignación de Turnos (supervisor/manager leen y escriben, acotado a sus sedes en el service)
const TURNO_ASSIGNMENT_READ_CODES = ['attendance.turnos.assignment.read'] as const;
const TURNO_ASSIGNMENT_WRITE_CODES = ['attendance.turnos.assignment.write'] as const;

// OS-582 follow-up — catálogo de Turnos (NOM-08): SUPERVISOR/MANAGER/NOMINA solo lectura.
const TURNOS_CATALOG_READ_CODES = ['attendance.turnos.read'] as const;
const SUPPLIER_DOCUMENT_READ_CODES = ['suppliers.documents.read'] as const;
const SUPPLIER_DOCUMENT_WRITE_CODES = ['suppliers.documents.write'] as const;

const ALL_PERMISSION_CODES = PERMISSION_SEEDS.map((permissionSeed) => permissionSeed.code);

const ROLE_PERMISSION_MATRIX: Record<string, readonly string[]> = {
  OWNER: ALL_PERMISSION_CODES,
  SUPER_ADMIN: ALL_PERMISSION_CODES,
  SUPERVISOR: [
    ...SUPERVISOR_PERMISSION_CODES,
    ...SOCIAL_PROFILE_PERMISSION_CODES,
    ...FINANCIAL_READ_PERMISSION_CODES,
    ...FINANCIAL_TAX_READ_PERMISSION_CODES,
    ...MOBILE_ATTENDANCE_CREATE_CODES,
    ...MOBILE_ATTENDANCE_READ_CODES,
    ...TURNO_ASSIGNMENT_READ_CODES,
    ...TURNO_ASSIGNMENT_WRITE_CODES,
    ...TURNOS_CATALOG_READ_CODES,
    ...SUPPLIER_DOCUMENT_READ_CODES,
  ],
  MANAGER: [
    ...MANAGER_PERMISSION_CODES,
    ...SOCIAL_PROFILE_PERMISSION_CODES,
    ...FINANCIAL_READ_PERMISSION_CODES,
    ...FINANCIAL_TAX_READ_PERMISSION_CODES,
    ...FINANCIAL_WRITE_PERMISSION_CODES,
    ...MOBILE_ATTENDANCE_CREATE_CODES,
    ...MOBILE_ATTENDANCE_READ_CODES,
    ...TURNO_ASSIGNMENT_READ_CODES,
    ...TURNO_ASSIGNMENT_WRITE_CODES,
    ...TURNOS_CATALOG_READ_CODES,
    ...SUPPLIER_DOCUMENT_READ_CODES,
    ...SUPPLIER_DOCUMENT_WRITE_CODES,
    ...OVERTIME_READ_CODES,
  ],
  OPERATOR: [...OPERATOR_PERMISSION_CODES, ...MOBILE_ATTENDANCE_CREATE_CODES],
  OPERATIONS_ADMIN: OPERATIONS_ADMIN_PERMISSION_CODES,
  NOMINA: [
    ...SOCIAL_PROFILE_PERMISSION_CODES,
    ...FINANCIAL_READ_PERMISSION_CODES,
    ...MOBILE_ATTENDANCE_CREATE_CODES,
    ...MOBILE_ATTENDANCE_READ_CODES,
    ...TURNO_ASSIGNMENT_READ_CODES,
    ...TURNOS_CATALOG_READ_CODES,
    ...SUPPLIER_DOCUMENT_READ_CODES,
    ...OVERTIME_READ_CODES,
  ],
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
      where: { id: permissionSeed.id },
      update: {
        code: permissionSeed.code,
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

const DEFAULT_BUSINESS_HOURS = {
  timezone: 'America/Bogota',
  hoursPerDay: [
    { dayOfWeek: 'monday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'tuesday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'wednesday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'thursday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'friday', openingTime: '06:00', closingTime: '23:00', isOpen: true },
    { dayOfWeek: 'saturday', openingTime: '08:00', closingTime: '23:00', isOpen: true },
    { dayOfWeek: 'sunday', openingTime: '08:00', closingTime: '20:00', isOpen: true },
  ],
};

// PL-01 uses real Bogotá coords so mobile-attendance QA can produce VALID/REJECTED status.
// mobileClientLatitude=4.6097 / mobileClientLongitude=-74.0817 → VALID (on-site)
// mobileClientLatitudeOutside=4.7100 / mobileClientLongitudeOutside=-74.0817 → REJECTED (~11 km away)
const PL01_GEO = { geoLatitude: 4.6097, geoLongitude: -74.0817, checkInRadiusMeters: 100 } as const;

/**
 * OS-550 follow-up — sedes oficiales de Palos de Leña (reemplaza los nombres genéricos
 * "Sede Palos de Leña N"). Los `code` PL-01.. se mantienen estables (usados en otros seeds
 * por code, nunca por name — ver attendance.seed.ts/plant-supervisor.seed.ts/seedSignupUserLocations
 * más abajo, todos hacen `where: { code: 'PL-01' }` etc.), solo cambia el `name` mostrado.
 * Iban 10 sedes demo antes; el listado oficial tiene 14 — las 4 nuevas (PL-11..14) se agregan
 * al final, en el mismo orden (alfabético) en que se entregó el listado oficial.
 */
const OFFICIAL_LOCATION_NAMES = [
  'ADMINISTRATIVO',
  'CAFAM',
  'CALLE 85',
  'CENTRO',
  'FONTIBON',
  'GRAN ESTACION',
  'JIMENEZ',
  'MALL PLAZA',
  'MULTIPLAZA',
  'NUESTRO BOGOTA',
  'PLANTA',
  'PUENTE ARANDA',
  'QUINTA PAREDES',
  'SALITRE PLAZA',
] as const;

async function seedLocations() {
  const locations: Location[] = [];
  for (let i = 1; i <= OFFICIAL_LOCATION_NAMES.length; i++) {
    const name = OFFICIAL_LOCATION_NAMES[i - 1]!;
    const code = `PL-${i.toString().padStart(2, '0')}`;
    const address = `Calle ${i} # 10-20, Bogotá`;
    const city = 'Bogotá';
    const phone = `+57 300 000 00${i.toString().padStart(2, '0')}`;
    // PL-01 has geofence configured; the rest intentionally left without geo to test PENDING status.
    const geoFields = i === 1 ? PL01_GEO : {};
    const location = await prisma.location.upsert({
      where: {
        tenantId_code: { tenantId: OPERATIONAL_TENANT_ID, code },
      },
      update: {
        name,
        address,
        city,
        phone,
        isActive: true,
        businessHours: DEFAULT_BUSINESS_HOURS,
        openingTime: '08:00',
        closingTime: '22:00',
        ...geoFields,
      },
      create: {
        tenantId: OPERATIONAL_TENANT_ID,
        name,
        code,
        address,
        city,
        phone,
        isActive: true,
        businessHours: DEFAULT_BUSINESS_HOURS,
        openingTime: '08:00',
        closingTime: '22:00',
        ...geoFields,
      },
    });
    locations.push(location);
    console.log('Location:', location.name, '—', location.id);
  }
  return locations;
}

async function seedUserLocationAssignments(
  assignments: Array<{ userId: string; locationIds: string[] }>,
) {
  for (const { userId, locationIds } of assignments) {
    for (const locationId of locationIds) {
      await prisma.userLocation.upsert({
        where: {
          userId_locationId: { userId, locationId },
        },
        update: { tenantId: OPERATIONAL_TENANT_ID },
        create: {
          userId,
          locationId,
          tenantId: OPERATIONAL_TENANT_ID,
        },
      });
    }
    console.log(`UserLocation: linked ${userId} -> ${locationIds.join(', ')}`);
  }
}

// ─── OS-563/OS-566: EmployeePosition catalog for Palos de Leña ─
// OS-566 — Fuente de verdad de "cargo oficial activo": el Excel del organigrama
// `Organigrama_Palos_de_Lena_Supervision.xlsx` (hoja "Organigrama Palos de Leña", 32 filas
// Cargo → Cargo supervisor). Cada entrada trae su propio `isActive`, calculado una sola vez
// contra ese Excel: `true` si el título está referenciado por algún alias en
// `ORG_CHART_POSITION_IDS` (employee-org-chart.seed.ts), `false` si no aparece ahí bajo
// ningún alias. Esta lista de 37 títulos escrita originalmente en el texto del ticket
// OS-566 ya NO es la fuente de "oficial" — solo queda como catálogo histórico de
// definiciones (title/area/baseSalaryRange); lo que decide si un cargo es seleccionable es
// exclusivamente su `isActive` aquí. Ningún cargo se borra — solo se desactiva — para no
// perder referencias históricas de EmployeeDetails.positionId.
const EMPLOYEE_POSITIONS_PDL = [
  // Gerencia
  // NOTE: titles must match prod's casing exactly (ALL CAPS) — the upsert `where` matches
  // by `tenantId_title`, and prod's employee_positions rows were normalized to uppercase
  // outside of this seed. A casing mismatch here makes upsert miss the match-by-title and
  // fall into create with an id that's already taken by the uppercase row → P2002 on id.
  {
    id: 'pos-pdl-001',
    title: 'ADMINISTRADOR',
    area: 'Gerencia',
    baseSalaryRange: 5000000,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-002',
    title: 'ADMINISTRADOR JUNIOR',
    area: 'Gerencia',
    baseSalaryRange: 3000000,
    isActive: true, // Excel: "Administrador Jr"
  },
  {
    id: 'pos-pdl-003',
    title: 'DIRECTOR DE OPERACIONES',
    area: 'Gerencia',
    baseSalaryRange: 8000000,
    isActive: true, // Excel: "Director de Operaciones"
  },
  {
    id: 'pos-pdl-004',
    title: 'DIRECTORA COMERCIAL',
    area: 'Gerencia',
    baseSalaryRange: 7000000,
    isActive: true, // Excel: "Director Comercial y Mercadeo"
  },
  {
    id: 'pos-pdl-005',
    title: 'GERENTE ADMINISTRATIVA',
    area: 'Gerencia',
    baseSalaryRange: 6000000,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-006',
    title: 'GERENTE DE PUNTO DE VENTA',
    area: 'Gerencia',
    baseSalaryRange: 4500000,
    isActive: true, // Excel: "Gerente PDV/Administrador"
  },
  {
    id: 'pos-pdl-007',
    title: 'GERENTE GENERAL',
    area: 'Gerencia',
    baseSalaryRange: 15000000,
    isActive: true, // Excel: "Gerente General"
  },
  // Cocina
  {
    id: 'pos-pdl-008',
    title: 'AUXILIAR DE COCINA Y PRODUCCION',
    area: 'Cocina',
    baseSalaryRange: 1423500,
    isActive: false, // no aparece en el Excel del organigrama
  },
  // pos-pdl-009 ('AUXLIAR DE COCINA Y PRODUCCION') fue un typo-duplicado de pos-pdl-008 —
  // no vive en este catálogo, ver POSITION_MERGE_INTO_CANONICAL más abajo.
  {
    id: 'pos-pdl-010',
    title: 'CHEF CORPORATIVO',
    area: 'Cocina',
    baseSalaryRange: 6000000,
    isActive: true, // Excel: "Chef Corporativo"
  },
  {
    id: 'pos-pdl-011',
    title: 'COCINA',
    area: 'Cocina',
    baseSalaryRange: 1800000,
    isActive: true, // Excel: "Cocina"
  },
  {
    id: 'pos-pdl-012',
    title: 'COCINA FIN DE SEMANA',
    area: 'Cocina',
    baseSalaryRange: 1423500,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-013',
    title: 'PARRILLERO',
    area: 'Cocina',
    baseSalaryRange: 2200000,
    isActive: true, // Excel: "Parrilleros"
  },
  {
    id: 'pos-pdl-014',
    title: 'PARRILLERO JUNIOR',
    area: 'Cocina',
    baseSalaryRange: 1600000,
    isActive: true, // Excel: "Parrilla Jr"
  },
  // Servicio
  {
    id: 'pos-pdl-015',
    title: 'ASESOR DE VENTAS',
    area: 'Servicio',
    baseSalaryRange: 1800000,
    isActive: true, // Excel: "Asesores de Venta"
  },
  {
    id: 'pos-pdl-016',
    title: 'ASESORA DE VENTAS FIN DE SEMANA',
    area: 'Servicio',
    baseSalaryRange: 1423500,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-017',
    title: 'BARTENDER',
    area: 'Servicio',
    baseSalaryRange: 1800000,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-018',
    title: 'EJECUTIVO COMERCIAL',
    area: 'Servicio',
    baseSalaryRange: 3000000,
    isActive: true, // Excel: "Ejecutivo Comercial"
  },
  {
    id: 'pos-pdl-019',
    title: 'HOSTESS FIN DE SEMANA',
    area: 'Servicio',
    baseSalaryRange: 1423500,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-020',
    title: 'IMPULSADOR',
    area: 'Servicio',
    baseSalaryRange: 1600000,
    isActive: true, // Excel: "Impulsadores"
  },
  {
    id: 'pos-pdl-021',
    title: 'IMPULSADOR FIN DE SEMANA',
    area: 'Servicio',
    baseSalaryRange: 1423500,
    isActive: false, // no aparece en el Excel del organigrama
  },
  // Planta / Producción
  {
    id: 'pos-pdl-022',
    title: 'LIDER DE PLANTA DE PRODUCCION',
    area: 'Planta',
    baseSalaryRange: 3500000,
    isActive: true, // Excel: "Líder de Producción"
  },
  // Administrativo
  {
    id: 'pos-pdl-023',
    title: 'ANALISTA DE COMPRAS',
    area: 'Administrativo',
    baseSalaryRange: 3000000,
    isActive: true, // Excel: "Analista de Abastecimiento"
  },
  {
    id: 'pos-pdl-024',
    title: 'ANALISTA DE GESTIÓN HUMANA',
    area: 'Administrativo',
    baseSalaryRange: 3000000,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-025',
    title: 'ANALISTA FINANCIERA Y CONTABLE',
    area: 'Administrativo',
    baseSalaryRange: 3500000,
    isActive: true, // Excel: "Analista Financiera y Contable"
  },
  {
    id: 'pos-pdl-026',
    title: 'APRENDIZ SENA',
    area: 'Administrativo',
    baseSalaryRange: 711750,
    isActive: true, // Excel: "Aprendiz SENA"
  },
  {
    id: 'pos-pdl-027',
    title: 'AUDITOR',
    area: 'Administrativo',
    baseSalaryRange: 4000000,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-028',
    title: 'AUXILIAR ADMINISTRATIVO',
    area: 'Administrativo',
    baseSalaryRange: 1800000,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-029',
    title: 'AUXILIAR TALENTO HUMANO',
    area: 'Administrativo',
    baseSalaryRange: 1800000,
    isActive: true, // Excel: "Auxiliar Talento Humano"
  },
  {
    id: 'pos-pdl-030',
    title: 'CONTADOR',
    area: 'Administrativo',
    baseSalaryRange: 4500000,
    isActive: false, // no aparece en el Excel del organigrama
  },
  {
    id: 'pos-pdl-031',
    title: 'JEFE DE COMPRAS',
    area: 'Administrativo',
    baseSalaryRange: 4000000,
    isActive: true, // Excel: "Jefe de Abastecimiento"
  },
  {
    id: 'pos-pdl-032',
    title: 'JEFE DE TALENTO HUMANO',
    area: 'Administrativo',
    baseSalaryRange: 4000000,
    isActive: true, // Excel: "Líder de Talento Humano"
  },
  {
    id: 'pos-pdl-033',
    title: 'PROGRAMADOR',
    area: 'Administrativo',
    baseSalaryRange: 3500000,
    isActive: true, // Excel: "Programador"
  },
  {
    id: 'pos-pdl-034',
    title: 'SERVICIOS GENERALES',
    area: 'Administrativo',
    baseSalaryRange: 1423500,
    isActive: true, // Excel: "Servicios Generales"
  },
  // Logística
  {
    id: 'pos-pdl-035',
    title: 'ALMACENISTA',
    area: 'Logística',
    baseSalaryRange: 1800000,
    isActive: true, // Excel: "Almacenista"
  },
  {
    id: 'pos-pdl-036',
    title: 'AUXILIAR DE CONDUCCION',
    area: 'Logística',
    baseSalaryRange: 1800000,
    isActive: true, // Excel: "Aux. Conductor"
  },
  {
    id: 'pos-pdl-037',
    title: 'AUXILIAR DE CONDUCCION Y MANTENIMIENTO',
    area: 'Logística',
    baseSalaryRange: 2000000,
    isActive: false, // no aparece en el Excel del organigrama (distinto de pos-pdl-036,
    // que sí está aliasado como "Aux. Conductor")
  },
  {
    id: 'pos-pdl-038',
    title: 'CONDUCTOR',
    area: 'Logística',
    baseSalaryRange: 2200000,
    isActive: true, // Excel: "Conductor"
  },
] as const;

// OS-566 — pos-pdl-009 ('AUXLIAR DE COCINA Y PRODUCCION') fue un typo-duplicado exacto de
// pos-pdl-008 (mismo título salvo la I faltante, misma área, mismo salario). A diferencia
// del resto del catálogo (que solo necesita su `isActive` correcto), este caso requiere
// además fusionar cualquier EmployeeDetails que todavía apunte al duplicado hacia el título
// correcto antes de desactivarlo — por eso vive aparte, no en EMPLOYEE_POSITIONS_PDL.
const POSITION_MERGE_INTO_CANONICAL: ReadonlyArray<{
  id: string;
  canonicalId: string;
  reason: string;
}> = [
  {
    id: 'pos-pdl-009',
    canonicalId: 'pos-pdl-008',
    reason: "typo-duplicado de 'AUXILIAR DE COCINA Y PRODUCCION' (AUXLIAR sin la I)",
  },
];

async function seedEmployeePositions(tenantId: string) {
  // Matched by `id` (not `tenantId_title`): `id` is the stable identity we control here —
  // positionId FKs point at it — while `title` is just display text that has drifted out of
  // band between environments (e.g. prod rows got normalized to uppercase directly in the DB).
  // Matching by title made upsert miss the existing row on any drift and crash trying to
  // create a duplicate `id`. Matching by `id` finds the row regardless of title and heals it.
  //
  // `isActive` viene de cada entrada (calculado contra el Excel del organigrama, ver
  // comentario arriba) — no hay un segundo paso que lo pise después.
  for (const pos of EMPLOYEE_POSITIONS_PDL) {
    await prisma.employeePosition.upsert({
      where: { id: pos.id },
      update: {
        title: pos.title,
        area: pos.area,
        baseSalaryRange: pos.baseSalaryRange,
        isActive: pos.isActive,
      },
      create: {
        id: pos.id,
        tenantId,
        title: pos.title,
        area: pos.area,
        baseSalaryRange: pos.baseSalaryRange,
        isActive: pos.isActive,
      },
    });
  }
  const activeCount = EMPLOYEE_POSITIONS_PDL.filter((pos) => pos.isActive).length;
  console.log(
    `EmployeePositions: seeded ${EMPLOYEE_POSITIONS_PDL.length} positions for ${tenantId} ` +
      `(${activeCount} active per Excel del organigrama, ${EMPLOYEE_POSITIONS_PDL.length - activeCount} deprecated)`,
  );

  for (const merge of POSITION_MERGE_INTO_CANONICAL) {
    const existing = await prisma.employeePosition.findUnique({ where: { id: merge.id } });
    if (!existing) continue;

    const canonical = await prisma.employeePosition.findUniqueOrThrow({
      where: { id: merge.canonicalId },
    });

    const { count } = await prisma.employeeDetails.updateMany({
      where: { tenantId, positionId: merge.id },
      data: { positionId: canonical.id, position: canonical.title, area: canonical.area },
    });
    if (count > 0) {
      console.log(
        `EmployeePositions: reassigned ${count} employee(s) from deprecated ${merge.id} to ${merge.canonicalId}`,
      );
    }

    await prisma.employeePosition.update({
      where: { id: merge.id },
      data: { isActive: false },
    });
    console.log(`EmployeePositions: deactivated deprecated position ${merge.id} (${merge.reason})`);
  }

  // Visibilidad: cualquier EmployeeDetails que quede con positionId apuntando a un cargo hoy
  // inactivo conserva su FK intacta (no se reasigna sin alias claro) — solo se reporta.
  const inactiveRefs = await prisma.employeeDetails.groupBy({
    by: ['positionId'],
    where: { tenantId, positionRef: { isActive: false } },
    _count: { _all: true },
  });
  for (const ref of inactiveRefs) {
    console.log(
      `EmployeePositions: ${ref._count._all} employee(s) keep positionId=${ref.positionId} ` +
        `(inactive, history preserved, not reassigned)`,
    );
  }
}

async function seedEmployeeDetails(
  ownerUserId: string,
  operatorUserId: string,
  locationId: string,
) {
  // Seed for owner
  // NOM-03: pinHash = bcrypt('1234') — PIN de kiosko de asistencia (distinto de OperationalUser.pinHash)
  const ownerPinHashEmployee = await bcrypt.hash('1234', SALT_ROUNDS);
  const ownerEmployee = await prisma.employeeDetails.upsert({
    where: { userId: ownerUserId },
    update: {
      isActive: true,
      pinHash: ownerPinHashEmployee,
      name: 'Propietario Principal',
      costCenter: CostCenter.GERENCIA,
      laborClassification: LaborClassification.ADMINISTRATIVO,
      barrio: 'El Poblado',
      localidad: 'Medellín',
    },
    create: {
      userId: ownerUserId,
      tenantId: OPERATIONAL_TENANT_ID,
      name: 'Propietario Principal',
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
      barrio: 'El Poblado',
      localidad: 'Medellín',
      costCenter: CostCenter.GERENCIA,
      laborClassification: LaborClassification.ADMINISTRATIVO,
      nonSalaryAmount: 500000.0,
      pinHash: ownerPinHashEmployee,
      isActive: true,
    },
  });
  await syncEmployeeCompensationHistory(prisma, ownerEmployee);

  // Seed for operator
  // NOM-03: pinHash = bcrypt('4321') — mismo PIN que OperationalUser del seed, para e2e de kiosko
  const operatorPinHashEmployee = await bcrypt.hash('4321', SALT_ROUNDS);
  const operatorEmployee = await prisma.employeeDetails.upsert({
    where: { userId: operatorUserId },
    update: {
      isActive: true,
      pinHash: operatorPinHashEmployee,
      name: 'Operario de Planta',
      positionId: 'pos-pdl-002',
      position: 'ADMINISTRADOR JUNIOR',
      costCenter: CostCenter.PLANTA,
      laborClassification: LaborClassification.COCINA,
      barrio: 'Laureles',
      localidad: 'Medellín',
    },
    create: {
      userId: operatorUserId,
      tenantId: OPERATIONAL_TENANT_ID,
      name: 'Operario de Planta',
      locationId: locationId,
      positionId: 'pos-pdl-002',
      position: 'ADMINISTRADOR JUNIOR',
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
      barrio: 'Laureles',
      localidad: 'Medellín',
      costCenter: CostCenter.PLANTA,
      laborClassification: LaborClassification.COCINA,
      pinHash: operatorPinHashEmployee,
      isActive: true,
    },
  });
  await syncEmployeeCompensationHistory(prisma, operatorEmployee);

  console.log('EmployeeDetails: Seeded for owner and operator');
}

/** OS-589 — saldos de vacaciones de prueba (idempotente). */
async function seedVacationDemoBalances(ownerUserId: string, operatorUserId: string) {
  const employees = await prisma.employeeDetails.findMany({
    where: { userId: { in: [ownerUserId, operatorUserId] } },
    select: { id: true, tenantId: true, userId: true },
  });

  const ownerEmployee = employees.find((employee) => employee.userId === ownerUserId);
  const operatorEmployee = employees.find((employee) => employee.userId === operatorUserId);

  if (ownerEmployee) {
    await prisma.vacationBalance.upsert({
      where: { employeeId: ownerEmployee.id },
      update: {},
      create: {
        id: 'seed-vacation-balance-owner-001',
        tenantId: ownerEmployee.tenantId,
        employeeId: ownerEmployee.id,
        accruedDays: 15.0,
        takenDays: 0,
        compensatedDays: 0,
        lastAccrualDate: new Date('2026-07-01'),
      },
    });
    console.log('VacationBalance: seeded for owner employee');
  } else {
    console.warn('VacationBalance: owner employee not found — skipping');
  }

  if (operatorEmployee) {
    await prisma.vacationBalance.upsert({
      where: { employeeId: operatorEmployee.id },
      update: {},
      create: {
        id: 'seed-vacation-balance-operator-001',
        tenantId: operatorEmployee.tenantId,
        employeeId: operatorEmployee.id,
        accruedDays: 15.0,
        takenDays: 0,
        compensatedDays: 0,
        lastAccrualDate: new Date('2026-07-01'),
      },
    });
    console.log(
      'VacationBalance: seeded for operator employee (use mes-operator for L1 approval flow)',
      operatorEmployee.id,
    );
  } else {
    console.warn('VacationBalance: operator employee not found — skipping');
  }
}

/**
 * Bug fix OS-550 — EmployeeDetails para los usuarios demo SUPERVISOR/MANAGER, con `positionId`
 * real (cargos del organigrama con subordinados configurados en EmployeePositionSupervisor)
 * para que el filtro Supervisor del listado de colaboradores tenga datos con los que probar
 * tanto el scoping por sede (UserLocation, ver seedUserLocationAssignments) como el de cargo.
 */
async function seedSupervisorManagerDemoUsers(
  supervisorUserId: string,
  managerUserId: string,
  supervisorLocationId: string,
  managerLocationId: string,
) {
  const supervisorPosition = await prisma.employeePosition.findUniqueOrThrow({
    where: { id: 'pos-pdl-006' }, // GERENTE DE PUNTO DE VENTA — supervisa ADMINISTRADOR JUNIOR
  });
  const managerPosition = await prisma.employeePosition.findUniqueOrThrow({
    where: { id: 'pos-pdl-031' }, // JEFE DE COMPRAS — supervisa ANALISTA DE COMPRAS/FINANCIERA
  });

  const supervisorEmployee = await prisma.employeeDetails.upsert({
    where: { userId: supervisorUserId },
    update: {
      isActive: true,
      name: 'Sofía Ramírez',
      positionId: supervisorPosition.id,
      position: supervisorPosition.title,
      area: supervisorPosition.area,
    },
    create: {
      userId: supervisorUserId,
      tenantId: OPERATIONAL_TENANT_ID,
      name: 'Sofía Ramírez',
      locationId: supervisorLocationId,
      positionId: supervisorPosition.id,
      position: supervisorPosition.title,
      area: supervisorPosition.area,
      department: supervisorPosition.area,
      contractType: EmployeeContractType.INDEFINIDO,
      hireDate: new Date('2024-03-01'),
      contractStart: new Date('2024-03-01'),
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: supervisorPosition.baseSalaryRange,
      epsName: 'Sura',
      pensionFundName: 'Protección',
      cesantiasFundName: 'Protección',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_I,
      cajaCompensacion: 'Comfama',
      costCenter: CostCenter.OPERACIONES,
      laborClassification: LaborClassification.ADMINISTRATIVO,
      isActive: true,
    },
  });
  await syncEmployeeCompensationHistory(prisma, supervisorEmployee);

  const managerEmployee = await prisma.employeeDetails.upsert({
    where: { userId: managerUserId },
    update: {
      isActive: true,
      name: 'Diego Torres',
      positionId: managerPosition.id,
      position: managerPosition.title,
      area: managerPosition.area,
    },
    create: {
      userId: managerUserId,
      tenantId: OPERATIONAL_TENANT_ID,
      name: 'Diego Torres',
      locationId: managerLocationId,
      positionId: managerPosition.id,
      position: managerPosition.title,
      area: managerPosition.area,
      department: managerPosition.area,
      contractType: EmployeeContractType.INDEFINIDO,
      hireDate: new Date('2024-03-01'),
      contractStart: new Date('2024-03-01'),
      salaryType: SalaryType.ORDINARIO,
      salaryAmount: managerPosition.baseSalaryRange,
      epsName: 'Sanitas',
      pensionFundName: 'Porvenir',
      cesantiasFundName: 'Porvenir',
      arlName: 'Sura',
      arlRiskLevel: ArlRiskLevel.RIESGO_I,
      cajaCompensacion: 'Compensar',
      costCenter: CostCenter.ADMINISTRATIVO,
      laborClassification: LaborClassification.ADMINISTRATIVO,
      isActive: true,
    },
  });
  await syncEmployeeCompensationHistory(prisma, managerEmployee);

  console.log('EmployeeDetails: Seeded for supervisor and manager demo users');
}

async function seedEmployeeSocialProfiles(ownerUserId: string, operatorUserId: string) {
  const ownerEmployee = await prisma.employeeDetails.findUnique({
    where: { userId: ownerUserId },
    select: { id: true, tenantId: true },
  });

  const operatorEmployee = await prisma.employeeDetails.findUnique({
    where: { userId: operatorUserId },
    select: { id: true, tenantId: true },
  });

  if (!ownerEmployee || !operatorEmployee) {
    console.warn('⚠️  Employee details not found — skipping social profile seed');
    return;
  }

  const ownerProfiles = [
    {
      fullName: 'María Gómez',
      relationshipType: EmployeeRelationshipType.SPOUSE,
      birthDate: new Date('1985-03-22'),
      isDependent: false,
    },
    {
      fullName: 'Carlos Ramírez',
      relationshipType: EmployeeRelationshipType.CHILD,
      birthDate: new Date('2010-07-15'),
      isDependent: true,
    },
    {
      fullName: 'Alberto Ramírez',
      relationshipType: EmployeeRelationshipType.FATHER,
      birthDate: new Date('1955-11-08'),
      isDependent: false,
    },
    {
      fullName: 'Laura Sánchez',
      relationshipType: EmployeeRelationshipType.OTHER,
      birthDate: new Date('1990-01-30'),
      isDependent: false,
    },
  ];

  for (const profile of ownerProfiles) {
    await prisma.employeeSocialProfile.upsert({
      where: {
        employeeDetailsId_fullName_relationshipType_birthDate: {
          employeeDetailsId: ownerEmployee.id,
          fullName: profile.fullName,
          relationshipType: profile.relationshipType,
          birthDate: profile.birthDate,
        },
      },
      update: {},
      create: {
        tenantId: ownerEmployee.tenantId,
        employeeDetailsId: ownerEmployee.id,
        ...profile,
      },
    });
  }

  // Operario: cónyuge dependiente + hijo dependiente
  const operatorProfiles = [
    {
      fullName: 'Sofía Torres',
      relationshipType: EmployeeRelationshipType.SPOUSE,
      birthDate: new Date('1992-05-10'),
      isDependent: true,
    },
    {
      fullName: 'Mateo Herrera',
      relationshipType: EmployeeRelationshipType.CHILD,
      birthDate: new Date('2018-09-03'),
      isDependent: true,
    },
  ];

  for (const profile of operatorProfiles) {
    await prisma.employeeSocialProfile.upsert({
      where: {
        employeeDetailsId_fullName_relationshipType_birthDate: {
          employeeDetailsId: operatorEmployee.id,
          fullName: profile.fullName,
          relationshipType: profile.relationshipType,
          birthDate: profile.birthDate,
        },
      },
      update: {},
      create: {
        tenantId: operatorEmployee.tenantId,
        employeeDetailsId: operatorEmployee.id,
        ...profile,
      },
    });
  }

  console.log('EmployeeSocialProfiles: Seeded for owner (4) and operator (2)');
}

/**
 * Asigna sedes PL-01, PL-02, PL-03 al usuario de signup creado vía API por QA.
 * El usuario NO se crea aquí — si no existe en la DB, se omite con un aviso.
 * Idempotente: upsert por userId_locationId.
 */
async function seedSignupUserLocations(
  client: typeof prisma,
  locations: Location[],
): Promise<void> {
  const SIGNUP_EMAIL = 'signup-1781213262141@palos-de-lena.dev';

  const signupUser = await client.user.findFirst({
    where: { email: SIGNUP_EMAIL, tenantId: OPERATIONAL_TENANT_ID },
    select: { id: true, email: true, isActive: true },
  });

  if (!signupUser) {
    console.warn(`⚠️  seedSignupUserLocations: usuario "${SIGNUP_EMAIL}" no encontrado en la DB.`);
    console.warn(
      '    Crea el usuario vía signup o registro antes de correr este seed, luego vuelve a correr pnpm db:seed.',
    );
    return;
  }

  const targetCodes = ['PL-01', 'PL-02', 'PL-03'];
  const targetLocations = locations.filter(
    (loc) => loc.code !== null && targetCodes.includes(loc.code),
  );

  if (targetLocations.length === 0) {
    console.warn('⚠️  seedSignupUserLocations: ninguna de PL-01/02/03 encontrada — skipping');
    return;
  }

  for (const loc of targetLocations) {
    await client.userLocation.upsert({
      where: { userId_locationId: { userId: signupUser.id, locationId: loc.id } },
      update: { tenantId: OPERATIONAL_TENANT_ID },
      create: { userId: signupUser.id, locationId: loc.id, tenantId: OPERATIONAL_TENANT_ID },
    });
  }

  console.log(`✅ seedSignupUserLocations: ${signupUser.email} → ${targetCodes.join(', ')}`);
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
      prefijo: 'ABA',
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
      locationId: firstLocationId,
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
      locationId: firstLocationId,
      aplicaVencimiento: false,
      aplicaLote: false,
      isActive: true,
    },
  });
  console.log('SupplyItem:', supplyItem.codigoInterno, '—', supplyItem.id);

  const categoryGranos = await prisma.supplyCategory.upsert({
    where: { id: SEED_CATEGORY_GRANOS_ID },
    update: { tenantId: OPERATIONAL_TENANT_ID, nombre: 'Fruver', prefijo: 'FRU' },
    create: {
      id: SEED_CATEGORY_GRANOS_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      nombre: 'Fruver',
      descripcion: 'Frutas y verduras',
      prefijo: 'FRU',
    },
  });
  console.log('SupplyCategory:', categoryGranos.nombre, '—', categoryGranos.id);

  const canonicalCategories = [
    { id: SEED_CATEGORY_CARNICOS_ID, nombre: 'Cocina', prefijo: 'COC' },
    { id: SEED_CATEGORY_LACTEOS_ID, nombre: 'Parrilla', prefijo: 'PAR' },
    { id: SEED_CATEGORY_BEBIDAS_ID, nombre: 'Bebidas', prefijo: 'BEB' },
    { id: SEED_CATEGORY_ASEO_ID, nombre: 'Aseo', prefijo: 'ASE' },
    { id: SEED_CATEGORY_EMPAQUE_ID, nombre: 'Desechables', prefijo: 'DES' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000009', nombre: 'Bar', prefijo: 'BAR' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000010', nombre: 'Otros', prefijo: 'OTR' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000011', nombre: 'Producción', prefijo: 'PRO' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000012', nombre: 'Cumpleaños', prefijo: 'CUM' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000013', nombre: 'Desechable Domicilio', prefijo: 'DDM' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000014', nombre: 'Desechable Operación', prefijo: 'DOP' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000015', nombre: 'Licores', prefijo: 'LIC' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000016', nombre: 'Entrada Cocina', prefijo: 'ECO' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000017', nombre: 'Entrada Parrilla', prefijo: 'EPA' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000018', nombre: 'Plato Fuerte Cocina', prefijo: 'PFC' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000019', nombre: 'Plato Fuerte Parrilla', prefijo: 'PFP' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000020', nombre: 'Postres', prefijo: 'POS' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000021', nombre: 'Cafés', prefijo: 'CAF' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000022', nombre: 'Adición Cocina', prefijo: 'ADC' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000023', nombre: 'Adición Parrilla', prefijo: 'ADP' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000024', nombre: 'Decoraciones Venta', prefijo: 'DCV' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000025', nombre: 'Dotación', prefijo: 'DOT' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000026', nombre: 'Menaje', prefijo: 'MEN' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000027', nombre: 'Activos menores', prefijo: 'AME' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000028', nombre: 'Activos fijos', prefijo: 'AFI' },
    { id: 'bbbbbbbb-0000-0000-0000-000000000029', nombre: 'Comodatos', prefijo: 'COM' },
  ] as const;
  for (const cat of canonicalCategories) {
    const byNombre = await prisma.supplyCategory.findUnique({
      where: {
        tenantId_nombre: { tenantId: OPERATIONAL_TENANT_ID, nombre: cat.nombre },
      },
    });

    let row;
    if (byNombre) {
      row = await prisma.supplyCategory.update({
        where: { id: byNombre.id },
        data: { prefijo: cat.prefijo, isActive: true },
      });
    } else {
      const byId = await prisma.supplyCategory.findUnique({ where: { id: cat.id } });
      if (byId) {
        row = await prisma.supplyCategory.update({
          where: { id: cat.id },
          data: {
            nombre: cat.nombre,
            prefijo: cat.prefijo,
            isActive: true,
          },
        });
      } else {
        row = await prisma.supplyCategory.create({
          data: {
            id: cat.id,
            tenantId: OPERATIONAL_TENANT_ID,
            nombre: cat.nombre,
            prefijo: cat.prefijo,
          },
        });
      }
    }

    console.log('SupplyCategory:', row.nombre, '—', row.id);
  }

  // ── Dotación supply items (for the "Registrar entrega de dotación" modal) ─
  const dotacionItems = [
    {
      id: SEED_SUPPLY_ITEM_CAMISA_ID,
      codigoInterno: 'SEED-DOT-CAMISA-M',
      nombre: 'Camisa de Trabajo (seed)',
      subcategoria: 'Camisas/Camisetas',
      genero: 'Masculino',
      talla: 'M',
    },
    {
      id: SEED_SUPPLY_ITEM_PANTALON_ID,
      codigoInterno: 'SEED-DOT-PANTALON-32',
      nombre: 'Pantalón Operario (seed)',
      subcategoria: 'Pantalones/Overoles',
      genero: 'Masculino',
      talla: '32',
    },
    {
      id: SEED_SUPPLY_ITEM_BOTAS_ID,
      codigoInterno: 'SEED-DOT-BOTAS-40',
      nombre: 'Botas de Seguridad (seed)',
      subcategoria: 'Calzado',
      genero: 'Unisex',
      talla: '40',
    },
  ] as const;

  for (const item of dotacionItems) {
    const supplyItemDotacion = await prisma.supplyItem.upsert({
      where: { id: item.id },
      update: {
        tenantId: OPERATIONAL_TENANT_ID,
        categoriaId: SEED_CATEGORY_DOTACION_ID,
        nombre: item.nombre,
        subcategoria: item.subcategoria,
        genero: item.genero,
        talla: item.talla,
        stockActualBodega: 20,
        locationId: firstLocationId,
        isActive: true,
      },
      create: {
        id: item.id,
        tenantId: OPERATIONAL_TENANT_ID,
        nombre: item.nombre,
        codigoInterno: item.codigoInterno,
        categoriaId: SEED_CATEGORY_DOTACION_ID,
        unidadBase: StockUnit.UNIT,
        factorConversion: 1,
        costoPromedioPonderado: 0,
        stockMinimoBodega: 5,
        stockMaximoBodega: 100,
        stockActualBodega: 20,
        locationId: firstLocationId,
        subcategoria: item.subcategoria,
        genero: item.genero,
        talla: item.talla,
        aplicaVencimiento: false,
        aplicaLote: false,
        isActive: true,
      },
    });
    console.log('SupplyItem:', supplyItemDotacion.codigoInterno, '—', supplyItemDotacion.id);
  }

  const supplyItemArroz = await prisma.supplyItem.upsert({
    where: { id: SEED_SUPPLY_ITEM_ARROZ_ID },
    update: {
      tenantId: OPERATIONAL_TENANT_ID,
      categoriaId: SEED_CATEGORY_GRANOS_ID,
      nombre: 'Arroz Premium (seed)',
      stockMinimoBodega: 20,
      stockActualBodega: 50,
      locationId: locations[1]?.id ?? firstLocationId,
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
      locationId: locations[1]?.id ?? firstLocationId,
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
    where: { id: MES_OWNER_ID },
    update: {
      userId: ownerGlobalUser.id,
      cedulaHash: ownerCedulaHash,
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
    where: { id: MES_OPERATOR_ID },
    update: {
      userId: operatorGlobalUser.id,
      cedulaHash: operatorCedulaHash,
      pinHash: operatorPinHash,
      role: OperationalRole.OPERATOR,
      sedeId: firstLocationId,
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
      sedeId: firstLocationId,
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

  const operator2PinHash = await bcrypt.hash('4321', SALT_ROUNDS);
  const operator2CedulaHash = hashCedula('11223344');

  const operator2GlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '11223344' },
    },
    update: {
      email: 'carlos.mendoza@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.OPERATOR.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_MES_OPERATOR2_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '11223344',
      documentType: DocumentType.CC,
      email: 'carlos.mendoza@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.OPERATOR.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(
    'Global User (MES operator 2):',
    operator2GlobalUser.email,
    '—',
    operator2GlobalUser.id,
  );

  const operator2 = await prisma.operationalUser.upsert({
    where: { id: MES_OPERATOR2_ID },
    update: {
      userId: operator2GlobalUser.id,
      cedulaHash: operator2CedulaHash,
      pinHash: operator2PinHash,
      role: OperationalRole.OPERATOR,
      sedeId: firstLocationId,
      isActive: true,
      loginAttempts: 0,
      lockedUntil: null,
    },
    create: {
      id: MES_OPERATOR2_ID,
      userId: operator2GlobalUser.id,
      tenantId: OPERATIONAL_TENANT_ID,
      cedulaHash: operator2CedulaHash,
      pinHash: operator2PinHash,
      role: OperationalRole.OPERATOR,
      sedeId: firstLocationId,
      isActive: true,
    },
  });
  console.log(
    'MES operational user:',
    operator2.role,
    '—',
    operator2.id,
    `(userId ${operator2.userId})`,
  );

  const operationsAdminGlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '55556666' },
    },
    update: {
      email: 'operations.admin@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.OPERATIONS_ADMIN.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_MES_OPERATIONS_ADMIN_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '55556666',
      documentType: DocumentType.CC,
      email: 'operations.admin@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.OPERATIONS_ADMIN.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(
    'Global User (MES operations admin):',
    operationsAdminGlobalUser.email,
    '—',
    operationsAdminGlobalUser.id,
  );

  const nominaGlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '99887766' },
    },
    update: {
      email: 'nomina@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.NOMINA.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_NOMINA_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '99887766',
      documentType: DocumentType.CC,
      email: 'nomina@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.NOMINA.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('Global User (NOMINA):', nominaGlobalUser.email, '—', nominaGlobalUser.id);

  const superAdminGlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '00000001' },
    },
    update: {
      email: 'superadmin@opssynk.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.SUPER_ADMIN.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_SUPER_ADMIN_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '00000001',
      documentType: DocumentType.CC,
      email: 'superadmin@opssynk.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.SUPER_ADMIN.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(
    'Global User (SUPER_ADMIN):',
    superAdminGlobalUser.email,
    '—',
    superAdminGlobalUser.id,
  );

  // Bug fix OS-550 — usuarios demo con rol SUPERVISOR/MANAGER para que el filtro Supervisor
  // del listado de colaboradores tenga opciones reales (antes: 0 usuarios con estos roles).
  const supervisorGlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '22334455' },
    },
    update: {
      email: 'mes-supervisor@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.SUPERVISOR.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_MES_SUPERVISOR_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '22334455',
      documentType: DocumentType.CC,
      email: 'mes-supervisor@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.SUPERVISOR.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(
    'Global User (SUPERVISOR):',
    supervisorGlobalUser.email,
    '—',
    supervisorGlobalUser.id,
  );

  const managerGlobalUser = await prisma.user.upsert({
    where: {
      tenantId_cedula: { tenantId: OPERATIONAL_TENANT_ID, cedula: '66778899' },
    },
    update: {
      email: 'mes-manager@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      documentType: DocumentType.CC,
      roleId: roles.MANAGER.id,
      isActive: true,
      emailVerified: true,
    },
    create: {
      id: GLOBAL_MES_MANAGER_USER_ID,
      tenantId: OPERATIONAL_TENANT_ID,
      cedula: '66778899',
      documentType: DocumentType.CC,
      email: 'mes-manager@palos-de-lena.dev',
      passwordHash: mesUserPasswordHash,
      roleId: roles.MANAGER.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log('Global User (MANAGER):', managerGlobalUser.email, '—', managerGlobalUser.id);

  console.log('\n✅ Email auth (global User — x-tenant-id: palos-de-lena):');
  console.log('  mes-owner          = mes-owner@palos-de-lena.dev / TestPass123!');
  console.log('  mes-operator       = mes-operator@palos-de-lena.dev / TestPass123!');
  console.log(
    '  operations-admin   = operations.admin@palos-de-lena.dev / TestPass123!  ← committee modal',
  );
  console.log(
    '  nomina             = nomina@palos-de-lena.dev / TestPass123!  ← payroll read-only',
  );
  console.log(
    '  superadmin         = superadmin@opssynk.dev / TestPass123!  ← admin de roles/permisos',
  );
  console.log(
    '  mes-supervisor     = mes-supervisor@palos-de-lena.dev / TestPass123!  ← filtro Supervisor',
  );
  console.log(
    '  mes-manager        = mes-manager@palos-de-lena.dev / TestPass123!  ← filtro Supervisor',
  );
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
  console.log('\n✅ Mobile Attendance QA (NOM-05):');
  console.log('  PL-01 geofence: lat=4.6097 lng=-74.0817 radius=100m');
  console.log('  VALID  → use mobileClientLatitude=4.6097 / mobileClientLongitude=-74.0817');
  console.log(
    '  REJECTED → use mobileClientLatitudeOutside=4.7100 / mobileClientLongitudeOutside=-74.0817',
  );
  console.log('  PENDING  → use any location other than PL-01 (no geofence configured)');

  // ── USR-01 Task 09: link any orphan OperationalUser rows when cédula mapping exists ──
  try {
    const { backfillOperationalUserLinks } =
      await import('../../../scripts/backfill-operational-user-links');
    const backfillResult = await backfillOperationalUserLinks(prisma);
    console.log('\n✅ OperationalUser → User backfill:', backfillResult);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Cannot find module')) {
      console.warn(
        '\n⚠️  Skipping OperationalUser backfill (helper script/dependencies unavailable in runtime image).',
      );
    } else {
      throw error;
    }
  }

  // ── NOM-01: Seed EmployeeDetails ─────────────────────────────────────────
  const { seedEmployeeCatalogOptions } = await import('./seeds/employee-catalog.seed');
  await seedEmployeeCatalogOptions(prisma, OPERATIONAL_TENANT_ID);
  await seedEmployeePositions(OPERATIONAL_TENANT_ID);
  const { seedEmployeeOrgChart } = await import('./seeds/employee-org-chart.seed');
  await seedEmployeeOrgChart(prisma);
  await seedEmployeeDetails(ownerGlobalUser.id, operatorGlobalUser.id, firstLocationId);
  await seedVacationDemoBalances(ownerGlobalUser.id, operatorGlobalUser.id);
  await seedSupervisorManagerDemoUsers(
    supervisorGlobalUser.id,
    managerGlobalUser.id,
    locations[0]!.id,
    locations[2]!.id,
  );
  await seedEmployeeSocialProfiles(ownerGlobalUser.id, operatorGlobalUser.id);
  const { seedBulkAttendanceCollaborators } =
    await import('./seeds/attendance-collaborators-bulk.seed');
  await seedBulkAttendanceCollaborators(prisma);
  const { seedEmployeeFinancialProfiles } = await import('./seeds/employee-financial-profile.seed');
  await seedEmployeeFinancialProfiles(prisma, ownerGlobalUser.id, operatorGlobalUser.id);
  await seedUserLocationAssignments([
    {
      userId: ownerGlobalUser.id,
      locationIds: locations.map((location) => location.id),
    },
    {
      userId: operatorGlobalUser.id,
      locationIds: locations.slice(0, 3).map((location) => location.id),
    },
    { userId: operator2GlobalUser.id, locationIds: [firstLocationId] },
    {
      userId: operationsAdminGlobalUser.id,
      locationIds: locations.map((location) => location.id),
    },
    { userId: nominaGlobalUser.id, locationIds: [firstLocationId] },
    // Bug fix OS-550 — sedes con solapamiento parcial (PL-02) entre supervisor y manager,
    // para probar la intersección de scope al filtrar colaboradores por supervisorUserId.
    {
      userId: supervisorGlobalUser.id,
      locationIds: [locations[0]!.id, locations[1]!.id], // PL-01, PL-02
    },
    {
      userId: managerGlobalUser.id,
      locationIds: [locations[1]!.id, locations[2]!.id], // PL-02, PL-03
    },
  ]);
  const { seedPlantSupervisor } = await import('./seeds/plant-supervisor.seed');
  await seedPlantSupervisor(prisma);

  const { seedAttendance, seedHistoricalAttendance, seedMonitorOvertime } =
    await import('./seeds/attendance.seed');
  await seedAttendance(prisma);
  await seedHistoricalAttendance(prisma);
  await seedMonitorOvertime(prisma);

  const { seedOvertimeDemo } = await import('./seeds/overtime-demo.seed');
  await seedOvertimeDemo(prisma);

  await seedSignupUserLocations(prisma, locations);

  const { seedLaborLegalParameters } = await import('./seeds/labor-legal-parameters.seed');
  await seedLaborLegalParameters(prisma);

  const { seedNovedadTypeConfigs } = await import('./seeds/novedad-type-config.seed');
  await seedNovedadTypeConfigs(prisma, OPERATIONAL_TENANT_ID);

  const { seedDataProcessingPolicy } = await import('./seeds/data-processing-policy.seed');
  await seedDataProcessingPolicy(prisma, OPERATIONAL_TENANT_ID);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

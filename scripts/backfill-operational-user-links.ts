/**
 * USR-01 Task 09 — Idempotent backfill of OperationalUser.userId → global User.
 *
 * Links operational profiles to centralized User rows when plain cédula is known
 * (dev seed fixtures or an optional JSON mapping file). Rows with only cedulaHash
 * and no mapping are skipped — plain cédula cannot be recovered from the hash.
 *
 * Usage:
 *   cd apps/api && npx tsx ../../scripts/backfill-operational-users.ts
 *   cd apps/api && npx tsx ../../scripts/backfill-operational-users.ts --mapping ./ops-cedula-map.json
 *   cd apps/api && npx tsx ../../scripts/backfill-operational-users.ts --dry-run
 *
 * Mapping file format (JSON array):
 *   [{ "tenantId": "...", "cedulaHash": "...", "cedula": "12345678", "email": "optional@tenant.dev" }]
 */

import { DocumentType, OperationalRole, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const SALT_ROUNDS = 12;

/** Dev/staging fixtures with known plain cédulas (Task 07 seed). */
export const DEV_KNOWN_OPERATORS = [
  {
    tenantId: 'palos-de-lena',
    cedula: '12345678',
    email: 'mes-owner@palos-de-lena.dev',
    operationalRole: OperationalRole.OWNER,
    seedOperationalUserId: 'dddddddd-0000-0000-0000-000000000004',
  },
  {
    tenantId: 'palos-de-lena',
    cedula: '87654321',
    email: 'mes-operator@palos-de-lena.dev',
    operationalRole: OperationalRole.OPERATOR,
    seedOperationalUserId: 'eeeeeeee-0000-0000-0000-000000000005',
  },
] as const;

export interface CedulaMappingEntry {
  tenantId: string;
  cedulaHash: string;
  cedula: string;
  email?: string;
}

export interface BackfillOperationalUserLinksOptions {
  mappingEntries?: CedulaMappingEntry[];
  dryRun?: boolean;
}

export interface BackfillOperationalUserLinksResult {
  linked: number;
  createdUsers: number;
  skippedNoMapping: number;
  skippedConflict: number;
  orphanCountAtStart: number;
  remainingOrphans: number;
  totalLinked: number;
}

/** Matches MesAuthService / seed cédula hashing (HMAC-SHA256 or SHA-256 fallback). */
export function hashCedula(cedula: string): string {
  const hmacSecret = process.env.CEDULA_HMAC_SECRET;
  if (hmacSecret) {
    return crypto.createHmac('sha256', hmacSecret).update(cedula).digest('hex');
  }
  return crypto.createHash('sha256').update(cedula).digest('hex');
}

export function buildDevCedulaHashLookup(): Map<string, CedulaMappingEntry> {
  const lookup = new Map<string, CedulaMappingEntry>();

  for (const entry of DEV_KNOWN_OPERATORS) {
    const cedulaHash = hashCedula(entry.cedula);
    lookup.set(`${entry.tenantId}:${cedulaHash}`, {
      tenantId: entry.tenantId,
      cedulaHash,
      cedula: entry.cedula,
      email: entry.email,
    });
  }

  return lookup;
}

export function loadMappingFile(filePath: string): CedulaMappingEntry[] {
  const absolute = path.resolve(filePath);
  const raw = fs.readFileSync(absolute, 'utf8');
  const parsed = JSON.parse(raw) as CedulaMappingEntry[];

  if (!Array.isArray(parsed)) {
    throw new Error(`Mapping file must be a JSON array: ${absolute}`);
  }

  return parsed;
}

function mergeLookups(
  devLookup: Map<string, CedulaMappingEntry>,
  fileEntries: CedulaMappingEntry[],
): Map<string, CedulaMappingEntry> {
  const merged = new Map(devLookup);

  for (const entry of fileEntries) {
    merged.set(`${entry.tenantId}:${entry.cedulaHash}`, entry);
  }

  return merged;
}

function defaultBackfillEmail(tenantId: string, cedula: string): string {
  return `mes-backfill-${cedula}@${tenantId}.internal`;
}

export async function backfillOperationalUserLinks(
  prisma: PrismaClient,
  options: BackfillOperationalUserLinksOptions = {},
): Promise<BackfillOperationalUserLinksResult> {
  const lookup = mergeLookups(buildDevCedulaHashLookup(), options.mappingEntries ?? []);
  const dryRun = options.dryRun ?? false;

  const result: BackfillOperationalUserLinksResult = {
    linked: 0,
    createdUsers: 0,
    skippedNoMapping: 0,
    skippedConflict: 0,
    orphanCountAtStart: 0,
    remainingOrphans: 0,
    totalLinked: 0,
  };

  const orphans = await prisma.operationalUser.findMany({
    where: { userId: null },
    orderBy: { createdAt: 'asc' },
  });

  result.orphanCountAtStart = orphans.length;

  for (const operationalUser of orphans) {
    const mapping = lookup.get(`${operationalUser.tenantId}:${operationalUser.cedulaHash}`);

    if (!mapping) {
      result.skippedNoMapping += 1;
      console.warn(
        `[backfill] skip operationalUser=${operationalUser.id} — no cédula mapping for hash prefix ${operationalUser.cedulaHash.slice(0, 12)}…`,
      );
      continue;
    }

    const role = await prisma.role.findUnique({
      where: {
        tenantId_code: {
          tenantId: operationalUser.tenantId,
          code: operationalUser.role,
        },
      },
      select: { id: true, isActive: true },
    });

    if (!role?.isActive) {
      result.skippedConflict += 1;
      console.warn(
        `[backfill] skip operationalUser=${operationalUser.id} — role ${operationalUser.role} missing/inactive for tenant ${operationalUser.tenantId}`,
      );
      continue;
    }

    const email = mapping.email ?? defaultBackfillEmail(operationalUser.tenantId, mapping.cedula);

    let globalUser = await prisma.user.findUnique({
      where: {
        tenantId_cedula: {
          tenantId: operationalUser.tenantId,
          cedula: mapping.cedula,
        },
      },
      select: { id: true, operationalProfile: { select: { id: true } } },
    });

    if (!globalUser) {
      const placeholderPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(placeholderPassword, SALT_ROUNDS);

      if (dryRun) {
        console.log(
          `[backfill] dry-run would create User tenant=${operationalUser.tenantId} cedula=${mapping.cedula} email=${email}`,
        );
        result.createdUsers += 1;
        result.linked += 1;
        continue;
      }

      globalUser = await prisma.user.create({
        data: {
          tenantId: operationalUser.tenantId,
          cedula: mapping.cedula,
          documentType: DocumentType.CC,
          email,
          passwordHash,
          roleId: role.id,
          isActive: operationalUser.isActive,
          emailVerified: false,
        },
        select: { id: true, operationalProfile: { select: { id: true } } },
      });
      result.createdUsers += 1;
    } else if (
      globalUser.operationalProfile &&
      globalUser.operationalProfile.id !== operationalUser.id
    ) {
      result.skippedConflict += 1;
      console.warn(
        `[backfill] skip operationalUser=${operationalUser.id} — User ${globalUser.id} already linked to operationalUser=${globalUser.operationalProfile.id}`,
      );
      continue;
    }

    const userTakenByOther = await prisma.operationalUser.findFirst({
      where: {
        userId: globalUser.id,
        id: { not: operationalUser.id },
      },
      select: { id: true },
    });

    if (userTakenByOther) {
      result.skippedConflict += 1;
      console.warn(
        `[backfill] skip operationalUser=${operationalUser.id} — userId ${globalUser.id} already used by operationalUser=${userTakenByOther.id}`,
      );
      continue;
    }

    if (dryRun) {
      console.log(
        `[backfill] dry-run would link operationalUser=${operationalUser.id} → userId=${globalUser.id}`,
      );
      result.linked += 1;
      continue;
    }

    await prisma.operationalUser.update({
      where: { id: operationalUser.id },
      data: { userId: globalUser.id },
    });

    result.linked += 1;
    console.log(
      `[backfill] linked operationalUser=${operationalUser.id} (${operationalUser.role}) → userId=${globalUser.id}`,
    );
  }

  result.remainingOrphans = await prisma.operationalUser.count({
    where: { userId: null },
  });
  result.totalLinked = await prisma.operationalUser.count({
    where: { userId: { not: null } },
  });

  console.log('\n[backfill] summary:', result);

  return result;
}

export type BackfillOperationalUserLinksFn = typeof backfillOperationalUserLinks;

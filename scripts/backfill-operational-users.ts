#!/usr/bin/env tsx
/**
 * CLI entrypoint for USR-01 Task 09 operational user → global User backfill.
 *
 * Run from apps/api:
 *   cd apps/api && npx tsx ../../scripts/backfill-operational-users.ts
 */

import { PrismaClient } from '@prisma/client';
import { backfillOperationalUserLinks, loadMappingFile } from './backfill-operational-user-links';

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const mappingFlagIndex = args.findIndex((arg) => arg === '--mapping');
  const mappingPath = mappingFlagIndex >= 0 ? args[mappingFlagIndex + 1] : undefined;

  if (mappingFlagIndex >= 0 && !mappingPath) {
    throw new Error('Usage: --mapping <path-to-json>');
  }

  const mappingEntries = mappingPath ? loadMappingFile(mappingPath) : undefined;
  const prisma = new PrismaClient();

  try {
    console.log('OperationalUser → User backfill starting…');
    if (dryRun) console.log('DRY RUN — no writes will be performed');

    const result = await backfillOperationalUserLinks(prisma, {
      mappingEntries,
      dryRun,
    });

    if (result.remainingOrphans > 0) {
      console.warn(
        `\n⚠️  ${result.remainingOrphans} operational user(s) still have null userId (no cédula mapping).`,
      );
    } else {
      console.log('\n✅ All operational users are linked to global User rows.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * NestJS Module Structure Validator
 * -----------------------------------
 * Validates that the NestJS API src/ directory follows the required
 * per-module folder layout:
 *   interfaces/ · repository/ · service/ · controller/ · test/
 *
 * Run: node scripts/validate-structure.js
 * Exit 0 = valid, Exit 1 = violations found
 */

const fs = require('fs');
const path = require('path');

const API_SRC = path.join(__dirname, '../apps/api/src');
const VIOLATIONS = [];

// ── Helpers ──────────────────────────────────────────────────────────────────

function log(msg) {
  process.stdout.write(msg + '\n');
}
function error(msg) {
  VIOLATIONS.push(msg);
  process.stderr.write(`  ✗ ${msg}\n`);
}
function ok(msg) {
  log(`  ✓ ${msg}`);
}

function getDirs(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isDirectory());
}

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

/** mes-auth → MesAuth, supplyitems → Supplyitems */
function toPascalCase(featureName) {
  return featureName
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// ── Rule: *.module.ts must exist at the module root ───────────────────────

function validateModuleFile(featureDir, featureName) {
  const moduleFile = path.join(featureDir, `${featureName}.module.ts`);
  if (!fs.existsSync(moduleFile)) {
    error(`[${featureName}] Missing ${featureName}.module.ts in module root`);
  } else {
    ok(`${featureName}.module.ts exists`);
  }
}

// ── Rule: interfaces/ must exist with I{Feature}Repository + I{Feature}Service

function validateInterfacesLayer(featureDir, featureName) {
  const dir = path.join(featureDir, 'interfaces');
  if (!fs.existsSync(dir)) {
    error(`[${featureName}] Missing interfaces/ directory`);
    return;
  }

  const file = path.join(dir, `${featureName}.interfaces.ts`);
  if (!fs.existsSync(file)) {
    error(`[${featureName}] Missing interfaces/${featureName}.interfaces.ts`);
    return;
  }

  const content = readFile(file);
  const cap = toPascalCase(featureName);

  if (!content.includes(`I${cap}Repository`)) {
    error(`[${featureName}] interfaces/${featureName}.interfaces.ts is missing I${cap}Repository`);
  } else {
    ok(`I${cap}Repository defined`);
  }

  if (!content.includes(`I${cap}Service`)) {
    error(`[${featureName}] interfaces/${featureName}.interfaces.ts is missing I${cap}Service`);
  } else {
    ok(`I${cap}Service defined`);
  }

  // Interfaces file must not contain runtime code (classes or decorators)
  if (/^(export\s+)?(abstract\s+)?class\s+/m.test(content)) {
    error(`[${featureName}] interfaces/${featureName}.interfaces.ts must not contain classes`);
  }
}

// ── Rule: repository/ must exist and implement I{Feature}Repository ────────

function validateRepositoryLayer(featureDir, featureName) {
  const dir = path.join(featureDir, 'repository');
  if (!fs.existsSync(dir)) {
    error(`[${featureName}] Missing repository/ directory`);
    return;
  }

  const file = path.join(dir, `${featureName}.repository.ts`);
  if (!fs.existsSync(file)) {
    error(`[${featureName}] Missing repository/${featureName}.repository.ts`);
    return;
  }

  const content = readFile(file);
  const cap = toPascalCase(featureName);

  if (!content.includes(`implements I${cap}Repository`)) {
    error(`[${featureName}] ${featureName}.repository.ts does not implement I${cap}Repository`);
  } else {
    ok(`${featureName}.repository.ts implements I${cap}Repository`);
  }

  // Repository must not throw HTTP exceptions
  if (/NotFoundException|ConflictException|BadRequestException/.test(content)) {
    error(`[${featureName}] repository must not throw HTTP exceptions — move logic to service`);
  }
}

// ── Rule: service/ must exist and implement I{Feature}Service ─────────────

function validateServiceLayer(featureDir, featureName) {
  const dir = path.join(featureDir, 'service');
  if (!fs.existsSync(dir)) {
    error(`[${featureName}] Missing service/ directory`);
    return;
  }

  const file = path.join(dir, `${featureName}.service.ts`);
  if (!fs.existsSync(file)) {
    error(`[${featureName}] Missing service/${featureName}.service.ts`);
    return;
  }

  const content = readFile(file);
  const cap = toPascalCase(featureName);

  if (!content.includes(`implements I${cap}Service`)) {
    error(`[${featureName}] ${featureName}.service.ts does not implement I${cap}Service`);
  } else {
    ok(`${featureName}.service.ts implements I${cap}Service`);
  }

  // Service must not inject PrismaService directly
  if (/PrismaService/.test(content)) {
    error(
      `[${featureName}] service must not inject PrismaService directly — use the Repository instead`,
    );
  }
}

function hasResolver(featureDir, featureName) {
  return fs.existsSync(path.join(featureDir, 'resolver', `${featureName}.resolver.ts`));
}

function isGraphqlOnlyModule(featureDir, featureName) {
  return (
    hasResolver(featureDir, featureName) && !fs.existsSync(path.join(featureDir, 'controller'))
  );
}

// ── Rule: resolver/ for GraphQL-only modules (no REST controller) ─────────

function validateResolverLayer(featureDir, featureName) {
  const dir = path.join(featureDir, 'resolver');
  if (!fs.existsSync(dir)) {
    error(`[${featureName}] Missing resolver/ directory`);
    return;
  }

  const file = path.join(dir, `${featureName}.resolver.ts`);
  if (!fs.existsSync(file)) {
    error(`[${featureName}] Missing resolver/${featureName}.resolver.ts`);
    return;
  }
  ok(`${featureName}.resolver.ts exists`);

  const content = readFile(file);
  if (/from ['"].*repository/.test(content)) {
    error(`[${featureName}] resolver must not import from repository — use the Service instead`);
  }
}

// ── Rule: controller/ must exist with controller file and dto/ ────────────

function validateControllerLayer(featureDir, featureName) {
  const dir = path.join(featureDir, 'controller');
  if (!fs.existsSync(dir)) {
    error(`[${featureName}] Missing controller/ directory`);
    return;
  }

  const file = path.join(dir, `${featureName}.controller.ts`);
  if (!fs.existsSync(file)) {
    error(`[${featureName}] Missing controller/${featureName}.controller.ts`);
    return;
  }
  ok(`${featureName}.controller.ts exists`);

  const dtoDir = path.join(dir, 'dto');
  if (!fs.existsSync(dtoDir)) {
    error(`[${featureName}] Missing controller/dto/ directory`);
  } else {
    ok(`controller/dto/ exists`);
  }

  // Controller must not import from repository
  const content = readFile(file);
  if (/from ['"].*repository/.test(content)) {
    error(`[${featureName}] controller must not import from repository — use the Service instead`);
  }
}

// ── Rule: test/ — service spec; controller and/or resolver specs when present ─

function validateTestLayer(featureDir, featureName, { graphqlOnly = false } = {}) {
  const dir = path.join(featureDir, 'test');
  if (!fs.existsSync(dir)) {
    error(`[${featureName}] Missing test/ directory`);
    return;
  }

  const serviceSpec = path.join(dir, `${featureName}.service.spec.ts`);
  const controllerSpec = path.join(dir, `${featureName}.controller.spec.ts`);
  const resolverSpec = path.join(dir, `${featureName}.resolver.spec.ts`);

  if (!fs.existsSync(serviceSpec)) {
    error(`[${featureName}] Missing test/${featureName}.service.spec.ts`);
  } else {
    ok(`test/${featureName}.service.spec.ts exists`);
  }

  if (graphqlOnly) {
    if (!fs.existsSync(resolverSpec)) {
      error(`[${featureName}] Missing test/${featureName}.resolver.spec.ts`);
    } else {
      ok(`test/${featureName}.resolver.spec.ts exists`);
    }
    return;
  }

  if (fs.existsSync(path.join(featureDir, 'controller'))) {
    if (!fs.existsSync(controllerSpec)) {
      error(`[${featureName}] Missing test/${featureName}.controller.spec.ts`);
    } else {
      ok(`test/${featureName}.controller.spec.ts exists`);
    }
  }

  if (hasResolver(featureDir, featureName)) {
    if (!fs.existsSync(resolverSpec)) {
      error(`[${featureName}] Missing test/${featureName}.resolver.spec.ts`);
    } else {
      ok(`test/${featureName}.resolver.spec.ts exists`);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function validate() {
  log('\n🔍 Validating NestJS module structure...\n');

  if (!fs.existsSync(API_SRC)) {
    log(`⚠  API src not found at ${API_SRC} — skipping validation`);
    process.exit(0);
  }

  // Directories that are infrastructure/aggregator modules — skip direct validation.
  const SKIP_ROOT = new Set([
    'shared',
    'common',
    '__mocks__',
    'filters',
    'interceptors',
    'pipes',
    'guards',
    'decorators',
    'prisma',
    'email',
    'utils', // shared helpers — not a Nest feature module
  ]);

  // Wiring-only modules (no domain layers)
  const INFRASTRUCTURE = new Set(['graphql', 'pubsub']);

  // Parent aggregator modules whose children should be validated individually
  const AGGREGATORS = new Set(['mes']);

  // Collect { dir, name } pairs for every feature module to validate
  const features = [];

  for (const entry of getDirs(API_SRC)) {
    if (SKIP_ROOT.has(entry)) continue;

    const entryPath = path.join(API_SRC, entry);

    if (AGGREGATORS.has(entry)) {
      for (const child of getDirs(entryPath)) {
        const childDir = path.join(entryPath, child);
        const name = entry === 'mes' && child === 'auth' ? 'mes-auth' : child;
        features.push({ dir: childDir, name });
      }
    } else {
      features.push({ dir: entryPath, name: entry });
    }
  }

  if (features.length === 0) {
    log('ℹ  No feature modules found yet — nothing to validate.\n');
    process.exit(0);
  }

  for (const { dir: featureDir, name: feature } of features) {
    log(`\n📦 Module: ${feature}`);

    validateModuleFile(featureDir, feature);

    if (INFRASTRUCTURE.has(feature)) {
      ok('infrastructure module — domain layers not required');
      continue;
    }

    validateInterfacesLayer(featureDir, feature);
    validateRepositoryLayer(featureDir, feature);
    validateServiceLayer(featureDir, feature);

    const graphqlOnly = isGraphqlOnlyModule(featureDir, feature);
    if (graphqlOnly) {
      validateResolverLayer(featureDir, feature);
      validateTestLayer(featureDir, feature, { graphqlOnly: true });
    } else {
      validateControllerLayer(featureDir, feature);
      validateTestLayer(featureDir, feature);
    }
  }

  log('\n' + '─'.repeat(60));

  if (VIOLATIONS.length > 0) {
    log(`\n❌ ${VIOLATIONS.length} violation(s) found. Fix them before merging.\n`);
    log('See docs/MODULE-STRUCTURE.md for the architecture guide.\n');
    process.exit(1);
  } else {
    log(`\n✅ All ${features.length} module(s) pass structure validation.\n`);
    process.exit(0);
  }
}

validate();

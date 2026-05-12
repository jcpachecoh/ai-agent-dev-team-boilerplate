#!/usr/bin/env node
/**
 * Facade Pattern Structure Validator
 * -----------------------------------
 * Validates that the NestJS API src/ directory follows the required
 * per-module folder layout and that no forbidden cross-layer imports exist.
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

function getFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext));
}

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

// ── Rule: Every module folder must have a *.module.ts ─────────────────────

function validateModuleFile(featureDir, featureName) {
  const moduleFile = path.join(featureDir, `${featureName}.module.ts`);
  if (!fs.existsSync(moduleFile)) {
    error(`[${featureName}] Missing ${featureName}.module.ts in module root`);
  } else {
    ok(`${featureName}.module.ts exists`);
  }
}

// ── Rule: api/ folder must exist with controller + dto/ ───────────────────

function validateApiLayer(featureDir, featureName) {
  const apiDir = path.join(featureDir, 'api');

  if (!fs.existsSync(apiDir)) {
    error(`[${featureName}] Missing api/ directory`);
    return;
  }

  const controller = path.join(apiDir, `${featureName}.controller.ts`);
  const controllerSpec = path.join(apiDir, `${featureName}.controller.spec.ts`);
  const dtoDir = path.join(apiDir, 'dto');

  if (!fs.existsSync(controller)) {
    error(`[${featureName}] Missing api/${featureName}.controller.ts`);
  } else {
    ok(`${featureName}: api/${featureName}.controller.ts`);
  }

  if (!fs.existsSync(controllerSpec)) {
    error(`[${featureName}] Missing api/${featureName}.controller.spec.ts — unit tests required`);
  } else {
    ok(`${featureName}: api/${featureName}.controller.spec.ts`);
  }

  if (!fs.existsSync(dtoDir)) {
    error(`[${featureName}] Missing api/dto/ directory`);
  }
}

// ── Rule: application/ folder must exist with service ─────────────────────

function validateApplicationLayer(featureDir, featureName) {
  const appDir = path.join(featureDir, 'application');

  if (!fs.existsSync(appDir)) {
    error(`[${featureName}] Missing application/ directory`);
    return;
  }

  const service = path.join(appDir, `${featureName}.service.ts`);
  const serviceSpec = path.join(appDir, `${featureName}.service.spec.ts`);

  if (!fs.existsSync(service)) {
    error(`[${featureName}] Missing application/${featureName}.service.ts`);
  } else {
    ok(`${featureName}: application/${featureName}.service.ts`);
  }

  if (!fs.existsSync(serviceSpec)) {
    error(
      `[${featureName}] Missing application/${featureName}.service.spec.ts — unit tests required`,
    );
  } else {
    ok(`${featureName}: application/${featureName}.service.spec.ts`);
  }
}

// ── Rule: Controller must not import from repository or entity ─────────────

function validateFacadeImports(featureDir, featureName) {
  const controllerPath = path.join(featureDir, 'api', `${featureName}.controller.ts`);
  const content = readFile(controllerPath);

  if (!content) return;

  const forbiddenPatterns = [
    { pattern: /from ['"].*\/infrastructure\/.*repository/, label: 'repository' },
    { pattern: /from ['"].*\/entities\/.*entity/, label: 'entity' },
  ];

  for (const { pattern, label } of forbiddenPatterns) {
    if (pattern.test(content)) {
      error(
        `[${featureName}] FACADE VIOLATION: ${featureName}.controller.ts imports from ${label} layer directly. ` +
          `Controllers must only call the Service (Facade).`,
      );
    }
  }
}

// ── Rule: Service must not import from controller ─────────────────────────

function validateServiceImports(featureDir, featureName) {
  const servicePath = path.join(featureDir, 'application', `${featureName}.service.ts`);
  const content = readFile(servicePath);

  if (!content) return;

  if (/from ['"].*\/api\/.*controller/.test(content)) {
    error(
      `[${featureName}] Service imports from Controller layer — this is a circular dependency violation.`,
    );
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

function validate() {
  log('\n🔍 Validating NestJS Facade Pattern structure...\n');

  if (!fs.existsSync(API_SRC)) {
    log(`⚠  API src not found at ${API_SRC} — skipping validation`);
    process.exit(0);
  }

  // Directories that are infrastructure/aggregator modules — skip direct validation.
  // Their children (e.g. src/testlab/projects) are scanned separately below.
  const SKIP_ROOT = new Set([
    'shared',
    '__mocks__',
    'filters',
    'interceptors',
    'pipes',
    'guards',
    'decorators',
    'prisma', // infrastructure-only, no controller/service facade needed
  ]);

  // Parent aggregator modules whose children should be validated individually
  const AGGREGATORS = new Set(['testlab']);

  // Collect { dir, name } pairs for every feature module to validate
  const features = [];

  for (const entry of getDirs(API_SRC)) {
    if (SKIP_ROOT.has(entry)) continue;

    const entryPath = path.join(API_SRC, entry);

    if (AGGREGATORS.has(entry)) {
      // Recurse one level into the aggregator
      for (const child of getDirs(entryPath)) {
        features.push({ dir: path.join(entryPath, child), name: child });
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
    validateApiLayer(featureDir, feature);
    validateApplicationLayer(featureDir, feature);
    validateFacadeImports(featureDir, feature);
    validateServiceImports(featureDir, feature);
  }

  log('\n' + '─'.repeat(60));

  if (VIOLATIONS.length > 0) {
    log(`\n❌ ${VIOLATIONS.length} violation(s) found. Fix them before merging.\n`);
    log('See docs/FACADE-PATTERN.md for the architecture guide.\n');
    process.exit(1);
  } else {
    log(`\n✅ All ${features.length} module(s) pass Facade Pattern validation.\n`);
    process.exit(0);
  }
}

validate();

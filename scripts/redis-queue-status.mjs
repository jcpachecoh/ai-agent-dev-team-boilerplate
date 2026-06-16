/**
 * scripts/redis-queue-status.mjs
 *
 * Diagnostics + cleanup for the BullMQ email queue.
 *
 * Usage:
 *   node scripts/redis-queue-status.mjs           # show status
 *   node scripts/redis-queue-status.mjs --flush   # delete all stale jobs
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const Redis = require(
  path.resolve(__dirname, '../node_modules/.pnpm/ioredis@5.10.1/node_modules/ioredis/built/index.js')
);

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const flush = process.argv.includes('--flush');

const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true });

try {
  await redis.connect();
  console.log(`\n✅ Redis connected → ${REDIS_URL}\n`);

  // ── Queue keys ──────────────────────────────────────────────────────────────
  const allKeys = await redis.keys('bull:email-queue:*');

  const waiting  = allKeys.filter(k => k.endsWith(':wait'));
  const active   = allKeys.filter(k => k.endsWith(':active'));
  const delayed  = allKeys.filter(k => k.endsWith(':delayed'));
  const failed   = allKeys.filter(k => k.endsWith(':failed'));
  const complete = allKeys.filter(k => k.endsWith(':completed'));
  const others   = allKeys.filter(k =>
    !waiting.includes(k) && !active.includes(k) &&
    !delayed.includes(k) && !failed.includes(k) && !complete.includes(k)
  );

  console.log('📊 email-queue status');
  console.log('─────────────────────────────');
  console.log(`  waiting   : ${waiting.length  > 0 ? (await redis.llen(waiting[0])) : 0} jobs`);
  console.log(`  active    : ${active.length   > 0 ? (await redis.llen(active[0]))  : 0} jobs`);
  console.log(`  delayed   : ${delayed.length  > 0 ? (await redis.zcard(delayed[0])): 0} jobs`);
  console.log(`  failed    : ${failed.length   > 0 ? (await redis.zcard(failed[0])) : 0} jobs`);
  console.log(`  completed : ${complete.length > 0 ? (await redis.zcard(complete[0])): 0} jobs`);
  console.log(`  total keys: ${allKeys.length}`);

  if (flush) {
    if (allKeys.length === 0) {
      console.log('\n⚠️  Nothing to flush — queue is already empty.');
    } else {
      await redis.del(...allKeys);
      console.log(`\n🗑️  Flushed ${allKeys.length} BullMQ keys for email-queue.`);

      // Also clear the job-id counter so next job starts from 1 cleanly
      await redis.del('bull:email-queue:id');
      console.log('🗑️  Reset job ID counter.');
    }
  } else if (allKeys.length > 0) {
    console.log('\n💡 Run with --flush to delete all stale jobs:');
    console.log('   node scripts/redis-queue-status.mjs --flush');
  }

  console.log();
} catch (err) {
  console.error('❌ Redis error:', err.message);
  process.exit(1);
} finally {
  await redis.quit();
}

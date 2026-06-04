/**
 * Email Worker entrypoint — standalone process that consumes the BullMQ
 * email-queue and sends emails via Resend.
 *
 * Usage:
 *   pnpm --filter=@restopsiq/email start:worker
 *
 * Required env vars (read from process.env or apps/api/.env):
 *   REDIS_URL       — e.g. redis://localhost:6379
 *   RESEND_API_KEY  — Resend API key
 *   EMAIL_FROM      — From address, e.g. no-reply@example.com
 */

import path from 'path';
import fs from 'fs';

// Resolve .env regardless of where the worker is invoked from.
// Try candidates in order:
//   1. monorepo root / apps/api/.env  (when run via pnpm --filter from root)
//   2. __dirname/../../../apps/api/.env  (dist/worker.entrypoint.js → packages/email/dist → up 3 = monorepo root)
//   3. __dirname/../../../../apps/api/.env  (in case tsup flattens differently)
const envCandidates = [
  path.resolve(process.cwd(), 'apps/api/.env'),
  path.resolve(__dirname, '../../../apps/api/.env'),
  path.resolve(__dirname, '../../../../apps/api/.env'),
];

const envPath = envCandidates.find((p) => fs.existsSync(p));

if (envPath) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^"|"$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
  console.log(`[EmailWorker] Loaded env from ${envPath}`);
} else {
  console.warn('[EmailWorker] No .env file found — relying on process.env');
}

import { EmailWorker } from './email.worker';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const resendApiKey = process.env.RESEND_API_KEY ?? '';
const fromAddress = process.env.EMAIL_FROM ?? '';

if (!resendApiKey) {
  console.error('[EmailWorker] ERROR: RESEND_API_KEY is not set. Emails will fail.');
  process.exit(1);
}
if (!fromAddress) {
  console.error('[EmailWorker] ERROR: EMAIL_FROM is not set. Emails will fail.');
  process.exit(1);
}

console.log(`[EmailWorker] Starting...`);
console.log(`[EmailWorker]   Redis     : ${redisUrl}`);
console.log(`[EmailWorker]   From      : ${fromAddress}`);
console.log(`[EmailWorker]   Queue     : email-queue`);

const worker = new EmailWorker({ redisUrl, resendApiKey, fromAddress });

console.log('[EmailWorker] Ready — listening for jobs on email-queue');

async function shutdown(signal: string) {
  console.log(`[EmailWorker] ${signal} received — shutting down gracefully...`);
  await worker.close();
  console.log('[EmailWorker] Closed.');
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

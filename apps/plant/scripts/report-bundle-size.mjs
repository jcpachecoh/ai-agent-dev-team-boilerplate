import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = new URL('../dist/assets/', import.meta.url).pathname;

async function collectJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await collectJsFiles(p)));
    else if (extname(e.name) === '.js') files.push(p);
  }
  return files;
}

async function main() {
  const files = await collectJsFiles(DIST);
  let totalGzip = 0;
  const rows = [];

  for (const file of files) {
    const buf = await readFile(file);
    const gz = gzipSync(buf).length;
    totalGzip += gz;
    const { size } = await stat(file);
    rows.push({ file: file.split('/dist/')[1] ?? file, raw: size, gzip: gz });
  }

  rows.sort((a, b) => b.gzip - a.gzip);
  console.log('Plant KDS bundle report (gzip):');
  for (const r of rows) {
    console.log(`  ${r.file}: ${(r.gzip / 1024).toFixed(1)} KB gzip (${(r.raw / 1024).toFixed(1)} KB raw)`);
  }
  console.log(`  TOTAL gzip: ${(totalGzip / 1024).toFixed(1)} KB`);
  const targetKb = 120;
  if (totalGzip / 1024 > targetKb * 2) {
    console.warn(`  WARN: total exceeds rough 2x target (~${targetKb} KB operator path)`);
  }
}

main().catch((err) => {
  console.error('Run pnpm build first.', err.message);
  process.exit(1);
});

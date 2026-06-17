import { Controller, ForbiddenException, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { promisify } from 'util';
import { Public } from '../common/decorators/public.decorator';

const execAsync = promisify(exec);

/** Walk up from __dirname until prisma/schema.prisma is found — works in both ts-node (src/) and compiled (dist/) contexts. */
function findApiRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(dir, 'prisma', 'schema.prisma'))) return dir;
    dir = resolve(dir, '..');
  }
  throw new Error(`Could not locate prisma/schema.prisma from ${__dirname}`);
}

/**
 * Dev-only endpoint — not registered in production (NODE_ENV=production).
 * Use POST /api/dev/seed to repopulate the database with demo fixtures.
 */
@ApiTags('dev')
@Public()
@Controller('dev')
export class DevController {
  @ApiOperation({ summary: 'Run database seed (non-production only)' })
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async runSeed() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seed endpoint is disabled in production');
    }

    const apiRoot = findApiRoot();

    const { stdout, stderr } = await execAsync('npx prisma@5 db seed', {
      cwd: apiRoot,
      timeout: 120_000,
      env: { ...process.env },
    });

    return {
      success: true,
      output: stdout,
      warnings: stderr || undefined,
    };
  }
}

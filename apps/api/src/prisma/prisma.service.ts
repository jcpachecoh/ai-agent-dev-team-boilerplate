import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

if (!process.env.DATABASE_URL) {
  const candidateEnvFiles = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(__dirname, '../../.env'),
  ];

  for (const envPath of candidateEnvFiles) {
    if (!existsSync(envPath)) {
      continue;
    }

    loadDotenv({ path: envPath, override: false });
    if (process.env.DATABASE_URL) {
      break;
    }
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

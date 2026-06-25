import { DynamicModule, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageController } from './controller/storage.controller';
import type { StorageModuleOptions } from './interfaces/storage.interfaces';
import { STORAGE_PROVIDER } from './interfaces/storage.interfaces';
import { StorageService } from './storage.service';

@Module({})
export class StorageModule {
  static forRoot(options: StorageModuleOptions): DynamicModule {
    return {
      module: StorageModule,
      global: true,
      imports: [PrismaModule],
      controllers: [StorageController],
      providers: [
        {
          provide: STORAGE_PROVIDER,
          useClass: options.provider,
        },
        StorageService,
      ],
      exports: [StorageService],
    };
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageObjectStatus } from '../enums/storage.enums';
import type {
  CreateStorageObjectData,
  IStorageRepository,
  StorageRecord,
  UpdateStorageObjectData,
} from '../interfaces/storage.interfaces';

@Injectable()
export class StorageRepository implements IStorageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStorageObjectData): Promise<StorageRecord> {
    return this.prisma.storageObject.create({ data }) as Promise<StorageRecord>;
  }

  async findActive(id: string, tenantId: string): Promise<StorageRecord | null> {
    return this.prisma.storageObject.findFirst({
      where: { id, tenantId, status: StorageObjectStatus.ACTIVE, deletedAt: null },
    }) as Promise<StorageRecord | null>;
  }

  async update(id: string, data: UpdateStorageObjectData): Promise<StorageRecord> {
    const { metadata, ...rest } = data;
    return this.prisma.storageObject.update({
      where: { id },
      data: {
        ...rest,
        ...(metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue }),
      },
    }) as Promise<StorageRecord>;
  }
}

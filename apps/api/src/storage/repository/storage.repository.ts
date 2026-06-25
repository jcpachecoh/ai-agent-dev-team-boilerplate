import { Injectable } from '@nestjs/common';
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
    return this.prisma.storageObject.update({
      where: { id },
      data,
    }) as Promise<StorageRecord>;
  }
}

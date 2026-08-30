import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { StorageService } from '../../storage/service/storage.service';
import { EmployeeAssetsRepository } from '../repository/employee-assets.repository';
import type {
  CreateEmployeeAssetData,
  EmployeeAssetRecord,
  IEmployeeAssetsService,
  ListEmployeeAssetsOptions,
  UpdateEmployeeAssetData,
} from '../interfaces/employee-assets.interfaces';

const PRESIGNED_TTL_SECONDS = 900;

@Injectable()
export class EmployeeAssetsService implements IEmployeeAssetsService {
  constructor(
    private readonly repo: EmployeeAssetsRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(tenantId: string, data: CreateEmployeeAssetData): Promise<EmployeeAssetRecord> {
    const existing = await this.repo.findActiveByEmployeeAndName(
      tenantId,
      data.employeeId,
      data.assetName,
    );
    if (existing) {
      throw new ConflictException(
        `El empleado ya tiene un activo "${data.assetName}" en estado ACTIVO`,
      );
    }
    if (data.storageObjectId) {
      await this.validateStorageObject(data.storageObjectId, tenantId, data.employeeId);
    }
    return this.repo.create(tenantId, data);
  }

  async findById(tenantId: string, id: string): Promise<EmployeeAssetRecord> {
    const asset = await this.repo.findById(tenantId, id);
    if (!asset) {
      throw new NotFoundException(`Activo "${id}" no encontrado`);
    }
    return asset;
  }

  findByEmployee(
    tenantId: string,
    employeeId: string,
    options?: ListEmployeeAssetsOptions,
  ): Promise<EmployeeAssetRecord[]> {
    return this.repo.findByEmployee(tenantId, employeeId, options);
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateEmployeeAssetData,
  ): Promise<EmployeeAssetRecord> {
    const asset = await this.findById(tenantId, id);
    if (data.storageObjectId) {
      await this.validateStorageObject(data.storageObjectId, tenantId, asset.employeeId);
    }
    return this.repo.update(tenantId, id, data);
  }

  getActiveAssetsForPayroll(tenantId: string, employeeId: string): Promise<EmployeeAssetRecord[]> {
    return this.repo.findByEmployee(tenantId, employeeId, { status: 'ACTIVO' });
  }

  async getDownloadUrl(tenantId: string, id: string): Promise<string> {
    const asset = await this.findById(tenantId, id);
    if (!asset.storageObjectId) {
      throw new NotFoundException(`El activo "${id}" no tiene archivo adjunto`);
    }
    return this.storageService.getPresignedUrl(
      asset.storageObjectId,
      tenantId,
      PRESIGNED_TTL_SECONDS,
    );
  }

  private async validateStorageObject(
    storageObjectId: string,
    tenantId: string,
    employeeId: string,
  ): Promise<void> {
    const obj = await this.storageService.findById(storageObjectId, tenantId);
    if (obj.domain !== 'PAYROLL') {
      throw new BadRequestException(
        'El objeto de almacenamiento debe pertenecer al dominio PAYROLL',
      );
    }
    if (obj.entityType !== 'Employee' || obj.entityId !== employeeId) {
      throw new BadRequestException(
        'El objeto de almacenamiento no está vinculado al empleado correcto',
      );
    }
  }
}

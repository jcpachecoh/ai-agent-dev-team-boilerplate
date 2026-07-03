import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidTime } from '../../locations/types/business-hours.types';
import { ImageProfile, StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import { StorageService } from '../../storage/service/storage.service';
import { TenantRepository } from '../repository/tenant.repository';
import type {
  ITenantService,
  Tenant,
  TenantLogoUpload,
  UpdateTenantData,
} from '../interfaces/tenant.interfaces';

@Injectable()
export class TenantService implements ITenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly storageService: StorageService,
  ) {}

  assertTenantAccess(jwtTenantId: string, requestedTenantId: string): void {
    if (jwtTenantId !== requestedTenantId) {
      throw new ForbiddenException('Acceso denegado');
    }
  }

  async findById(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    return tenant;
  }

  findAll(): Promise<Tenant[]> {
    return this.tenantRepository.findAll();
  }

  async update(tenantId: string, data: UpdateTenantData): Promise<Tenant> {
    this.validateTimeFields(data.openingTime, data.closingTime);
    const updated = await this.tenantRepository.update(tenantId, data);
    if (!updated) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    return updated;
  }

  private validateTimeFields(openingTime?: string | null, closingTime?: string | null): void {
    if (openingTime !== null && openingTime !== undefined && !isValidTime(openingTime)) {
      throw new BadRequestException('openingTime debe estar en formato HH:mm');
    }
    if (closingTime !== null && closingTime !== undefined && !isValidTime(closingTime)) {
      throw new BadRequestException('closingTime debe estar en formato HH:mm');
    }
    if (
      openingTime !== null &&
      openingTime !== undefined &&
      closingTime !== null &&
      closingTime !== undefined &&
      openingTime >= closingTime
    ) {
      throw new BadRequestException('openingTime debe ser anterior a closingTime');
    }
  }

  async uploadLogo(tenantId: string, uploadedBy: string, file: TenantLogoUpload): Promise<Tenant> {
    await this.findById(tenantId);

    const result = await this.storageService.uploadFile({
      tenantId,
      uploadedBy,
      domain: StorageDomain.BRANDING,
      imageProfile: ImageProfile.LOGO,
      visibility: StorageVisibility.PUBLIC,
      entityType: 'tenant',
      entityId: tenantId,
      file,
    });

    const logoUrl = result.publicUrl ?? this.storageService.buildPublicUrl(result.key);
    return this.update(tenantId, { logoUrl });
  }
}

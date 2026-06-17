import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { TenantRepository } from '../repository/tenant.repository';
import type {
  ITenantService,
  Tenant,
  TenantLogoUpload,
  UpdateTenantData,
} from '../interfaces/tenant.interfaces';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

@Injectable()
export class TenantService implements ITenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

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
    const updated = await this.tenantRepository.update(tenantId, data);
    if (!updated) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    return updated;
  }

  async uploadLogo(tenantId: string, file: TenantLogoUpload): Promise<Tenant> {
    if (!ALLOWED_LOGO_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Solo se permiten archivos PNG o JPG');
    }

    if (file.buffer.byteLength > MAX_LOGO_BYTES) {
      throw new BadRequestException('El logo no puede superar 2 MB');
    }

    await this.findById(tenantId);

    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const tenantDir = path.join(process.cwd(), 'uploads', 'tenants', tenantId);
    await fs.mkdir(tenantDir, { recursive: true });

    const filePath = path.join(tenantDir, `logo.${extension}`);
    await fs.writeFile(filePath, file.buffer);

    const alternateExtension = extension === 'png' ? 'jpg' : 'png';
    const alternatePath = path.join(tenantDir, `logo.${alternateExtension}`);
    await fs.rm(alternatePath, { force: true });

    const logoUrl = `/api/tenant/logo/${tenantId}`;
    return this.update(tenantId, { logoUrl });
  }

  async resolveLogoFilePath(tenantId: string): Promise<string | null> {
    const tenantDir = path.join(process.cwd(), 'uploads', 'tenants', tenantId);

    for (const extension of ['png', 'jpg'] as const) {
      const filePath = path.join(tenantDir, `logo.${extension}`);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // try next extension
      }
    }

    return null;
  }
}

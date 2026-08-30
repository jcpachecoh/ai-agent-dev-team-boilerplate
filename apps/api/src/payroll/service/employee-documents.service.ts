import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../storage/service/storage.service';
import { EmployeeDocumentsRepository } from '../repository/employee-documents.repository';
import type {
  CreateEmployeeDocumentData,
  EmployeeDocumentRecord,
  IEmployeeDocumentsService,
  ListEmployeeDocumentsOptions,
} from '../interfaces/employee-documents.interfaces';

const PRESIGNED_TTL_SECONDS = 900;

@Injectable()
export class EmployeeDocumentsService implements IEmployeeDocumentsService {
  constructor(
    private readonly repo: EmployeeDocumentsRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(
    tenantId: string,
    data: CreateEmployeeDocumentData,
  ): Promise<EmployeeDocumentRecord> {
    await this.validateStorageObject(data.storageObjectId, tenantId, data.employeeId);
    return this.repo.create(tenantId, data);
  }

  async findById(tenantId: string, id: string): Promise<EmployeeDocumentRecord> {
    const doc = await this.repo.findById(tenantId, id);
    if (!doc) throw new NotFoundException(`Documento "${id}" no encontrado`);
    return doc;
  }

  findByEmployee(
    tenantId: string,
    employeeId: string,
    options?: ListEmployeeDocumentsOptions,
  ): Promise<EmployeeDocumentRecord[]> {
    return this.repo.findByEmployee(tenantId, employeeId, options);
  }

  async remove(tenantId: string, id: string): Promise<EmployeeDocumentRecord> {
    await this.findById(tenantId, id);
    return this.repo.softDelete(tenantId, id);
  }

  async getDownloadUrl(tenantId: string, id: string): Promise<string> {
    const doc = await this.findById(tenantId, id);
    return this.storageService.getPresignedUrl(
      doc.storageObjectId,
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

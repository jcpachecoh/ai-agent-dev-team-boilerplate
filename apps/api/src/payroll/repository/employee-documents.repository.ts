import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateEmployeeDocumentData,
  EmployeeDocumentRecord,
  IEmployeeDocumentsRepository,
  ListEmployeeDocumentsOptions,
} from '../interfaces/employee-documents.interfaces';

type RowWithStorage = {
  id: string;
  tenantId: string;
  employeeId: string;
  fileType: import('@prisma/client').DocumentFileType;
  title: string;
  issueDate: Date | null;
  expiryDate: Date | null;
  storageObjectId: string;
  notes: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  storageObject: { mimeType: string };
};

const includeStorage = { storageObject: { select: { mimeType: true } } } as const;

@Injectable()
export class EmployeeDocumentsRepository implements IEmployeeDocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: CreateEmployeeDocumentData,
  ): Promise<EmployeeDocumentRecord> {
    const row = await this.prisma.employeeDocument.create({
      data: {
        tenantId,
        employeeId: data.employeeId,
        fileType: data.fileType,
        title: data.title,
        storageObjectId: data.storageObjectId,
        issueDate: data.issueDate ?? null,
        expiryDate: data.expiryDate ?? null,
        notes: data.notes ?? null,
      },
      include: includeStorage,
    });
    return this.map(row);
  }

  async findById(tenantId: string, id: string): Promise<EmployeeDocumentRecord | null> {
    const row = await this.prisma.employeeDocument.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: includeStorage,
    });
    return row ? this.map(row) : null;
  }

  async findByEmployee(
    tenantId: string,
    employeeId: string,
    options: ListEmployeeDocumentsOptions = {},
  ): Promise<EmployeeDocumentRecord[]> {
    const rows = await this.prisma.employeeDocument.findMany({
      where: {
        tenantId,
        employeeId,
        ...(options.fileType ? { fileType: options.fileType } : {}),
        ...(options.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: [{ fileType: 'asc' }, { createdAt: 'desc' }],
      include: includeStorage,
    });
    return rows.map((r) => this.map(r));
  }

  async softDelete(tenantId: string, id: string): Promise<EmployeeDocumentRecord> {
    const row = await this.prisma.employeeDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: includeStorage,
    });
    if (row.tenantId !== tenantId) throw new Error('Tenant mismatch after soft delete');
    return this.map(row);
  }

  private map(row: RowWithStorage): EmployeeDocumentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      employeeId: row.employeeId,
      fileType: row.fileType,
      title: row.title,
      issueDate: row.issueDate,
      expiryDate: row.expiryDate,
      storageObjectId: row.storageObjectId,
      mimeType: row.storageObject.mimeType,
      notes: row.notes,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}

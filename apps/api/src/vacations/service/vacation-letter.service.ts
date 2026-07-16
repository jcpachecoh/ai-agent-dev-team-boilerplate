import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { VacationType } from '@prisma/client';
import PDFDocument from 'pdfkit';

import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/service/storage.service';
import { StorageDomain, StorageVisibility } from '../../storage/enums/storage.enums';
import type { VacationRequestRecord } from '../interfaces/vacations.interfaces';
import { IVacationLetterService } from '../interfaces/vacations.interfaces';
import type {
  VacationLetterContext,
  VacationLetterVariant,
} from '../interfaces/vacation-letter.interfaces';
import { VACATION_LETTER_HR_SIGNATORY } from '../interfaces/vacation-letter.interfaces';
import { VacationsRepository } from '../repository/vacations.repository';
import { renderVacationApprovalLetter } from '../templates/vacation-letter-approval.template';
import {
  computeAccrualPeriod,
  computeReturnToWorkDate,
} from '../templates/vacation-letter-format.utils';
import { LETTER_MARGIN } from '../templates/vacation-letter-pdf.shared';
import { renderVacationRejectionLetter } from '../templates/vacation-letter-rejection.template';

const PRESIGNED_TTL_SECONDS = 900;
const LETTER_UPLOADED_BY = 'system-vacation-letter';

@Injectable()
export class VacationLetterService implements IVacationLetterService {
  private readonly logger = new Logger(VacationLetterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: VacationsRepository,
    private readonly storageService: StorageService,
  ) {}

  async generateAndStoreLetter(
    tenantId: string,
    request: VacationRequestRecord,
    variant: VacationLetterVariant,
    options?: { rejectionReason?: string },
  ): Promise<{ storageObjectId: string }> {
    const context = await this.buildContext(tenantId, request, options?.rejectionReason);
    const buffer = await this.renderPdf(context, variant);
    const filename = `vacaciones-${variant === 'APPROVAL' ? 'APROBACION' : 'NEGACION'}-${request.id}.pdf`;

    const stored = await this.storageService.uploadFile({
      tenantId,
      uploadedBy: LETTER_UPLOADED_BY,
      domain: StorageDomain.PAYROLL,
      entityType: 'VacationRequest',
      entityId: request.id,
      visibility: StorageVisibility.PRIVATE,
      file: {
        buffer,
        mimetype: 'application/pdf',
        originalname: filename,
        size: buffer.byteLength,
      },
    });

    await this.repository.updateRequest(tenantId, request.id, {
      letterStorageObjectId: stored.id,
    });

    return { storageObjectId: stored.id };
  }

  async getLetterPresignedUrl(tenantId: string, requestId: string): Promise<string> {
    const request = await this.repository.findRequestById(tenantId, requestId);
    if (!request?.letterStorageObjectId) {
      throw new NotFoundException(`La solicitud ${requestId} no tiene carta PDF generada`);
    }

    return this.storageService.getPresignedUrl(
      request.letterStorageObjectId,
      tenantId,
      PRESIGNED_TTL_SECONDS,
    );
  }

  private async buildContext(
    tenantId: string,
    request: VacationRequestRecord,
    rejectionReason?: string,
  ): Promise<VacationLetterContext> {
    const employee = await this.prisma.employeeDetails.findFirst({
      where: { tenantId, id: request.employeeId, isActive: true, deletedAt: null },
      include: {
        user: true,
        location: { select: { name: true, city: true } },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Empleado ${request.employeeId} no encontrado`);
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      select: {
        legalName: true,
        tradeName: true,
        name: true,
        logoUrl: true,
        city: true,
        email: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const logoBuffer = await this.tryLoadLogo(tenant.logoUrl);
    const employeeCity = employee.localidad ?? employee.location?.city ?? tenant.city ?? 'Ciudad';
    const tenantCity = tenant.city ?? employeeCity;

    const hrEmail = tenant.email ?? VACATION_LETTER_HR_SIGNATORY.email;

    return {
      tenant: {
        legalName: tenant.legalName ?? tenant.tradeName ?? tenant.name,
        tradeName: tenant.tradeName,
        logoUrl: tenant.logoUrl,
        city: tenantCity,
      },
      employee: {
        fullName: employee.name,
        cedula: employee.user.cedula,
        position: employee.position,
        email: employee.user.email,
        city: employeeCity,
        hireDate: employee.hireDate,
      },
      request,
      accrualPeriod: computeAccrualPeriod(employee.hireDate, request.startDate),
      returnToWorkDate: computeReturnToWorkDate(request.endDate),
      cashCompensationDays:
        request.type === VacationType.COMPENSACION ? request.daysRequested.toNumber() : 0,
      hrSignatory: {
        name: VACATION_LETTER_HR_SIGNATORY.name,
        title: VACATION_LETTER_HR_SIGNATORY.title,
        email: hrEmail,
      },
      letterDate: new Date(),
      rejectionReason,
      logoBuffer,
    };
  }

  private async tryLoadLogo(logoUrl: string | null): Promise<Buffer | null> {
    if (!logoUrl?.trim()) {
      return null;
    }

    try {
      const response = await fetch(logoUrl);
      if (!response.ok) {
        this.logger.warn(`No se pudo cargar logo del tenant (${response.status}): ${logoUrl}`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      this.logger.warn(`Error cargando logo del tenant: ${String(error)}`);
      return null;
    }
  }

  private renderPdf(
    context: VacationLetterContext,
    variant: VacationLetterVariant,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'portrait',
        margin: LETTER_MARGIN,
        autoFirstPage: true,
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (variant === 'APPROVAL') {
        renderVacationApprovalLetter(doc, context);
      } else {
        renderVacationRejectionLetter(doc, context);
      }

      doc.end();
    });
  }
}

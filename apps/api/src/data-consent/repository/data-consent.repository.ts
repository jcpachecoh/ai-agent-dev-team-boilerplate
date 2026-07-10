import { Injectable } from '@nestjs/common';
import { ConsentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  DataConsentRecord,
  DataProcessingPolicyRecord,
  IDataConsentRepository,
  PublishDataProcessingPolicyInput,
} from '../interfaces/data-consent.interfaces';

@Injectable()
export class DataConsentRepository implements IDataConsentRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEmployeeByUserId(userId: string, tenantId: string) {
    return this.prisma.employeeDetails.findFirst({
      where: { userId, tenantId, deletedAt: null },
      select: {
        id: true,
        pinHash: true,
        photoStorageObjectId: true,
        personalData: { select: { profilePhotoStorageObjectId: true } },
      },
    });
  }

  findActivePolicy(tenantId: string): Promise<DataProcessingPolicyRecord | null> {
    return this.prisma.dataProcessingPolicy.findFirst({
      where: { tenantId, isActive: true, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
    });
  }

  findPoliciesByTenant(tenantId: string): Promise<DataProcessingPolicyRecord[]> {
    return this.prisma.dataProcessingPolicy.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
    });
  }

  findConsentsByEmployeeAndVersion(
    tenantId: string,
    employeeId: string,
    policyVersion: string,
  ): Promise<DataConsentRecord[]> {
    return this.prisma.dataConsent.findMany({
      where: { tenantId, employeeId, policyVersion },
    });
  }

  async upsertGrantedConsent(params: {
    tenantId: string;
    employeeId: string;
    consentType: ConsentType;
    policyVersion: string;
    ipAddress?: string | null;
    deviceId?: string | null;
  }): Promise<DataConsentRecord> {
    const now = new Date();
    return this.prisma.dataConsent.upsert({
      where: {
        employeeId_consentType_policyVersion: {
          employeeId: params.employeeId,
          consentType: params.consentType,
          policyVersion: params.policyVersion,
        },
      },
      update: {
        granted: true,
        grantedAt: now,
        revokedAt: null,
        ipAddress: params.ipAddress ?? null,
        deviceId: params.deviceId ?? null,
      },
      create: {
        tenantId: params.tenantId,
        employeeId: params.employeeId,
        consentType: params.consentType,
        policyVersion: params.policyVersion,
        granted: true,
        grantedAt: now,
        revokedAt: null,
        ipAddress: params.ipAddress ?? null,
        deviceId: params.deviceId ?? null,
      },
    });
  }

  async revokeConsent(params: {
    tenantId: string;
    employeeId: string;
    consentType: ConsentType;
    policyVersion: string;
  }): Promise<DataConsentRecord> {
    const existing = await this.prisma.dataConsent.findUnique({
      where: {
        employeeId_consentType_policyVersion: {
          employeeId: params.employeeId,
          consentType: params.consentType,
          policyVersion: params.policyVersion,
        },
      },
    });

    if (!existing) {
      return this.prisma.dataConsent.create({
        data: {
          tenantId: params.tenantId,
          employeeId: params.employeeId,
          consentType: params.consentType,
          policyVersion: params.policyVersion,
          granted: false,
          grantedAt: null,
          revokedAt: new Date(),
        },
      });
    }

    return this.prisma.dataConsent.update({
      where: { id: existing.id },
      data: {
        granted: false,
        revokedAt: new Date(),
      },
    });
  }

  async publishPolicy(
    tenantId: string,
    input: PublishDataProcessingPolicyInput,
  ): Promise<DataProcessingPolicyRecord> {
    return this.prisma.$transaction(async (tx) => {
      await tx.dataProcessingPolicy.updateMany({
        where: { tenantId, isActive: true, deletedAt: null },
        data: { isActive: false },
      });

      return tx.dataProcessingPolicy.upsert({
        where: {
          tenantId_version: { tenantId, version: input.version },
        },
        update: {
          title: input.title,
          content: input.content,
          consentLabel: input.consentLabel,
          publishedAt: new Date(),
          isActive: true,
          deletedAt: null,
        },
        create: {
          tenantId,
          version: input.version,
          title: input.title,
          content: input.content,
          consentLabel: input.consentLabel,
          publishedAt: new Date(),
          isActive: true,
        },
      });
    });
  }
}

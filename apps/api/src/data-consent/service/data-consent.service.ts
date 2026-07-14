import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditAction, ConsentType } from '@prisma/client';
import { AuditService } from '../../audit/service/audit.service';
import { PAYROLL_MODULE_ROLES, SYSTEM_ADMIN_ROLES } from '../../common/config/rbac.config';
import type {
  ConsentActorContext,
  ConsentRequiredErrorDetails,
  DataConsentRecord,
  DataProcessingPolicyRecord,
  EmployeeConsentSummary,
  GrantDataConsentInput,
  IDataConsentService,
  PublishDataProcessingPolicyInput,
  RevokeDataConsentInput,
} from '../interfaces/data-consent.interfaces';
import { DataConsentRepository } from '../repository/data-consent.repository';

const ALL_CONSENT_TYPES: ConsentType[] = [
  ConsentType.BIOMETRICO_FACIAL,
  ConsentType.GEOLOCALIZACION,
];

const CONSENT_TYPE_MESSAGES: Record<ConsentType, string> = {
  [ConsentType.BIOMETRICO_FACIAL]:
    'Consentimiento biométrico facial requerido para registrar o usar reconocimiento facial',
  [ConsentType.GEOLOCALIZACION]:
    'Consentimiento de geolocalización requerido para marcación móvil con ubicación',
};

@Injectable()
export class DataConsentService implements IDataConsentService {
  constructor(
    private readonly repository: DataConsentRepository,
    private readonly auditService: AuditService,
  ) {}

  async getActivePolicy(tenantId: string): Promise<DataProcessingPolicyRecord> {
    const policy = await this.repository.findActivePolicy(tenantId);
    if (!policy) {
      throw new NotFoundException(
        'No hay política de tratamiento de datos vigente para este tenant',
      );
    }
    return policy;
  }

  listPolicies(tenantId: string): Promise<DataProcessingPolicyRecord[]> {
    return this.repository.findPoliciesByTenant(tenantId);
  }

  async getMyConsentStatus(userId: string, tenantId: string): Promise<EmployeeConsentSummary> {
    const employee = await this.requireEmployeeByUserId(userId, tenantId);
    return this.buildSummary(tenantId, employee);
  }

  async getEmployeeConsentStatus(
    targetUserId: string,
    actor: ConsentActorContext,
  ): Promise<EmployeeConsentSummary> {
    this.assertCanViewEmployeeConsents(targetUserId, actor);
    const employee = await this.requireEmployeeByUserId(targetUserId, actor.tenantId);
    return this.buildSummary(actor.tenantId, employee);
  }

  async grantConsent(
    actor: ConsentActorContext,
    input: GrantDataConsentInput,
  ): Promise<DataConsentRecord[]> {
    if (!input.accepted) {
      throw new BadRequestException(
        'Debe aceptar explícitamente el consentimiento (accepted: true)',
      );
    }
    if (!input.consentTypes.length) {
      throw new BadRequestException('Debe indicar al menos un tipo de consentimiento');
    }

    const employee = await this.requireEmployeeByUserId(actor.userId, actor.tenantId);
    const policy = await this.getActivePolicy(actor.tenantId);

    if (input.policyVersion !== policy.version) {
      throw new BadRequestException(
        `La versión de política ${input.policyVersion} no coincide con la vigente (${policy.version})`,
      );
    }

    const uniqueTypes = [...new Set(input.consentTypes)];
    const results: DataConsentRecord[] = [];

    for (const consentType of uniqueTypes) {
      const record = await this.repository.upsertGrantedConsent({
        tenantId: actor.tenantId,
        employeeId: employee.id,
        consentType,
        policyVersion: policy.version,
        ipAddress: actor.ipAddress,
        deviceId: input.deviceId,
      });
      results.push(record);

      await this.auditService.log({
        tenantId: actor.tenantId,
        actorUserId: actor.userId,
        userId: actor.userId,
        action: AuditAction.CREATE,
        entityType: 'DataConsent',
        entityId: record.id,
        newValue: {
          consentType: record.consentType,
          granted: true,
          policyVersion: record.policyVersion,
          deviceId: record.deviceId,
        },
        ipAddress: actor.ipAddress,
        userAgent: actor.userAgent,
      });
    }

    return results;
  }

  async revokeConsent(
    actor: ConsentActorContext,
    input: RevokeDataConsentInput,
  ): Promise<DataConsentRecord> {
    const employee = await this.requireEmployeeByUserId(actor.userId, actor.tenantId);
    const policy = await this.getActivePolicy(actor.tenantId);

    const record = await this.repository.revokeConsent({
      tenantId: actor.tenantId,
      employeeId: employee.id,
      consentType: input.consentType,
      policyVersion: policy.version,
    });

    await this.auditService.log({
      tenantId: actor.tenantId,
      actorUserId: actor.userId,
      userId: actor.userId,
      action: AuditAction.UPDATE,
      entityType: 'DataConsent',
      entityId: record.id,
      oldValue: { granted: true },
      newValue: {
        consentType: record.consentType,
        granted: false,
        revokedAt: record.revokedAt?.toISOString() ?? null,
        policyVersion: record.policyVersion,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return record;
  }

  async publishPolicy(
    actor: ConsentActorContext,
    input: PublishDataProcessingPolicyInput,
  ): Promise<DataProcessingPolicyRecord> {
    if (!SYSTEM_ADMIN_ROLES.includes(actor.roleCode as (typeof SYSTEM_ADMIN_ROLES)[number])) {
      throw new ForbiddenException(
        'Solo SuperAdmin puede publicar políticas de tratamiento de datos',
      );
    }

    const policy = await this.repository.publishPolicy(actor.tenantId, input);

    await this.auditService.log({
      tenantId: actor.tenantId,
      actorUserId: actor.userId,
      action: AuditAction.CREATE,
      entityType: 'DataProcessingPolicy',
      entityId: policy.id,
      newValue: {
        version: policy.version,
        title: policy.title,
        isActive: policy.isActive,
      },
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });

    return policy;
  }

  async assertConsentForFeature(params: {
    userId: string;
    tenantId: string;
    consentType: ConsentType;
  }): Promise<void> {
    const employee = await this.repository.findEmployeeByUserId(params.userId, params.tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado para este tenant');
    }

    const policy = await this.repository.findActivePolicy(params.tenantId);
    if (!policy) {
      throw new ForbiddenException(this.buildConsentErrorBody(params.consentType, false));
    }

    const consents = await this.repository.findConsentsByEmployeeAndVersion(
      params.tenantId,
      employee.id,
      policy.version,
    );
    const active = consents.find(
      (row) => row.consentType === params.consentType && row.granted && row.revokedAt === null,
    );

    if (!active) {
      const alternateMethodAvailable = Boolean(employee.pinHash);
      throw new ForbiddenException(
        this.buildConsentErrorBody(params.consentType, alternateMethodAvailable),
      );
    }
  }

  async buildConsentRequiredError(
    userId: string,
    tenantId: string,
    consentType: ConsentType,
  ): Promise<ConsentRequiredErrorDetails> {
    const employee = await this.repository.findEmployeeByUserId(userId, tenantId);
    return {
      code: 'CONSENT_REQUIRED',
      consentType,
      alternateMethodAvailable: Boolean(employee?.pinHash),
      message: CONSENT_TYPE_MESSAGES[consentType],
    };
  }

  private async buildSummary(
    tenantId: string,
    employee: {
      id: string;
      pinHash: string | null;
      photoStorageObjectId: string | null;
      personalData: { profilePhotoStorageObjectId: string | null } | null;
    },
  ): Promise<EmployeeConsentSummary> {
    const policy = await this.getActivePolicy(tenantId);
    const records = await this.repository.findConsentsByEmployeeAndVersion(
      tenantId,
      employee.id,
      policy.version,
    );

    const consents = ALL_CONSENT_TYPES.map((consentType) => {
      const record = records.find((row) => row.consentType === consentType);
      const granted = Boolean(record?.granted && !record.revokedAt);
      return {
        consentType,
        granted,
        policyVersion: record?.policyVersion ?? policy.version,
        grantedAt: record?.grantedAt ?? null,
        revokedAt: record?.revokedAt ?? null,
        canUseFeature: granted,
      };
    });

    const biometricEnrolled = Boolean(
      employee.personalData?.profilePhotoStorageObjectId ?? employee.photoStorageObjectId,
    );

    return {
      activePolicyVersion: policy.version,
      policy,
      consents,
      biometricEnrolled,
      alternateMethodAvailable: Boolean(employee.pinHash),
    };
  }

  private async requireEmployeeByUserId(userId: string, tenantId: string) {
    const employee = await this.repository.findEmployeeByUserId(userId, tenantId);
    if (!employee) {
      throw new NotFoundException('Empleado no encontrado para este tenant');
    }
    return employee;
  }

  private assertCanViewEmployeeConsents(targetUserId: string, actor: ConsentActorContext): void {
    if (targetUserId === actor.userId) {
      return;
    }

    const isPayrollRole = (PAYROLL_MODULE_ROLES as readonly string[]).includes(actor.roleCode);
    if (!isPayrollRole) {
      throw new ForbiddenException('No puede consultar consentimientos de otro empleado');
    }
  }

  private buildConsentErrorBody(
    consentType: ConsentType,
    alternateMethodAvailable: boolean,
  ): ConsentRequiredErrorDetails {
    return {
      code: 'CONSENT_REQUIRED',
      consentType,
      alternateMethodAvailable,
      message: CONSENT_TYPE_MESSAGES[consentType],
    };
  }
}

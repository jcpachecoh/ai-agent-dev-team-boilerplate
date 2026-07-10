import type { ConsentType, DataConsent, DataProcessingPolicy } from '@prisma/client';

export type DataConsentRecord = DataConsent;
export type DataProcessingPolicyRecord = DataProcessingPolicy;

export interface DataConsentStatusItem {
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string | null;
  grantedAt: Date | null;
  revokedAt: Date | null;
  canUseFeature: boolean;
}

export interface EmployeeConsentSummary {
  activePolicyVersion: string;
  policy: DataProcessingPolicyRecord;
  consents: DataConsentStatusItem[];
  biometricEnrolled: boolean;
  alternateMethodAvailable: boolean;
}

export interface GrantDataConsentInput {
  policyVersion: string;
  consentTypes: ConsentType[];
  accepted: boolean;
  deviceId?: string | null;
}

export interface RevokeDataConsentInput {
  consentType: ConsentType;
}

export interface PublishDataProcessingPolicyInput {
  version: string;
  title: string;
  content: string;
  consentLabel: string;
}

export interface ConsentActorContext {
  userId: string;
  tenantId: string;
  roleCode: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ConsentRequiredErrorDetails {
  code: 'CONSENT_REQUIRED';
  consentType: ConsentType;
  alternateMethodAvailable: boolean;
  message: string;
}

export interface IDataConsentRepository {
  findEmployeeByUserId(
    userId: string,
    tenantId: string,
  ): Promise<{
    id: string;
    pinHash: string | null;
    photoStorageObjectId: string | null;
    personalData: { profilePhotoStorageObjectId: string | null } | null;
  } | null>;

  findActivePolicy(tenantId: string): Promise<DataProcessingPolicyRecord | null>;

  findPoliciesByTenant(tenantId: string): Promise<DataProcessingPolicyRecord[]>;

  findConsentsByEmployeeAndVersion(
    tenantId: string,
    employeeId: string,
    policyVersion: string,
  ): Promise<DataConsentRecord[]>;

  upsertGrantedConsent(params: {
    tenantId: string;
    employeeId: string;
    consentType: ConsentType;
    policyVersion: string;
    ipAddress?: string | null;
    deviceId?: string | null;
  }): Promise<DataConsentRecord>;

  revokeConsent(params: {
    tenantId: string;
    employeeId: string;
    consentType: ConsentType;
    policyVersion: string;
  }): Promise<DataConsentRecord>;

  publishPolicy(
    tenantId: string,
    input: PublishDataProcessingPolicyInput,
  ): Promise<DataProcessingPolicyRecord>;
}

export interface IDataConsentService {
  getActivePolicy(tenantId: string): Promise<DataProcessingPolicyRecord>;

  listPolicies(tenantId: string): Promise<DataProcessingPolicyRecord[]>;

  getMyConsentStatus(userId: string, tenantId: string): Promise<EmployeeConsentSummary>;

  getEmployeeConsentStatus(
    targetUserId: string,
    actor: ConsentActorContext,
  ): Promise<EmployeeConsentSummary>;

  grantConsent(
    actor: ConsentActorContext,
    input: GrantDataConsentInput,
  ): Promise<DataConsentRecord[]>;

  revokeConsent(
    actor: ConsentActorContext,
    input: RevokeDataConsentInput,
  ): Promise<DataConsentRecord>;

  publishPolicy(
    actor: ConsentActorContext,
    input: PublishDataProcessingPolicyInput,
  ): Promise<DataProcessingPolicyRecord>;

  assertConsentForFeature(params: {
    userId: string;
    tenantId: string;
    consentType: ConsentType;
  }): Promise<void>;

  buildConsentRequiredError(
    userId: string,
    tenantId: string,
    consentType: ConsentType,
  ): Promise<ConsentRequiredErrorDetails>;
}

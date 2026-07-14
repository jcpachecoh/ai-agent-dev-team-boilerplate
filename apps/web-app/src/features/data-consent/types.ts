export type ConsentType = 'BIOMETRICO_FACIAL' | 'GEOLOCALIZACION';

export interface DataConsentStatusItem {
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string | null;
  grantedAt: string | null;
  revokedAt: string | null;
  canUseFeature: boolean;
}

export interface DataProcessingPolicy {
  id: string;
  version: string;
  title: string;
  content: string;
  consentLabel: string;
  publishedAt: string;
}

export interface EmployeeConsentSummary {
  activePolicyVersion: string;
  policy: DataProcessingPolicy;
  consents: DataConsentStatusItem[];
  biometricEnrolled: boolean;
  alternateMethodAvailable: boolean;
}

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
  BIOMETRICO_FACIAL: 'Dato biométrico facial',
  GEOLOCALIZACION: 'Geolocalización',
};

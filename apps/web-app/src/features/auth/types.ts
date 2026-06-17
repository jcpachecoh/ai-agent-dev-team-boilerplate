export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export type SignupDocumentType = 'CC' | 'CE' | 'PASAPORTE' | 'TI' | 'PEP';

export interface SignupInput {
  email: string;
  cedula: string;
  documentType: SignupDocumentType;
  password: string;
}

export type SignupResponse = LoginResponse;

export interface AuthUserProfile {
  id: string;
  tenantId: string;
  email: string;
  cedula: string;
  documentType: SignupDocumentType;
  emailVerified: boolean;
  isActive: boolean;
  roleCode: string;
  createdAt: string;
}

export interface AuthUserViewModel {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  displayRole: string;
  roleCode: string;
}

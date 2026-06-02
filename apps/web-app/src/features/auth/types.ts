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

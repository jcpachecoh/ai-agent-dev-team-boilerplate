export interface Tenant {
  id: string;
  name: string;
  nit: string | null;
  legalName: string | null;
  tradeName: string | null;
  legalRepresentativeName: string | null;
  legalRepresentativeDocumentType: string | null;
  legalRepresentativeDocumentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  department: string | null;
  country: string;
  taxRegime: string | null;
  logoUrl: string | null;
  openingTime: string | null;
  closingTime: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateTenantData {
  tradeName?: string;
  nit?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  openingTime?: string | null;
  closingTime?: string | null;
}

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findAll(): Promise<Tenant[]>;
  update(id: string, data: UpdateTenantData): Promise<Tenant | null>;
}

export interface TenantLogoUpload {
  mimetype: string;
  buffer: Buffer;
  originalname: string;
  size: number;
}

export interface ITenantService {
  findById(tenantId: string): Promise<Tenant>;
  findAll(): Promise<Tenant[]>;
  update(tenantId: string, data: UpdateTenantData): Promise<Tenant>;
  assertTenantAccess(jwtTenantId: string, requestedTenantId: string): void;
  uploadLogo(tenantId: string, uploadedBy: string, file: TenantLogoUpload): Promise<Tenant>;
}

import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Tenant } from '../../interfaces/tenant.interfaces';

@ObjectType('Tenant')
export class TenantType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  nit?: string | null;

  @Field(() => String, { nullable: true })
  legalName?: string | null;

  @Field(() => String, { nullable: true })
  tradeName?: string | null;

  @Field(() => String, { nullable: true })
  legalRepresentativeName?: string | null;

  @Field(() => String, { nullable: true })
  legalRepresentativeDocumentType?: string | null;

  @Field(() => String, { nullable: true })
  legalRepresentativeDocumentNumber?: string | null;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field(() => String, { nullable: true })
  department?: string | null;

  @Field()
  country!: string;

  @Field(() => String, { nullable: true })
  taxRegime?: string | null;

  @Field(() => String, { nullable: true })
  logoUrl?: string | null;

  @Field()
  isActive!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

export function toTenantType(tenant: Tenant): TenantType {
  return {
    id: tenant.id,
    name: tenant.name,
    nit: tenant.nit,
    legalName: tenant.legalName,
    tradeName: tenant.tradeName,
    legalRepresentativeName: tenant.legalRepresentativeName,
    legalRepresentativeDocumentType: tenant.legalRepresentativeDocumentType,
    legalRepresentativeDocumentNumber: tenant.legalRepresentativeDocumentNumber,
    email: tenant.email,
    phone: tenant.phone,
    address: tenant.address,
    city: tenant.city,
    department: tenant.department,
    country: tenant.country,
    taxRegime: tenant.taxRegime,
    logoUrl: tenant.logoUrl,
    isActive: tenant.isActive,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}

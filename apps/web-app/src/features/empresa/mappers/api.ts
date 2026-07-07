import type { EmpresaInformacionValues, EmpresaMetadataItem } from '@restopsiq/ui';

import type { TenantApiModel } from '../api/empresa.queries';
import { resolveTenantLogoUrl } from '../api/empresa.upload';
import { formatProfileUpdatedAt } from './display';

const COUNTRY_LABELS: Record<string, string> = {
  CO: 'Colombia',
};

const TAX_REGIME_LABELS: Record<string, string> = {
  RESPONSABLE_IVA: 'Responsable de IVA',
  NO_RESPONSABLE_IVA: 'No responsable de IVA',
  REGIMEN_SIMPLE: 'Régimen simple',
};

export interface TenantProfileViewModel {
  tenantLabel: string;
  logoUrl?: string;
  values: Required<EmpresaInformacionValues>;
  metadata: EmpresaMetadataItem[];
}

function formatCountry(country: string): string {
  return COUNTRY_LABELS[country] ?? country;
}

function formatTaxRegime(taxRegime?: string | null): string {
  if (!taxRegime) {
    return 'Sin régimen';
  }

  return TAX_REGIME_LABELS[taxRegime] ?? taxRegime.replace(/_/g, ' ');
}

function formatRegion(tenant: TenantApiModel): string {
  const country = formatCountry(tenant.country);
  if (tenant.department && tenant.city) {
    return `${tenant.city}, ${tenant.department} · ${country}`;
  }

  if (tenant.department) {
    return `${tenant.department} · ${country}`;
  }

  return country;
}

export function mapTenantToProfile(
  tenant: TenantApiModel,
  schedule?: Pick<EmpresaInformacionValues, 'openTime' | 'closeTime' | 'operatingDays'>,
): TenantProfileViewModel {
  const values: Required<EmpresaInformacionValues> = {
    restaurantName: tenant.tradeName ?? tenant.name,
    taxId: tenant.nit ?? '',
    address: tenant.address ?? '',
    phone: tenant.phone ?? '',
    email: tenant.email ?? '',
    openTime: tenant.openingTime ?? schedule?.openTime ?? '08:00',
    closeTime: tenant.closingTime ?? schedule?.closeTime ?? '22:00',
    operatingDays: schedule?.operatingDays ?? ['mon', 'tue', 'wed', 'thu', 'fri'],
  };

  return {
    tenantLabel: tenant.legalName ?? tenant.name,
    logoUrl: resolveTenantLogoUrl(tenant.logoUrl),
    values,
    metadata: [
      { label: 'Tenant ID', value: tenant.id },
      { label: 'Régimen fiscal', value: formatTaxRegime(tenant.taxRegime) },
      { label: 'Región', value: formatRegion(tenant) },
      { label: 'Última modificación', value: formatProfileUpdatedAt(tenant.updatedAt) },
    ],
  };
}

export function mapProfileValuesToUpdateInput(values: Required<EmpresaInformacionValues>): {
  tradeName: string;
  nit?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingTime?: string | null;
  closingTime?: string | null;
} {
  return {
    tradeName: values.restaurantName.trim(),
    nit: values.taxId.trim() || undefined,
    address: values.address.trim() || undefined,
    phone: values.phone.trim() || undefined,
    email: values.email.trim() || undefined,
    openingTime: values.openTime || null,
    closingTime: values.closeTime || null,
  };
}

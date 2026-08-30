import type { SupplierLogisticsApiModel, SupplierLogisticsFormValues } from '../types';
import { EMPTY_LOGISTICS_FORM } from '../constants';

export function mapLogisticsApiToForm(
  logistics?: SupplierLogisticsApiModel | null,
): SupplierLogisticsFormValues {
  if (!logistics) {
    return { ...EMPTY_LOGISTICS_FORM };
  }

  return {
    deliveryMode: (logistics.deliveryMode ?? '') as SupplierLogisticsFormValues['deliveryMode'],
    deliveryPlace: (logistics.deliveryPlace ?? '') as SupplierLogisticsFormValues['deliveryPlace'],
    deliveryPlaceCustom: logistics.deliveryPlaceCustom ?? '',
    deliveryDays: logistics.deliveryDays ?? [],
    leadTimeDays: logistics.leadTimeDays ?? null,
    timeWindowStart: logistics.timeWindowStart ?? '',
    timeWindowEnd: logistics.timeWindowEnd ?? '',
    receptionResponsibleUserId: logistics.receptionResponsible?.id ?? '',
    transportType: (logistics.transportType ?? '') as SupplierLogisticsFormValues['transportType'],
    requiresColdChain: logistics.requiresColdChain,
    transportTempMinC: logistics.transportTempMinC ?? null,
    transportTempMaxC: logistics.transportTempMaxC ?? null,
    transportCost: logistics.transportCost ?? null,
    transportCostCurrency: logistics.transportCostCurrency ?? 'COP',
    minimumOrderQty: logistics.minimumOrderQty ?? null,
    minimumOrderUnit: logistics.minimumOrderUnit ?? '',
    coverageLocationIds: logistics.coverageLocations.map((location) => location.id),
  };
}

export function formatLogisticsLeadTime(days?: number | null): string {
  if (!days || days <= 0) return '—';
  return `${days} día${days === 1 ? '' : 's'}`;
}

import type {
  ProductionByproduct,
  ProductionQualityCheck,
  ProductionQualityCheckType,
} from '../types';

export const QUALITY_CHECK_TYPES: ProductionQualityCheckType[] = [
  'LIBERACION_MP',
  'CORRECCION',
  'ACCION_CORRECTIVA',
  'ENTREGA',
  'RECIBE',
];

export const QUALITY_CHECK_LABELS: Record<ProductionQualityCheckType, string> = {
  LIBERACION_MP: 'Liberación MP',
  CORRECCION: 'Corrección',
  ACCION_CORRECTIVA: 'Acción correctiva',
  ENTREGA: 'Entrega',
  RECIBE: 'Recibe',
};

export interface ProductionOrderDocumentHeader {
  lotNumber: string;
  productionDate: string;
  deliveryDate: string;
  notes: string;
}

export interface MaterialDocumentRow {
  id: string;
  materialName: string;
  requiredQuantity: string;
  unit: string;
}

export interface ByproductDocumentRow {
  id?: string;
  itemName: string;
  unit: string;
  actualQuantity: string;
  lotNumber: string;
  expirationDate: string;
  _delete?: boolean;
}

export interface QualityCheckDocumentRow {
  checkType: ProductionQualityCheckType;
  temperature: string;
  color: string;
  smell: string;
  texture: string;
  notes: string;
}

export interface ExecutionRouteRow {
  id: string;
  phaseName: string;
  startedAt: string | null;
  completedAt: string | null;
  responsibleName: string | null;
  operatorCount: string;
  deliveredQuantity: string;
}

export interface ProductionOrderDocumentFormState {
  header: ProductionOrderDocumentHeader;
  byproducts: ByproductDocumentRow[];
}

export const emptyDocumentHeader = (): ProductionOrderDocumentHeader => ({
  lotNumber: '',
  productionDate: '',
  deliveryDate: '',
  notes: '',
});

export function isoToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateInputToIso(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function emptyQualityChecks(): QualityCheckDocumentRow[] {
  return QUALITY_CHECK_TYPES.map((checkType) => ({
    checkType,
    temperature: '',
    color: '',
    smell: '',
    texture: '',
    notes: '',
  }));
}

function mergeQualityChecks(existing: ProductionQualityCheck[]): QualityCheckDocumentRow[] {
  const byType = new Map(existing.map((check) => [check.checkType, check]));
  return QUALITY_CHECK_TYPES.map((checkType) => {
    const check = byType.get(checkType);
    return {
      checkType,
      temperature: check?.temperature ?? '',
      color: check?.color ?? '',
      smell: check?.smell ?? '',
      texture: check?.texture ?? '',
      notes: check?.notes ?? '',
    };
  });
}

export function documentFormFromOrder(order: {
  lotNumber: string | null;
  productionDate: string | null;
  deliveryDate: string | null;
  notes: string | null;
  byproducts: ProductionByproduct[];
}): ProductionOrderDocumentFormState {
  return {
    header: {
      lotNumber: order.lotNumber ?? '',
      productionDate: isoToDateInput(order.productionDate),
      deliveryDate: isoToDateInput(order.deliveryDate),
      notes: order.notes ?? '',
    },
    byproducts: (order.byproducts ?? []).map((byproduct) => ({
      id: byproduct.id,
      itemName: byproduct.itemName,
      unit: byproduct.unit,
      actualQuantity: byproduct.actualQuantity ?? '',
      lotNumber: byproduct.lotNumber ?? '',
      expirationDate: isoToDateInput(byproduct.expirationDate),
    })),
  };
}

export function qualityChecksForDisplay(
  qualityChecks: ProductionQualityCheck[],
): QualityCheckDocumentRow[] {
  return mergeQualityChecks(qualityChecks ?? []);
}

export function emptyByproductRow(): ByproductDocumentRow {
  return {
    itemName: '',
    unit: 'KILOGRAMS',
    actualQuantity: '',
    lotNumber: '',
    expirationDate: '',
  };
}

export function createModalDocumentDefaults(): ProductionOrderDocumentHeader {
  return emptyDocumentHeader();
}

export function emptyQualityCheckRows(): QualityCheckDocumentRow[] {
  return emptyQualityChecks();
}

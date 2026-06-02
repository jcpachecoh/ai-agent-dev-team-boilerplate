export type InventarioTheme = 'light' | 'dark';
export type InventarioSize = 'sm' | 'md' | 'xl';

export type InventarioAccentColor =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'purple'
  | 'enterprise';

export type InventarioBarRowDensity = 'compact' | 'comfortable';

export interface InventarioBarChartItem {
  label: string;
  value: number;
  max?: number;
}

export interface InventarioBarRowItem {
  label: string;
  value: string | number;
  progress: number;
  max?: number;
  accent?: InventarioAccentColor | string;
}

export type InventarioTableAlign = 'left' | 'center' | 'right';

export interface InventarioTableColumn {
  key: string;
  label: string;
  align?: InventarioTableAlign;
  width?: string;
}

export type InventarioPrimaryButtonVariant = 'primary' | 'success' | 'danger' | 'ghost';

export type InventarioIconButtonVariant = 'edit' | 'delete' | 'view' | 'order' | 'resolve';

export type InventarioMovementType = 'entrada' | 'salida' | 'consumo' | 'ajuste';

export type InventarioSeverity = 'critical' | 'warning' | 'resolved';

export type InventarioStockTone = 'success' | 'warning' | 'danger';

export type InventarioReportType = 'category' | 'supplier' | 'movement' | 'valuation';

import { RecetaActionButton, RecetaUtilityButton, StatusBadge } from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import { ResponsiveTableCard } from '@/components/responsive-table';
import type { UiTheme } from '@/constants/theme';
import {
  formatPlannedDate,
  formatPriority,
  formatShift,
  orderStatusToBadge,
  committeeStatusToBadge,
} from '@/features/produccion/mappers/display';
import type {
  ProductionCommitteeListItem,
  ProductionOrderListItem,
} from '@/features/produccion/types';
import type { ResponsiveColumnDef } from '@/lib/responsive-columns';

import styles from './produccion-responsive.module.scss';

interface RowBaseProps {
  visibleColumns: ResponsiveColumnDef[];
  columnsTemplate: string;
  theme: UiTheme;
}

function ResponsiveGridRow({
  visibleColumns,
  columnsTemplate,
  children,
}: RowBaseProps & { children: (columnId: string) => React.ReactNode }): React.JSX.Element {
  return (
    <div
      className={styles.row}
      role="row"
      style={{ '--receta-columns': columnsTemplate } as CSSProperties}
    >
      {visibleColumns.map((column) => (
        <span key={column.id} className={styles.cell} role="cell">
          {children(column.id)}
        </span>
      ))}
    </div>
  );
}

export interface ProductionOrderRowView {
  order: ProductionOrderListItem;
  recipeName: string;
}

export interface ProductionOrderRowProps extends RowBaseProps {
  row: ProductionOrderRowView;
  onPlan: (event: React.MouseEvent) => void;
  onDownloadPdf: (event: React.MouseEvent) => void;
  isPlanning: boolean;
  isDownloadingPdf: boolean;
}

function OrderActions({
  theme,
  order,
  onPlan,
  onDownloadPdf,
  isPlanning,
  isDownloadingPdf,
}: {
  theme: UiTheme;
  order: ProductionOrderListItem;
  onPlan: (event: React.MouseEvent) => void;
  onDownloadPdf: (event: React.MouseEvent) => void;
  isPlanning: boolean;
  isDownloadingPdf: boolean;
}): React.JSX.Element {
  return (
    <span
      className={styles.actions}
      role="presentation"
      onClick={(event) => event.stopPropagation()}
    >
      <RecetaUtilityButton
        theme={theme}
        size="sm"
        variant="pdf"
        disabled={isDownloadingPdf}
        onClick={onDownloadPdf}
      />
      {order.status === 'DRAFT' && (
        <RecetaActionButton
          theme={theme}
          size="sm"
          accent="orange"
          variant="soft"
          label="Planificar"
          loading={isPlanning}
          onClick={onPlan}
        />
      )}
    </span>
  );
}

export function ProductionOrderListRow({
  row,
  theme,
  visibleColumns,
  columnsTemplate,
  onPlan,
  onDownloadPdf,
  isPlanning,
  isDownloadingPdf,
}: ProductionOrderRowProps): React.JSX.Element {
  const { order, recipeName } = row;

  return (
    <ResponsiveGridRow
      visibleColumns={visibleColumns}
      columnsTemplate={columnsTemplate}
      theme={theme}
    >
      {(columnId) => {
        switch (columnId) {
          case 'number':
            return <span className={styles.code}>{order.number}</span>;
          case 'recipe':
            return <span className={styles.name}>{recipeName}</span>;
          case 'status':
            return (
              <StatusBadge
                status={orderStatusToBadge(order.status)}
                variant="pill"
                size="sm"
                theme={theme}
              />
            );
          case 'priority':
            return <span className={styles.muted}>{formatPriority(order.priority)}</span>;
          case 'shift':
            return <span className={styles.muted}>{formatShift(order.shift)}</span>;
          case 'planned':
            return <span className={styles.muted}>{formatPlannedDate(order.plannedStartAt)}</span>;
          case 'actions':
            return (
              <OrderActions
                theme={theme}
                order={order}
                onPlan={onPlan}
                onDownloadPdf={onDownloadPdf}
                isPlanning={isPlanning}
                isDownloadingPdf={isDownloadingPdf}
              />
            );
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function ProductionOrderListCard({
  row,
  theme,
  onOpen,
  onPlan,
  onDownloadPdf,
  isPlanning,
  isDownloadingPdf,
}: Omit<ProductionOrderRowProps, 'visibleColumns' | 'columnsTemplate'> & {
  onOpen: () => void;
}): React.JSX.Element {
  const { order, recipeName } = row;

  return (
    <ResponsiveTableCard
      className={styles.card}
      title={
        <span className={styles.titleGroup}>
          <span className={styles.code}>{order.number}</span>
          <span className={styles.name}>{recipeName}</span>
        </span>
      }
      badge={
        <StatusBadge
          status={orderStatusToBadge(order.status)}
          variant="pill"
          size="sm"
          theme={theme}
        />
      }
      fields={[
        { label: 'Prioridad', value: formatPriority(order.priority) },
        { label: 'Turno', value: formatShift(order.shift) },
        { label: 'Inicio planificado', value: formatPlannedDate(order.plannedStartAt) },
        ...(order.committeeNumber ? [{ label: 'Comité', value: order.committeeNumber }] : []),
      ]}
      footer={
        <OrderActions
          theme={theme}
          order={order}
          onPlan={onPlan}
          onDownloadPdf={onDownloadPdf}
          isPlanning={isPlanning}
          isDownloadingPdf={isDownloadingPdf}
        />
      }
      onClick={onOpen}
    />
  );
}

export interface ProductionCommitteeRowProps extends RowBaseProps {
  committee: ProductionCommitteeListItem;
}

export function ProductionCommitteeListRow({
  committee,
  theme,
  visibleColumns,
  columnsTemplate,
}: ProductionCommitteeRowProps): React.JSX.Element {
  return (
    <ResponsiveGridRow
      visibleColumns={visibleColumns}
      columnsTemplate={columnsTemplate}
      theme={theme}
    >
      {(columnId) => {
        switch (columnId) {
          case 'number':
            return <span className={styles.code}>{committee.number}</span>;
          case 'status':
            return (
              <StatusBadge
                status={committeeStatusToBadge(committee.status)}
                variant="pill"
                size="sm"
                theme={theme}
              />
            );
          case 'members':
            return <span className={styles.muted}>{committee.memberCount}</span>;
          case 'orders':
            return <span className={styles.muted}>{committee.ordersCount}</span>;
          case 'created':
            return <span className={styles.muted}>{formatPlannedDate(committee.createdAt)}</span>;
          default:
            return null;
        }
      }}
    </ResponsiveGridRow>
  );
}

export function ProductionCommitteeListCard({
  committee,
  theme,
  onOpen,
}: {
  committee: ProductionCommitteeListItem;
  theme: UiTheme;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <ResponsiveTableCard
      className={styles.card}
      title={<span className={styles.code}>{committee.number}</span>}
      badge={
        <StatusBadge
          status={committeeStatusToBadge(committee.status)}
          variant="pill"
          size="sm"
          theme={theme}
        />
      }
      fields={[
        { label: 'Miembros', value: String(committee.memberCount) },
        { label: 'OPs creadas', value: String(committee.ordersCount) },
        { label: 'Creado', value: formatPlannedDate(committee.createdAt) },
      ]}
      onClick={onOpen}
    />
  );
}

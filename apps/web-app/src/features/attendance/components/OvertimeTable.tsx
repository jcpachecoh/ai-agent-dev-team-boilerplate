import { EmpleadoTableHeader, type EmpleadoTheme } from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import {
  OVERTIME_APPROVER_POSITION_IDS,
  type OvertimeRequestItem,
  type OvertimeStatus,
} from '../types/overtime.types';
import {
  getOvertimeTableMinWidthPx,
  OVERTIME_TABLE_COLUMNS,
} from '../utils/overtime-table.columns';
import { OvertimeTableItem } from './OvertimeTableItem';
import styles from './OvertimeTable.module.scss';

const PENDING_STATUSES = new Set<OvertimeStatus>([
  'PENDIENTE_ADMIN',
  'PENDIENTE_GERENCIA_OPERACIONES',
  'PENDIENTE_GERENCIA_GENERAL',
]);

function canActorApproveByPosition(
  item: OvertimeRequestItem,
  positionId: string | null | undefined,
): boolean {
  if (!positionId || !PENDING_STATUSES.has(item.status)) return false;

  switch (item.status) {
    case 'PENDIENTE_ADMIN':
      return positionId === OVERTIME_APPROVER_POSITION_IDS.ADMINISTRADOR;
    case 'PENDIENTE_GERENCIA_OPERACIONES':
      return positionId === OVERTIME_APPROVER_POSITION_IDS.GERENCIA_OPERACIONES;
    case 'PENDIENTE_GERENCIA_GENERAL':
      return positionId === OVERTIME_APPROVER_POSITION_IDS.GERENCIA_GENERAL;
    default:
      return false;
  }
}

export function canApproveOvertimeRequest(
  item: OvertimeRequestItem,
  roleCode: string | null | undefined,
  positionId: string | null | undefined,
): boolean {
  if (!PENDING_STATUSES.has(item.status)) return false;
  if (roleCode === 'NOMINA') return true;
  return canActorApproveByPosition(item, positionId);
}

interface Props {
  items: OvertimeRequestItem[];
  theme: EmpleadoTheme;
  roleCode: string | null | undefined;
  positionId: string | null | undefined;
  actionsDisabled?: boolean;
  onApprove: (item: OvertimeRequestItem) => void;
  onObject: (item: OvertimeRequestItem) => void;
}

export function OvertimeTable({
  items,
  theme,
  roleCode,
  positionId,
  actionsDisabled = false,
  onApprove,
  onObject,
}: Props): React.JSX.Element {
  return (
    <section className={styles.table} role="table" aria-label="Solicitudes de tiempo extra">
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--empleado-table-min-width': `${getOvertimeTableMinWidthPx()}px`,
            } as CSSProperties
          }
        >
          <EmpleadoTableHeader
            columns={OVERTIME_TABLE_COLUMNS}
            theme={theme}
            className={styles.desktopHeader}
          />
          <div className={styles.body} role="rowgroup">
            {items.map((item) => (
              <OvertimeTableItem
                key={item.id}
                item={item}
                theme={theme}
                showActions={canApproveOvertimeRequest(item, roleCode, positionId)}
                actionsDisabled={actionsDisabled}
                onApprove={() => onApprove(item)}
                onObject={() => onObject(item)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import {
  EmpleadoPagination,
  EmpleadoTableHeader,
  type EmpleadoPaginationProps,
  type EmpleadoTheme,
} from '@restopsiq/ui';
import type { CSSProperties } from 'react';

import type { MedicalLeaveSummary } from '../types/medical-leaves.types';
import {
  getMedicalLeaveGridTemplate,
  getMedicalLeaveTableColumns,
  getMedicalLeaveTableMinWidthPx,
} from '../utils/medical-leaves-table.columns';
import { MedicalLeaveTableItem } from './MedicalLeaveTableItem';
import styles from './MedicalLeavesTable.module.scss';

interface Props {
  leaves: MedicalLeaveSummary[];
  theme: EmpleadoTheme;
  canWrite: boolean;
  downloadingId: string | null;
  statusBusy: boolean;
  pagination?: EmpleadoPaginationProps;
  onView: (leave: MedicalLeaveSummary) => void;
  onDownload: (leave: MedicalLeaveSummary) => void;
  onRadicate: (leave: MedicalLeaveSummary) => void;
  onRecovered: (leave: MedicalLeaveSummary) => void;
  onReject: (leave: MedicalLeaveSummary) => void;
}

export function MedicalLeavesTable({
  leaves,
  theme,
  canWrite,
  downloadingId,
  statusBusy,
  pagination,
  onView,
  onDownload,
  onRadicate,
  onRecovered,
  onReject,
}: Props): React.JSX.Element {
  const columns = getMedicalLeaveTableColumns(canWrite);
  const gridTemplate = getMedicalLeaveGridTemplate(canWrite);

  return (
    <section className={styles.table} role="table" aria-label="Listado de incapacidades médicas">
      <div className={styles.scrollRegion}>
        <div
          className={styles.scrollContent}
          style={
            {
              '--empleado-columns': gridTemplate,
              '--empleado-table-min-width': `${getMedicalLeaveTableMinWidthPx(canWrite)}px`,
            } as CSSProperties
          }
        >
          <EmpleadoTableHeader columns={columns} theme={theme} className={styles.desktopHeader} />
          <div className={styles.body} role="rowgroup">
            {leaves.map((leave) => (
              <MedicalLeaveTableItem
                key={leave.id}
                leave={leave}
                theme={theme}
                gridTemplate={gridTemplate}
                canWrite={canWrite}
                downloading={downloadingId === leave.id}
                statusBusy={statusBusy}
                onView={() => onView(leave)}
                onDownload={() => onDownload(leave)}
                onRadicate={() => onRadicate(leave)}
                onRecovered={() => onRecovered(leave)}
                onReject={() => onReject(leave)}
              />
            ))}
          </div>
        </div>
      </div>
      {pagination ? <EmpleadoPagination theme={theme} {...pagination} /> : null}
    </section>
  );
}

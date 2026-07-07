import { TurnosTableCard } from './TurnosTableCard';
import styles from './TurnosTableItem.module.scss';
import { TurnosTableRow, type TurnosTableRowProps } from './TurnosTableRow';

export type TurnosTableItemProps = TurnosTableRowProps;

export function TurnosTableItem({ className, ...props }: TurnosTableItemProps): React.JSX.Element {
  return (
    <>
      <TurnosTableRow
        {...props}
        className={[styles.desktop, className].filter(Boolean).join(' ')}
      />
      <TurnosTableCard
        turno={props.turno}
        locationName={props.locationName}
        scheduleLabel={props.scheduleLabel}
        showActions={props.showActions}
        toggleLoading={props.toggleLoading}
        theme={props.theme}
        onEdit={props.onEdit}
        onToggleStatus={props.onToggleStatus}
        className={[styles.mobile, className].filter(Boolean).join(' ')}
      />
    </>
  );
}

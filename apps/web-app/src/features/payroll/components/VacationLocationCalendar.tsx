import { formatCalendarEmployeeLabel, formatVacationDate } from '../utils/vacation-display.utils';
import {
  VACATION_STATUS_LABELS,
  VACATION_TYPE_LABELS,
  type VacationRequestSummary,
} from '../types/vacations.types';
import styles from './VacationLocationCalendar.module.scss';

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function toUtcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildMonthGrid(month: string): Date[] {
  const [year, monthIndex] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year!, monthIndex! - 1, 1));
  const startOffset = (first.getUTCDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setUTCDate(first.getUTCDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setUTCDate(gridStart.getUTCDate() + index);
    return day;
  });
}

function requestCoversDate(request: VacationRequestSummary, day: Date): boolean {
  const key = dateKey(day);
  const start = dateKey(toUtcDate(request.startDate));
  const end = dateKey(toUtcDate(request.endDate));
  return key >= start && key <= end;
}

interface Props {
  month: string;
  locationId: string;
  requests: VacationRequestSummary[];
}

export function VacationLocationCalendar({
  month,
  locationId,
  requests,
}: Props): React.JSX.Element {
  const filtered = requests.filter((request) => {
    if (locationId && request.locationId !== locationId) return false;
    return request.status !== 'RECHAZADA';
  });

  const days = buildMonthGrid(month);
  const [year, monthNumber] = month.split('-').map(Number);

  return (
    <section className={styles.calendar}>
      <header className={styles.header}>
        <h3>
          Calendario {monthNumber}/{year}
        </h3>
        <p className={styles.subtitle}>Solicitudes aprobadas y pendientes por sede</p>
      </header>

      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className={styles.gridScroll}>
        <div className={styles.grid}>
          {days.map((day) => {
            const inMonth = day.getUTCMonth() + 1 === monthNumber;
            const dayRequests = filtered.filter((request) => requestCoversDate(request, day));
            return (
              <div key={dateKey(day)} className={`${styles.cell} ${inMonth ? '' : styles.outside}`}>
                <span className={styles.dayNumber}>{day.getUTCDate()}</span>
                <div className={styles.events}>
                  {dayRequests.slice(0, 2).map((request) => {
                    const label = formatCalendarEmployeeLabel(request.employeeName);
                    const tooltip = [
                      request.employeeName || 'Empleado sin nombre',
                      VACATION_TYPE_LABELS[request.type],
                      VACATION_STATUS_LABELS[request.status],
                      `${formatVacationDate(request.startDate)} – ${formatVacationDate(request.endDate)}`,
                    ].join(' · ');

                    return (
                      <span
                        key={`${request.id}-${dateKey(day)}`}
                        className={`${styles.event} ${styles[`status_${request.status}`]}`}
                        title={tooltip}
                      >
                        {label}
                      </span>
                    );
                  })}
                  {dayRequests.length > 2 ? (
                    <span className={styles.more}>+{dayRequests.length - 2} más</span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

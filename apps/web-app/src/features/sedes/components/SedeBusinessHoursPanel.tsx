import { type JSX } from 'react';

import type { BusinessHoursDayInput, DayOfWeek } from '../types';
import { DAY_LABELS } from '../types';
import styles from './SedeBusinessHoursPanel.module.scss';

interface SedeBusinessHoursPanelProps {
  hoursPerDay: BusinessHoursDayInput[];
  onChange: (days: BusinessHoursDayInput[]) => void;
  disabled?: boolean;
}

const ORDERED_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export function SedeBusinessHoursPanel({
  hoursPerDay,
  onChange,
  disabled = false,
}: SedeBusinessHoursPanelProps): JSX.Element {
  const dayMap = new Map(hoursPerDay.map((d) => [d.dayOfWeek, d]));

  function updateDay(dayOfWeek: DayOfWeek, patch: Partial<BusinessHoursDayInput>) {
    const current = dayMap.get(dayOfWeek) ?? { dayOfWeek, isOpen: false };
    const updated = { ...current, ...patch };
    const next = ORDERED_DAYS.map((d) =>
      d === dayOfWeek ? updated : (dayMap.get(d) ?? { dayOfWeek: d, isOpen: false }),
    );
    onChange(next);
  }

  return (
    <div className={styles.panel}>
      <div className={styles.timezone}>
        <span className={styles.timezoneIcon}>🌎</span>
        Zona horaria: America/Bogota
      </div>

      {ORDERED_DAYS.map((day) => {
        const entry = dayMap.get(day) ?? { dayOfWeek: day, isOpen: false };

        return (
          <div key={day} className={styles.row}>
            <span className={styles.dayLabel}>{DAY_LABELS[day]}</span>

            <div className={styles.rowControls}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  className={styles.toggleCheckbox}
                  checked={entry.isOpen}
                  disabled={disabled}
                  onChange={(e) => updateDay(day, { isOpen: e.target.checked })}
                />
                <span
                  className={`${styles.toggleLabel} ${entry.isOpen ? styles.toggleLabelOpen : ''}`}
                >
                  {entry.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </label>

              {entry.isOpen ? (
                <div className={styles.times}>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={entry.openingTime ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateDay(day, { openingTime: e.target.value })}
                  />
                  <span className={styles.timeSep}>–</span>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={entry.closingTime ?? ''}
                    disabled={disabled}
                    onChange={(e) => updateDay(day, { closingTime: e.target.value })}
                  />
                </div>
              ) : (
                <span className={styles.closedLabel}>No opera este día</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

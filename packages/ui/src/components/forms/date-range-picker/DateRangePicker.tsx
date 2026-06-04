import * as Popover from '@radix-ui/react-popover';
import {
  format,
  startOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { es as esLocale, es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { type DateRange, DayPicker } from 'react-day-picker';

import styles from './DateRangePicker.module.scss';
import datePickerStyles from '../date-picker/DatePicker.module.scss';

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  size?: 'sm' | 'md' | 'xl';
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  theme = 'dark',
  className,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const themeClass =
    theme === 'light' ? datePickerStyles['theme--light'] : datePickerStyles['theme--dark'];
  const sizeClass = datePickerStyles[`size--${size}`];

  const handleRangeSelect = (range: DateRange | undefined): void => {
    onChange?.(range);
  };

  const shortcuts = [
    { label: 'Hoy', getValue: (): DateRange => ({ from: startOfToday(), to: startOfToday() }) },
    {
      label: 'Esta semana',
      getValue: (): DateRange => ({
        from: startOfWeek(new Date(), { locale: esLocale }),
        to: endOfWeek(new Date(), { locale: esLocale }),
      }),
    },
    {
      label: 'Este mes',
      getValue: (): DateRange => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
    },
    {
      label: 'Este año',
      getValue: (): DateRange => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }),
    },
  ];

  const displayValue = React.useMemo(() => {
    if (!value?.from) {
      return '';
    }
    if (!value?.to) {
      return format(value.from, 'dd/MM/yyyy');
    }
    return `${format(value.from, 'dd/MM/yyyy')} - ${format(value.to, 'dd/MM/yyyy')}`;
  }, [value]);

  return (
    <div
      className={[datePickerStyles.container, themeClass, sizeClass, className]
        .filter(Boolean)
        .join(' ')}
    >
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <div className={datePickerStyles.inputWrapper}>
          <input
            type="text"
            className={datePickerStyles.input}
            value={displayValue}
            readOnly
            placeholder={placeholder}
            disabled={disabled}
          />
          <Popover.Trigger asChild>
            <button type="button" className={datePickerStyles.trigger} disabled={disabled}>
              <CalendarIcon size={18} />
            </button>
          </Popover.Trigger>
        </div>
        <Popover.Content
          className={[datePickerStyles.popoverContent, styles.rangePopover].join(' ')}
          sideOffset={5}
          align="start"
        >
          <div className={styles.container}>
            <div className={styles.shortcuts}>
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  className={styles.shortcutButton}
                  onClick={() => handleRangeSelect(shortcut.getValue())}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
            <DayPicker
              mode="range"
              selected={value}
              onSelect={handleRangeSelect}
              locale={es}
              classNames={{
                ...datePickerStyles,
                months: datePickerStyles.months,
                month: datePickerStyles.month,
                month_caption: datePickerStyles.caption,
                caption_label: datePickerStyles.captionLabel,
                nav: datePickerStyles.nav,
                button_previous: [
                  datePickerStyles.navButton,
                  datePickerStyles.navButtonPrevious,
                ].join(' '),
                button_next: [datePickerStyles.navButton, datePickerStyles.navButtonNext].join(' '),
                month_grid: datePickerStyles.table,
                weekdays: datePickerStyles.headRow,
                weekday: datePickerStyles.headCell,
                week: datePickerStyles.row,
                day: datePickerStyles.day,
                day_button: datePickerStyles.day,
                selected: datePickerStyles.daySelected,
                today: datePickerStyles.dayToday,
                outside: datePickerStyles.dayOutside,
                disabled: datePickerStyles.dayDisabled,
                range_middle: styles.dayRangeMiddle,
                range_start: styles.dayRangeStart,
                range_end: styles.dayRangeEnd,
                hidden: datePickerStyles.dayHidden,
              }}
              components={{
                Chevron: (props): React.JSX.Element => {
                  if (props.orientation === 'left') {
                    return <ChevronLeft size={16} {...props} />;
                  }
                  return <ChevronRight size={16} {...props} />;
                },
              }}
            />
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

export default DateRangePicker;

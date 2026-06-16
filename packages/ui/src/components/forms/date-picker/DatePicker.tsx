import * as Popover from '@radix-ui/react-popover';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';

import styles from './DatePicker.module.scss';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  size?: 'sm' | 'md' | 'xl';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  theme = 'dark',
  className,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value ? format(value, 'dd/MM/yyyy') : '');

  React.useEffect(() => {
    if (value) {
      setInputValue(format(value, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const val = e.target.value;
    setInputValue(val);

    const parsedDate = parse(val, 'dd/MM/yyyy', new Date());
    if (isValid(parsedDate) && val.length === 10) {
      onChange?.(parsedDate);
    }
  };

  const handleDateSelect = (date: Date | undefined): void => {
    onChange?.(date);
    if (date) {
      setInputValue(format(date, 'dd/MM/yyyy'));
    }
    setIsOpen(false);
  };

  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div className={[styles.container, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
          />
          <Popover.Trigger asChild>
            <button type="button" className={styles.trigger} disabled={disabled}>
              <CalendarIcon size={18} />
            </button>
          </Popover.Trigger>
        </div>
        <Popover.Content className={styles.popoverContent} sideOffset={5} align="start">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            locale={es}
            classNames={{
              months: styles.months,
              month: styles.month,
              month_caption: styles.caption,
              caption_label: styles.captionLabel,
              nav: styles.nav,
              button_previous: [styles.navButton, styles.navButtonPrevious].join(' '),
              button_next: [styles.navButton, styles.navButtonNext].join(' '),
              month_grid: styles.table,
              weekdays: styles.headRow,
              weekday: styles.headCell,
              week: styles.row,
              day: styles.day,
              day_button: styles.day,
              selected: styles.daySelected,
              today: styles.dayToday,
              outside: styles.dayOutside,
              disabled: styles.dayDisabled,
              range_middle: styles.dayRangeMiddle,
              hidden: styles.dayHidden,
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
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

export default DatePicker;

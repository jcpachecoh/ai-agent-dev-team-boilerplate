import * as Popover from '@radix-ui/react-popover';
import { format, parse, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

import styles from './DatePicker.module.scss';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  size?: 'sm' | 'md' | 'xl';
  /** No outer border — for use inside InventarioFormField / Receta controls */
  embedded?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled = false,
  theme = 'dark',
  className,
  size = 'md',
  embedded = false,
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

  const openPicker = (): void => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
  const sizeClass = styles[`size--${size}`];

  return (
    <div
      className={[styles.container, themeClass, sizeClass, embedded && styles.embedded, className]
        .filter(Boolean)
        .join(' ')}
    >
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <div className={styles.inputWrapper} onClick={openPicker}>
          <input
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={openPicker}
            placeholder={placeholder}
            disabled={disabled}
          />
          <Popover.Trigger asChild>
            <button
              type="button"
              className={styles.trigger}
              disabled={disabled}
              aria-label="Abrir calendario"
            >
              <CalendarIcon size={18} />
            </button>
          </Popover.Trigger>
        </div>
        <Popover.Content
          className={[
            styles.popoverContent,
            theme === 'dark' ? styles.popoverContentDark : styles.popoverContentLight,
          ]
            .filter(Boolean)
            .join(' ')}
          sideOffset={6}
          align="start"
          collisionPadding={12}
          avoidCollisions
        >
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            locale={es}
            weekStartsOn={1}
            components={{
              Chevron: (props): React.JSX.Element => {
                if (props.orientation === 'left') {
                  return <ChevronLeft size={14} {...props} />;
                }
                return <ChevronRight size={14} {...props} />;
              },
            }}
          />
        </Popover.Content>
      </Popover.Root>
    </div>
  );
};

export default DatePicker;

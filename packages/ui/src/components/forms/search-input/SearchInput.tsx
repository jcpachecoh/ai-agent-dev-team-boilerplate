import { Search, X, Loader2 } from 'lucide-react';
import * as React from 'react';

import styles from './SearchInput.module.scss';

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'size'
> {
  onSearch?: (value: string) => void;
  debounce?: number;
  loading?: boolean;
  onClear?: () => void;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      onSearch,
      debounce = 300,
      loading = false,
      onClear,
      className,
      theme = 'dark',
      size = 'md',
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = React.useState(String(props.defaultValue || props.value || ''));

    React.useEffect(() => {
      if (props.value !== undefined) {
        setValue(String(props.value));
      }
    }, [props.value]);

    const timerRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      const newValue = e.target.value;
      setValue(newValue);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        onSearch?.(newValue);
      }, debounce);
    };

    const handleClear = (): void => {
      setValue('');
      onSearch?.('');
      onClear?.();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };

    const themeClass = theme === 'light' ? styles['theme--light'] : styles['theme--dark'];
    const sizeClass = styles[`size--${size}`];

    return (
      <div className={[styles.wrapper, themeClass, sizeClass, className].filter(Boolean).join(' ')}>
        <div className={styles.icon}>
          {loading ? <Loader2 className={styles.spinner} /> : <Search size={18} />}
        </div>
        <input
          ref={ref}
          type="text"
          className={styles.input}
          value={value}
          onChange={handleChange}
          {...props}
        />
        {value && !loading && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;

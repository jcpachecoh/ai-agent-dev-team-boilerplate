import type { HTMLAttributes } from 'react';

import { Spinner } from '../../Spinner';
import styles from './LoadingState.module.scss';

export type LoadingStateLayout = 'section' | 'compact' | 'inline';
export type LoadingStateTheme = 'light' | 'dark';

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  message?: string;
  theme?: LoadingStateTheme;
  spinnerSize?: 'sm' | 'md' | 'lg';
  layout?: LoadingStateLayout;
}

export function LoadingState({
  message = 'Cargando…',
  theme = 'light',
  spinnerSize = 'lg',
  layout = 'section',
  className,
  ...props
}: LoadingStateProps): React.JSX.Element {
  return (
    <div
      className={[
        styles.loadingState,
        styles[`layout--${layout}`],
        styles[`theme--${theme}`],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-label={message}
      {...props}
    >
      <span className={styles.spinnerWrap} aria-hidden>
        <Spinner size={spinnerSize} theme={theme} />
      </span>
      <p className={styles.message}>{message}</p>
    </div>
  );
}

export default LoadingState;

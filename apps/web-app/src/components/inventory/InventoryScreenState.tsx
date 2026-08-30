import { LoadingState } from '@restopsiq/ui';

import styles from './InventoryScreenState.module.scss';

interface InventoryScreenStateProps {
  variant: 'loading' | 'empty' | 'error';
  message?: string;
  onRetry?: () => void;
  theme?: 'light' | 'dark';
}

export function InventoryScreenState({
  variant,
  message,
  onRetry,
  theme = 'light',
}: InventoryScreenStateProps): React.JSX.Element {
  if (variant === 'loading') {
    return (
      <LoadingState
        message={message ?? 'Cargando…'}
        theme={theme}
        layout="section"
        className={styles.state}
      />
    );
  }

  const defaultMessage =
    variant === 'empty' ? 'No hay datos para mostrar.' : 'Error al cargar datos.';

  return (
    <div className={styles.state} role="status">
      <p>{message ?? defaultMessage}</p>
      {variant === 'error' && onRetry ? (
        <button type="button" className={styles.retry} onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

import styles from './InventoryScreenState.module.scss';

interface InventoryScreenStateProps {
  variant: 'loading' | 'empty' | 'error';
  message?: string;
  onRetry?: () => void;
}

export function InventoryScreenState({
  variant,
  message,
  onRetry,
}: InventoryScreenStateProps): React.JSX.Element {
  const defaultMessage =
    variant === 'loading'
      ? 'Cargando...'
      : variant === 'empty'
        ? 'No hay datos para mostrar.'
        : 'Error al cargar datos.';

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

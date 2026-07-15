import styles from './SettlementBlocksWarningsPanel.module.scss';

interface Props {
  blocks?: string[];
  warnings?: string[];
}

/**
 * OS-591 (fase 4) — muestra los mensajes de `blocks`/`warnings` EXACTAMENTE como los
 * devuelve el backend, sin reinterpretarlos ni resumirlos. Las acciones para resolver un
 * bloqueo específico (reconciliar salario pendiente, validar fórmula legal, etc.) las
 * decide el componente padre inspeccionando el código al inicio de cada mensaje.
 */
export function SettlementBlocksWarningsPanel({
  blocks = [],
  warnings = [],
}: Props): React.JSX.Element | null {
  if (blocks.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className={styles.panel}>
      {blocks.length > 0 ? (
        <div className={styles.blocks} role="alert">
          <p className={styles.title}>Bloqueos — deben resolverse antes de continuar</p>
          <ul>
            {blocks.map((block, index) => (
              <li key={index}>{block}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className={styles.warnings} role="status">
          <p className={styles.title}>Advertencias</p>
          <ul>
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

import styles from './PilaValidationErrors.module.scss';
import type { PilaValidationError } from '../types/pila.types';
import { groupPilaErrorsByEmployee } from '../utils/pila-display';

interface Props {
  errors: PilaValidationError[];
}

export function PilaValidationErrors({ errors }: Props): React.JSX.Element {
  if (errors.length === 0) {
    return <p className={styles.empty}>Sin errores de validación.</p>;
  }

  const groups = groupPilaErrorsByEmployee(errors);

  return (
    <div className={styles.root} role="alert">
      <p className={styles.summary}>
        {errors.length} {errors.length === 1 ? 'error' : 'errores'} impiden generar el archivo PILA.
      </p>
      <ul className={styles.groups}>
        {groups.map((group) => (
          <li key={group.key} className={styles.group}>
            <h4 className={styles.employee}>
              {group.employeeName}
              {!group.key.startsWith('field:') ? (
                <span className={styles.employeeMeta}> · …{group.key.slice(-6)}</span>
              ) : null}
            </h4>
            <ul className={styles.errors}>
              {group.errors.map((error, index) => (
                <li key={`${error.field}-${index}`} className={styles.errorItem}>
                  <span className={styles.field}>{error.field}</span>
                  <span className={styles.message}>{error.message}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

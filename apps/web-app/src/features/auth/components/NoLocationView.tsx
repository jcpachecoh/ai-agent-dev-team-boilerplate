import { Button, FieldAlertBanner } from '@restopsiq/ui';

import { useLogout } from '../hooks/useLogout';
import styles from './NoLocationView.module.scss';

export function NoLocationView(): React.JSX.Element {
  const handleLogout = useLogout();

  return (
    <div className={styles.screen} data-testid="no-location-screen">
      <div className={styles.panel}>
        <FieldAlertBanner variant="warning">
          Su usuario no tiene ninguna sede asignada. Contacte al administrador para continuar.
        </FieldAlertBanner>
        <p className={styles.help}>
          No es posible operar en la plataforma hasta que se le asigne al menos una sede activa.
        </p>
        <Button type="button" variant="secondary" size="medium" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

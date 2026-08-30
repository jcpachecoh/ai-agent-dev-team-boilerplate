import { Button, FieldAlertBanner } from '@restopsiq/ui';

import styles from './NoLocationScreen.module.scss';

export interface NoLocationScreenProps {
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

export function NoLocationScreen({
  onLogout,
  isLoggingOut = false,
}: NoLocationScreenProps): React.JSX.Element {
  return (
    <div className={styles.screen} data-testid="no-location-screen">
      <div className={styles.panel}>
        <FieldAlertBanner variant="warning" theme="dark">
          Su usuario no tiene ninguna sede asignada. Contacte al administrador para continuar.
        </FieldAlertBanner>
        <p className={styles.help}>
          No es posible operar en Plant hasta que se le asigne al menos una sede activa.
        </p>
        {onLogout ? (
          <Button type="button" variant="secondary" onClick={onLogout} disabled={isLoggingOut}>
            {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default NoLocationScreen;

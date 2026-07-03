import { Button, EmptyState } from '@restopsiq/ui';
import { useNavigate } from 'react-router-dom';

import { NOMINA_DEFAULT_ROUTE } from '@/config/rbac.config';
import { useUiTheme } from '@/hooks/useUiTheme';
import styles from './UnauthorizedPage.module.scss';

export default function UnauthorizedPage(): React.JSX.Element {
  const navigate = useNavigate();
  const theme = useUiTheme();

  return (
    <div className={styles.page}>
      <EmptyState
        variant="error"
        theme={theme}
        title="Acceso denegado"
        description="No tienes permisos para acceder a este módulo."
        action={
          <Button
            type="button"
            variant="primary"
            onClick={() => void navigate(NOMINA_DEFAULT_ROUTE)}
          >
            Volver a Nómina
          </Button>
        }
      />
    </div>
  );
}

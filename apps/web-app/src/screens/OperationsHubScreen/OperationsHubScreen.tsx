import {
  LogoutButton,
  OperationsEntryCard,
  OperationsHubHeader,
  OperationsStatCard,
  OperationsStatsBar,
} from '@restopsiq/ui';
import { Activity, AlertOctagon, CheckCircle2, ChefHat, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';

import styles from './OperationsHubScreen.module.scss';

interface OperationsHubScreenProps {
  operatorName?: string;
  onLogout?: () => void;
  onOpenRecipes?: () => void;
}

export function OperationsHubScreen({
  operatorName = 'Operario',
  onLogout,
  onOpenRecipes,
}: OperationsHubScreenProps): React.JSX.Element {
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setClock(
        new Date().toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      );
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const dateLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className={styles.screen}>
      <OperationsHubHeader
        theme="dark"
        size="md"
        time={clock}
        dateLabel={dateLabel}
        brandSubtitle="PALOS DE LEÑA · BOGOTÁ"
      />

      <OperationsStatsBar theme="dark" size="md">
        <OperationsStatCard
          theme="dark"
          size="md"
          label="Estaciones activas"
          value="5/6"
          icon={<Activity aria-hidden />}
          iconColor="success"
          valueColor="success"
        />
        <OperationsStatCard
          theme="dark"
          size="md"
          label="Alarmas activas"
          value="4"
          icon={<AlertOctagon aria-hidden />}
          iconColor="danger"
          valueColor="danger"
        />
        <OperationsStatCard
          theme="dark"
          size="md"
          label="Ordenes en curso"
          value="6"
          icon={<Clock3 aria-hidden />}
          iconColor="warning"
          valueColor="warning"
        />
        <OperationsStatCard
          theme="dark"
          size="md"
          label="Completadas hoy"
          value="12"
          icon={<CheckCircle2 aria-hidden />}
          iconColor="success"
          valueColor="success"
        />
      </OperationsStatsBar>

      <div className={styles.body}>
        <div className={styles.bodyTop}>
          <div>
            <p className={styles.kicker}>Modulos operativos</p>
            <h1 className={styles.title}>Panel de operaciones</h1>
          </div>
          <div className={styles.operator}>
            <span>{operatorName}</span>
            {onLogout ? (
              <LogoutButton variant="icon" size="sm" theme="dark" onClick={onLogout} />
            ) : null}
          </div>
        </div>

        <div className={styles.grid}>
          <OperationsEntryCard
            category="Production"
            title="Gestion de Recetas"
            description="Control de recetas de produccion, fases operacionales, validaciones y trazabilidad de ejecucion en planta."
            tags={['MES', 'Quality']}
            icon={<ChefHat size={24} aria-hidden />}
            accent="purple"
            theme="dark"
            size="md"
            onAction={onOpenRecipes}
          />
        </div>
      </div>
    </section>
  );
}

export default OperationsHubScreen;

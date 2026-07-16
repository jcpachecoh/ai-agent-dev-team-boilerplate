import { Activity } from 'lucide-react';

import { CesantiasAlertBanner } from '@/features/payroll/components/CesantiasAlertBanner';
import { PilaDeadlineAlertBanner } from '@/features/payroll/components/PilaDeadlineAlertBanner';
import { getCurrentPayrollPeriod } from '@/features/payroll/utils/mapPayrollReportToNomina';

import styles from './DashboardPage.module.scss';

export default function DashboardPage(): React.JSX.Element {
  const currentPilaPeriod = getCurrentPayrollPeriod();

  return (
    <section className={styles.page}>
      {/* OS-588 (fase 4) — se oculta sola cuando no hay liquidaciones de cesantías
          pendientes (sin dejar un contenedor vacío); el rol NOMINA no tiene acceso a este
          módulo (DASHBOARD), por eso el mismo banner también se muestra en
          /payroll/cesantias. */}
      <CesantiasAlertBanner className={styles.alertBanner} />
      {/* OS-595 — alerta vencimiento PILA del período corriente; oculta si PAID / NOT_DUE. */}
      <PilaDeadlineAlertBanner period={currentPilaPeriod} className={styles.alertBanner} />

      <div className={styles.heroIcon} aria-hidden>
        <Activity size={48} />
      </div>

      <h1 className={styles.title}>RestOpsIQ Plant</h1>
      <p className={styles.description}>
        Sistema de Ejecución de Manufactura para la Planta Central
        <br />
        Selecciona un módulo del menú lateral para comenzar
      </p>

      <div className={styles.cards}>
        <article className={[styles.card, styles.cardTeal].join(' ')}>
          <p className={styles.cardLabel}>Estaciones Activas</p>
          <p className={styles.cardValue}>5/6</p>
        </article>
        <article className={[styles.card, styles.cardGold].join(' ')}>
          <p className={styles.cardLabel}>Despachos Pendientes</p>
          <p className={styles.cardValue}>12</p>
        </article>
        <article className={[styles.card, styles.cardPurple].join(' ')}>
          <p className={styles.cardLabel}>Recetas Activas</p>
          <p className={styles.cardValue}>24</p>
        </article>
        <article className={[styles.card, styles.cardOrange].join(' ')}>
          <p className={styles.cardLabel}>Proveedores</p>
          <p className={styles.cardValue}>8</p>
        </article>
      </div>
    </section>
  );
}

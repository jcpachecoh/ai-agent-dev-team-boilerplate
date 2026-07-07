import { Activity } from 'lucide-react';

import styles from './DashboardPage.module.scss';

export default function DashboardPage(): React.JSX.Element {
  return (
    <section className={styles.page}>
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

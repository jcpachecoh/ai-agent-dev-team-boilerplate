import styles from './ModulePlaceholderPage.module.scss';

interface ModulePlaceholderPageProps {
  title: string;
  subtitle?: string;
}

export default function ModulePlaceholderPage({
  title,
  subtitle = 'Módulo en construcción. Contenido disponible próximamente.',
}: ModulePlaceholderPageProps): React.JSX.Element {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </section>
  );
}

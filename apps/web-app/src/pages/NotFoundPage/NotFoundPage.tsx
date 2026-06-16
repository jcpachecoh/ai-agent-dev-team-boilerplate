import styles from './NotFoundPage.module.scss';

export default function NotFoundPage(): React.JSX.Element {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>404 — Page not found</h1>
      <p className={styles.description}>The page you are looking for does not exist.</p>
    </div>
  );
}

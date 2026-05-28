import type { ReactNode } from 'react';
import styles from './AppLayout.module.scss';

interface AppLayoutProps {
  children: ReactNode;
}

const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? 'dev';

export default function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav} aria-label="Main navigation">
        <span className={styles.navBrand}>RestOpsIQ</span>
      </nav>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <span className={styles.footerText}>v{APP_VERSION}</span>
      </footer>
    </div>
  );
}

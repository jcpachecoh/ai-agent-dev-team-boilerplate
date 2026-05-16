import { Outlet } from 'react-router';
import { Sidebar } from '@/components/Sidebar';
import styles from './AppLayout.module.css';

export function AppLayout(): JSX.Element {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';

import styles from './Layout.module.scss';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop]);

  const handleToggleCollapse = useCallback(() => {
    if (isDesktop) {
      setCollapsed((value) => !value);
      return;
    }
    setMobileOpen((value) => !value);
  }, [isDesktop]);

  const handleNavigate = useCallback(() => {
    if (!isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop]);

  return (
    <div className={styles.shell}>
      <Sidebar
        collapsed={isDesktop && collapsed}
        open={isDesktop || mobileOpen}
        overlay={!isDesktop}
        onToggleCollapse={handleToggleCollapse}
        onNavigate={handleNavigate}
      />

      {!isDesktop && mobileOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className={styles.mainColumn}>
        <Header showMenuButton={!isDesktop} onMenuClick={() => setMobileOpen((value) => !value)} />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

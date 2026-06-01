import { Bell, Clock, Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import Breadcrumbs from '@/components/Breadcrumbs';
import UserMenu from '@/components/UserMenu';
import { getBreadcrumbsForPath } from '@/constants/navigation';
import { useLogout } from '@/features/auth/hooks/useLogout';

import styles from './Header.module.scss';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export default function Header({
  onMenuClick,
  showMenuButton = false,
}: HeaderProps): React.JSX.Element {
  const handleLogout = useLogout();
  const { pathname } = useLocation();
  const breadcrumbs = getBreadcrumbsForPath(pathname);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [dateLabel, setDateLabel] = useState(() => formatDate(new Date()));

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const now = new Date();
      setClock(formatClock(now));
      setDateLabel(formatDate(now));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {showMenuButton ? (
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Abrir menú"
            onClick={onMenuClick}
          >
            <Menu size={16} />
          </button>
        ) : null}

        <div className={styles.statusGroup}>
          <div className={[styles.pill, styles.pillActive].join(' ')}>
            <span className={styles.statusDot} aria-hidden />
            PLANTA CENTRAL
          </div>
          <div className={styles.pill}>
            <Clock size={14} aria-hidden />
            TURNO MAÑANA
          </div>
        </div>

        <div className={styles.breadcrumbs}>
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      <div className={styles.center}>
        <label className={styles.search}>
          <Search size={14} className={styles.searchIcon} aria-hidden />
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Buscar en el sistema..."
            aria-label="Buscar en el sistema"
          />
        </label>
      </div>

      <div className={styles.right}>
        <div className={styles.clock} aria-live="polite">
          <span>{dateLabel}</span>
          <span className={styles.clockDivider} aria-hidden />
          <span className={styles.clockTime}>{clock}</span>
        </div>

        <button type="button" className={styles.notificationButton} aria-label="Notificaciones">
          <Bell size={16} />
          <span className={styles.notificationDot} aria-hidden />
        </button>

        <UserMenu onLogout={handleLogout} />
      </div>
    </header>
  );
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function formatDate(date: Date): string {
  return date
    .toLocaleDateString('es-CO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace('.', '');
}

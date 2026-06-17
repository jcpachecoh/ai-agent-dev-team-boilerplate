import { LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useMe } from '@/features/auth/hooks/useMe';

import styles from './UserMenu.module.scss';

interface UserMenuProps {
  onLogout?: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: user, isPending } = useMe();

  const displayName = user?.displayName ?? (isPending ? 'Cargando…' : 'Usuario');
  const displayRole = user?.displayRole ?? '';
  const displayEmail = user?.email ?? '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.menu} ref={menuRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.avatar} aria-hidden>
          <User size={16} />
        </span>
        <span className={styles.name}>{displayName}</span>
      </button>

      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            {displayRole ? <span className={styles.userRole}>{displayRole}</span> : null}
            {displayEmail ? <span className={styles.userEmail}>{displayEmail}</span> : null}
          </div>
          <button
            type="button"
            className={styles.logoutButton}
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout?.();
            }}
          >
            <LogOut size={14} aria-hidden /> Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

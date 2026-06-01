import { LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { MOCK_USER } from '@/constants/navigation';

import styles from './UserMenu.module.scss';

interface UserMenuProps {
  onLogout?: () => void;
}

export default function UserMenu({ onLogout }: UserMenuProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        <span className={styles.name}>{MOCK_USER.name}</span>
      </button>

      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.userInfo}>
            <span className={styles.userName}>{MOCK_USER.name}</span>
            <span className={styles.userRole}>{MOCK_USER.role}</span>
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

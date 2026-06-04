import { useEffect, useRef, useState, type JSX } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [{ label: 'Projects', to: '/projects', exact: true }] as const;

const PROJECT_NAV_ITEMS = [
  { label: 'Test Suites', segment: 'suites' },
  { label: 'Test Runs', segment: 'runs' },
  { label: 'Milestones', segment: 'milestones' },
  { label: 'Requirements', segment: 'requirements' },
] as const;

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

export function Sidebar(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  async function handleLogout(): Promise<void> {
    setMenuOpen(false);
    await logout();
    navigate('/login');
  }

  return (
    <nav className={styles.sidebar}>
      <div className={styles.brand}>TestLab</div>
      <ul className={styles.nav}>
        {NAV_ITEMS.map(({ label, to }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
            >
              {label}
            </NavLink>
          </li>
        ))}
        {projectId &&
          PROJECT_NAV_ITEMS.map(({ label, segment }) => (
            <li key={segment}>
              <NavLink
                to={`/projects/${projectId}/${segment}`}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              >
                {label}
              </NavLink>
            </li>
          ))}
      </ul>

      {user && (
        <div className={styles.footer} ref={menuRef}>
          {menuOpen && (
            <div className={styles.menu} role="menu">
              <NavLink
                to="/profile"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </NavLink>
              <button
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                role="menuitem"
                onClick={() => void handleLogout()}
              >
                Log out
              </button>
            </div>
          )}

          <button
            className={`${styles.userTrigger} ${menuOpen ? styles.userTriggerOpen : ''}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={styles.avatar}>{getInitials(user.email)}</span>
            <span className={styles.email} title={user.email}>
              {user.email}
            </span>
            <svg
              className={`${styles.chevron} ${menuOpen ? styles.chevronUp : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 4.5L6 8.5L10 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </nav>
  );
}

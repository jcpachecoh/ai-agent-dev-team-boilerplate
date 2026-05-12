import { NavLink, useParams } from 'react-router';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [{ label: 'Projects', to: '/projects', exact: true }] as const;

const PROJECT_NAV_ITEMS = [
  { label: 'Test Suites', segment: 'suites' },
  { label: 'Test Runs', segment: 'runs' },
  { label: 'Milestones', segment: 'milestones' },
  { label: 'Requirements', segment: 'requirements' },
] as const;

export function Sidebar(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();

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
    </nav>
  );
}

import { NavLink } from 'react-router-dom';

import { ATTENDANCE_ROUTES } from '../../constants/routes';
import styles from './TurnosSubNav.module.scss';

export function TurnosSubNav(): React.JSX.Element {
  return (
    <nav className={styles.subNav} aria-label="Navegación de turnos">
      <NavLink
        to={ATTENDANCE_ROUTES.shifts}
        end
        className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}
      >
        Listado de Turnos
      </NavLink>
      <NavLink
        to={ATTENDANCE_ROUTES.shiftsAssignment}
        className={({ isActive }) => (isActive ? styles.tabActive : styles.tab)}
      >
        Asignación de Turnos
      </NavLink>
    </nav>
  );
}

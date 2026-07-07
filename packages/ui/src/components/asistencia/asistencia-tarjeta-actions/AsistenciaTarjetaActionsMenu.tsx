import { ChevronDown, FileSpreadsheet, FileText, Mail } from 'lucide-react';
import { useEffect, useRef, useState, type JSX } from 'react';

import type { AsistenciaTarjetaExportAction, AsistenciaTheme } from '../shared/asistencia-types';
import styles from './AsistenciaTarjetaActionsMenu.module.scss';

export interface AsistenciaTarjetaActionsMenuProps {
  onExport?: (action: AsistenciaTarjetaExportAction) => void;
  theme?: AsistenciaTheme;
  className?: string;
}

const ACTIONS: { id: AsistenciaTarjetaExportAction; label: string; icon: JSX.Element }[] = [
  { id: 'excel', label: 'Exportar Excel', icon: <FileSpreadsheet aria-hidden /> },
  { id: 'pdf', label: 'Exportar PDF', icon: <FileText aria-hidden /> },
  { id: 'email', label: 'Enviar por correo', icon: <Mail aria-hidden /> },
];

export function AsistenciaTarjetaActionsMenu({
  onExport,
  theme = 'dark',
  className,
}: AsistenciaTarjetaActionsMenuProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={wrapRef}
      className={[styles.wrap, styles[`theme--${theme}`], className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        Acciones
        <ChevronDown className={styles.chevron} aria-hidden />
      </button>
      {open ? (
        <div className={styles.panel} role="menu">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              className={styles.item}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onExport?.(action.id);
              }}
            >
              <span className={styles.itemIcon}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default AsistenciaTarjetaActionsMenu;

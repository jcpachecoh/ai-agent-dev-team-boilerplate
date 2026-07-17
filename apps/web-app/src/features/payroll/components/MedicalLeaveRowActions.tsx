import { EmpleadoRowActionButton, type EmpleadoTheme } from '@restopsiq/ui';
import { Check, DollarSign, Download, MoreVertical, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type { MedicalLeaveSummary } from '../types/medical-leaves.types';
import {
  canMarkRecovered,
  canRadicateMedicalLeave,
  canRejectMedicalLeave,
} from '../utils/medical-leaves-display';
import styles from './MedicalLeaveRowActions.module.scss';

interface MenuAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface Props {
  leave: MedicalLeaveSummary;
  theme: EmpleadoTheme;
  canWrite: boolean;
  downloading: boolean;
  statusBusy: boolean;
  onView: () => void;
  onDownload: () => void;
  onRadicate: () => void;
  onRecovered: () => void;
  onReject: () => void;
}

function buildMenuActions({
  leave,
  canWrite,
  downloading,
  statusBusy,
  onDownload,
  onRadicate,
  onRecovered,
  onReject,
}: Omit<Props, 'theme' | 'onView'>): MenuAction[] {
  const actions: MenuAction[] = [];

  if (leave.supportStorageObjectId) {
    actions.push({
      id: 'download',
      label: 'Descargar',
      icon: <Download aria-hidden />,
      onClick: onDownload,
      disabled: downloading,
    });
  }

  if (canWrite && canRadicateMedicalLeave(leave.status, !!leave.supportStorageObjectId)) {
    actions.push({
      id: 'radicate',
      label: 'Radicar',
      icon: <Check aria-hidden />,
      onClick: onRadicate,
      disabled: statusBusy,
    });
  }

  if (canWrite && canMarkRecovered(leave.status)) {
    actions.push({
      id: 'recover',
      label: 'Registrar pago',
      icon: <DollarSign aria-hidden />,
      onClick: onRecovered,
      disabled: statusBusy,
    });
  }

  if (canWrite && canRejectMedicalLeave(leave.status)) {
    actions.push({
      id: 'cancel',
      label: 'Cancelar',
      icon: <X aria-hidden />,
      onClick: onReject,
      danger: true,
    });
  }

  return actions;
}

export function MedicalLeaveRowActions({
  leave,
  theme,
  canWrite,
  downloading,
  statusBusy,
  onView,
  onDownload,
  onRadicate,
  onRecovered,
  onReject,
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const menuActions = buildMenuActions({
    leave,
    canWrite,
    downloading,
    statusBusy,
    onDownload,
    onRadicate,
    onRecovered,
    onReject,
  });
  const hasMenuActions = menuActions.length > 0;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.actions} ref={wrapRef}>
      <EmpleadoRowActionButton
        variant="view"
        theme={theme}
        onClick={onView}
        title="Ver"
        aria-label="Ver detalle de incapacidad"
      />
      <button
        type="button"
        className={styles.menuTrigger}
        aria-label="Más acciones de incapacidad"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={!hasMenuActions}
        onClick={(event) => {
          event.stopPropagation();
          if (!hasMenuActions) return;
          setOpen((current) => !current);
        }}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
      {open && hasMenuActions ? (
        <div
          id={menuId}
          className={styles.menuPanel}
          role="menu"
          aria-label="Acciones de incapacidad"
          onMouseDown={(event) => event.stopPropagation()}
        >
          {menuActions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={[styles.menuItem, action.danger ? styles.menuItemDanger : '']
                .filter(Boolean)
                .join(' ')}
              disabled={action.disabled}
              onClick={(event) => {
                event.stopPropagation();
                setOpen(false);
                action.onClick();
              }}
            >
              <span className={styles.menuItemIcon}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

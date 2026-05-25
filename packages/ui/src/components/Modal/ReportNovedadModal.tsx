import * as React from 'react';
import clsx from 'clsx';
import {
  AlertCircle,
  Box,
  Diamond,
  Flame,
  Pause,
  Settings,
  Send,
  TriangleAlert,
} from 'lucide-react';
import styles from './Modal.module.scss';
import { Modal } from './Modal';
import { Button } from '../Button';

export type NovedadTipo = 'pausa' | 'insumo' | 'equipo' | 'producto' | 'accidente' | 'otro';

const TIPO_OPTIONS: {
  id: NovedadTipo;
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'pausa', label: 'Pausa operario', icon: <Pause size={20} aria-hidden /> },
  { id: 'insumo', label: 'Insumo insuficiente', icon: <Box size={20} aria-hidden /> },
  { id: 'equipo', label: 'Equipo fallado', icon: <Settings size={20} aria-hidden /> },
  {
    id: 'producto',
    label: 'Producto no conforme',
    icon: <TriangleAlert size={20} aria-hidden />,
  },
  { id: 'accidente', label: 'ACCIDENTE', icon: <Flame size={20} aria-hidden /> },
  { id: 'otro', label: 'Otro', icon: <Diamond size={20} aria-hidden /> },
];

export interface ReportNovedadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (payload: { tipo: NovedadTipo; descripcion: string }) => void;
  defaultTipo?: NovedadTipo;
}

export function ReportNovedadModal({
  open,
  onOpenChange,
  onSubmit,
  defaultTipo = 'accidente',
}: ReportNovedadModalProps) {
  const [tipo, setTipo] = React.useState<NovedadTipo>(defaultTipo);
  const [descripcion, setDescripcion] = React.useState('');

  React.useEffect(() => {
    if (open) setTipo(defaultTipo);
  }, [open, defaultTipo]);

  const handleSubmit = () => {
    onSubmit?.({ tipo, descripcion });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      theme="dark"
      hideCloseButton={false}
      footer={
        <div className={styles.reportFooter}>
          <Button variant="secondary" size="medium" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="primary" size="medium" onClick={handleSubmit}>
            <Send size={16} aria-hidden />
            Enviar Novedad
          </Button>
        </div>
      }
    >
      <div className={styles.reportHeader}>
        <div className={styles.reportHeaderIcon}>
          <AlertCircle size={20} aria-hidden />
        </div>
        <h2 className={styles.reportTitle}>Reportar Novedad</h2>
      </div>

      <p className={styles.sectionLabel}>Seleccione tipo de novedad</p>
      <div className={styles.typeGrid} role="radiogroup" aria-label="Tipo de novedad">
        {TIPO_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={tipo === opt.id}
            className={clsx(styles.typeOption, tipo === opt.id && styles['typeOption--selected'])}
            onClick={() => setTipo(opt.id)}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      <p className={styles.sectionLabel}>Descripción adicional (opcional)</p>
      <textarea
        className={styles.textarea}
        placeholder="Describa brevemente la situación..."
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        rows={4}
      />
    </Modal>
  );
}

import { RecetaFormButton, RolCheckbox, RolFormField, RolModal, RolTextInput } from '@restopsiq/ui';
import { Calendar } from 'lucide-react';
import { useEffect, useId, useRef, useState, type JSX } from 'react';

import { useTheme } from '@/providers/ThemeProvider';

import {
  LABOR_LEGAL_PARAMETER_KEY_LABELS,
  LABOR_LEGAL_PARAMETER_KEYS,
  type CreateLaborLegalParameterFormValues,
  type UpdateLaborLegalParameterFormValues,
} from '../types';
import styles from './LaborLegalParameterFormModal.module.scss';

interface CreateModeProps {
  mode: 'create';
  /** Only SUPER_ADMIN may create a global (tenantId null) parameter — OWNER always scopes to their own tenant. */
  canCreateGlobal: boolean;
  actorTenantId: string;
  /** Increment after a successful save to clear the draft for the next create session. */
  createResetKey?: number;
  onSave: (values: CreateLaborLegalParameterFormValues) => void;
}

interface EditModeProps {
  mode: 'edit';
  keyLabel: string;
  initialValue: { value: number; validFrom: string; validTo: string | null; source: string | null };
  onSave: (values: UpdateLaborLegalParameterFormValues) => void;
}

type LaborLegalParameterFormModalProps = (CreateModeProps | EditModeProps) & {
  open: boolean;
  saving?: boolean;
  onClose: () => void;
};

function isNumericDraft(value: string): boolean {
  return value === '' || /^-?\d*(\.\d*)?$/.test(value);
}

interface DateFieldProps {
  id: string;
  theme: 'light' | 'dark';
  value: string;
  onChange: (value: string) => void;
}

function DateField({ id, theme, value, onChange }: DateFieldProps): JSX.Element {
  const wrapRef = useRef<HTMLDivElement>(null);

  const openPicker = () => {
    const input = wrapRef.current?.querySelector('input');
    if (!input || input.disabled) return;
    input.focus();
    input.showPicker?.();
  };

  return (
    <div
      ref={wrapRef}
      className={styles.dateField}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPicker();
        }
      }}
      role="presentation"
    >
      <RolTextInput
        id={id}
        theme={theme}
        type="date"
        className={styles.dateInput}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onClick={openPicker}
      />
      <Calendar className={styles.calendarIcon} aria-hidden strokeWidth={1.75} />
    </div>
  );
}

export function LaborLegalParameterFormModal(
  props: LaborLegalParameterFormModalProps,
): JSX.Element | null {
  const { open, saving = false, onClose, mode } = props;
  const { theme } = useTheme();
  const keyId = useId();
  const valueId = useId();
  const validFromId = useId();
  const validToId = useId();
  const sourceId = useId();
  const scopeId = useId();

  const [key, setKey] = useState<string>(LABOR_LEGAL_PARAMETER_KEYS[0]);
  const [value, setValue] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [source, setSource] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === 'edit';
  const createResetKey = mode === 'create' ? props.createResetKey : undefined;
  const canCreateGlobal = mode === 'create' ? props.canCreateGlobal : false;

  useEffect(() => {
    if (isEdit) return;
    setKey(LABOR_LEGAL_PARAMETER_KEYS[0]);
    setValue('');
    setValidFrom('');
    setValidTo('');
    setSource('');
    setIsGlobal(canCreateGlobal);
    setError(null);
  }, [isEdit, createResetKey, canCreateGlobal]);

  useEffect(() => {
    if (!open || mode !== 'edit') return;
    const { initialValue } = props;
    setError(null);
    setValue(String(initialValue.value));
    setValidFrom(initialValue.validFrom.slice(0, 10));
    setValidTo(initialValue.validTo ? initialValue.validTo.slice(0, 10) : '');
    setSource(initialValue.source ?? '');
  }, [open, mode, mode === 'edit' ? props.initialValue : null]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    const numericValue = Number(value);
    if (!value.trim() || Number.isNaN(numericValue)) {
      setError('El valor es obligatorio y debe ser numérico.');
      return;
    }
    if (!isEdit && !validFrom) {
      setError('La fecha de inicio de vigencia (validFrom) es obligatoria.');
      return;
    }
    if (validTo && validFrom && validTo < validFrom) {
      setError('La fecha de fin de vigencia no puede ser anterior a la fecha de inicio.');
      return;
    }
    setError(null);

    if (isEdit) {
      props.onSave({
        value: numericValue,
        validFrom: validFrom || undefined,
        validTo: validTo ? validTo : null,
        source: source.trim() || undefined,
      });
      return;
    }

    props.onSave({
      key,
      value: numericValue,
      validFrom,
      validTo: validTo || undefined,
      source: source.trim() || undefined,
      tenantId: isGlobal ? undefined : props.actorTenantId,
    });
  };

  return (
    <RolModal
      open={open}
      title={isEdit ? `Editar vigencia: ${props.keyLabel}` : 'Nueva vigencia de parámetro legal'}
      subtitle={
        isEdit
          ? 'Modifica el valor o el rango de vigencia'
          : 'Define la key, el valor y el rango de vigencia'
      }
      theme={theme}
      onClose={onClose}
      closeLabel="Cerrar"
      footer={
        <>
          <RecetaFormButton
            variant="cancel"
            label="Cancelar"
            theme={theme}
            onClick={onClose}
            disabled={saving}
          />
          <RecetaFormButton
            variant="save"
            label={isEdit ? 'Guardar cambios' : 'Crear vigencia'}
            theme={theme}
            onClick={handleSave}
            disabled={saving}
          />
        </>
      }
    >
      <div>
        {!isEdit ? (
          <RolFormField label="Parámetro (key) *" htmlFor={keyId} theme={theme}>
            <select
              id={keyId}
              className={styles.select}
              value={key}
              onChange={(e) => setKey(e.target.value)}
            >
              {LABOR_LEGAL_PARAMETER_KEYS.map((k) => (
                <option key={k} value={k}>
                  {LABOR_LEGAL_PARAMETER_KEY_LABELS[k]} ({k})
                </option>
              ))}
            </select>
          </RolFormField>
        ) : null}

        <RolFormField label="Valor *" htmlFor={valueId} theme={theme}>
          <RolTextInput
            id={valueId}
            theme={theme}
            type="text"
            inputMode="decimal"
            className={styles.numericInput}
            value={value}
            onChange={(event) => {
              const next = event.target.value;
              if (isNumericDraft(next)) setValue(next);
            }}
            placeholder="Ej: 0.8 o 1423500"
          />
        </RolFormField>

        <RolFormField label="Vigente desde *" htmlFor={validFromId} theme={theme}>
          <DateField id={validFromId} theme={theme} value={validFrom} onChange={setValidFrom} />
        </RolFormField>

        <RolFormField
          label="Vigente hasta (opcional — vacío = indefinido)"
          htmlFor={validToId}
          theme={theme}
        >
          <DateField id={validToId} theme={theme} value={validTo} onChange={setValidTo} />
        </RolFormField>

        <RolFormField label="Fuente / referencia legal (opcional)" htmlFor={sourceId} theme={theme}>
          <RolTextInput
            id={sourceId}
            theme={theme}
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Ej: Ley 2466 de 2025"
          />
        </RolFormField>

        {!isEdit && props.canCreateGlobal ? (
          <RolCheckbox
            id={scopeId}
            theme={theme}
            label="Global (aplica a todos los tenants)"
            checked={isGlobal}
            onChange={setIsGlobal}
          />
        ) : null}
        {!isEdit && !isGlobal ? (
          <p className={styles.infoText}>Se creará como override solo para tu tenant.</p>
        ) : null}

        {error ? (
          <p role="alert" className={styles.errorText}>
            {error}
          </p>
        ) : null}
      </div>
    </RolModal>
  );
}

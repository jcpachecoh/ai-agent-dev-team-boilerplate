import { useRef, useEffect, type FormEvent, type ReactNode } from 'react';
import styles from './SimpleModal.module.css';

interface SelectOption {
  value: string;
  label: string;
}

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'select';
  required?: boolean;
  maxLength?: number;
  hint?: string;
  placeholder?: string;
  options?: SelectOption[];
  defaultValue?: string;
}

interface Props {
  title: string;
  fields: Field[];
  submitLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (data: Record<string, string>) => void;
  children?: ReactNode;
}

export function SimpleModal({
  title,
  fields,
  submitLabel = 'Create',
  isPending = false,
  error,
  onClose,
  onSubmit,
  children,
}: Props): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = new FormData(form);
    const data: Record<string, string> = {};
    for (const [key, val] of raw.entries()) {
      data[key] = val as string;
    }
    onSubmit(data);
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <h2 className={styles.title}>{title}</h2>
      <form method="dialog" onSubmit={handleSubmit} noValidate>
        {fields.map((f) => (
          <div key={f.name} className={styles.field}>
            <label htmlFor={`sm-${f.name}`} className={styles.label}>
              {f.label}
              {!f.required && <span className={styles.optional}> (optional)</span>}
            </label>
            {f.type === 'textarea' ? (
              <textarea
                id={`sm-${f.name}`}
                name={f.name}
                className={styles.textarea}
                rows={3}
                maxLength={f.maxLength}
                placeholder={f.placeholder}
              />
            ) : f.type === 'date' ? (
              <input
                id={`sm-${f.name}`}
                name={f.name}
                type="date"
                className={styles.input}
                required={f.required}
              />
            ) : f.type === 'select' ? (
              <select
                id={`sm-${f.name}`}
                name={f.name}
                className={styles.select}
                required={f.required}
                defaultValue={f.defaultValue ?? f.options?.[0]?.value}
              >
                {f.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`sm-${f.name}`}
                name={f.name}
                className={styles.input}
                required={f.required}
                maxLength={f.maxLength}
                placeholder={f.placeholder}
                autoFocus={fields.indexOf(f) === 0}
              />
            )}
            {f.hint && <span className={styles.hint}>{f.hint}</span>}
          </div>
        ))}
        {children}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.btnCancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.btnSubmit} disabled={isPending}>
            {isPending ? `${submitLabel}…` : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}

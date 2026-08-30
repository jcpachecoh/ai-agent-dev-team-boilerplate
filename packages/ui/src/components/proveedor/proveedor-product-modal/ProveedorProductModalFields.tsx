import React, { type JSX, type ReactElement, type ReactNode } from 'react';

import { RecetaTextInput } from '../../receta/receta-text-input/RecetaTextInput';
import { fieldPlaceholderFromLabel } from '../../receta/shared/field-placeholder';
import styles from './ProveedorProductModal.module.scss';

export interface ProveedorProductModalFieldsProps {
  children: ReactNode;
  className?: string;
}

export function ProveedorProductModalFields({
  children,
  className,
}: ProveedorProductModalFieldsProps): JSX.Element {
  return <div className={[styles.fieldsGrid, className].filter(Boolean).join(' ')}>{children}</div>;
}

export interface ProveedorProductModalFieldProps {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  /** Overrides auto placeholder derived from `label`. */
  placeholder?: string;
  children: ReactNode;
  fullWidth?: boolean;
  className?: string;
}

function withFieldPlaceholder(
  children: ReactNode,
  label: string | undefined,
  placeholder: string | undefined,
): ReactNode {
  const resolved = placeholder ?? (label ? fieldPlaceholderFromLabel(label) : undefined);

  if (!resolved) return children;

  return React.Children.map(children, (child) => {
    if (!React.isValidElement<{ placeholder?: string }>(child)) return child;
    if (child.type !== RecetaTextInput) return child;
    if (child.props.placeholder != null && child.props.placeholder !== '') return child;

    return React.cloneElement(child, { placeholder: resolved });
  });
}

export function ProveedorProductModalField({
  label,
  htmlFor,
  required = false,
  placeholder,
  children,
  fullWidth = false,
  className,
}: ProveedorProductModalFieldProps): JSX.Element {
  return (
    <div
      className={[styles.fieldCell, fullWidth && styles.fieldFull, className]
        .filter(Boolean)
        .join(' ')}
    >
      {label ? (
        <label className={styles.fieldLabel} htmlFor={htmlFor}>
          {label}
          {required ? <span className={styles.fieldLabelRequired}>*</span> : null}
        </label>
      ) : null}
      {withFieldPlaceholder(children, label, placeholder)}
    </div>
  );
}

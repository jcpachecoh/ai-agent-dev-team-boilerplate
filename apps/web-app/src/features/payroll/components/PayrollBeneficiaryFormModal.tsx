import { Button, Modal, RecetaFilterSelect } from '@restopsiq/ui';
import { useEffect, useState } from 'react';

import type { BeneficiaryFormRow } from '../types/payroll.types';
import {
  BENEFICIARY_DOCUMENT_TYPE_OPTIONS,
  BENEFICIARY_TYPE_OPTIONS,
  DISABILITY_OPTIONS,
  EMPTY_BENEFICIARY_FORM_ROW,
  validateBeneficiaryForm,
} from '../utils/beneficiary';
import styles from './PayrollBeneficiaryFormModal.module.scss';

interface PayrollBeneficiaryFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  theme: 'light' | 'dark';
  initialValues?: BeneficiaryFormRow;
  onClose: () => void;
  onSubmit: (values: BeneficiaryFormRow) => void;
}

export function PayrollBeneficiaryFormModal({
  open,
  mode,
  theme,
  initialValues,
  onClose,
  onSubmit,
}: PayrollBeneficiaryFormModalProps): React.JSX.Element {
  const [values, setValues] = useState<BeneficiaryFormRow>(EMPTY_BENEFICIARY_FORM_ROW);
  const [errors, setErrors] = useState<Partial<Record<keyof BeneficiaryFormRow, string>>>({});

  useEffect(() => {
    if (!open) return;
    setValues(mode === 'edit' && initialValues ? initialValues : EMPTY_BENEFICIARY_FORM_ROW);
    setErrors({});
  }, [open, mode, initialValues]);

  const handleSubmit = () => {
    const nextErrors = validateBeneficiaryForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit(values);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      size="lg"
      theme={theme}
      className={styles.modalContent}
      title={mode === 'create' ? 'Agregar beneficiario' : 'Editar beneficiario'}
      footer={
        <>
          <Button variant="secondary" size="medium" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="medium" onClick={handleSubmit}>
            Guardar
          </Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Tipo de documento</span>
            <RecetaFilterSelect
              aria-label="Tipo de documento del beneficiario"
              options={[...BENEFICIARY_DOCUMENT_TYPE_OPTIONS]}
              value={values.documentType}
              placeholder="Seleccionar"
              onChange={(value) =>
                setValues((current) => ({
                  ...current,
                  documentType: value as BeneficiaryFormRow['documentType'],
                }))
              }
              theme={theme}
              size="md"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Número de documento</span>
            <input
              className={styles.input}
              value={values.documentNumber}
              onChange={(event) =>
                setValues((current) => ({ ...current, documentNumber: event.target.value }))
              }
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Tipo de beneficiario *</span>
          <RecetaFilterSelect
            aria-label="Tipo de beneficiario"
            options={[...BENEFICIARY_TYPE_OPTIONS]}
            value={values.relationshipType}
            onChange={(value) => {
              setValues((current) => ({
                ...current,
                relationshipType: value as BeneficiaryFormRow['relationshipType'],
              }));
              setErrors((current) => ({ ...current, relationshipType: undefined }));
            }}
            theme={theme}
            size="md"
          />
          {errors.relationshipType ? (
            <p className={styles.error}>{errors.relationshipType}</p>
          ) : null}
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Primer nombre *</span>
            <input
              className={styles.input}
              value={values.primerNombre}
              onChange={(event) => {
                setValues((current) => ({ ...current, primerNombre: event.target.value }));
                setErrors((current) => ({ ...current, primerNombre: undefined }));
              }}
            />
            {errors.primerNombre ? <p className={styles.error}>{errors.primerNombre}</p> : null}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Segundo nombre</span>
            <input
              className={styles.input}
              value={values.segundoNombre}
              onChange={(event) =>
                setValues((current) => ({ ...current, segundoNombre: event.target.value }))
              }
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Primer apellido *</span>
            <input
              className={styles.input}
              value={values.primerApellido}
              onChange={(event) => {
                setValues((current) => ({ ...current, primerApellido: event.target.value }));
                setErrors((current) => ({ ...current, primerApellido: undefined }));
              }}
            />
            {errors.primerApellido ? <p className={styles.error}>{errors.primerApellido}</p> : null}
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Segundo apellido</span>
            <input
              className={styles.input}
              value={values.segundoApellido}
              onChange={(event) =>
                setValues((current) => ({ ...current, segundoApellido: event.target.value }))
              }
            />
          </label>
        </div>

        <label className={styles.field}>
          <span className={styles.label}>Fecha de nacimiento *</span>
          <input
            className={styles.input}
            type="date"
            value={values.fechaNacimiento}
            onChange={(event) => {
              setValues((current) => ({ ...current, fechaNacimiento: event.target.value }));
              setErrors((current) => ({ ...current, fechaNacimiento: undefined }));
            }}
          />
          {errors.fechaNacimiento ? <p className={styles.error}>{errors.fechaNacimiento}</p> : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Discapacidad *</span>
          <RecetaFilterSelect
            aria-label="Discapacidad del beneficiario"
            options={[...DISABILITY_OPTIONS]}
            value={values.disability}
            onChange={(value) =>
              setValues((current) => ({
                ...current,
                disability: value as BeneficiaryFormRow['disability'],
              }))
            }
            theme={theme}
            size="md"
          />
        </label>
      </div>
    </Modal>
  );
}

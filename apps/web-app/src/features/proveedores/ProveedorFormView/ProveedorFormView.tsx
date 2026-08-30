import {
  NumberInput,
  ProveedorFormActions,
  ProveedorFormHeader,
  ProveedorFormSection,
  ProveedorProductModalField,
  ProveedorProductModalFields,
  RecetaFilterSelect,
  RecetaTextInput,
  LoadingState,
} from '@restopsiq/ui';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getErrorMessage } from '@/lib/graphql-client';

import {
  CIUDADES_POR_DEPARTAMENTO,
  CONDICION_PAGO_OPTIONS,
  DEPARTAMENTO_OPTIONS,
  EMPTY_LOGISTICS_FORM,
  PROVEEDOR_TABLE_SIZE,
  TIPO_OPTIONS,
  getDepartamentoFromCiudad,
} from '../constants';
import { useSupplier } from '../hooks/useSupplier';
import { useCreateSupplier, useUpdateSupplier } from '../hooks/useSupplierMutations';
import styles from '../proveedores.module.scss';
import type {
  CondicionPago,
  SupplierFormValues,
  SupplierLogisticsFormValues,
  SupplierTipo,
} from '../types';
import { useUiTheme } from '@/hooks/useUiTheme';
import ProveedorLogisticsFormSection from './ProveedorLogisticsFormSection';
import { mapLogisticsApiToForm } from '../mappers/logistics';

const EMPTY_FORM: SupplierFormValues = {
  razonSocial: '',
  nit: '',
  dv: '',
  tipo: 'PERSONA_JURIDICA',
  direccion: '',
  departamento: '',
  ciudad: '',
  telefono: '',
  email: '',
  contactoNombre: '',
  condicionPago: 'DIAS_30',
  cupoCredito: 0,
  isActive: true,
  logistics: { ...EMPTY_LOGISTICS_FORM },
};

interface ProveedorFormViewProps {
  mode: 'create' | 'edit';
}

const FORM_FIELD_SIZE = 'md' as const;

export default function ProveedorFormView({ mode }: ProveedorFormViewProps): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const supplierQuery = useSupplier(mode === 'edit' ? supplierId : undefined);
  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier();
  const existing = supplierQuery.data ?? undefined;

  const [form, setForm] = useState<SupplierFormValues>(EMPTY_FORM);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [logisticsErrors, setLogisticsErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!existing) return;
    const ciudadActual = existing.ciudad ?? '';
    const depDerivado = existing.departamento ?? getDepartamentoFromCiudad(ciudadActual);
    setForm({
      razonSocial: existing.razonSocial,
      nit: existing.nit,
      dv: existing.dv ?? '',
      tipo: existing.tipo,
      direccion: existing.direccion ?? '',
      departamento: depDerivado,
      ciudad: ciudadActual,
      telefono: existing.telefono ?? '',
      email: existing.email ?? '',
      contactoNombre: existing.contactoNombre ?? '',
      condicionPago: existing.condicionPago,
      cupoCredito: existing.cupoCredito,
      isActive: existing.isActive,
      logistics: mapLogisticsApiToForm(existing.logistics),
    });
  }, [existing]);

  const ciudadOptions = useMemo(() => {
    const depKey = form.departamento ?? '';
    const options = depKey ? (CIUDADES_POR_DEPARTAMENTO[depKey] ?? []) : [];
    // Preserve existing city value even if not in catalog
    if (form.ciudad && !options.find((o) => o.value === form.ciudad)) {
      return [{ value: form.ciudad, label: form.ciudad }, ...options];
    }
    return options;
  }, [form.departamento, form.ciudad]);

  const isValid = form.razonSocial.trim().length > 0 && form.nit.trim().length > 0;

  const title = useMemo(() => (mode === 'create' ? 'NUEVO PROVEEDOR' : 'EDITAR PROVEEDOR'), [mode]);

  const updateField = <K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
  ): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleDepartamentoChange = (value: string): void => {
    const citiesForDep = CIUDADES_POR_DEPARTAMENTO[value] ?? [];
    const ciudadSigueValida = citiesForDep.some((c) => c.value === form.ciudad);
    setForm((current) => ({
      ...current,
      departamento: value,
      ciudad: ciudadSigueValida ? current.ciudad : '',
    }));
  };

  const handleCancel = (): void => {
    if (mode === 'edit' && supplierId) {
      navigate(`/proveedores/${supplierId}`);
      return;
    }
    navigate('/proveedores');
  };

  const validateLogistics = (logistics: SupplierLogisticsFormValues): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!logistics.deliveryMode) errors.deliveryMode = 'Modalidad de entrega es requerida';
    if (!logistics.deliveryPlace) errors.deliveryPlace = 'Lugar de entrega es requerido';
    if (!logistics.leadTimeDays || logistics.leadTimeDays <= 0) {
      errors.leadTimeDays = 'Lead time debe ser un entero positivo';
    }
    if (!logistics.transportType) errors.transportType = 'Tipo de transporte es requerido';
    if (!logistics.receptionResponsibleUserId) {
      errors.receptionResponsibleUserId = 'Responsable de recepción es requerido';
    }
    if (logistics.deliveryDays.length === 0) {
      errors.deliveryDays = 'Selecciona al menos un día de entrega';
    }
    if (logistics.deliveryPlace === 'OTHER' && !logistics.deliveryPlaceCustom.trim()) {
      errors.deliveryPlaceCustom = 'Indica el lugar personalizado';
    }
    if (
      logistics.timeWindowStart &&
      logistics.timeWindowEnd &&
      logistics.timeWindowStart > logistics.timeWindowEnd
    ) {
      errors.timeWindowEnd = 'La hora fin debe ser posterior a la hora inicio';
    }
    if (logistics.requiresColdChain) {
      if (logistics.transportTempMinC === null) {
        errors.transportTempMinC = 'Temperatura mínima requerida';
      }
      if (logistics.transportTempMaxC === null) {
        errors.transportTempMaxC = 'Temperatura máxima requerida';
      }
    }
    return errors;
  };

  const handleSave = async (saveLogisticsAsDraft = false): Promise<void> => {
    if (!isValid) return;
    setSaveError(null);

    if (!saveLogisticsAsDraft) {
      const errors = validateLogistics(form.logistics);
      setLogisticsErrors(errors);
      if (Object.keys(errors).length > 0) return;
    } else {
      setLogisticsErrors({});
    }

    const payload: SupplierFormValues = {
      ...form,
      razonSocial: form.razonSocial.trim(),
      nit: form.nit.trim(),
      dv: form.dv?.trim() || undefined,
      direccion: form.direccion?.trim() || undefined,
      departamento: form.departamento?.trim() || undefined,
      ciudad: form.ciudad?.trim() || undefined,
      telefono: form.telefono?.trim() || undefined,
      email: form.email?.trim() || undefined,
      contactoNombre: form.contactoNombre?.trim() || undefined,
    };

    try {
      if (mode === 'create') {
        const created = await createMutation.mutateAsync({ values: payload, saveLogisticsAsDraft });
        navigate(`/proveedores/${created.id}`);
        return;
      }

      if (supplierId) {
        await updateMutation.mutateAsync({ id: supplierId, values: payload, saveLogisticsAsDraft });
        navigate(`/proveedores/${supplierId}`);
      }
    } catch (error) {
      setSaveError(getErrorMessage(error));
    }
  };

  if (mode === 'edit' && supplierId && supplierQuery.isPending) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <LoadingState message="Cargando proveedor…" theme={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    );
  }

  if (mode === 'edit' && supplierId && (supplierQuery.isError || !existing)) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <p className={styles.notFound}>Proveedor no encontrado.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.content} ${styles.contentPadded}`}>
      <ProveedorFormHeader title={title} onBack={handleCancel} theme={theme} size="xl" />

      <div className={styles.formPage}>
        <ProveedorFormSection title="Información general" theme={theme} size="xl">
          <div className={styles.formSectionFields}>
            <ProveedorProductModalFields>
              <ProveedorProductModalField
                fullWidth
                label="Razón social"
                htmlFor="razonSocial"
                required
              >
                <RecetaTextInput
                  id="razonSocial"
                  theme={theme}
                  value={form.razonSocial}
                  onChange={(event) => updateField('razonSocial', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="NIT" htmlFor="nit" required>
                <RecetaTextInput
                  id="nit"
                  theme={theme}
                  value={form.nit}
                  onChange={(event) => updateField('nit', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="DV" htmlFor="dv">
                <RecetaTextInput
                  id="dv"
                  theme={theme}
                  value={form.dv}
                  onChange={(event) => updateField('dv', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Tipo" htmlFor="tipo">
                <RecetaFilterSelect
                  id="tipo"
                  options={TIPO_OPTIONS}
                  value={form.tipo}
                  onChange={(value) => updateField('tipo', value as SupplierTipo)}
                  theme={theme}
                  size={FORM_FIELD_SIZE}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField fullWidth label="Dirección" htmlFor="direccion">
                <RecetaTextInput
                  id="direccion"
                  theme={theme}
                  value={form.direccion}
                  onChange={(event) => updateField('direccion', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Departamento" htmlFor="departamento">
                <RecetaFilterSelect
                  id="departamento"
                  options={DEPARTAMENTO_OPTIONS}
                  value={form.departamento ?? ''}
                  onChange={handleDepartamentoChange}
                  theme={theme}
                  size={FORM_FIELD_SIZE}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Ciudad" htmlFor="ciudad">
                <RecetaFilterSelect
                  id="ciudad"
                  options={ciudadOptions}
                  value={form.ciudad ?? ''}
                  onChange={(value) => updateField('ciudad', value)}
                  theme={theme}
                  size={FORM_FIELD_SIZE}
                />
              </ProveedorProductModalField>
            </ProveedorProductModalFields>
          </div>
        </ProveedorFormSection>

        <ProveedorFormSection title="Contacto" theme={theme} size="xl">
          <div className={styles.formSectionFields}>
            <ProveedorProductModalFields>
              <ProveedorProductModalField label="Nombre contacto" htmlFor="contactoNombre">
                <RecetaTextInput
                  id="contactoNombre"
                  theme={theme}
                  value={form.contactoNombre}
                  onChange={(event) => updateField('contactoNombre', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Teléfono del contacto" htmlFor="telefono">
                <RecetaTextInput
                  id="telefono"
                  type="tel"
                  theme={theme}
                  value={form.telefono}
                  onChange={(event) => updateField('telefono', event.target.value)}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Correo del contacto" htmlFor="email">
                <RecetaTextInput
                  id="email"
                  type="email"
                  theme={theme}
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </ProveedorProductModalField>
            </ProveedorProductModalFields>
          </div>
        </ProveedorFormSection>

        <ProveedorFormSection title="Condiciones comerciales" theme={theme} size="xl">
          <div className={styles.formSectionFields}>
            <ProveedorProductModalFields>
              <ProveedorProductModalField label="Condición de pago" htmlFor="condicionPago">
                <RecetaFilterSelect
                  id="condicionPago"
                  options={CONDICION_PAGO_OPTIONS}
                  value={form.condicionPago}
                  onChange={(value) => updateField('condicionPago', value as CondicionPago)}
                  theme={theme}
                  size={FORM_FIELD_SIZE}
                />
              </ProveedorProductModalField>
              <ProveedorProductModalField label="Cupo crédito (COP)" htmlFor="cupoCredito">
                <NumberInput
                  id="cupoCredito"
                  variant="currency"
                  value={form.cupoCredito}
                  onChange={(value) => updateField('cupoCredito', value)}
                  theme={theme}
                  size={FORM_FIELD_SIZE}
                  min={0}
                />
              </ProveedorProductModalField>
              {mode === 'edit' && (
                <ProveedorProductModalField label="Estado">
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) => updateField('isActive', event.target.checked)}
                    />
                    Proveedor activo
                  </label>
                </ProveedorProductModalField>
              )}
            </ProveedorProductModalFields>
          </div>
        </ProveedorFormSection>

        <ProveedorLogisticsFormSection
          value={form.logistics}
          onChange={(logistics) => setForm((current) => ({ ...current, logistics }))}
          errors={logisticsErrors}
          theme={theme}
        />

        {saveError && (
          <p className={styles.formError} role="alert">
            {saveError}
          </p>
        )}

        <ProveedorFormActions
          theme={theme}
          size={PROVEEDOR_TABLE_SIZE}
          onCancel={handleCancel}
          onSave={() => void handleSave(false)}
          onSaveDraft={() => void handleSave(true)}
          saveDisabled={!isValid || createMutation.isPending || updateMutation.isPending}
          saveDraftDisabled={!isValid || createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  );
}

import {
  NumberInput,
  ProveedorFormSection,
  ProveedorProductModalField,
  ProveedorProductModalFields,
  RecetaFilterSelect,
  RecetaTextInput,
} from '@restopsiq/ui';
import { useMemo } from 'react';

import { fetchAdminUsersGql } from '@/features/usuarios/api/usuarios.queries';
import { useLocations } from '@/features/sedes/hooks/useLocations';
import { useQuery } from '@tanstack/react-query';

import {
  CURRENCY_OPTIONS,
  DELIVERY_DAY_OPTIONS,
  DELIVERY_MODE_OPTIONS,
  DELIVERY_PLACE_OPTIONS,
  MINIMUM_ORDER_UNIT_OPTIONS,
  TRANSPORT_TYPE_OPTIONS,
} from '../constants';
import styles from '../proveedores.module.scss';
import type { SupplierLogisticsFormValues } from '../types';

interface ProveedorLogisticsFormSectionProps {
  value: SupplierLogisticsFormValues;
  onChange: (value: SupplierLogisticsFormValues) => void;
  errors?: Record<string, string>;
  theme: 'light' | 'dark';
}

const LOGISTICS_FIELD_SIZE = 'md' as const;

export default function ProveedorLogisticsFormSection({
  value,
  onChange,
  errors = {},
  theme,
}: ProveedorLogisticsFormSectionProps): React.JSX.Element {
  const locationsQuery = useLocations();
  const usersQuery = useQuery({
    queryKey: ['proveedores', 'reception-users'],
    queryFn: () => fetchAdminUsersGql(false),
  });

  const locationOptions = useMemo(
    () =>
      (locationsQuery.data ?? [])
        .filter((location) => location.isActive)
        .map((location) => ({ value: location.id, label: location.name })),
    [locationsQuery.data],
  );

  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? [])
        .filter((user) => user.isActive)
        .map((user) => ({ value: user.id, label: user.email })),
    [usersQuery.data],
  );

  const updateField = <K extends keyof SupplierLogisticsFormValues>(
    key: K,
    fieldValue: SupplierLogisticsFormValues[K],
  ): void => {
    onChange({ ...value, [key]: fieldValue });
  };

  const toggleDeliveryDay = (day: number): void => {
    const next = value.deliveryDays.includes(day)
      ? value.deliveryDays.filter((item) => item !== day)
      : [...value.deliveryDays, day].sort((a, b) => a - b);
    updateField('deliveryDays', next);
  };

  const toggleCoverageLocation = (locationId: string): void => {
    const next = value.coverageLocationIds.includes(locationId)
      ? value.coverageLocationIds.filter((id) => id !== locationId)
      : [...value.coverageLocationIds, locationId];
    updateField('coverageLocationIds', next);
  };

  const errorSummary = Object.values(errors);

  return (
    <ProveedorFormSection title="Información logística" theme={theme} size="xl">
      <div className={styles.formSectionFields}>
        {errorSummary.length > 0 && (
          <div className={styles.logisticsErrorSummary} role="alert">
            <p>Revisa los campos obligatorios de logística:</p>
            <ul>
              {errorSummary.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <ProveedorProductModalFields>
          <ProveedorProductModalField label="Modalidad de entrega" htmlFor="deliveryMode" required>
            <RecetaFilterSelect
              id="deliveryMode"
              options={DELIVERY_MODE_OPTIONS}
              value={value.deliveryMode}
              onChange={(next) =>
                updateField('deliveryMode', next as SupplierLogisticsFormValues['deliveryMode'])
              }
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Lugar de entrega" htmlFor="deliveryPlace" required>
            <RecetaFilterSelect
              id="deliveryPlace"
              options={DELIVERY_PLACE_OPTIONS}
              value={value.deliveryPlace}
              onChange={(next) =>
                updateField('deliveryPlace', next as SupplierLogisticsFormValues['deliveryPlace'])
              }
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
            />
          </ProveedorProductModalField>

          {value.deliveryPlace === 'OTHER' && (
            <ProveedorProductModalField
              label="Lugar personalizado"
              htmlFor="deliveryPlaceCustom"
              required
            >
              <RecetaTextInput
                id="deliveryPlaceCustom"
                theme={theme}
                className={styles.logisticsTextInput}
                value={value.deliveryPlaceCustom}
                onChange={(event) => updateField('deliveryPlaceCustom', event.target.value)}
              />
            </ProveedorProductModalField>
          )}

          <ProveedorProductModalField label="Lead time (días)" htmlFor="leadTimeDays" required>
            <NumberInput
              id="leadTimeDays"
              value={value.leadTimeDays ?? 0}
              onChange={(next) => updateField('leadTimeDays', next > 0 ? next : null)}
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
              className={styles.logisticsNumberInput}
              min={1}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Transporte" htmlFor="transportType" required>
            <RecetaFilterSelect
              id="transportType"
              options={TRANSPORT_TYPE_OPTIONS}
              value={value.transportType}
              onChange={(next) =>
                updateField('transportType', next as SupplierLogisticsFormValues['transportType'])
              }
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField
            label="Responsable de recepción"
            htmlFor="receptionResponsibleUserId"
            required
          >
            <RecetaFilterSelect
              id="receptionResponsibleUserId"
              options={userOptions}
              value={value.receptionResponsibleUserId}
              onChange={(next) => updateField('receptionResponsibleUserId', next)}
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Ventana horaria inicio" htmlFor="timeWindowStart">
            <RecetaTextInput
              id="timeWindowStart"
              type="time"
              theme={theme}
              className={styles.logisticsTextInput}
              value={value.timeWindowStart}
              onChange={(event) => updateField('timeWindowStart', event.target.value)}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Ventana horaria fin" htmlFor="timeWindowEnd">
            <RecetaTextInput
              id="timeWindowEnd"
              type="time"
              theme={theme}
              className={styles.logisticsTextInput}
              value={value.timeWindowEnd}
              onChange={(event) => updateField('timeWindowEnd', event.target.value)}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Costo transporte (opcional)" htmlFor="transportCost">
            <NumberInput
              id="transportCost"
              variant="currency"
              value={value.transportCost ?? 0}
              onChange={(next) => updateField('transportCost', next > 0 ? next : null)}
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
              className={styles.logisticsNumberInput}
              showSteppers={false}
              min={0}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Moneda" htmlFor="transportCostCurrency">
            <RecetaFilterSelect
              id="transportCostCurrency"
              options={CURRENCY_OPTIONS}
              value={value.transportCostCurrency}
              onChange={(next) =>
                updateField(
                  'transportCostCurrency',
                  next as SupplierLogisticsFormValues['transportCostCurrency'],
                )
              }
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Pedido mínimo (opcional)" htmlFor="minimumOrderQty">
            <NumberInput
              id="minimumOrderQty"
              value={value.minimumOrderQty ?? 0}
              onChange={(next) => updateField('minimumOrderQty', next > 0 ? next : null)}
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
              className={styles.logisticsNumberInput}
              showSteppers={false}
              min={0}
            />
          </ProveedorProductModalField>

          <ProveedorProductModalField label="Unidad pedido mínimo" htmlFor="minimumOrderUnit">
            <RecetaFilterSelect
              id="minimumOrderUnit"
              options={MINIMUM_ORDER_UNIT_OPTIONS}
              value={value.minimumOrderUnit}
              onChange={(next) => updateField('minimumOrderUnit', next)}
              theme={theme}
              size={LOGISTICS_FIELD_SIZE}
            />
          </ProveedorProductModalField>
        </ProveedorProductModalFields>

        <div className={styles.logisticsOptionsPanel}>
          <span className={styles.logisticsGroupLabel}>Días de entrega *</span>
          <div className={styles.deliveryDaysRow}>
            {DELIVERY_DAY_OPTIONS.map((day) => (
              <label key={day.value} className={styles.deliveryDayToggle}>
                <input
                  type="checkbox"
                  checked={value.deliveryDays.includes(day.value)}
                  onChange={() => toggleDeliveryDay(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>
          <hr className={styles.logisticsPanelDivider} />
          <label className={styles.logisticsCheckboxOption}>
            <input
              type="checkbox"
              checked={value.requiresColdChain}
              onChange={(event) => updateField('requiresColdChain', event.target.checked)}
            />
            <span>Requiere cadena de frío</span>
          </label>
        </div>

        {value.requiresColdChain && (
          <ProveedorProductModalFields>
            <ProveedorProductModalField
              label="Temp. mínima (°C)"
              htmlFor="transportTempMinC"
              required
            >
              <NumberInput
                id="transportTempMinC"
                value={value.transportTempMinC ?? 0}
                onChange={(next) => updateField('transportTempMinC', next)}
                theme={theme}
                size={LOGISTICS_FIELD_SIZE}
                className={styles.logisticsNumberInput}
              />
            </ProveedorProductModalField>
            <ProveedorProductModalField
              label="Temp. máxima (°C)"
              htmlFor="transportTempMaxC"
              required
            >
              <NumberInput
                id="transportTempMaxC"
                value={value.transportTempMaxC ?? 0}
                onChange={(next) => updateField('transportTempMaxC', next)}
                theme={theme}
                size={LOGISTICS_FIELD_SIZE}
                className={styles.logisticsNumberInput}
              />
            </ProveedorProductModalField>
          </ProveedorProductModalFields>
        )}

        <div className={styles.logisticsOptionsPanel}>
          <span className={styles.logisticsGroupLabel}>Cobertura por sedes (opcional)</span>
          {locationOptions.length === 0 ? (
            <p className={styles.logisticsEmptyHint}>No hay sedes activas disponibles.</p>
          ) : (
            <div className={styles.locationCoverageGrid}>
              {locationOptions.map((location) => (
                <label key={location.value} className={styles.locationCoverageItem}>
                  <input
                    type="checkbox"
                    checked={value.coverageLocationIds.includes(location.value)}
                    onChange={() => toggleCoverageLocation(location.value)}
                  />
                  <span>{location.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProveedorFormSection>
  );
}

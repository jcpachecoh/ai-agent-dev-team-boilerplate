import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { canWritePayrollEmployee } from '@/config/rbac.config';
import { useEmployeeCatalogOptions } from '@/features/payroll/hooks/useEmployeeCatalogOptions';
import { EMPLOYEE_CATALOG_TYPES } from '@/features/payroll/types/employee-catalog.types';

import styles from './AdministrativeOvertimeRequestModal.module.scss';
import { useAttendanceCollaboratorsQuery } from '../hooks/useAttendanceCollaboratorsQuery';
import { useAttendanceScopeLocations } from '../hooks/useAttendanceScopeLocations';
import type { CreateAdministrativeOvertimeRequestInput } from '../types/overtime.types';
import {
  buildAdminOvertimeWindowPayload,
  formatEstimatedDuration,
} from '../utils/admin-overtime-window';

export interface AdministrativeOvertimeRequestModalProps {
  open: boolean;
  loading?: boolean;
  roleCode: string | null | undefined;
  onClose: () => void;
  onSubmit: (input: CreateAdministrativeOvertimeRequestInput) => void;
  errorMessage?: string | null;
}

function todayLocalIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * OS-606 / CONN-04b — modal de solicitud administrativa en la bandeja de tiempo extra.
 */
export function AdministrativeOvertimeRequestModal({
  open,
  loading = false,
  roleCode,
  onClose,
  onSubmit,
  errorMessage = null,
}: AdministrativeOvertimeRequestModalProps): React.JSX.Element | null {
  const { locations, isLoading: locationsLoading } = useAttendanceScopeLocations();
  const canManageCatalog = canWritePayrollEmployee(roleCode);

  const [locationId, setLocationId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reasonOptionId, setReasonOptionId] = useState('');
  const [workDate, setWorkDate] = useState(todayLocalIsoDate);
  const [startTime, setStartTime] = useState('22:00');
  const [endTime, setEndTime] = useState('23:30');
  const [localError, setLocalError] = useState<string | null>(null);

  const reasonsQuery = useEmployeeCatalogOptions(EMPLOYEE_CATALOG_TYPES.OVERTIME_REASON);
  const collaboratorsQuery = useAttendanceCollaboratorsQuery(
    {
      locationId: locationId || undefined,
      status: 'active',
      page: 1,
      pageSize: 100,
      sortBy: 'employee',
      sortDir: 'asc',
    },
    Boolean(locationId),
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setSelectedIds(new Set());
    setReasonOptionId('');
    setWorkDate(todayLocalIsoDate());
    setStartTime('22:00');
    setEndTime('23:30');
    setLocalError(null);

    if (locations.length === 1) {
      setLocationId(locations[0].id);
    } else {
      setLocationId('');
    }
  }, [open, locations]);

  const collaborators = (collaboratorsQuery.data?.items ?? []).filter(
    (row) => !locationId || row.locationId === locationId,
  );
  const reasons = reasonsQuery.data ?? [];

  const windowPreview = useMemo(() => {
    if (!workDate || !startTime || !endTime) {
      return null;
    }
    try {
      return buildAdminOvertimeWindowPayload({ workDate, startTime, endTime });
    } catch {
      return null;
    }
  }, [workDate, startTime, endTime]);

  if (!open) {
    return null;
  }

  const toggleEmployee = (id: string): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allSelected =
    collaborators.length > 0 && collaborators.every((row) => selectedIds.has(row.id));

  const toggleSelectAll = (): void => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allSelected) {
        collaborators.forEach((row) => next.delete(row.id));
      } else {
        collaborators.forEach((row) => next.add(row.id));
      }
      return next;
    });
  };

  const handleLocationChange = (nextLocationId: string): void => {
    setLocationId(nextLocationId);
    setSelectedIds(new Set());
  };

  const handleSubmit = (): void => {
    setLocalError(null);
    if (!locationId) {
      setLocalError('Seleccione la sede.');
      return;
    }
    if (selectedIds.size === 0) {
      setLocalError('Seleccione al menos un colaborador.');
      return;
    }
    if (!reasonOptionId) {
      setLocalError('Seleccione un motivo.');
      return;
    }
    if (!workDate || !startTime || !endTime) {
      setLocalError('Complete la fecha y el horario propuesto.');
      return;
    }

    const window = buildAdminOvertimeWindowPayload({ workDate, startTime, endTime });
    if (window.estimatedMinutes <= 0) {
      setLocalError('La ventana propuesta debe tener duración positiva.');
      return;
    }

    onSubmit({
      employeeIds: Array.from(selectedIds),
      locationId,
      workDate,
      proposedStartTime: window.proposedStartTime,
      proposedEndTime: window.proposedEndTime,
      reasonOptionId,
    });
  };

  const singleLocation = locations.length === 1;

  return (
    <div className={styles.backdrop} role="presentation" onClick={loading ? undefined : onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-overtime-request-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-overtime-request-title" className={styles.title}>
          Solicitar extensión de jornada
        </h2>
        <p className={styles.help}>
          Cree una solicitud administrativa para uno o varios colaboradores. La duración estimada es
          solo una ayuda visual; el backend calcula los minutos oficiales.
        </p>

        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Sede</span>
            {locationsLoading ? (
              <span className={styles.emptyHint}>Cargando sedes…</span>
            ) : singleLocation ? (
              <input
                className={styles.control}
                value={locations[0]?.name ?? ''}
                readOnly
                aria-readonly
              />
            ) : (
              <select
                className={styles.control}
                value={locationId}
                disabled={loading}
                onChange={(event) => handleLocationChange(event.target.value)}
              >
                <option value="">Seleccionar sede</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            )}
          </label>

          <div className={styles.field}>
            <span className={styles.label}>Colaboradores</span>
            {!locationId ? (
              <p className={styles.emptyHint}>Seleccione una sede para listar colaboradores.</p>
            ) : collaboratorsQuery.isLoading ? (
              <p className={styles.emptyHint}>Cargando colaboradores…</p>
            ) : collaborators.length === 0 ? (
              <p className={styles.emptyHint}>No hay colaboradores activos en esta sede.</p>
            ) : (
              <>
                <div className={styles.selectAllBar}>
                  <span>{selectedIds.size} seleccionado(s)</span>
                  <button
                    type="button"
                    className={styles.selectAllButton}
                    onClick={toggleSelectAll}
                    disabled={loading}
                  >
                    {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                </div>
                <div className={styles.employeeList} role="group" aria-label="Colaboradores">
                  {collaborators.map((employee) => (
                    <label key={employee.id} className={styles.employeeRow}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(employee.id)}
                        disabled={loading}
                        onChange={() => toggleEmployee(employee.id)}
                      />
                      <span className={styles.employeeMeta}>
                        <span>{employee.name}</span>
                        <span className={styles.employeeCedula}>
                          CC {employee.cedula}
                          {employee.positionName ? ` · ${employee.positionName}` : ''}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Motivo</span>
            {reasonsQuery.isLoading ? (
              <span className={styles.emptyHint}>Cargando motivos…</span>
            ) : reasons.length === 0 ? (
              <p className={styles.emptyHint}>
                No hay motivos activos de extensión de jornada.
                {canManageCatalog ? (
                  <>
                    {' '}
                    Adminístrelos en{' '}
                    <Link className={styles.catalogLink} to="/payroll/catalogs">
                      Catálogos de nómina
                    </Link>
                    .
                  </>
                ) : (
                  ' Contacte a un administrador de nómina para configurarlos.'
                )}
              </p>
            ) : (
              <select
                className={styles.control}
                value={reasonOptionId}
                disabled={loading}
                onChange={(event) => setReasonOptionId(event.target.value)}
              >
                <option value="">Seleccionar motivo</option>
                {reasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.name}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Fecha de trabajo</span>
            <input
              className={styles.control}
              type="date"
              value={workDate}
              disabled={loading}
              onChange={(event) => setWorkDate(event.target.value)}
            />
          </label>

          <div className={styles.row2}>
            <label className={styles.field}>
              <span className={styles.label}>Hora inicial propuesta</span>
              <input
                className={styles.control}
                type="time"
                value={startTime}
                disabled={loading}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Hora final propuesta</span>
              <input
                className={styles.control}
                type="time"
                value={endTime}
                disabled={loading}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
          </div>

          {windowPreview ? (
            <p className={styles.duration}>
              Duración estimada: {formatEstimatedDuration(windowPreview.estimatedMinutes)}
              {windowPreview.crossesMidnight ? ' (cruza medianoche)' : ''}
            </p>
          ) : null}
        </div>

        {localError || errorMessage ? (
          <p className={styles.error} role="alert">
            {localError ?? errorMessage}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            disabled={loading}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.submitButton}
            disabled={loading || reasons.length === 0}
            onClick={handleSubmit}
          >
            {loading ? 'Enviando…' : 'Crear solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}

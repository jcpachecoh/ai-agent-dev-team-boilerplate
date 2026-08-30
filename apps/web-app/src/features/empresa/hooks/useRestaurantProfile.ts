import type { EmpresaInformacionValues } from '@restopsiq/ui';
import { useCallback, useMemo, useState } from 'react';

import { useMe } from '@/features/auth/hooks/useMe';

import { mapProfileValuesToUpdateInput, mapTenantToProfile } from '../mappers/api';
import { formatAccessBadge } from '../mappers/display';
import { readTenantSchedule, writeTenantSchedule } from '../storage/tenant-schedule.storage';
import { useTenant } from './useTenant';
import { useUpdateTenant } from './useUpdateTenant';

export function useRestaurantProfile() {
  const { data: me } = useMe();
  const tenantQuery = useTenant();
  const updateTenantMutation = useUpdateTenant();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Required<EmpresaInformacionValues> | null>(null);
  const [schedule, setSchedule] = useState(() =>
    tenantQuery.data ? readTenantSchedule(tenantQuery.data.id) : null,
  );

  const profile = useMemo(() => {
    if (!tenantQuery.data) {
      return null;
    }

    const storedSchedule = schedule ?? readTenantSchedule(tenantQuery.data.id);
    return mapTenantToProfile(tenantQuery.data, storedSchedule ?? undefined);
  }, [schedule, tenantQuery.data]);

  const values = editing && draft ? draft : profile?.values;

  const startEditing = useCallback(() => {
    if (!profile) {
      return;
    }

    setDraft(profile.values);
    setEditing(true);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setDraft(null);
    setEditing(false);
  }, []);

  const updateField = useCallback(
    (
      field: keyof EmpresaInformacionValues,
      value: string | EmpresaInformacionValues['operatingDays'],
    ) => {
      setDraft((current) => {
        const base = current ?? profile?.values;
        if (!base) {
          return current;
        }

        return {
          ...base,
          [field]: value,
        };
      });
    },
    [profile?.values],
  );

  const saveProfile = useCallback(async () => {
    if (!tenantQuery.data || !values) {
      return;
    }

    const nextValues = draft ?? values;
    await updateTenantMutation.mutateAsync(mapProfileValuesToUpdateInput(nextValues));

    const nextSchedule = writeTenantSchedule(tenantQuery.data.id, {
      openTime: nextValues.openTime,
      closeTime: nextValues.closeTime,
      operatingDays: nextValues.operatingDays,
    });
    setSchedule(nextSchedule);
    setDraft(null);
    setEditing(false);
  }, [draft, tenantQuery.data, updateTenantMutation, values]);

  return {
    tenantLabel: profile?.tenantLabel ?? '',
    values,
    metadata: profile?.metadata ?? [],
    accessBadgeLabel: formatAccessBadge(me?.roleCode),
    editing,
    isLoading: tenantQuery.isPending,
    isError: tenantQuery.isError,
    error: tenantQuery.error,
    isSaving: updateTenantMutation.isPending,
    startEditing,
    cancelEditing,
    updateField,
    saveProfile,
  };
}

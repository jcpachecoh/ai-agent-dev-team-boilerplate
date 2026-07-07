import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  assignUserToLocation,
  createLocation,
  deleteLocation,
  removeUserFromLocation,
  toggleLocationStatus,
  updateLocation,
} from '../api/sedes.mutations';
import { sedesKeys } from '../api/sedes.keys';
import type { LocationBusinessHoursInput, SedeFormValues } from '../types';
import { useRestaurantId } from './useRestaurantId';

function serializeBusinessHours(
  bh: LocationBusinessHoursInput | null | undefined,
): string | undefined {
  if (!bh) return undefined;
  return JSON.stringify(bh);
}

function formToCreateInput(
  restaurantId: string,
  values: SedeFormValues,
  businessHours: LocationBusinessHoursInput | null,
) {
  return {
    restaurantId,
    name: values.name?.trim() ?? '',
    address: values.address?.trim() ?? '',
    city: values.city?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    businessHours: serializeBusinessHours(businessHours),
    openingTime: values.openingTime || null,
    closingTime: values.closingTime || null,
  };
}

function formToUpdateInput(
  values: SedeFormValues,
  businessHours: LocationBusinessHoursInput | null | undefined,
) {
  return {
    name: values.name?.trim() ?? '',
    address: values.address?.trim() ?? '',
    city: values.city?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    isActive: values.isActive ?? true,
    businessHours: serializeBusinessHours(businessHours),
    openingTime: values.openingTime || null,
    closingTime: values.closingTime || null,
  };
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const restaurantId = useRestaurantId();

  return useMutation({
    mutationFn: async ({
      values,
      businessHours,
    }: {
      values: SedeFormValues;
      businessHours: LocationBusinessHoursInput | null;
    }) => {
      const created = await createLocation(formToCreateInput(restaurantId, values, businessHours));
      if (values.isActive === false) {
        return updateLocation(created.id, { isActive: false });
      }
      return created;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  const restaurantId = useRestaurantId();

  return useMutation({
    mutationFn: ({
      id,
      values,
      businessHours,
    }: {
      id: string;
      values: SedeFormValues;
      businessHours: LocationBusinessHoursInput | null | undefined;
    }) => updateLocation(id, formToUpdateInput(values, businessHours)),
    onSuccess: (location) => {
      void queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: sedesKeys.detail(restaurantId, location.id),
      });
    },
  });
}

export function useToggleLocationStatus() {
  const queryClient = useQueryClient();
  const restaurantId = useRestaurantId();

  return useMutation({
    mutationFn: (id: string) => toggleLocationStatus(id),
    onSuccess: (location) => {
      void queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: sedesKeys.detail(restaurantId, location.id),
      });
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  const restaurantId = useRestaurantId();

  return useMutation({
    mutationFn: (id: string) => deleteLocation(id),
    onSuccess: (_result, id) => {
      void queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: sedesKeys.detail(restaurantId, id),
      });
    },
  });
}

export function useRemoveUserFromLocation(locationId: string | undefined) {
  const queryClient = useQueryClient();
  const restaurantId = useRestaurantId();

  return useMutation({
    mutationFn: (userId: string) => removeUserFromLocation(userId, locationId!),
    onSuccess: () => {
      if (!locationId) return;
      void queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: sedesKeys.users(restaurantId, locationId),
      });
    },
  });
}

export function useAssignUserToLocation(locationId: string | undefined) {
  const queryClient = useQueryClient();
  const restaurantId = useRestaurantId();

  return useMutation({
    mutationFn: (userId: string) => assignUserToLocation(userId, locationId!),
    onSuccess: () => {
      if (!locationId) return;
      void queryClient.invalidateQueries({ queryKey: sedesKeys.lists() });
      void queryClient.invalidateQueries({
        queryKey: sedesKeys.users(restaurantId, locationId),
      });
    },
  });
}

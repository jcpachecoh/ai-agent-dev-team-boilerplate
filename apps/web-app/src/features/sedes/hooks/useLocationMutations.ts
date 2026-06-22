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
import type { SedeFormValues } from '../types';
import { useRestaurantId } from './useRestaurantId';

function formToCreateInput(restaurantId: string, values: SedeFormValues) {
  return {
    restaurantId,
    name: values.name?.trim() ?? '',
    address: values.address?.trim() ?? '',
    city: values.city?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
  };
}

function formToUpdateInput(values: SedeFormValues) {
  return {
    name: values.name?.trim() ?? '',
    address: values.address?.trim() ?? '',
    city: values.city?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    isActive: values.isActive ?? true,
  };
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  const restaurantId = useRestaurantId();

  return useMutation({
    mutationFn: async (values: SedeFormValues) => {
      const created = await createLocation(formToCreateInput(restaurantId, values));
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
    mutationFn: ({ id, values }: { id: string; values: SedeFormValues }) =>
      updateLocation(id, formToUpdateInput(values)),
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

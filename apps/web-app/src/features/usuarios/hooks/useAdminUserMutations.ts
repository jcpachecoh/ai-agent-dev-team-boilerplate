import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  adminCreateUser,
  adminDeactivateUser,
  adminUpdateUser,
  type AdminCreateUserInput,
  type AdminUpdateUserInput,
} from '../api/usuarios.api';
import { usuariosKeys } from '../api/usuarios.keys';

export function useAdminCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AdminCreateUserInput) => adminCreateUser(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUpdateUserInput }) =>
      adminUpdateUser(id, input),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(variables.id) });
    },
  });
}

export function useAdminDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDeactivateUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}

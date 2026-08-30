import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEmployeeDocument, deleteEmployeeDocument } from '../api/employee-documents.api';
import { payrollKeys } from '../api/queryKeys';
import type { CreateEmployeeDocumentInput } from '../types/employee-document.types';

export function useEmployeeDocumentsMutations(employeeId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: payrollKeys.documents(employeeId) });
  };

  const createMutation = useMutation({
    mutationFn: (input: CreateEmployeeDocumentInput) => createEmployeeDocument(input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => deleteEmployeeDocument(documentId),
    onSuccess: invalidate,
  });

  return { createMutation, deleteMutation };
}

import { useQuery } from '@tanstack/react-query';
import { fetchEmployeeDocuments } from '../api/employee-documents.api';
import { payrollKeys } from '../api/queryKeys';

export function useEmployeeDocumentsQuery(employeeId: string | undefined) {
  return useQuery({
    queryKey: payrollKeys.documents(employeeId ?? ''),
    queryFn: () => fetchEmployeeDocuments(employeeId!),
    enabled: !!employeeId,
  });
}

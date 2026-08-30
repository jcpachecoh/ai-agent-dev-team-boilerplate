import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteSupplierDocument,
  fetchSupplierDocuments,
  registerSupplierDocument,
  uploadSupplierDocumentStorage,
  type SupplierDocumentType,
  type SupplierDocumentsListResponse,
} from '../api/supplier-documents.api';
import { supplierDocumentsKeys } from '../api/supplier-documents.keys';

export function useSupplierDocuments(supplierId: string | undefined) {
  return useQuery({
    queryKey: supplierDocumentsKeys.list(supplierId ?? ''),
    queryFn: () => fetchSupplierDocuments(supplierId as string),
    enabled: Boolean(supplierId),
  });
}

export function useUploadSupplierDocument(supplierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      documentType: SupplierDocumentType;
      file: File;
      issuedAt?: string;
    }) => {
      const storage = await uploadSupplierDocumentStorage(supplierId, params.file);
      return registerSupplierDocument({
        supplierId,
        documentType: params.documentType,
        storageObjectId: storage.id,
        issuedAt: params.issuedAt,
      });
    },
    onSuccess: (data: SupplierDocumentsListResponse) => {
      void queryClient.setQueryData(supplierDocumentsKeys.list(supplierId), data);
    },
  });
}

export function useDeleteSupplierDocument(supplierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentType: SupplierDocumentType) =>
      deleteSupplierDocument(supplierId, documentType),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: supplierDocumentsKeys.list(supplierId) });
    },
  });
}

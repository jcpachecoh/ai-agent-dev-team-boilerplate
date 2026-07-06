export const supplierDocumentsKeys = {
  all: ['supplier-documents'] as const,
  list: (supplierId: string) => [...supplierDocumentsKeys.all, supplierId] as const,
};

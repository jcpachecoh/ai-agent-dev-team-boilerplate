import { SupplierDocumentType } from '@prisma/client';

import { SupplierDocumentsController } from '../controller/supplier-documents.controller';
import { SupplierDocumentsService } from '../service/supplier-documents.service';

describe('SupplierDocumentsController', () => {
  let controller: SupplierDocumentsController;
  let service: jest.Mocked<SupplierDocumentsService>;

  beforeEach(() => {
    service = {
      list: jest.fn(),
      upsert: jest.fn(),
      remove: jest.fn(),
      getDownloadUrl: jest.fn(),
    } as unknown as jest.Mocked<SupplierDocumentsService>;
    controller = new SupplierDocumentsController(service);
  });

  it('delegates listing to service', async () => {
    service.list.mockResolvedValue({
      completeness: { loaded: 0, total: 14, requiredPending: [SupplierDocumentType.RUT] },
      documents: [],
    } as any);

    const result = await controller.list(
      { tenantId: 'tenant-1', sub: 'user-1' } as any,
      '',
      'sup-1',
    );

    expect(result.completeness.total).toBe(14);
    expect(service.list).toHaveBeenCalledWith('tenant-1', 'sup-1');
  });
});

import { buildCleanPilaDraft } from '../pila/serializer/fixtures/pila-clean-draft.fixture';
import { splitDraftIntoXlsxBatches } from '../pila/serializer/pila-xlsx-batches';
import { zipStoreFiles } from '../utils/zip-store.util';

describe('splitDraftIntoXlsxBatches', () => {
  it('un solo lote si ≤20', () => {
    const draft = buildCleanPilaDraft({ employeeCount: 20 });
    const batches = splitDraftIntoXlsxBatches(draft);
    expect(batches).toHaveLength(1);
    expect(batches[0]!.batchIndex).toBe(1);
    expect(batches[0]!.batchTotal).toBe(1);
    expect(batches[0]!.draft.cotizantes).toHaveLength(20);
  });

  it('parte 45 cotizantes en 3 lotes (20+20+5)', () => {
    const draft = buildCleanPilaDraft({ employeeCount: 45 });
    const batches = splitDraftIntoXlsxBatches(draft);
    expect(batches).toHaveLength(3);
    expect(batches.map((b) => b.draft.cotizantes.length)).toEqual([20, 20, 5]);
    expect(batches[2]!.batchIndex).toBe(3);
    expect(batches[2]!.batchTotal).toBe(3);
    expect(batches.every((b) => b.draft.aportante.nit === draft.aportante.nit)).toBe(true);
  });
});

describe('zipStoreFiles', () => {
  it('produce firma ZIP PK', () => {
    const zip = zipStoreFiles([
      { name: 'a.xlsx', data: Buffer.from('hello') },
      { name: 'b.xlsx', data: Buffer.from('world') },
    ]);
    expect(zip.subarray(0, 2).toString('utf8')).toBe('PK');
    expect(zip.byteLength).toBeGreaterThan(40);
  });
});

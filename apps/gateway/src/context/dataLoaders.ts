import DataLoader from 'dataloader';
import { PrismaClient, Supplier, SupplyItem } from '@prisma/client';

export interface DataLoaders {
  supplierLoader: DataLoader<string, Supplier | null>;
  supplyItemLoader: DataLoader<string, SupplyItem | null>;
}

/**
 * Create per-request DataLoaders.
 * Each loader batches DB calls within a single tick.
 */
export function createDataLoaders(prisma: PrismaClient): DataLoaders {
  const supplierLoader = new DataLoader<string, Supplier | null>(
    async (ids: readonly string[]) => {
      const suppliers = await prisma.supplier.findMany({
        where: { id: { in: [...ids] } },
      });

      const map = new Map<string, Supplier>();
      for (const s of suppliers) {
        map.set(s.id, s);
      }

      return ids.map((id) => map.get(id) ?? null);
    },
    { cache: true },
  );

  const supplyItemLoader = new DataLoader<string, SupplyItem | null>(
    async (ids: readonly string[]) => {
      const items = await prisma.supplyItem.findMany({
        where: { id: { in: [...ids] } },
      });

      const map = new Map<string, SupplyItem>();
      for (const item of items) {
        map.set(item.id, item);
      }

      return ids.map((id) => map.get(id) ?? null);
    },
    { cache: true },
  );

  return { supplierLoader, supplyItemLoader };
}

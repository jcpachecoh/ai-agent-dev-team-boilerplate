import DataLoader from 'dataloader';
import { Supplier } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export function createSupplierLoader(prisma: PrismaService): DataLoader<string, Supplier | null> {
  return new DataLoader<string, Supplier | null>(
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
}

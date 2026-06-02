import DataLoader from 'dataloader';
import { SupplyItem } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export function createSupplyItemLoader(
  prisma: PrismaService,
): DataLoader<string, SupplyItem | null> {
  return new DataLoader<string, SupplyItem | null>(
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
}

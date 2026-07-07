import type { PlantOrderNoveltyItem } from '@restopsiq/ui';
import { useCallback, useEffect, useState } from 'react';

import { fetchOrderNovelties, type OrderNovelty } from '@/services/incident.service';

function toPlantNoveltyItem(novelty: OrderNovelty): PlantOrderNoveltyItem {
  return {
    id: novelty.id,
    noveltyType: novelty.noveltyType ?? 'OTHER',
    severity: novelty.severity,
    description: novelty.description,
    createdAt: novelty.createdAt,
    resolvedAt: novelty.resolvedAt,
    requiresPause: novelty.requiresPause,
  };
}

export function useOrderNovelties(orderId?: string, refreshKey = 0) {
  const [items, setItems] = useState<PlantOrderNoveltyItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!orderId) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const novelties = await fetchOrderNovelties(orderId);
      setItems(
        novelties
          .map(toPlantNoveltyItem)
          .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void refetch();
  }, [refetch, refreshKey]);

  const openCount = items.filter((item) => !item.resolvedAt).length;

  return { items, loading, refetch, openCount };
}

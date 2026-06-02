import DataLoader from 'dataloader';
import { Supplier, SupplyItem } from '@prisma/client';

export interface DataLoaders {
  supplierLoader: DataLoader<string, Supplier | null>;
  supplyItemLoader: DataLoader<string, SupplyItem | null>;
}

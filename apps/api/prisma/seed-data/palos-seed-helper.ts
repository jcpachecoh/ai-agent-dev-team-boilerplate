import { CondicionPago, PrismaClient, StockUnit, SupplierTipo } from '@prisma/client';
import { PALOS_SUPPLY_ITEMS } from './palos-supply-items';

const TENANT_ID = 'palos-de-lena';

/**
 * Seeds supply items for Palos de Leña tenant.
 * Data source: apps/api/docs/palos_supply_items_seed_simplified.md
 */
export async function seedPalosSupplyItems(prisma: PrismaClient) {
  console.log('\n--- Seeding Palos de Leña supply items ---');

  const summary = {
    itemsUpserted: 0,
    categoriesUpserted: 0,
    suppliersUpserted: 0,
    linksUpserted: 0,
    skippedRows: 0,
    duplicates: [] as string[],
  };

  const categoriesMap = new Map<string, string>();
  const suppliersMap = new Map<string, string>();
  const seenCodigoInterno = new Set<string>();

  const prefijoByCategory = new Map<string, string>();
  for (const item of PALOS_SUPPLY_ITEMS) {
    const catName = item.categoria.trim().toUpperCase();
    if (!prefijoByCategory.has(catName)) {
      const match = item.codigoInterno.match(/^([A-Z0-9]{2,6})-/);
      if (match) {
        prefijoByCategory.set(catName, match[1]);
      }
    }
  }

  // 1. Process Categories
  const uniqueCategories = Array.from(
    new Set(PALOS_SUPPLY_ITEMS.map((i) => i.categoria.trim().toUpperCase())),
  );
  for (const catName of uniqueCategories) {
    const prefijo =
      (prefijoByCategory.get(catName) ?? catName.replace(/[^A-Z0-9]/g, '').slice(0, 3)) || 'CAT';
    const cat = await prisma.supplyCategory.upsert({
      where: {
        tenantId_nombre: { tenantId: TENANT_ID, nombre: catName },
      },
      update: { isActive: true, prefijo },
      create: {
        tenantId: TENANT_ID,
        nombre: catName,
        prefijo,
        isActive: true,
      },
    });
    categoriesMap.set(catName, cat.id);
    summary.categoriesUpserted++;
  }

  // 2. Process Suppliers
  const allSupplierNames = PALOS_SUPPLY_ITEMS.flatMap((i) =>
    i.proveedores.map((s) => s.trim().toUpperCase()),
  ).filter(Boolean);
  const uniqueSupplierNames = Array.from(new Set(allSupplierNames));

  for (const supName of uniqueSupplierNames) {
    // Derive a deterministic NIT from the name for idempotency
    const normalizedNitName = supName.replace(/[^A-Z0-9]/g, '');
    const derivedNit = `GEN-${normalizedNitName}`.substring(0, 20); // NIT limit in DB? usually 20-50

    // Try to find by razonSocial first to handle cases where NIT might be different but it's the same supplier
    let supplier = await prisma.supplier.findFirst({
      where: { tenantId: TENANT_ID, razonSocial: supName },
    });

    if (!supplier) {
      supplier = await prisma.supplier.upsert({
        where: {
          tenantId_nit: { tenantId: TENANT_ID, nit: derivedNit },
        },
        update: { razonSocial: supName, isActive: true },
        create: {
          tenantId: TENANT_ID,
          nit: derivedNit,
          razonSocial: supName,
          tipo: SupplierTipo.PERSONA_JURIDICA,
          condicionPago: CondicionPago.CONTADO,
          cupoCredito: 0,
          calificacion: 5,
          isActive: true,
        },
      });
    }
    suppliersMap.set(supName, supplier.id);
    summary.suppliersUpserted++;
  }

  // 3. Process Supply Items
  for (const itemData of PALOS_SUPPLY_ITEMS) {
    if (seenCodigoInterno.has(itemData.codigoInterno)) {
      summary.duplicates.push(itemData.codigoInterno);
      continue;
    }
    seenCodigoInterno.add(itemData.codigoInterno);

    const catNameNormalized = itemData.categoria.trim().toUpperCase();
    const categoriaId = categoriesMap.get(catNameNormalized);
    if (!categoriaId) {
      console.error(
        `[Seed] Category not found for item ${itemData.codigoInterno}: ${itemData.categoria}`,
      );
      summary.skippedRows++;
      continue;
    }

    // Map unit string to StockUnit enum
    const unitMapping: Record<string, StockUnit> = {
      UNIT: StockUnit.UNIT,
      GRAMS: StockUnit.GRAMS,
      KILOGRAMS: StockUnit.KILOGRAMS,
      ML: StockUnit.ML,
      LITERS: StockUnit.LITERS,
      BOX: StockUnit.BOX,
    };
    const unitBase = unitMapping[itemData.unidadBase] || StockUnit.UNIT;

    const supplyItem = await prisma.supplyItem.upsert({
      where: {
        tenantId_codigoInterno: { tenantId: TENANT_ID, codigoInterno: itemData.codigoInterno },
      },
      update: {
        nombre: itemData.nombre,
        categoriaId: categoriaId,
        unidadBase: unitBase,
        costoPromedioPonderado: itemData.costoPromedioPonderado,
        stockActualBodega: itemData.stockActualBodega,
        isActive: true,
      },
      create: {
        tenantId: TENANT_ID,
        codigoInterno: itemData.codigoInterno,
        nombre: itemData.nombre,
        categoriaId: categoriaId,
        unidadBase: unitBase,
        factorConversion: 1,
        costoPromedioPonderado: itemData.costoPromedioPonderado,
        stockMinimoBodega: 0,
        stockMaximoBodega: 0,
        stockActualBodega: itemData.stockActualBodega,
        aplicaVencimiento: false,
        aplicaLote: false,
        isActive: true,
      },
    });
    summary.itemsUpserted++;

    // 4. Process Supplier Products
    for (let idx = 0; idx < itemData.proveedores.length; idx++) {
      const supName = itemData.proveedores[idx].trim().toUpperCase();
      const supplierId = suppliersMap.get(supName);
      if (!supplierId) continue;

      await prisma.supplierProduct.upsert({
        where: {
          tenantId_supplierId_supplyItemId: {
            tenantId: TENANT_ID,
            supplierId: supplierId,
            supplyItemId: supplyItem.id,
          },
        },
        update: {
          precioUnitario: itemData.costoPromedioPonderado,
          esProveedorPrincipal: idx === 0,
        },
        create: {
          tenantId: TENANT_ID,
          supplierId: supplierId,
          supplyItemId: supplyItem.id,
          precioUnitario: itemData.costoPromedioPonderado,
          unidadCompra: unitBase,
          factorConversion: 1,
          tiempoEntregaDias: 1,
          esProveedorPrincipal: idx === 0,
        },
      });
      summary.linksUpserted++;
    }
  }

  console.log('--- Palos de Leña seed summary ---');
  console.log(`- Categories upserted: ${summary.categoriesUpserted}`);
  console.log(`- Suppliers upserted: ${summary.suppliersUpserted}`);
  console.log(`- Supply items upserted: ${summary.itemsUpserted}`);
  console.log(`- Supplier-Product links upserted: ${summary.linksUpserted}`);
  if (summary.skippedRows > 0) {
    console.log(`- Skipped rows: ${summary.skippedRows}`);
  }
  if (summary.duplicates.length > 0) {
    console.log(`- Duplicate references found: ${summary.duplicates.length}`);
    // Optional: console.log(`  Duplicates: ${summary.duplicates.join(', ')}`);
  }
  console.log('-----------------------------------\n');
}

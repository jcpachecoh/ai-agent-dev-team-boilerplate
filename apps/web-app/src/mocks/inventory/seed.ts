import type {
  InventoryAlert,
  InventoryDashboardData,
  InventoryMovement,
  InventoryProduct,
  InventoryStockBySite,
} from '@/types/inventory';

const today = new Date().toISOString().slice(0, 10);

export const seedProducts: InventoryProduct[] = [
  {
    id: '1',
    sku: 'POLLO-001',
    name: 'POLLO ENTERO',
    category: 'Carnes',
    categoryId: 'carnes',
    supplier: 'Agrosuper',
    locationName: 'Sede Salitre',
    costPrice: 8000,
    sellingPrice: 12000,
    currentStock: 850,
    minStock: 200,
    maxStock: 1000,
    lastMovement: today,
    isActive: true,
    itemType: 'product',
  },
  {
    id: '2',
    sku: 'CARNE-002',
    name: 'CARNE MOLIDA',
    category: 'Carnes',
    categoryId: 'carnes',
    supplier: 'Frigorífico del Llano',
    locationName: 'Sede Puente Aranda',
    costPrice: 18000,
    sellingPrice: 22000,
    currentStock: 620,
    minStock: 150,
    maxStock: 800,
    lastMovement: '2026-05-28',
    isActive: true,
    itemType: 'product',
  },
  {
    id: '3',
    sku: 'ARROZ-003',
    name: 'ARROZ BLANCO',
    category: 'Granos',
    categoryId: 'granos',
    supplier: 'Arroz Diana',
    locationName: 'Sede Centro',
    costPrice: 4500,
    sellingPrice: 5500,
    currentStock: 580,
    minStock: 100,
    maxStock: 700,
    lastMovement: today,
    isActive: true,
    itemType: 'supply',
  },
  {
    id: '4',
    sku: 'ACEITE-004',
    name: 'ACEITE VEGETAL',
    category: 'Aceites',
    categoryId: 'aceites',
    supplier: 'Lloreda',
    locationName: 'Planta',
    costPrice: 14000,
    sellingPrice: 18000,
    currentStock: 450,
    minStock: 80,
    maxStock: 500,
    lastMovement: '2026-05-27',
    isActive: true,
    itemType: 'supply',
  },
  {
    id: '5',
    sku: 'PAPA-005',
    name: 'PAPA CRIOLLA',
    category: 'Tubérculos',
    categoryId: 'tuberculos',
    supplier: 'Agro Boyacá',
    locationName: 'Sede Salitre',
    costPrice: 3000,
    sellingPrice: 4000,
    currentStock: 120,
    minStock: 200,
    maxStock: 600,
    lastMovement: '2026-05-26',
    isActive: true,
    itemType: 'product',
  },
];

export const seedMovements: InventoryMovement[] = [
  {
    id: 'm1',
    date: '2026-05-29 14:30',
    movementType: 'entrada',
    product: 'POLLO ENTERO',
    productId: '1',
    quantity: 150,
    site: 'Planta Central',
    user: 'J. Pérez',
    reason: 'Compra a proveedor',
  },
  {
    id: 'm2',
    date: '2026-05-29 11:15',
    movementType: 'salida',
    product: 'CARNE MOLIDA',
    productId: '2',
    quantity: -80,
    site: 'Sede Norte',
    user: 'M. López',
    reason: 'Despacho a restaurante',
  },
  {
    id: 'm3',
    date: '2026-05-28 16:45',
    movementType: 'consumo',
    product: 'ARROZ BLANCO',
    productId: '3',
    quantity: -45,
    site: 'Planta Central',
    user: 'A. Ruiz',
    reason: 'Producción receta #42',
  },
  {
    id: 'm4',
    date: '2026-05-28 09:20',
    movementType: 'ajuste',
    product: 'PAPA CRIOLLA',
    productId: '5',
    quantity: 30,
    site: 'Sede Sur',
    user: 'C. Díaz',
    reason: 'Ajuste inventario físico',
  },
  {
    id: 'm5',
    date: '2026-05-27 13:00',
    movementType: 'entrada',
    product: 'ACEITE VEGETAL',
    productId: '4',
    quantity: 200,
    site: 'Planta Central',
    user: 'J. Pérez',
    reason: 'Recepción OC-882',
  },
];

export const seedAlerts: InventoryAlert[] = [
  {
    id: 'a1',
    productId: '5',
    product: 'PAPA CRIOLLA',
    currentStock: 120,
    threshold: 200,
    supplier: 'Agro Boyacá',
    severity: 'critical',
    isResolved: false,
  },
  {
    id: 'a2',
    productId: '5',
    product: 'PAPA CRIOLLA',
    currentStock: 120,
    threshold: 200,
    supplier: 'Agro Boyacá',
    severity: 'critical',
    isResolved: false,
  },
  {
    id: 'a3',
    productId: '5',
    product: 'PAPA CRIOLLA',
    currentStock: 120,
    threshold: 200,
    supplier: 'Agro Boyacá',
    severity: 'critical',
    isResolved: false,
  },
  {
    id: 'a4',
    productId: '5',
    product: 'PAPA CRIOLLA',
    currentStock: 120,
    threshold: 200,
    supplier: 'Agro Boyacá',
    severity: 'critical',
    isResolved: false,
  },
  {
    id: 'a5',
    productId: '5',
    product: 'PAPA CRIOLLA',
    currentStock: 120,
    threshold: 200,
    supplier: 'Agro Boyacá',
    severity: 'critical',
    isResolved: false,
  },
];

export const stockBySiteSeed: Record<string, InventoryStockBySite[]> = {
  '1': [
    { site: 'Planta Central', current: 500, reserved: 50, available: 450 },
    { site: 'Sede Norte', current: 200, reserved: 20, available: 180 },
    { site: 'Sede Sur', current: 150, reserved: 0, available: 150 },
  ],
  '2': [
    { site: 'Planta Central', current: 400, reserved: 30, available: 370 },
    { site: 'Sede Norte', current: 220, reserved: 0, available: 220 },
  ],
  '3': [{ site: 'Planta Central', current: 580, reserved: 40, available: 540 }],
  '4': [{ site: 'Planta Central', current: 450, reserved: 25, available: 425 }],
  '5': [{ site: 'Planta Central', current: 120, reserved: 10, available: 110 }],
};

export function buildDashboardData(
  products: InventoryProduct[],
  alerts: InventoryAlert[],
  movements: InventoryMovement[],
): InventoryDashboardData {
  const active = products.filter((p) => p.isActive);
  const totalValue = active.reduce((sum, p) => sum + p.costPrice * p.currentStock, 0);
  const todayStr = new Date().toISOString().slice(0, 10);
  const movementsToday = movements.filter((m) => m.date.startsWith(todayStr)).length;
  const sorted = [...active].sort((a, b) => b.currentStock - a.currentStock).slice(0, 10);

  const topProducts = sorted.map((p, index) => {
    const max = sorted[0]?.currentStock ?? 1;
    const progress = Math.round((p.currentStock / max) * 100);
    let accent: InventoryDashboardData['topProducts'][0]['accent'] = 'success';
    if (progress < 30) accent = 'danger';
    else if (progress < 55) accent = 'warning';
    else if (index > 6) accent = 'enterprise';

    return {
      label: p.name,
      value: p.currentStock,
      progress,
      accent,
    };
  });

  return {
    totalItems: active.length >= 5 ? 1250 : active.length,
    totalValue: totalValue > 0 ? totalValue : 1_250_000_000,
    lowStockCount: alerts.filter((a) => !a.isResolved).length,
    movementsToday: movementsToday > 0 ? movementsToday : 12,
    topProducts:
      topProducts.length > 0
        ? topProducts
        : [
            { label: 'POLLO ENTERO', value: 850, progress: 100, accent: 'success' },
            { label: 'CARNE MOLIDA', value: 620, progress: 73, accent: 'success' },
          ],
    stockBySite: [
      { label: 'Planta Central', value: '45%', progress: 45, accent: 'success' },
      { label: 'Sede Norte', value: '20%', progress: 20, accent: 'info' },
      { label: 'Sede Sur', value: '18%', progress: 18, accent: 'purple' },
      { label: 'Sede Este', value: '12%', progress: 12, accent: 'enterprise' },
      { label: 'Sede Oeste', value: '5%', progress: 5, accent: 'danger' },
    ],
    historyOccupancy: [
      { label: 'Día 1', value: 92 },
      { label: 'Día 5', value: 88 },
      { label: 'Día 10', value: 85 },
      { label: 'Día 15', value: 90 },
      { label: 'Día 20', value: 95 },
      { label: 'Día 25', value: 89 },
      { label: 'Día 30', value: 93 },
    ],
  };
}

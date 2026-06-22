import type { PlantRecipeDetail } from './plant-workstation-types';

const CHICHARRON_RECIPE: PlantRecipeDetail = {
  recipeName: 'Receta Chicharrón Casa',
  batchSize: '20 kg',
  stationId: 'EST-04',
  stationName: 'Fritura',
  phases: [
    {
      id: 'chicharron-p1',
      index: 1,
      name: 'Limpieza y corte',
      durationMinutes: 8,
      ingredients: [
        { id: 'ch1', name: 'Cuero de cerdo', quantity: '18 kg', supplier: 'Carnes del Llano' },
        { id: 'ch2', name: 'Agua', quantity: '5 L', supplier: 'Planta' },
      ],
    },
    {
      id: 'chicharron-p2',
      index: 2,
      name: 'Cocción inicial',
      durationMinutes: 20,
      ingredients: [
        { id: 'ch3', name: 'Aceite vegetal', quantity: '10 L', supplier: 'Aceites del Valle' },
        { id: 'ch4', name: 'Sal', quantity: '1 kg', supplier: 'Salinas del Caribe' },
        { id: 'ch5', name: 'Freidora industrial', quantity: '1 und', supplier: 'Equipo Interno' },
      ],
      instruction: 'Freír en aceite a 160°C hasta que el cuero se infle y dore uniformemente.',
    },
    {
      id: 'chicharron-p3',
      index: 3,
      name: 'Prensado y enfriado',
      durationMinutes: 15,
      stockIssue: true,
      ingredients: [
        { id: 'ch6', name: 'Prensa industrial', quantity: '1 und', supplier: 'Equipo Interno' },
        {
          id: 'ch7',
          name: 'Bandejas frías',
          quantity: '5 und',
          supplier: 'Plásticos Industriales',
          stockWarning: true,
        },
      ],
      instruction: 'Prensar el chicharrón caliente con peso uniforme. Dejar enfriar 30 min.',
    },
  ],
};

const POLLO_RECIPE: PlantRecipeDetail = {
  recipeName: 'Receta Base Pollo',
  batchSize: '15 kg',
  stationId: 'EST-02',
  stationName: 'Corte y porcionado',
  phases: [
    {
      id: 'pollo-p1',
      index: 1,
      name: 'Descongelado',
      durationMinutes: 30,
      ingredients: [
        { id: 'p1', name: 'Pollo entero', quantity: '15 kg', supplier: 'Avícola Andina' },
      ],
    },
    {
      id: 'pollo-p2',
      index: 2,
      name: 'Corte y porcionado',
      durationMinutes: 15,
      ingredients: [
        { id: 'p2', name: 'Aceite vegetal', quantity: '10 L', supplier: 'Aceites del Valle' },
        { id: 'p3', name: 'Sal', quantity: '1 kg', supplier: 'Salinas del Caribe' },
      ],
      instruction: 'Porcionar en piezas uniformes de 250 g.',
    },
    {
      id: 'pollo-p3',
      index: 3,
      name: 'Marinado',
      durationMinutes: 20,
      ingredients: [{ id: 'p4', name: 'Mezcla marinado', quantity: '2 L', supplier: 'Planta' }],
    },
    {
      id: 'pollo-p4',
      index: 4,
      name: 'Empaque',
      durationMinutes: 10,
      ingredients: [
        { id: 'p5', name: 'Bolsas vacío', quantity: '60 und', supplier: 'Empaques SA' },
      ],
    },
  ],
};

const COSTILLA_RECIPE: PlantRecipeDetail = {
  recipeName: 'Receta Costilla Premium',
  batchSize: '12 kg',
  stationId: 'EST-03',
  stationName: 'Parrilla',
  phases: [
    {
      id: 'costilla-p1',
      index: 1,
      name: 'Marinado',
      durationMinutes: 20,
      ingredients: [
        { id: 'c1', name: 'Costilla premium', quantity: '12 kg', supplier: 'Carnes del Llano' },
        { id: 'c2', name: 'Salsa BBQ', quantity: '3 L', supplier: 'Salsas Gourmet' },
      ],
      instruction: 'Marinar 20 minutos en salsa BBQ a temperatura ambiente.',
    },
    {
      id: 'costilla-p2',
      index: 2,
      name: 'Cocción lenta',
      durationMinutes: 45,
      ingredients: [{ id: 'c3', name: 'Carbón', quantity: '4 kg', supplier: 'Combustibles SA' }],
    },
    {
      id: 'costilla-p3',
      index: 3,
      name: 'Glaseado',
      durationMinutes: 10,
      ingredients: [
        { id: 'c4', name: 'Glaseado panela', quantity: '1 L', supplier: 'Salsas Gourmet' },
      ],
    },
  ],
};

const MORCILLA_RECIPE: PlantRecipeDetail = {
  recipeName: 'Receta Morcilla Tradicional',
  batchSize: '10 kg',
  stationId: 'EST-05',
  stationName: 'Embutidos',
  phases: [
    {
      id: 'morcilla-p1',
      index: 1,
      name: 'Embutido',
      durationMinutes: 12,
      ingredients: [
        { id: 'm1', name: 'Tripa natural', quantity: '5 m', supplier: 'Carnes del Llano' },
        { id: 'm2', name: 'Mezcla base', quantity: '8 kg', supplier: 'Planta' },
      ],
      instruction: 'Embutir con presión uniforme evitando burbujas de aire.',
    },
    {
      id: 'morcilla-p2',
      index: 2,
      name: 'Cocción',
      durationMinutes: 25,
      ingredients: [{ id: 'm3', name: 'Agua', quantity: '8 L', supplier: 'Planta' }],
    },
  ],
};

export const PLANT_RECIPE_DETAIL_BY_ORDER: Record<string, PlantRecipeDetail> = {
  'OP-000012': POLLO_RECIPE,
  'OP-000013': COSTILLA_RECIPE,
  'OP-000014': CHICHARRON_RECIPE,
  'OP-000015': MORCILLA_RECIPE,
};

export function getPlantRecipeDetail(orderId: string): PlantRecipeDetail | null {
  return PLANT_RECIPE_DETAIL_BY_ORDER[orderId] ?? null;
}

import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PLANT_RECIPE_DETAIL_BY_ORDER } from '../shared/plant-recipe-detail-demo';
import { PlantRecipeDetailScreen } from './PlantRecipeDetailScreen';

const meta: Meta<typeof PlantRecipeDetailScreen> = {
  title: 'Field Ops/Plant Dashboard/PlantRecipeDetailScreen',
  component: PlantRecipeDetailScreen,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Pantalla de detalle de receta al pulsar VER RECETA. Sidebar con pasos y panel principal con insumos, timer y acciones.',
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.args.theme as 'light' | 'dark' | undefined) ?? 'dark';
      const background = theme === 'light' ? '#f2f0ea' : '#0a0a0a';

      return (
        <div style={{ width: '100vw', height: '100vh', background }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PlantRecipeDetailScreen>;

const chicharronRecipe = PLANT_RECIPE_DETAIL_BY_ORDER['OP-000014'];

export const PausedStep2: Story = {
  args: {
    orderId: 'OP-000014',
    productName: 'Chicharrón prensado',
    operatorName: 'Carlos Mendoza',
    status: 'paused',
    recipe: chicharronRecipe,
    currentPhaseIndex: 2,
    elapsedMs: 0,
    timerRunning: false,
    onBack: () => undefined,
  },
};

export const InProgressStep3: Story = {
  args: {
    orderId: 'OP-000014',
    productName: 'Chicharrón prensado',
    operatorName: 'Carlos Mendoza',
    status: 'in_progress',
    recipe: chicharronRecipe,
    currentPhaseIndex: 3,
    elapsedMs: 4 * 1000,
    timerRunning: true,
    onBack: () => undefined,
  },
};

export const LightMode: Story = {
  args: {
    ...PausedStep2.args,
    theme: 'light',
  },
};

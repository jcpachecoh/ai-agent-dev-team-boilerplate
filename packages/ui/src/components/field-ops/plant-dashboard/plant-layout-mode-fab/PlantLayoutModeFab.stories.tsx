import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantLayoutModeFab } from './PlantLayoutModeFab';

const meta: Meta<typeof PlantLayoutModeFab> = {
  title: 'Field Ops/Plant Dashboard/PlantLayoutModeFab',
  component: PlantLayoutModeFab,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component: 'FAB inferior derecho para cambiar entre modos de vista 1×1, 1×2 y 2×2.',
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = (context.args.theme as 'light' | 'dark' | undefined) ?? 'dark';
      const background = theme === 'light' ? '#f2f0ea' : '#0a0a0a';
      return (
        <div style={{ minHeight: '100vh', background, position: 'relative' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PlantLayoutModeFab>;

export const Interactive: Story = {
  render: (args) => {
    const [layoutMode, setLayoutMode] = useState<'1x1' | '1x2' | '2x2'>('2x2');
    return (
      <PlantLayoutModeFab {...args} layoutMode={layoutMode} onLayoutModeChange={setLayoutMode} />
    );
  },
};

export const LightMode: Story = {
  args: { theme: 'light' },
  render: Interactive.render,
};

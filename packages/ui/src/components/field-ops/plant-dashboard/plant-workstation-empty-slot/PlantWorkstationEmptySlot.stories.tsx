import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantWorkstationEmptySlot } from './PlantWorkstationEmptySlot';

const meta: Meta<typeof PlantWorkstationEmptySlot> = {
  title: 'Field Ops/Plant Dashboard/PlantWorkstationEmptySlot',
  component: PlantWorkstationEmptySlot,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component: 'Placeholder de celda sin OP asignada. Al tocar abre el modal de asignación.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlantWorkstationEmptySlot>;

export const Compact: Story = {
  args: { density: 'compact' },
  decorators: [
    (Story, context) => {
      const theme = (context.args.theme as 'light' | 'dark' | undefined) ?? 'dark';
      const background = theme === 'light' ? '#f2f0ea' : '#0a0a0a';
      return (
        <div style={{ padding: '2rem', background, height: 320 }}>
          <Story />
        </div>
      );
    },
  ],
};

export const Full: Story = {
  args: { density: 'full' },
  decorators: Compact.decorators,
};

export const LightMode: Story = {
  args: { density: 'compact', theme: 'light' },
  decorators: Compact.decorators,
};

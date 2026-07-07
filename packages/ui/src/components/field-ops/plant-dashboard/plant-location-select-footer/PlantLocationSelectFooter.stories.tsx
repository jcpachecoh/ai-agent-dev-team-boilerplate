import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantLocationSelectFooter } from './PlantLocationSelectFooter';

const meta: Meta<typeof PlantLocationSelectFooter> = {
  title: 'Field Ops/Plant Dashboard/PlantLocationSelectFooter',
  component: PlantLocationSelectFooter,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlantLocationSelectFooter>;

export const DisabledContinue: Story = {
  args: {
    canContinue: false,
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
};

export const EnabledContinue: Story = {
  args: {
    canContinue: true,
  },
  decorators: DisabledContinue.decorators,
};

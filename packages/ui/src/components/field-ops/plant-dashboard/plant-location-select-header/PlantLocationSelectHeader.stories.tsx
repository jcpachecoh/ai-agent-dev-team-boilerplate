import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantLocationSelectHeader } from './PlantLocationSelectHeader';

const meta: Meta<typeof PlantLocationSelectHeader> = {
  title: 'Field Ops/Plant Dashboard/PlantLocationSelectHeader',
  component: PlantLocationSelectHeader,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlantLocationSelectHeader>;

export const Default: Story = {
  args: {
    operatorName: 'Carlos Mendoza',
    operatorRole: 'OPERATOR',
  },
  decorators: [
    (Story) => (
      <div style={{ background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
};

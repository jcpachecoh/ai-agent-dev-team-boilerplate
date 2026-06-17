import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantLocationCard } from './PlantLocationCard';

const meta: Meta<typeof PlantLocationCard> = {
  title: 'Field Ops/Plant Dashboard/PlantLocationCard',
  component: PlantLocationCard,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PlantLocationCard>;

const sampleLocation = {
  id: 'loc-01',
  name: 'Planta Principal',
  code: 'LOC-01',
  city: 'Bogotá',
  address: 'Cra. 68 #13-45, Zona Industrial Puente Aranda',
};

export const Default: Story = {
  args: {
    location: sampleLocation,
  },
};

export const Selected: Story = {
  args: {
    location: sampleLocation,
    selected: true,
  },
};

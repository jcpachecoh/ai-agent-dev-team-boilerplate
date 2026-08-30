import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeFormPreview } from './SedeFormPreview';

const meta: Meta<typeof SedeFormPreview> = {
  title: 'Sede/Compositions/SedeFormPreview',
  component: SedeFormPreview,
  ...sedeStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SedeFormPreview>;

export const NuevaSede: Story = {
  args: { mode: 'create' },
};

export const EditarSede: Story = {
  args: {
    mode: 'edit',
    values: {
      name: 'Sede Bocagrande',
      address: 'Cra 13 # 63-40',
      city: 'Cartagena',
      phone: '+57 601 234 5678',
      isActive: true,
    },
  },
};

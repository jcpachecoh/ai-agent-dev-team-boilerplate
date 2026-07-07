import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeFormHeader } from './SedeFormHeader';

const meta: Meta<typeof SedeFormHeader> = {
  title: 'Sede/SedeFormHeader',
  component: SedeFormHeader,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeFormHeader>;

export const NuevaSede: Story = {
  args: { title: 'Nueva sede', onBack: () => undefined },
};

export const EditarSede: Story = {
  args: {
    title: 'Editar: Sede Bocagrande',
    locationId: 'sed-08',
    onBack: () => undefined,
  },
};

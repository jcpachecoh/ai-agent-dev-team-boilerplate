import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeFormActions } from './SedeFormActions';

const meta: Meta<typeof SedeFormActions> = {
  title: 'Sede/SedeFormActions',
  component: SedeFormActions,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeFormActions>;

export const Crear: Story = { args: { mode: 'create' } };
export const Editar: Story = { args: { mode: 'edit' } };

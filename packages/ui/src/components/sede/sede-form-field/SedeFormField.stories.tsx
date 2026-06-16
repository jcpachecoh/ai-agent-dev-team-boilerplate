import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeFormField } from './SedeFormField';

const meta: Meta<typeof SedeFormField> = {
  title: 'Sede/SedeFormField',
  component: SedeFormField,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeFormField>;

export const Default: Story = {
  args: { label: 'Nombre de la sede', required: true, placeholder: 'Ej: Sede Chapinero' },
};

export const WithValue: Story = {
  args: { label: 'Ciudad', value: 'Cartagena' },
};

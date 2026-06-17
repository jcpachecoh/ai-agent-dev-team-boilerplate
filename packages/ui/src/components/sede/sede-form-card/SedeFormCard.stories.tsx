import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeFormCard } from './SedeFormCard';
import { SedeFormField } from '../sede-form-field';

const meta: Meta<typeof SedeFormCard> = {
  title: 'Sede/SedeFormCard',
  component: SedeFormCard,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeFormCard>;

export const Default: Story = {
  render: (args) => (
    <SedeFormCard {...args}>
      <SedeFormField
        theme={args.theme}
        label="Nombre de la sede"
        required
        placeholder="Ej: Sede Chapinero"
      />
      <SedeFormField theme={args.theme} label="Dirección" required placeholder="Cra 13 # 63-40" />
    </SedeFormCard>
  ),
};

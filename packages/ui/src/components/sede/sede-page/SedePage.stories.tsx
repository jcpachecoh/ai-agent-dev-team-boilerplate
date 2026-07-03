import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedePage } from './SedePage';

const meta: Meta<typeof SedePage> = {
  title: 'Sede/SedePage',
  component: SedePage,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedePage>;

export const Default: Story = {
  render: (args) => (
    <SedePage {...args}>
      <p style={{ margin: 0 }}>Contenedor de página con fondo y tokens de tema.</p>
    </SedePage>
  ),
};

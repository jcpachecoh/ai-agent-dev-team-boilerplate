import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeStatusBadge } from './SedeStatusBadge';

const meta: Meta<typeof SedeStatusBadge> = {
  title: 'Sede/SedeStatusBadge',
  component: SedeStatusBadge,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeStatusBadge>;

export const Activo: Story = { args: { status: 'active' } };
export const Inactivo: Story = { args: { status: 'inactive' } };

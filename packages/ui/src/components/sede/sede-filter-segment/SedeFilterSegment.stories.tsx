import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeFilterSegment } from './SedeFilterSegment';

const meta: Meta<typeof SedeFilterSegment> = {
  title: 'Sede/SedeFilterSegment',
  component: SedeFilterSegment,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeFilterSegment>;

export const Todos: Story = { args: { activeId: 'all' } };
export const Activos: Story = { args: { activeId: 'active' } };
export const Inactivos: Story = { args: { activeId: 'inactive' } };

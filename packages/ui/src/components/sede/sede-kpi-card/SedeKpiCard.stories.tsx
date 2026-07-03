import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeKpiCard } from './SedeKpiCard';

const meta: Meta<typeof SedeKpiCard> = {
  title: 'Sede/SedeKpiCard',
  component: SedeKpiCard,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeKpiCard>;

export const Total: Story = { args: { label: 'Total sedes', value: 4, valueColor: 'primary' } };
export const Activas: Story = { args: { label: 'Activas', value: 3, valueColor: 'success' } };
export const Inactivas: Story = { args: { label: 'Inactivas', value: 1, valueColor: 'muted' } };

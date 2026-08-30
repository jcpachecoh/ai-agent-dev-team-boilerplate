import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeMetricChip } from './SedeMetricChip';

const meta: Meta<typeof SedeMetricChip> = {
  title: 'Sede/SedeMetricChip',
  component: SedeMetricChip,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeMetricChip>;

export const Total: Story = { args: { label: 'Total sedes', value: 10, valueColor: 'primary' } };
export const Activas: Story = { args: { label: 'Activas', value: 7, valueColor: 'success' } };
export const Inactivas: Story = { args: { label: 'Inactivas', value: 3, valueColor: 'muted' } };

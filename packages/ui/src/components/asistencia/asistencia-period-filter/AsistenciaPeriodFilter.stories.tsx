import type { Meta, StoryObj } from '@storybook/react';

import { AsistenciaPeriodFilter } from './AsistenciaPeriodFilter';

const meta: Meta<typeof AsistenciaPeriodFilter> = {
  title: 'Asistencia/AsistenciaPeriodFilter',
  component: AsistenciaPeriodFilter,
};

export default meta;

type Story = StoryObj<typeof AsistenciaPeriodFilter>;

export const Day: Story = {
  args: {
    period: 'day',
    anchorDate: '2026-06-18',
  },
};

export const Year: Story = {
  args: {
    period: 'year',
    anchorDate: '2026-01-01',
  },
};

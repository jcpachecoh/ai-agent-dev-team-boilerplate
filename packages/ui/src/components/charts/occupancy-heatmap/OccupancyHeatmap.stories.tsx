import type { Meta, StoryObj } from '@storybook/react';

import { createChartRender } from '../../../../.storybook/chart-canvas';
import type { HeatmapCell } from './OccupancyHeatmap';
import { OccupancyHeatmap } from './OccupancyHeatmap';

const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const hours = [6, 7, 8, 9, 10, 11, 12];

function buildHeatmapData(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  days.forEach((day) => {
    hours.forEach((hour) => {
      cells.push({ day, hour, value: Math.floor(Math.random() * 100) });
    });
  });
  return cells;
}

const meta: Meta<typeof OccupancyHeatmap> = {
  title: 'Charts/OccupancyHeatmap',
  component: OccupancyHeatmap,
  tags: ['autodocs'],
  render: createChartRender(OccupancyHeatmap, 'OccupancyHeatmap', { maxWidth: 520 }),
  args: { theme: 'light', size: 'md' },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'select', options: ['sm', 'md', 'xl'] },
  },
};

export default meta;
type Story = StoryObj<typeof OccupancyHeatmap>;

export const Default: Story = {
  args: { data: buildHeatmapData(), hourRange: { start: 6, end: 12 } },
};

export const CameraYolo: Story = {
  args: {
    data: buildHeatmapData(),
    hourRange: { start: 6, end: 12 },
    ariaLabel: 'Ocupación cámaras YOLO',
  },
};

export const PartialWeek: Story = {
  args: {
    data: buildHeatmapData().filter((c) => ['Lun', 'Mar', 'Mié'].includes(c.day)),
    dayLabels: ['Lun', 'Mar', 'Mié'],
    hourRange: { start: 8, end: 12 },
  },
};

export const Loading: Story = { args: { loading: true, data: [] } };
export const Empty: Story = { args: { data: [] } };

export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  args: { theme: 'dark', data: buildHeatmapData(), hourRange: { start: 6, end: 12 } },
};

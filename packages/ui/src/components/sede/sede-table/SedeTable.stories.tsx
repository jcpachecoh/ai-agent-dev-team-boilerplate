import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeTable } from './SedeTable';
import { SedeTableRow } from '../sede-table-row';

const meta: Meta<typeof SedeTable> = {
  title: 'Sede/SedeTable',
  component: SedeTable,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeTable>;

export const Default: Story = {
  render: (args) => (
    <SedeTable {...args} pagination={{ page: 1, totalPages: 2, summary: 'Mostrando 1-2 de 10' }}>
      <SedeTableRow theme={args.theme} />
      <SedeTableRow theme={args.theme} name="Sede Bucarica" isActive={false} assignedUsers={[]} />
    </SedeTable>
  ),
};

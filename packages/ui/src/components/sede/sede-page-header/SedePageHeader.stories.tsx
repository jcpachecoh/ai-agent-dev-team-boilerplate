import type { Meta, StoryObj } from '@storybook/react';

import { SedeActionButton } from '../sede-action-button';
import { sedeStoryMeta } from '../shared/story-decorators';
import { SedePageHeader } from './SedePageHeader';

const meta: Meta<typeof SedePageHeader> = {
  title: 'Sede/SedePageHeader',
  component: SedePageHeader,
  ...sedeStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SedePageHeader>;

export const Default: Story = {
  render: (args) => (
    <SedePageHeader
      {...args}
      primaryAction={<SedeActionButton theme={args.theme} onClick={() => undefined} />}
    />
  ),
  args: {
    subtitle: 'Gestión de sedes del tenant',
  },
};

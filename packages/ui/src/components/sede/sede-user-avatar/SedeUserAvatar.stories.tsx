import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeUserAvatar } from './SedeUserAvatar';

const meta: Meta<typeof SedeUserAvatar> = {
  title: 'Sede/SedeUserAvatar',
  component: SedeUserAvatar,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeUserAvatar>;

export const Teal: Story = { args: { initials: 'AL', tone: 'teal' } };
export const Coral: Story = { args: { initials: 'RS', tone: 'coral' } };

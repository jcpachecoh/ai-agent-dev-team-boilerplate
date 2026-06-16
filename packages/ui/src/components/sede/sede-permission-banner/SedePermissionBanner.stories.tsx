import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedePermissionBanner } from './SedePermissionBanner';

const meta: Meta<typeof SedePermissionBanner> = {
  title: 'Sede/SedePermissionBanner',
  component: SedePermissionBanner,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedePermissionBanner>;

export const Default: Story = {};

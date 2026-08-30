import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeActionButton } from './SedeActionButton';

const meta: Meta<typeof SedeActionButton> = {
  title: 'Sede/SedeActionButton',
  component: SedeActionButton,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeActionButton>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Save: Story = { args: { variant: 'save' } };
export const Create: Story = { args: { variant: 'create' } };

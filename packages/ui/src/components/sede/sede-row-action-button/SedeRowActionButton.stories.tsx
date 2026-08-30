import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeRowActionButton } from './SedeRowActionButton';

const meta: Meta<typeof SedeRowActionButton> = {
  title: 'Sede/SedeRowActionButton',
  component: SedeRowActionButton,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeRowActionButton>;

export const View: Story = { args: { variant: 'view' } };
export const Edit: Story = { args: { variant: 'edit' } };
export const ToggleOff: Story = { args: { variant: 'toggle', active: false } };
export const ToggleOn: Story = { args: { variant: 'toggle', active: true } };

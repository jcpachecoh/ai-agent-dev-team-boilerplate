import type { Meta, StoryObj } from '@storybook/react';

import { sedeStoryMeta } from '../shared/story-decorators';
import { SedeSearch } from './SedeSearch';

const meta: Meta<typeof SedeSearch> = {
  title: 'Sede/SedeSearch',
  component: SedeSearch,
  ...sedeStoryMeta,
};

export default meta;
type Story = StoryObj<typeof SedeSearch>;

export const Default: Story = {};
export const WithValue: Story = { args: { value: 'Cartagena' } };

import type { Meta, StoryObj } from '@storybook/react';

import { themeCanvas } from '../../../.storybook/canvas';
import Spinner from './Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'Atomos/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    size: 'md',
  },
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    color: {
      control: 'color',
      description: 'Override del color del arco (vacío = token por theme)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Spinner>;

/** Vista por defecto en Docs: un solo spinner controlado por theme y size. */
export const Default: Story = {};

export const AllSizes: Story = {
  parameters: {
    docs: { disable: true },
  },
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 24 }}>
      <Spinner theme="light" size="sm" />
      <Spinner theme="light" size="md" />
      <Spinner theme="light" size="lg" />
    </div>
  ),
};

export const Colored: Story = {
  parameters: {
    docs: { disable: true },
  },
  args: {
    theme: 'dark',
    size: 'md',
    color: '#2F82FF',
  },
};

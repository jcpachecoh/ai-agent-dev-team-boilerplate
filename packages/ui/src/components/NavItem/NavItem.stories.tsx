import type { Meta, StoryObj } from '@storybook/react';
import { Settings } from 'lucide-react';

import { darkCanvas, themeCanvas } from '../../../.storybook/canvas';
import NavItem from '.';

const meta: Meta<typeof NavItem> = {
  title: 'Atomos/NavItem',
  component: NavItem,
  tags: ['autodocs'],
  decorators: [themeCanvas],
  args: {
    theme: 'light',
    label: 'Dashboard',
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg'],
    },
    active: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof NavItem>;

export const Default: Story = {};

export const Active: Story = {
  args: {
    active: true,
  },
};

export const CustomLucideIcon: Story = {
  args: {
    theme: 'dark',
    label: 'Configuración',
    icon: <Settings />,
  },
};

export const AllSizes: Story = {
  parameters: {
    docs: { disable: true },
  },
  decorators: [darkCanvas],
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <NavItem label="Dashboard" theme="dark" size="sm" />
      <NavItem label="Dashboard" theme="dark" size="md" active />
      <NavItem label="Dashboard" theme="dark" size="lg" />
    </div>
  ),
};

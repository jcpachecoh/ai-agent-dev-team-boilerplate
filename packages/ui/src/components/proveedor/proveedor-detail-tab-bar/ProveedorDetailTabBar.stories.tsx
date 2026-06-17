import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorDetailTabBar } from './ProveedorDetailTabBar';

const meta: Meta<typeof ProveedorDetailTabBar> = {
  title: 'Proveedor/ProveedorDetailTabBar',
  component: ProveedorDetailTabBar,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl' },
};

export default meta;
type Story = StoryObj<typeof ProveedorDetailTabBar>;

export const FiveTabs: Story = {};

export const ThreeTabs: Story = {
  args: {
    tabs: [
      { id: 'info', label: 'INFORMACIÓN' },
      { id: 'catalog', label: 'CATÁLOGO' },
      { id: 'history', label: 'HISTORIAL OCs' },
    ],
    activeTabId: 'catalog',
  },
};

export const Interactive: Story = {
  render: (args) => {
    const [active, setActive] = useState('info');
    return <ProveedorDetailTabBar {...args} activeTabId={active} onTabChange={setActive} />;
  },
};

export const FullWidthXL: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  args: { size: 'xl' },
};

export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProveedorDetailTabBar {...args} size="sm" />
      <ProveedorDetailTabBar {...args} size="md" />
      <ProveedorDetailTabBar {...args} size="xl" />
    </div>
  ),
};

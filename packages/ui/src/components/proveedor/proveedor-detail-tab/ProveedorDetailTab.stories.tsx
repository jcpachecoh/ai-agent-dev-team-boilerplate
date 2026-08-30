import type { Meta, StoryObj } from '@storybook/react';
import { Info } from 'lucide-react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorDetailTab } from './ProveedorDetailTab';

const meta: Meta<typeof ProveedorDetailTab> = {
  title: 'Proveedor/ProveedorDetailTab',
  component: ProveedorDetailTab,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProveedorDetailTab>;

export const Active: Story = { args: { active: true, icon: <Info /> } };
export const Inactive: Story = { args: { active: false, icon: <Info /> } };
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { active: true, theme: 'dark', icon: <Info /> },
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
      <ProveedorDetailTab {...args} size="sm" icon={<Info />} />
      <ProveedorDetailTab {...args} size="md" icon={<Info />} active />
      <ProveedorDetailTab {...args} size="xl" icon={<Info />} />
    </div>
  ),
};

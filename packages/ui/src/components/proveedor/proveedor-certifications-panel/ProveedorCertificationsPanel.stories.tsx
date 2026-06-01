import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorCertificationsPanel } from './ProveedorCertificationsPanel';

const meta: Meta<typeof ProveedorCertificationsPanel> = {
  title: 'Proveedor/ProveedorCertificationsPanel',
  component: ProveedorCertificationsPanel,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { theme: 'dark', size: 'xl' },
};
export default meta;
type Story = StoryObj<typeof ProveedorCertificationsPanel>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};

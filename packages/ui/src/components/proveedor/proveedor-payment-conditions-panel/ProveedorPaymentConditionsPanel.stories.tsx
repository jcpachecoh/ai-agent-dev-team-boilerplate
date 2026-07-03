import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorPaymentConditionsPanel } from './ProveedorPaymentConditionsPanel';

const meta: Meta<typeof ProveedorPaymentConditionsPanel> = {
  title: 'Proveedor/ProveedorPaymentConditionsPanel',
  component: ProveedorPaymentConditionsPanel,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { theme: 'dark', size: 'xl' },
};
export default meta;
type Story = StoryObj<typeof ProveedorPaymentConditionsPanel>;

export const Default: Story = {};
export const DarkMode: Story = {
  decorators: [proveedorDarkDecorator],
  args: { theme: 'dark' },
};

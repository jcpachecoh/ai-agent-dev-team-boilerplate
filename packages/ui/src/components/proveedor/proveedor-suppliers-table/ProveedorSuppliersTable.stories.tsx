import type { Meta, StoryObj } from '@storybook/react';

import { proveedorDarkDecorator, proveedorStoryMeta } from '../shared/story-decorators';
import { ProveedorSuppliersTable } from './ProveedorSuppliersTable';

const sampleRows = [
  {
    supplierId: 'SUP-001',
    name: 'Carnes del Valle S.A.S',
    category: 'Proteínas',
    status: 'active' as const,
    paymentTerms: '30 días',
    leadTime: '24h',
    reliability: '4.8 ★',
    productCount: 45,
    balance: '$2.450.000',
    lastPurchaseOrder: '2024-05-20',
  },
  {
    supplierId: 'SUP-004',
    name: 'Especias del Sur',
    category: 'Especias',
    status: 'inactive' as const,
    paymentTerms: '45 días',
    leadTime: '72h',
    reliability: '4.2 ★',
    productCount: 156,
    balance: '$890.000',
    lastPurchaseOrder: '2024-04-15',
  },
  {
    supplierId: 'SUP-006',
    name: 'Aceites Premium Colombia',
    category: 'Aceites',
    status: 'pending' as const,
    paymentTerms: '30 días',
    leadTime: '24h',
    reliability: '-',
    productCount: 0,
    balance: '$0',
    lastPurchaseOrder: '-',
  },
];

const meta: Meta<typeof ProveedorSuppliersTable> = {
  title: 'Proveedor/ProveedorSuppliersTable',
  component: ProveedorSuppliersTable,
  ...proveedorStoryMeta,
  tags: ['autodocs'],
  args: { size: 'xl', rows: sampleRows },
};

export default meta;
type Story = StoryObj<typeof ProveedorSuppliersTable>;

export const Default: Story = {};
export const ManyRows: Story = {
  args: {
    rows: [
      ...sampleRows,
      ...sampleRows.map((row, index) => ({
        ...row,
        supplierId: `SUP-10${index}`,
        name: `${row.name} (${index + 2})`,
      })),
    ],
  },
};
export const Empty: Story = { args: { rows: [] } };
export const FullWidthXL: Story = {
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', width: '100%', maxWidth: '100%' }}>
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
      <ProveedorSuppliersTable {...args} size="sm" />
      <ProveedorSuppliersTable {...args} size="md" />
      <ProveedorSuppliersTable {...args} size="xl" />
    </div>
  ),
};

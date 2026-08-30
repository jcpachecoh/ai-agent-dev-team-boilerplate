import type { Meta, StoryObj } from '@storybook/react';

import { NominaDashboardPreview } from './NominaDashboardPreview';

const meta: Meta<typeof NominaDashboardPreview> = {
  title: 'Nomina/NominaDashboardPreview',
  component: NominaDashboardPreview,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaDashboardPreview>;

export const Dark: Story = {
  args: { theme: 'dark' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  args: { theme: 'light' },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#f6f4ef' }}>
        <Story />
      </div>
    ),
  ],
};

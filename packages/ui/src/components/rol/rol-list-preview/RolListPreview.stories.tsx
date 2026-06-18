import type { Meta, StoryObj } from '@storybook/react';

import { RolListPreview } from './RolListPreview';

const meta: Meta<typeof RolListPreview> = {
  title: 'Rol/RolListPreview',
  component: RolListPreview,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RolListPreview>;

export const Dark: Story = {
  args: {
    theme: 'dark',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
        <Story />
      </div>
    ),
  ],
};

export const Light: Story = {
  args: {
    theme: 'light',
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: '100vh', background: '#f6f4ef' }}>
        <Story />
      </div>
    ),
  ],
};

export const WithPanelOpen: Story = {
  args: {
    theme: 'dark',
    showPanel: true,
    selectedRoleId: 'rol-supervisor',
    canAssignPermissions: true,
  },
  decorators: Dark.decorators,
};

export const ReadOnlyPanel: Story = {
  args: {
    theme: 'light',
    showPanel: true,
    selectedRoleId: 'rol-nomina',
    canAssignPermissions: false,
  },
  decorators: Light.decorators,
};

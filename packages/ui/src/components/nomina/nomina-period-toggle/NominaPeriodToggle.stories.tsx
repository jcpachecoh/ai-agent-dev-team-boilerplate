import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { NominaPeriodToggle } from './NominaPeriodToggle';

const meta: Meta<typeof NominaPeriodToggle> = {
  title: 'Nomina/NominaPeriodToggle',
  component: NominaPeriodToggle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NominaPeriodToggle>;

function ToggleDemo({ theme }: { theme: 'light' | 'dark' }) {
  const [value, setValue] = useState<'week' | 'month'>('month');
  return (
    <div style={{ padding: 24, background: theme === 'dark' ? '#0a0a0a' : '#f6f4ef' }}>
      <NominaPeriodToggle theme={theme} value={value} onChange={setValue} />
    </div>
  );
}

export const Dark: Story = {
  render: () => <ToggleDemo theme="dark" />,
};

export const Light: Story = {
  render: () => <ToggleDemo theme="light" />,
};

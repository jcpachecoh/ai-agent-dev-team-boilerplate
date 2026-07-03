import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import { Tooltip } from './Tooltip';
import { Button } from '../Button/Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Moleculas/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    theme: { control: 'radio', options: ['dark', 'light', 'brand'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    triggerSize: { control: 'radio', options: ['sm', 'md', 'lg'] },
    delayDuration: { control: { type: 'number', min: 0, max: 2000, step: 100 } },
  },
  args: {
    theme: 'brand',
    size: 'md',
    triggerSize: 'md',
    delayDuration: 300,
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

function TooltipDemo(props: React.ComponentProps<typeof Tooltip>) {
  return (
    <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
      <Tooltip {...props}>
        <Button variant="primary">Hover me</Button>
      </Tooltip>
    </div>
  );
}

export const Playground: Story = {
  args: {
    content: 'Texto de ayuda',
  },
  render: (args) => <TooltipDemo {...args} />,
};

export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 32,
        padding: 80,
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <TooltipDemo
          key={size}
          content={`Tooltip ${size}`}
          theme="dark"
          size={size}
          triggerSize={size}
        />
      ))}
    </div>
  ),
  ...darkBackground,
};

export const Dark: Story = {
  args: { content: 'Texto de ayuda', theme: 'dark', triggerSize: 'md' },
  render: (args) => <TooltipDemo {...args} />,
  ...darkBackground,
};

export const Light: Story = {
  args: { content: 'Ayuda ligera', theme: 'light', triggerSize: 'md' },
  render: (args) => <TooltipDemo {...args} />,
  ...lightBackground,
};

export const Brand: Story = {
  args: { content: 'Marca RestOpsIQ', theme: 'brand', triggerSize: 'md' },
  render: (args) => <TooltipDemo {...args} />,
  ...lightBackground,
};

import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import { Tooltip, TooltipProvider } from './Tooltip';
import { Button } from '../Button/Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Moleculas/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'radio', options: ['dark', 'light', 'brand'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    triggerSize: { control: 'radio', options: ['sm', 'md', 'lg'] },
    delayDuration: { control: { type: 'number', min: 0, max: 2000, step: 100 } },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

function TooltipDemo(props: React.ComponentProps<typeof Tooltip>) {
  return (
    <div style={{ padding: 80, display: 'flex', justifyContent: 'center' }}>
      <TooltipProvider>
        <Tooltip {...props}>
          <Button variant="primary">Hover me</Button>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export const Playground: Story = {
  args: {
    content: 'Texto de ayuda',
    variant: 'brand',
    size: 'md',
    triggerSize: 'md',
    delayDuration: 300,
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
          variant="dark"
          size={size}
          triggerSize={size}
        />
      ))}
    </div>
  ),
  ...darkBackground,
};

export const Dark: Story = {
  args: { content: 'Texto de ayuda', variant: 'dark', triggerSize: 'md' },
  render: (args) => <TooltipDemo {...args} />,
  ...darkBackground,
};

export const Light: Story = {
  args: { content: 'Ayuda ligera', variant: 'light', triggerSize: 'md' },
  render: (args) => <TooltipDemo {...args} />,
  ...lightBackground,
};

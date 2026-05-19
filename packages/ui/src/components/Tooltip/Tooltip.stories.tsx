import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Tooltip, TooltipProvider } from './Tooltip';
import { Button } from '../Button/Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Moleculas/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Dark: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip content="Texto de ayuda" variant="dark">
        <Button variant="primary">Hover me</Button>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const Light: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip content="Ayuda ligera" variant="light">
        <Button variant="primary">Hover me</Button>
      </Tooltip>
    </TooltipProvider>
  ),
};

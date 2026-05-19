import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';
import { Button } from '../Button/Button';

const meta: Meta<typeof Popover> = {
  title: 'Moleculas/Popover',
  component: Popover,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover content={<div style={{ padding: 8 }}>Menu rico con contenido</div>}>
      <Button variant="primary">Abrir Popover</Button>
    </Popover>
  ),
};

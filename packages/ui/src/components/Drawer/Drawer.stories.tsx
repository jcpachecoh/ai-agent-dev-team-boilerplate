import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer';
import { Button } from '../Button/Button';

const meta: Meta<typeof Drawer> = {
  title: 'Moleculas/Drawer',
  component: Drawer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Drawer>;

type AnyStory = StoryObj<Record<string, any>>;

export const Right: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Right Drawer</Button>
        <Drawer open={open} onOpenChange={setOpen} side="right" title="Filtros">
          <div style={{ minHeight: 200 }}>Contenido del drawer derecho</div>
        </Drawer>
      </>
    );
  },
};

export const Bottom: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Bottom Drawer</Button>
        <Drawer open={open} onOpenChange={setOpen} side="bottom" size="md" title="Detalle" />
      </>
    );
  },
};

export const Playground: AnyStory = {
  argTypes: {
    side: { control: { type: 'select', options: ['right', 'left', 'bottom', 'top'] } },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg'] } },
  },
  args: {
    side: 'right',
    size: 'md',
    title: 'Panel',
  },
  render: (args: any) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Drawer ({args.side})</Button>
        <Drawer open={open} onOpenChange={setOpen} {...args}>
          <div style={{ minHeight: 200 }}>
            Contenido del drawer {args.side} / {args.size}
          </div>
        </Drawer>
      </>
    );
  },
};

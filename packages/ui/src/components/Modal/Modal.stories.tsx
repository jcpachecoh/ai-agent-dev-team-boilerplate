import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Modal, ConfirmModal } from './Modal';
import { Button } from '../Button/Button';

const meta: Meta<typeof Modal> = {
  title: 'Moleculas/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'radio', options: ['sm', 'md', 'lg', 'xl', 'fullscreen'] } },
    iconColor: { control: 'color' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Confirm: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Confirm</Button>
        <ConfirmModal
          open={open}
          onOpenChange={setOpen}
          onConfirm={() => alert('Confirmed')}
          onCancel={() => setOpen(false)}
          title="¿Aceptar pedido?"
          description="Esta acción no se puede deshacer."
          size={args.size}
          iconColor={args.iconColor}
        />
      </>
    );
  },
};

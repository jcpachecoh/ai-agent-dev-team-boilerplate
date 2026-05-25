import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import { Modal, ConfirmModal } from './Modal';
import { ReportNovedadModal } from './ReportNovedadModal';
import { Button } from '../Button/Button';

const meta: Meta<typeof Modal> = {
  title: 'Moleculas/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'radio', options: ['sm', 'md', 'lg', 'xl', 'fullscreen'] } },
    theme: { control: { type: 'radio', options: ['light', 'dark'] } },
  },
  args: {
    theme: 'dark',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ModalDemo({
  size,
  theme,
  title = 'Título del modal',
  description = 'Descripción de apoyo para el usuario.',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  theme?: 'light' | 'dark';
  title?: string;
  description?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir modal</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        size={size}
        theme={theme}
        title={title}
        description={description}
        footer={
          <>
            <Button variant="secondary" size="medium" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="medium" onClick={() => setOpen(false)}>
              Aceptar
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>Contenido del cuerpo del modal.</p>
      </Modal>
    </>
  );
}

export const Playground: Story = {
  render: (args) => <ModalDemo size={args.size} theme={args.theme} />,
};

export const ConfirmDestructive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          ¿Eliminar viaje?
        </Button>
        <ConfirmModal
          open={open}
          onOpenChange={setOpen}
          onConfirm={() => setOpen(false)}
          confirmVariant="danger"
          theme="dark"
          title="¿Eliminar viaje?"
          description="Esta acción no se puede deshacer."
          confirmLabel="Confirmar"
          cancelLabel="Cancelar"
        />
      </>
    );
  },
  ...darkBackground,
};

export const ReportNovedad: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Reportar novedad</Button>
        <ReportNovedadModal
          open={open}
          onOpenChange={setOpen}
          onSubmit={(p) => console.log('novedad', p)}
        />
      </>
    );
  },
  ...darkBackground,
};

export const SmLight: Story = {
  render: () => <ModalDemo size="sm" theme="light" />,
  ...lightBackground,
};

export const MdDark: Story = {
  render: () => <ModalDemo size="md" theme="dark" />,
  ...darkBackground,
};

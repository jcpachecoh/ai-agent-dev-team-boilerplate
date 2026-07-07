import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../Button';
import { Toaster, toast } from './Toast';

const meta: Meta<typeof Toaster> = {
  title: 'Feedback/Toast',
  component: Toaster,
  tags: ['autodocs'],
  args: {
    closeButton: true,
    position: 'bottom-right',
    size: 'comfortable',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['compact', 'comfortable', 'wide'],
    },
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toaster>;

const surfaceBase = {
  minHeight: '420px',
  padding: '2rem',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: '1rem',
};

const controlsStyle = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap' as const,
  alignItems: 'center',
};

const firePromiseToast = (): void => {
  const promise = new Promise((resolve) => setTimeout(resolve, 1800));

  toast.promise(promise, {
    loading: 'Optimizando viajes...',
    success: 'Rutas actualizadas',
    error: 'No se pudieron actualizar las rutas',
  });
};

export const Default: Story = {
  render: (args) => (
    <div style={{ ...surfaceBase, background: '#f7f6f2' }}>
      <Toaster {...args} />
      <div style={controlsStyle}>
        <Button
          onClick={() =>
            toast('Planificacion sincronizada', {
              description: '6 pedidos pendientes listos para asignar.',
            })
          }
        >
          Default
        </Button>
        <Button
          onClick={() =>
            toast.success('Viaje creado', {
              description: 'Viaje 001 quedo listo para Carlos Mendoza.',
            })
          }
        >
          Success
        </Button>
        <Button
          onClick={() =>
            toast.error('Capacidad excedida', {
              description: 'Reduce 240 kg antes de completar el viaje.',
            })
          }
        >
          Error
        </Button>
        <Button
          onClick={() =>
            toast.warning('Pedido urgente', {
              description: 'Sede Norte vence a las 08:00.',
            })
          }
        >
          Warning
        </Button>
        <Button
          onClick={() =>
            toast.info('Sistema operativo', {
              description: 'La flota esta disponible para nuevos viajes.',
            })
          }
        >
          Info
        </Button>
        <Button onClick={firePromiseToast}>Loading</Button>
        <Button
          onClick={() =>
            toast('Pedido movido', {
              description: 'Sede Sur ahora esta en Viaje 002.',
              action: {
                label: 'Deshacer',
                onClick: () => toast.info('Cambio revertido'),
              },
              cancel: {
                label: 'Cerrar',
                onClick: () => toast.dismiss(),
              },
            })
          }
        >
          Action
        </Button>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark" style={{ ...surfaceBase, background: '#08080d' }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <>
      <Toaster {...args} theme="dark" />
      <div style={controlsStyle}>
        <Button
          onClick={() =>
            toast.success('Sistema OK', {
              description: 'Despachos, conductores y rutas estan en linea.',
            })
          }
        >
          Success
        </Button>
        <Button
          onClick={() =>
            toast.warning('Revision sugerida', {
              description: 'Viaje 001 sigue sin pedidos asignados.',
            })
          }
        >
          Warning
        </Button>
        <Button
          onClick={() =>
            toast.error('No se pudo completar', {
              description: 'El costo del viaje requiere validacion.',
            })
          }
        >
          Error
        </Button>
        <Button onClick={firePromiseToast}>Loading</Button>
      </div>
    </>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ ...surfaceBase, background: '#f7f6f2' }}>
      <Toaster {...args} />
      <div style={controlsStyle}>
        <Button
          onClick={() =>
            toast('Toast compacto', {
              description: 'Cambia el control size a compact.',
            })
          }
        >
          Compact
        </Button>
        <Button
          onClick={() =>
            toast('Toast comodo', {
              description: 'Cambia el control size a comfortable.',
            })
          }
        >
          Comfortable
        </Button>
        <Button
          onClick={() =>
            toast('Toast amplio', {
              description: 'Cambia el control size a wide para acciones largas.',
              action: {
                label: 'Aplicar',
                onClick: () => toast.success('Tamano aplicado'),
              },
              cancel: {
                label: 'Cerrar',
                onClick: () => toast.dismiss(),
              },
            })
          }
        >
          Wide
        </Button>
      </div>
    </div>
  ),
};

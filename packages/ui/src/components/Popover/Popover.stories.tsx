import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import { Popover } from './Popover';
import { Button } from '../Button/Button';

const meta: Meta<typeof Popover> = {
  title: 'Moleculas/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    side: { control: 'select', options: ['top', 'right', 'bottom', 'left'] },
    align: { control: 'select', options: ['start', 'center', 'end'] },
  },
  args: {
    theme: 'dark',
    size: 'md',
    side: 'bottom',
    align: 'center',
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

const richContent = (
  <div>
    <div style={{ fontWeight: 600, marginBottom: 6 }}>Acciones rápidas</div>
    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.5 }}>
      <li>Editar viaje</li>
      <li>Duplicar ruta</li>
      <li>Archivar</li>
    </ul>
  </div>
);

export const Playground: Story = {
  render: (args) => (
    <div style={{ padding: 100, display: 'flex', justifyContent: 'center' }}>
      <Popover {...args} content={richContent}>
        <Button variant="primary">Abrir popover</Button>
      </Popover>
    </div>
  ),
};

export const DarkMode: Story = {
  args: { theme: 'dark', size: 'md' },
  render: Playground.render,
  ...darkBackground,
};

export const LightMode: Story = {
  args: { theme: 'light', size: 'md' },
  render: Playground.render,
  ...lightBackground,
};

export const AllSizes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 32,
        padding: 100,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Popover key={size} theme="dark" size={size} content={`Tamaño ${size}`}>
          <Button variant="primary" size="medium">
            {size}
          </Button>
        </Popover>
      ))}
    </div>
  ),
  ...darkBackground,
};

export const ThemeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 48, padding: 100, justifyContent: 'center' }}>
      <Popover theme="light" size="lg" content={richContent}>
        <Button variant="primary">Light</Button>
      </Popover>
      <Popover theme="dark" size="lg" content={richContent}>
        <Button variant="primary">Dark</Button>
      </Popover>
    </div>
  ),
};

import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { darkBackground, lightBackground } from '../../storybook/theme-helpers';
import { Drawer } from './Drawer';
import { Button } from '../Button/Button';

const meta: Meta<typeof Drawer> = {
  title: 'Moleculas/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  argTypes: {
    side: { control: { type: 'select', options: ['right', 'left', 'bottom', 'top'] } },
    size: { control: { type: 'select', options: ['sm', 'md', 'lg', 'xl'] } },
    theme: { control: { type: 'radio', options: ['light', 'dark'] } },
  },
  args: {
    side: 'right',
    size: 'md',
    theme: 'dark',
    title: 'Panel',
  },
};

export default meta;
type Story = StoryObj<typeof Drawer>;

function DrawerTrigger(props: React.ComponentProps<typeof Drawer>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        Abrir {props.side} / {props.size} / {props.theme}
      </Button>
      <Drawer open={open} onOpenChange={setOpen} {...props}>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Ancho o alto según lado y tamaño. Compara sm (280px), md (400px), lg (560px), xl (720px).
        </p>
      </Drawer>
    </>
  );
}

export const Playground: Story = {
  render: (args) => <DrawerTrigger {...args} />,
};

export const LightMode: Story = {
  render: () => <DrawerTrigger side="right" size="md" theme="light" title="Filtros (light)" />,
  ...lightBackground,
};

export const DarkMode: Story = {
  render: () => <DrawerTrigger side="right" size="md" theme="dark" title="Filtros (dark)" />,
  ...darkBackground,
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 24 }}>
      {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <DrawerTrigger key={size} side="right" size={size} theme="dark" title={`Size ${size}`} />
      ))}
    </div>
  ),
  ...darkBackground,
};

export const ThemeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, padding: 24 }}>
      <DrawerTrigger side="right" size="lg" theme="light" title="Light" />
      <DrawerTrigger side="right" size="lg" theme="dark" title="Dark" />
    </div>
  ),
};

export const BottomSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, padding: 24 }}>
      <DrawerTrigger side="bottom" size="sm" theme="dark" title="Bottom sm" />
      <DrawerTrigger side="bottom" size="xl" theme="dark" title="Bottom xl" />
    </div>
  ),
  ...darkBackground,
};

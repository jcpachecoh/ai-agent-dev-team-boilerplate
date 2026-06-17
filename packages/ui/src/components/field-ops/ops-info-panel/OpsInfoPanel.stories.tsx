import type { Meta, StoryObj } from '@storybook/react';
import { ClipboardList, Layers, Scale, Thermometer } from 'lucide-react';

import { darkModeDecorator, fieldOpsStoryMeta } from '../shared/story-decorators';
import { OpsInfoPanel } from './OpsInfoPanel';

const meta: Meta<typeof OpsInfoPanel> = {
  title: 'Field Ops/OpsInfoPanel',
  component: OpsInfoPanel,
  ...fieldOpsStoryMeta,
};

export default meta;
type Story = StoryObj<typeof OpsInfoPanel>;

const instructionItems = [
  {
    id: '1',
    icon: <Thermometer size={16} />,
    text: 'Verificar temperatura interna ≥ 74°C antes de porcionar.',
  },
  {
    id: '2',
    icon: <Scale size={16} />,
    text: 'Pesar porciones a 150g ± 10g usando báscula calibrada.',
  },
  {
    id: '3',
    icon: <ClipboardList size={16} />,
    text: 'Registrar lote y operador en la hoja de control.',
  },
  {
    id: '4',
    icon: <Layers size={16} />,
    text: 'Empacar en bandejas según estándar de la línea.',
  },
];

export const Default: Story = {
  args: {
    title: 'Instrucciones de fase',
    items: instructionItems,
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Instrucciones de fase',
    items: instructionItems.slice(0, 2),
    footer: (
      <span style={{ fontSize: 12, opacity: 0.7 }}>
        Referencia visual disponible en estación EST-02
      </span>
    ),
  },
};

export const DarkMode: Story = {
  decorators: [darkModeDecorator],
  args: {
    ...Default.args,
    theme: 'dark',
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
      <OpsInfoPanel {...args} size="sm" />
      <OpsInfoPanel {...args} size="md" />
      <OpsInfoPanel {...args} size="xl" />
    </div>
  ),
  args: Default.args,
};

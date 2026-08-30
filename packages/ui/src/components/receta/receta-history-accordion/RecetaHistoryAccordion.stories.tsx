import type { Meta, StoryObj } from '@storybook/react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import { RecetaHistoryAccordion, type RecetaHistoryAccordionItem } from './RecetaHistoryAccordion';

const items: RecetaHistoryAccordionItem[] = [
  {
    value: 'EX-001',
    code: 'EX-001',
    recipeName: 'Lomo de Cerdo al Carbón',
    operatorName: 'Carlos Méndez',
    date: '25 de may, 08:30 a. m.',
    progress: '6/6',
    result: 'ok',
    validationsOk: 12,
    validationsFailed: 0,
    duration: '47 / 45 min',
    observations: 'Ejecución exitosa sin incidentes',
    phases: [
      { title: 'Preparación', note: 'Sin novedades', duration: '14 min' },
      { title: 'Marinado', note: 'Sin novedades', duration: '28 min' },
      { title: 'Cocción', note: 'Sin novedades', duration: '5 min' },
    ],
  },
  {
    value: 'EX-002',
    code: 'EX-002',
    recipeName: 'Costillas BBQ',
    operatorName: 'Ana Rojas',
    date: '25 de may, 10:15 a. m.',
    progress: '7/8',
    result: 'warning',
    validationsOk: 14,
    validationsFailed: 2,
    duration: '68 / 60 min',
    observations: 'Tiempo de cocción excedido en 8 minutos',
    phases: [
      { title: 'Preparación', note: 'Sin novedades', duration: '12 min' },
      { title: 'Cocción', note: 'Excedió tiempo', duration: '56 min' },
    ],
  },
  {
    value: 'EX-003',
    code: 'EX-003',
    recipeName: 'Flan de Caramelo',
    operatorName: 'María Torres',
    date: '25 de may, 02:06 p. m.',
    progress: '3/5',
    result: 'failed',
    validationsOk: 5,
    validationsFailed: 3,
    duration: '45 / 90 min',
    observations: 'Validación de temperatura fallida en fase de horneado',
    phases: [{ title: 'Horneado', note: 'Temp. insuficiente', duration: '45 min' }],
  },
];

const meta: Meta<typeof RecetaHistoryAccordion> = {
  title: 'Receta/RecetaHistoryAccordion',
  component: RecetaHistoryAccordion,
  tags: ['autodocs'],
  decorators: [recetaDarkDecorator],
  args: {
    theme: 'dark',
    size: 'xl',
    items,
  },
};

export default meta;

type Story = StoryObj<typeof RecetaHistoryAccordion>;

export const Default: Story = {};

export const Expanded: Story = {
  args: {
    defaultValue: 'EX-001',
  },
};

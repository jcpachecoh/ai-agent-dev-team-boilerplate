import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import { RecetaPhaseModal } from './RecetaPhaseModal';

const responsibleOptions = [
  { value: 'Operario', label: 'Operario' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Manager', label: 'Manager' },
];

const meta: Meta<typeof RecetaPhaseModal> = {
  title: 'Receta/RecetaPhaseModal',
  component: RecetaPhaseModal,
  tags: ['autodocs'],
  decorators: [recetaDarkDecorator],
  args: {
    open: true,
    theme: 'dark',
    size: 'md',
    phaseName: '',
    phaseDescription: '',
    phaseDuration: '10',
    phaseResponsible: 'Operario',
    responsibleOptions,
  },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    size: { control: 'radio', options: ['sm', 'md', 'xl'] },
  },
};

export default meta;

type Story = StoryObj<typeof RecetaPhaseModal>;

function PhaseModalStory(args: Story['args']) {
  const [open, setOpen] = useState(true);
  const [phaseName, setPhaseName] = useState('');
  const [phaseDescription, setPhaseDescription] = useState('');
  const [phaseDuration, setPhaseDuration] = useState('10');
  const [phaseResponsible, setPhaseResponsible] = useState('Operario');

  return (
    <RecetaPhaseModal
      {...args}
      open={open}
      onClose={() => setOpen(false)}
      phaseName={phaseName}
      onPhaseNameChange={setPhaseName}
      phaseDescription={phaseDescription}
      onPhaseDescriptionChange={setPhaseDescription}
      phaseDuration={phaseDuration}
      onPhaseDurationChange={setPhaseDuration}
      phaseResponsible={phaseResponsible}
      onPhaseResponsibleChange={setPhaseResponsible}
      onCancel={() => setOpen(false)}
      onSave={() => setOpen(false)}
    />
  );
}

export const Default: Story = {
  render: (args) => <PhaseModalStory {...args} />,
};

export const Light: Story = {
  args: {
    theme: 'light',
  },
  render: (args) => <PhaseModalStory {...args} />,
};

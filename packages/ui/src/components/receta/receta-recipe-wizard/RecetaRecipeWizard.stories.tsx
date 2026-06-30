import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

import { recetaDarkDecorator } from '../shared/story-decorators';
import type { RecetaRecipeWizardStepId } from '../shared/receta-wizard-types';
import { RecetaRecipeWizard } from './RecetaRecipeWizard';

const meta: Meta<typeof RecetaRecipeWizard> = {
  title: 'Receta/RecetaRecipeWizard',
  component: RecetaRecipeWizard,
  tags: ['autodocs'],
  decorators: [recetaDarkDecorator],
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof RecetaRecipeWizard>;

const demoPhases = [
  {
    id: 'p1',
    title: 'Preparación',
    description: 'Limpieza y corte de ingredientes',
    durationMin: 15,
    assignee: 'Operario',
  },
  {
    id: 'p2',
    title: 'Cocción',
    description: 'Cocción lenta a temperatura controlada',
    durationMin: 45,
    assignee: 'Supervisor',
  },
];

function WizardDemo({ mode }: { mode: 'create' | 'edit' }): React.JSX.Element {
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState<RecetaRecipeWizardStepId>('general');
  const [maxReachedStep, setMaxReachedStep] = useState<RecetaRecipeWizardStepId>('general');
  const [name, setName] = useState(mode === 'edit' ? 'Costillas BBQ' : '');
  const [categoryId, setCategoryId] = useState('cat-1');
  const [finishedProductId, setFinishedProductId] = useState('item-1');
  const [batchSize, setBatchSize] = useState('10');
  const [batchUnit, setBatchUnit] = useState('KILOGRAMS');
  const [packageWeight, setPackageWeight] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('Receta de demostración');

  const stepOrder: RecetaRecipeWizardStepId[] = ['general', 'composition', 'phases'];
  const advanceMax = (step: RecetaRecipeWizardStepId): void => {
    const currentIndex = stepOrder.indexOf(maxReachedStep);
    const nextIndex = stepOrder.indexOf(step);
    if (nextIndex > currentIndex) {
      setMaxReachedStep(step);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#141414' }}>
      <RecetaRecipeWizard
        open={open}
        onClose={() => setOpen(false)}
        mode={mode}
        code={mode === 'edit' ? 'RC-001' : 'Nueva'}
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepChange={setCurrentStep}
        onSave={() => undefined}
        onNext={() => {
          const index = stepOrder.indexOf(currentStep);
          const next = stepOrder[index + 1];
          if (next) {
            setCurrentStep(next);
            advanceMax(next);
          }
        }}
        onPrevious={() => {
          const index = stepOrder.indexOf(currentStep);
          const prev = stepOrder[index - 1];
          if (prev) {
            setCurrentStep(prev);
          }
        }}
        generalStep={{
          name,
          onNameChange: setName,
          categoryId,
          onCategoryChange: setCategoryId,
          categoryOptions: [
            { value: 'cat-1', label: 'Plato principal' },
            { value: 'cat-2', label: 'Producción planta' },
          ],
          finishedProductId,
          onFinishedProductChange: setFinishedProductId,
          supplyItemOptions: [{ value: 'item-1', label: 'Costillas (INS-001)' }],
          batchSize,
          onBatchSizeChange: setBatchSize,
          batchUnit,
          onBatchUnitChange: setBatchUnit,
          batchUnitOptions: [{ value: 'KILOGRAMS', label: 'Kilogramos' }],
          packageWeight,
          onPackageWeightChange: setPackageWeight,
          estimatedMinutes,
          onEstimatedMinutesChange: setEstimatedMinutes,
          isActive,
          onIsActiveChange: setIsActive,
          notes,
          onNotesChange: setNotes,
          showVersion: mode === 'edit',
          versionLabel: mode === 'edit' ? 'v1.1' : undefined,
        }}
        compositionStep={{
          componentCount: 0,
          totalNetLabel: '0 g',
          onAddComponent: () => undefined,
          children: <p style={{ padding: 16 }}>Tabla de composición (demo)</p>,
        }}
        productionPhasesStep={{
          phases: demoPhases,
          onAddPhase: () => undefined,
          onEditPhase: () => undefined,
          onDeletePhase: () => undefined,
        }}
      />
    </div>
  );
}

export const NuevaReceta: Story = {
  render: () => <WizardDemo mode="create" />,
};

export const EditarReceta: Story = {
  render: () => <WizardDemo mode="edit" />,
};

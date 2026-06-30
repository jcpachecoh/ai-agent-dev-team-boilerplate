import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import type { PlantNoveltySeverity, PlantNoveltyType } from '../shared/plant-workstation-types';
import { PlantIncidentReportModal } from './PlantIncidentReportModal';

const meta: Meta<typeof PlantIncidentReportModal> = {
  title: 'Field Ops/Plant Dashboard/PlantIncidentReportModal',
  component: PlantIncidentReportModal,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component:
          'Modal para reportar novedades en una estación de trabajo. Presentacional: el host de la app conecta cámara, API y cola offline.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlantIncidentReportModal>;

function ModalStoryHarness(props: Partial<React.ComponentProps<typeof PlantIncidentReportModal>>) {
  const [description, setDescription] = useState(props.description ?? '');
  const [noveltyType, setNoveltyType] = useState<PlantNoveltyType>(
    props.noveltyType ?? 'QUALITY_ISSUE',
  );
  const [severity, setSeverity] = useState<PlantNoveltySeverity>(props.severity ?? 'MEDIUM');
  const [requiresPause, setRequiresPause] = useState(props.requiresPause ?? false);

  return (
    <PlantIncidentReportModal
      open
      subtitle="OP0001-01 · Pollo asado porcionado"
      description={description}
      onDescriptionChange={setDescription}
      noveltyType={noveltyType}
      onNoveltyTypeChange={setNoveltyType}
      severity={severity}
      onSeverityChange={setSeverity}
      requiresPause={requiresPause}
      onRequiresPauseChange={setRequiresPause}
      onSubmit={() => undefined}
      onClose={() => undefined}
      size="xl"
      {...props}
    />
  );
}

export const Default: Story = {
  render: () => <ModalStoryHarness />,
};

export const LightMode: Story = {
  render: () => <ModalStoryHarness theme="light" />,
};

export const WithDescription: Story = {
  render: () => (
    <ModalStoryHarness description="Sensor de temperatura fuera de rango en la estación." />
  ),
};

export const RequiresPause: Story = {
  render: () => <ModalStoryHarness requiresPause severity="HIGH" noveltyType="UNPLANNED_STOP" />,
};

export const Submitting: Story = {
  render: () => (
    <ModalStoryHarness description="Falla en sensor" isSubmitting noveltyType="EQUIPMENT_FAILURE" />
  ),
};

export const ErrorState: Story = {
  render: () => (
    <ModalStoryHarness
      description="Detalle del incidente"
      error="No se pudo registrar la novedad"
    />
  ),
};

export const ExtraLarge: Story = {
  render: () => <ModalStoryHarness size="xl" />,
};

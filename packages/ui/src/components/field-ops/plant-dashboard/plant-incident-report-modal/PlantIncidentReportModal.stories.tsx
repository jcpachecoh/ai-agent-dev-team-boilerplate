import type { Meta, StoryObj } from '@storybook/react';

import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
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

const baseArgs = {
  open: true,
  subtitle: 'OP0001-01 · Pollo asado porcionado',
  description: '',
  onDescriptionChange: () => undefined,
  type: 'QUALITY' as const,
  onTypeChange: () => undefined,
  severity: 'WARNING' as const,
  onSeverityChange: () => undefined,
  onCapturePhoto: () => undefined,
  onSubmit: () => undefined,
  onClose: () => undefined,
};

export const Default: Story = {
  args: baseArgs,
};

export const LightMode: Story = {
  args: {
    ...baseArgs,
    theme: 'light',
  },
};

export const WithPhoto: Story = {
  args: {
    ...baseArgs,
    description: 'Sensor de temperatura fuera de rango en la estación.',
    photoPreview:
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="240"%3E%3Crect width="100%25" height="100%25" fill="%23222"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23888" font-family="sans-serif" font-size="18"%3EEvidencia%3C/text%3E%3C/svg%3E',
  },
};

export const Capturing: Story = {
  args: {
    ...baseArgs,
    isCapturing: true,
  },
};

export const Submitting: Story = {
  args: {
    ...baseArgs,
    description: 'Falla en sensor',
    isSubmitting: true,
  },
};

export const ErrorState: Story = {
  args: {
    ...baseArgs,
    description: 'Detalle del incidente',
    error: 'Permiso de cámara denegado',
  },
};

export const OfflineQueued: Story = {
  args: {
    ...baseArgs,
    description: 'Falla en sensor',
    error:
      'Incidente en cola offline. La foto se sincronizará cuando haya conexión (upload pendiente).',
  },
};

export const ExtraLarge: Story = {
  args: {
    ...baseArgs,
    size: 'xl',
  },
};

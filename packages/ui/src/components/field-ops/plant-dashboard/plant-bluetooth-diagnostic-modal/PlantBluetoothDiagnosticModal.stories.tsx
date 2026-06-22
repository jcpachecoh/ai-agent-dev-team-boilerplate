import type { Meta, StoryObj } from '@storybook/react';

import type { PlantBleDeviceSummary } from '../shared/plant-workstation-types';
import { plantDashboardStoryMeta } from '../shared/plant-dashboard-story-meta';
import { PlantBluetoothDiagnosticModal } from './PlantBluetoothDiagnosticModal';

const devices: PlantBleDeviceSummary[] = [
  { deviceId: 'AA:BB:CC:DD:EE:01', name: 'Balanza EST-02', rssi: -62 },
  { deviceId: 'AA:BB:CC:DD:EE:02', name: 'Sensor temp', rssi: -78 },
  { deviceId: 'AA:BB:CC:DD:EE:03', rssi: -91 },
];

const meta: Meta<typeof PlantBluetoothDiagnosticModal> = {
  title: 'Field Ops/Plant Dashboard/PlantBluetoothDiagnosticModal',
  component: PlantBluetoothDiagnosticModal,
  ...plantDashboardStoryMeta,
  tags: ['autodocs'],
  parameters: {
    ...plantDashboardStoryMeta.parameters,
    docs: {
      description: {
        component:
          'Modal de diagnóstico BLE para tablets nativas. Presentacional: la app Plant conecta Capacitor Bluetooth LE.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PlantBluetoothDiagnosticModal>;

const baseArgs = {
  open: true,
  status: 'Listo',
  isNativeAvailable: true,
  devices: [] as PlantBleDeviceSummary[],
  onClose: () => undefined,
  onStartScan: () => undefined,
  onStopScan: () => undefined,
  onConnect: () => undefined,
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

export const Scanning: Story = {
  args: {
    ...baseArgs,
    scanning: true,
    status: 'Escaneando dispositivos BLE…',
  },
};

export const WithDevices: Story = {
  args: {
    ...baseArgs,
    devices,
    status: 'Escaneo detenido',
  },
};

export const Connected: Story = {
  args: {
    ...baseArgs,
    devices,
    connectedDeviceId: 'AA:BB:CC:DD:EE:01',
    status: 'Conectado',
  },
};

export const NativeOnly: Story = {
  args: {
    ...baseArgs,
    isNativeAvailable: false,
    status: 'Listo',
  },
};

export const ErrorState: Story = {
  args: {
    ...baseArgs,
    devices,
    status: 'Fallo de conexión',
    error: 'No se pudo conectar al dispositivo',
  },
};

export const ExtraLarge: Story = {
  args: {
    ...baseArgs,
    devices,
    size: 'xl',
  },
};

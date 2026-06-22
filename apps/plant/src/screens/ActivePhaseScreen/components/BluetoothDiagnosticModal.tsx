import { PlantBluetoothDiagnosticModal } from '@restopsiq/ui';
import { useCallback, useEffect, useState, type JSX } from 'react';

import {
  connectBleDevice,
  disconnectBleDevice,
  listDiscoveredBleDevices,
  startBleScan,
  stopBleScan,
  type BleDeviceSummary,
} from '@/services/bluetooth.service';
import { isNativePlatform } from '@/utils/platform';

export interface BluetoothDiagnosticModalProps {
  open: boolean;
  onClose: () => void;
}

export function BluetoothDiagnosticModal({
  open,
  onClose,
}: BluetoothDiagnosticModalProps): JSX.Element | null {
  const [devices, setDevices] = useState<BleDeviceSummary[]>([]);
  const [connectedId, setConnectedId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Listo');

  useEffect(() => {
    if (!open) {
      void stopBleScan();
      setDevices([]);
      setConnectedId(null);
      setScanning(false);
      setError(null);
      setStatus('Listo');
    }
  }, [open]);

  const refreshDevices = useCallback(() => {
    setDevices(listDiscoveredBleDevices());
  }, []);

  const handleStartScan = useCallback(async () => {
    setError(null);
    setScanning(true);
    setStatus('Escaneando dispositivos BLE…');
    try {
      await startBleScan(() => {
        refreshDevices();
      });
      refreshDevices();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Error al escanear');
      setScanning(false);
      setStatus('Error de escaneo');
    }
  }, [refreshDevices]);

  const handleStopScan = useCallback(async () => {
    await stopBleScan();
    setScanning(false);
    setStatus('Escaneo detenido');
  }, []);

  const handleConnect = useCallback(
    async (deviceId: string) => {
      setError(null);
      setStatus(`Conectando a ${deviceId}…`);
      try {
        if (connectedId && connectedId !== deviceId) {
          await disconnectBleDevice(connectedId);
        }
        await connectBleDevice(deviceId);
        setConnectedId(deviceId);
        setStatus('Conectado');
      } catch (connectError) {
        setError(connectError instanceof Error ? connectError.message : 'Error al conectar');
        setStatus('Fallo de conexión');
      }
    },
    [connectedId],
  );

  return (
    <PlantBluetoothDiagnosticModal
      open={open}
      theme="dark"
      size="xl"
      status={status}
      isNativeAvailable={isNativePlatform()}
      devices={devices}
      scanning={scanning}
      connectedDeviceId={connectedId}
      error={error}
      onStartScan={() => void handleStartScan()}
      onStopScan={() => void handleStopScan()}
      onConnect={(deviceId) => void handleConnect(deviceId)}
      onClose={onClose}
    />
  );
}

export default BluetoothDiagnosticModal;

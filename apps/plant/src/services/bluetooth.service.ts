import { BleClient, type ScanResult } from '@capacitor-community/bluetooth-le';

import { isNativePlatform } from '@/utils/platform';

export interface BleDeviceSummary {
  deviceId: string;
  name?: string;
  rssi?: number;
}

export type BluetoothErrorCode =
  | 'native_only'
  | 'permission_denied'
  | 'bluetooth_disabled'
  | 'scan_failed'
  | 'connect_failed';

export class BluetoothError extends Error {
  constructor(
    public readonly code: BluetoothErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BluetoothError';
  }
}

let initialized = false;
let scanning = false;
const discoveredDevices = new Map<string, BleDeviceSummary>();

function mapScanResult(result: ScanResult): BleDeviceSummary {
  return {
    deviceId: result.device.deviceId,
    name: result.device.name ?? result.localName,
    rssi: result.rssi,
  };
}

export function listDiscoveredBleDevices(): BleDeviceSummary[] {
  return [...discoveredDevices.values()].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
}

export function isBleScanning(): boolean {
  return scanning;
}

export async function initializeBluetooth(): Promise<void> {
  if (!isNativePlatform()) {
    throw new BluetoothError('native_only', 'Bluetooth BLE solo está disponible en la app nativa');
  }

  if (initialized) {
    return;
  }

  try {
    await BleClient.initialize({ androidNeverForLocation: true });
    initialized = true;
  } catch {
    throw new BluetoothError('permission_denied', 'No se pudo inicializar Bluetooth');
  }
}

export async function ensureBluetoothEnabled(): Promise<void> {
  await initializeBluetooth();
  const enabled = await BleClient.isEnabled();
  if (enabled) {
    return;
  }

  try {
    await BleClient.requestEnable();
  } catch {
    throw new BluetoothError('bluetooth_disabled', 'Activa Bluetooth en ajustes del dispositivo');
  }
}

export async function startBleScan(
  onDeviceFound?: (device: BleDeviceSummary) => void,
): Promise<void> {
  if (!isNativePlatform()) {
    throw new BluetoothError('native_only', 'Bluetooth BLE solo está disponible en la app nativa');
  }

  await ensureBluetoothEnabled();

  if (scanning) {
    await stopBleScan();
  }

  discoveredDevices.clear();

  const rawServices = import.meta.env.VITE_BLE_SCAN_SERVICE_UUID?.trim();
  const services = rawServices
    ? rawServices
        .split(',')
        .map((value: string) => value.trim())
        .filter(Boolean)
    : undefined;

  try {
    await BleClient.requestLEScan(services ? { services } : {}, (result) => {
      const device = mapScanResult(result);
      discoveredDevices.set(device.deviceId, device);
      onDeviceFound?.(device);
    });
    scanning = true;
  } catch {
    scanning = false;
    throw new BluetoothError('scan_failed', 'No se pudo iniciar el escaneo BLE');
  }
}

export async function stopBleScan(): Promise<void> {
  if (!isNativePlatform() || !scanning) {
    return;
  }

  try {
    await BleClient.stopLEScan();
  } finally {
    scanning = false;
  }
}

export async function connectBleDevice(deviceId: string): Promise<void> {
  if (!isNativePlatform()) {
    throw new BluetoothError('native_only', 'Bluetooth BLE solo está disponible en la app nativa');
  }

  await ensureBluetoothEnabled();

  try {
    await BleClient.connect(deviceId, () => undefined);
  } catch {
    throw new BluetoothError('connect_failed', 'No se pudo conectar al dispositivo');
  }
}

export async function disconnectBleDevice(deviceId: string): Promise<void> {
  if (!isNativePlatform()) {
    return;
  }

  try {
    await BleClient.disconnect(deviceId);
  } catch {
    // ignore stale disconnect
  }
}

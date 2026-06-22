import { beforeEach, describe, expect, it, vi } from 'vitest';

const { bleClientMock } = vi.hoisted(() => ({
  bleClientMock: {
    initialize: vi.fn(),
    isEnabled: vi.fn(),
    requestEnable: vi.fn(),
    requestLEScan: vi.fn(),
    stopLEScan: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  },
}));

vi.mock('@capacitor-community/bluetooth-le', () => ({
  BleClient: bleClientMock,
}));

vi.mock('@/utils/platform', () => ({
  isNativePlatform: vi.fn(),
}));

import { isNativePlatform } from '@/utils/platform';

import {
  BluetoothError,
  connectBleDevice,
  initializeBluetooth,
  startBleScan,
  stopBleScan,
} from './bluetooth.service';

describe('bluetooth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isNativePlatform).mockReturnValue(true);
    bleClientMock.initialize.mockResolvedValue(undefined);
    bleClientMock.isEnabled.mockResolvedValue(true);
    bleClientMock.requestLEScan.mockResolvedValue(undefined);
    bleClientMock.stopLEScan.mockResolvedValue(undefined);
    bleClientMock.connect.mockResolvedValue(undefined);
  });

  it('initializeBluetooth throws on web', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(false);
    await expect(initializeBluetooth()).rejects.toMatchObject({ code: 'native_only' });
  });

  it('startBleScan initializes and scans on native', async () => {
    await startBleScan();

    expect(bleClientMock.initialize).toHaveBeenCalledWith({ androidNeverForLocation: true });
    expect(bleClientMock.requestLEScan).toHaveBeenCalled();
  });

  it('connectBleDevice connects by id', async () => {
    await connectBleDevice('device-123');
    expect(bleClientMock.connect).toHaveBeenCalledWith('device-123', expect.any(Function));
  });

  it('stopBleScan stops active scan', async () => {
    await startBleScan();
    await stopBleScan();
    expect(bleClientMock.stopLEScan).toHaveBeenCalled();
  });

  it('throws BluetoothError when scan fails', async () => {
    bleClientMock.requestLEScan.mockRejectedValue(new Error('fail'));
    await expect(startBleScan()).rejects.toBeInstanceOf(BluetoothError);
  });
});

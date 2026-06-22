import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@capacitor/camera', () => ({
  Camera: {
    requestPermissions: vi.fn(),
    getPhoto: vi.fn(),
  },
  CameraResultType: { DataUrl: 'dataUrl' },
  CameraSource: { Prompt: 'PROMPT' },
}));

vi.mock('@/utils/platform', () => ({
  isNativePlatform: vi.fn(),
}));

import { Camera } from '@capacitor/camera';
import { isNativePlatform } from '@/utils/platform';

import { IncidentPhotoError, requestCameraPermissions, takeIncidentPhoto } from './camera.service';

describe('camera.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requestCameraPermissions returns true on web', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(false);
    await expect(requestCameraPermissions()).resolves.toBe(true);
    expect(Camera.requestPermissions).not.toHaveBeenCalled();
  });

  it('takeIncidentPhoto uses Camera on native', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    vi.mocked(Camera.requestPermissions).mockResolvedValue({
      camera: 'granted',
      photos: 'granted',
    });
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,abc',
      format: 'jpeg',
      saved: false,
    });

    await expect(takeIncidentPhoto()).resolves.toBe('data:image/jpeg;base64,abc');
  });

  it('takeIncidentPhoto throws permission_denied when camera blocked', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    vi.mocked(Camera.requestPermissions).mockResolvedValue({ camera: 'denied', photos: 'denied' });

    await expect(takeIncidentPhoto()).rejects.toMatchObject({ code: 'permission_denied' });
  });

  it('takeIncidentPhoto throws IncidentPhotoError when dataUrl missing', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    vi.mocked(Camera.requestPermissions).mockResolvedValue({
      camera: 'granted',
      photos: 'granted',
    });
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      dataUrl: undefined,
      format: 'jpeg',
      saved: false,
    });

    await expect(takeIncidentPhoto()).rejects.toBeInstanceOf(IncidentPhotoError);
  });

  it('takeIncidentPhoto throws cancelled when user dismisses native picker', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    vi.mocked(Camera.requestPermissions).mockResolvedValue({
      camera: 'granted',
      photos: 'granted',
    });
    vi.mocked(Camera.getPhoto).mockRejectedValue(new Error('User cancelled photos app'));

    await expect(takeIncidentPhoto()).rejects.toMatchObject({ code: 'cancelled' });
  });

  it('takeIncidentPhoto accepts limited camera permission on iOS', async () => {
    vi.mocked(isNativePlatform).mockReturnValue(true);
    vi.mocked(Camera.requestPermissions).mockResolvedValue({
      camera: 'limited',
      photos: 'granted',
    });
    vi.mocked(Camera.getPhoto).mockResolvedValue({
      dataUrl: 'data:image/jpeg;base64,limited',
      format: 'jpeg',
      saved: false,
    });

    await expect(takeIncidentPhoto()).resolves.toBe('data:image/jpeg;base64,limited');
  });
});

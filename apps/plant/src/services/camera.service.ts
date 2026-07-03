import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

import { isNativePlatform } from '@/utils/platform';

export type IncidentPhotoErrorCode = 'permission_denied' | 'cancelled' | 'unavailable';

export class IncidentPhotoError extends Error {
  constructor(
    public readonly code: IncidentPhotoErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'IncidentPhotoError';
  }
}

function pickPhotoFromFileInput(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new IncidentPhotoError('cancelled', 'Captura cancelada'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new IncidentPhotoError('unavailable', 'No se pudo leer la imagen'));
      };
      reader.onerror = () => {
        reject(new IncidentPhotoError('unavailable', 'No se pudo leer la imagen'));
      };
      reader.readAsDataURL(file);
    };

    input.oncancel = () => {
      reject(new IncidentPhotoError('cancelled', 'Captura cancelada'));
    };

    input.click();
  });
}

export async function requestCameraPermissions(): Promise<boolean> {
  if (!isNativePlatform()) {
    return true;
  }

  const status = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
  return status.camera === 'granted' || status.camera === 'limited';
}

/** Captura foto para incidente — nativo vía Capacitor, web vía input file. */
export async function takeIncidentPhoto(): Promise<string> {
  if (isNativePlatform()) {
    const granted = await requestCameraPermissions();
    if (!granted) {
      throw new IncidentPhotoError('permission_denied', 'Permiso de cámara denegado');
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        correctOrientation: true,
      });

      if (!photo.dataUrl) {
        throw new IncidentPhotoError('unavailable', 'No se obtuvo imagen de la cámara');
      }

      return photo.dataUrl;
    } catch (error) {
      if (error instanceof IncidentPhotoError) {
        throw error;
      }
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (message.includes('cancel') || message.includes('user')) {
        throw new IncidentPhotoError('cancelled', 'Captura cancelada');
      }
      if (message.includes('permission')) {
        throw new IncidentPhotoError('permission_denied', 'Permiso de cámara denegado');
      }
      throw new IncidentPhotoError('unavailable', 'No se pudo abrir la cámara');
    }
  }

  return pickPhotoFromFileInput();
}

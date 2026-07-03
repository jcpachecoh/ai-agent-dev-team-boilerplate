import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.restopsiq.plant',
  appName: 'RestOpsIQ Plant KDS',
  webDir: 'dist',
  android: {
    minWebViewVersion: 60,
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      statsUrl: '',
    },
    BluetoothLe: {
      displayStrings: {
        scanning: 'Escaneando dispositivos…',
        cancel: 'Cancelar',
        availableDevices: 'Dispositivos disponibles',
        noDeviceFound: 'No se encontraron dispositivos',
      },
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;

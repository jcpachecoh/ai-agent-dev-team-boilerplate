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
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;

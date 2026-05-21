/**
 * Industrial SCSS preset — consumed by Vite via additionalData in vite.config.ts.
 * Touch and typography tokens for plant floor tablets.
 */
export const plantScssPreset = {
  fontSizeBase: '18px',
  touchTargetMin: '48px',
  keypadKeyMinWidth: '88px',
  keypadKeyMinHeight: '72px',
  operatorButtonMinHeight: '120px',
  colors: {
    operatorBg: '#0f1419',
    operatorText: '#f4f6f8',
    accent: '#3d9eff',
    danger: '#e85d4a',
    success: '#3ecf8e',
  },
} as const;

export type PlantScssPreset = typeof plantScssPreset;

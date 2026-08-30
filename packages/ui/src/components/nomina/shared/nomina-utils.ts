import type { NominaLocationTone } from './nomina-types';

const LOCATION_TONE_COLORS: Record<NominaLocationTone, string> = {
  accent: '#0ea5e9',
  purple: '#818cf8',
  teal: '#2ec4a0',
  amber: '#f0c040',
};

export function getNominaLocationColor(tone: NominaLocationTone): string {
  return LOCATION_TONE_COLORS[tone];
}

export function formatNominaCurrency(value: number): string {
  return `$ ${value.toLocaleString('es-CO')}`;
}

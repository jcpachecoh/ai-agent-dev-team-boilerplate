export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const VALID_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

/** Regex for HH:mm 24-hour format */
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface BusinessHoursDay {
  dayOfWeek: DayOfWeek;
  openingTime?: string;
  closingTime?: string;
  isOpen: boolean;
}

export interface LocationBusinessHours {
  timezone: string;
  hoursPerDay: BusinessHoursDay[];
}

export const DEFAULT_BUSINESS_HOURS: LocationBusinessHours = {
  timezone: 'America/Bogota',
  hoursPerDay: [
    { dayOfWeek: 'monday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'tuesday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'wednesday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'thursday', openingTime: '06:00', closingTime: '22:00', isOpen: true },
    { dayOfWeek: 'friday', openingTime: '06:00', closingTime: '23:00', isOpen: true },
    { dayOfWeek: 'saturday', openingTime: '08:00', closingTime: '23:00', isOpen: true },
    { dayOfWeek: 'sunday', openingTime: '08:00', closingTime: '20:00', isOpen: true },
  ],
};

export function validateBusinessHours(raw: unknown): LocationBusinessHours {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('businessHours debe ser un objeto JSON válido');
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj['timezone'] !== 'string' || !obj['timezone'].trim()) {
    throw new Error('businessHours.timezone es requerido');
  }

  if (!Array.isArray(obj['hoursPerDay'])) {
    throw new Error('businessHours.hoursPerDay debe ser un array');
  }

  const days = obj['hoursPerDay'] as unknown[];

  for (const [index, day] of days.entries()) {
    if (typeof day !== 'object' || day === null) {
      throw new Error(`businessHours.hoursPerDay[${index}] debe ser un objeto`);
    }

    const d = day as Record<string, unknown>;

    if (!VALID_DAYS.includes(d['dayOfWeek'] as DayOfWeek)) {
      throw new Error(
        `businessHours.hoursPerDay[${index}].dayOfWeek inválido: "${String(d['dayOfWeek'])}"`,
      );
    }

    if (typeof d['isOpen'] !== 'boolean') {
      throw new Error(`businessHours.hoursPerDay[${index}].isOpen debe ser boolean`);
    }

    if (d['isOpen']) {
      if (typeof d['openingTime'] !== 'string' || !TIME_RE.test(d['openingTime'])) {
        throw new Error(
          `businessHours.hoursPerDay[${index}].openingTime debe estar en formato HH:mm`,
        );
      }
      if (typeof d['closingTime'] !== 'string' || !TIME_RE.test(d['closingTime'])) {
        throw new Error(
          `businessHours.hoursPerDay[${index}].closingTime debe estar en formato HH:mm`,
        );
      }
    }
  }

  return obj as unknown as LocationBusinessHours;
}

export function parseBusinessHoursInput(
  raw: string | null | undefined,
): LocationBusinessHours | null {
  if (raw === null || raw === undefined || raw === '') return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('businessHours no es un JSON válido');
  }
  return validateBusinessHours(parsed);
}

import type { SedeFormPreviewValues } from '@restopsiq/ui';

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface BusinessHoursDayInput {
  dayOfWeek: DayOfWeek;
  openingTime?: string;
  closingTime?: string;
  isOpen: boolean;
}

export interface LocationBusinessHoursInput {
  timezone: string;
  hoursPerDay: BusinessHoursDayInput[];
}

export const DEFAULT_BUSINESS_HOURS: LocationBusinessHoursInput = {
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

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export interface LocationApiModel {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  city?: string | null;
  phone?: string | null;
  code?: string | null;
  /** Serialized JSON string of LocationBusinessHoursInput */
  businessHours?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationAssignedUserApi {
  id: string;
  email: string;
  cedula: string;
  isActive: boolean;
  restaurantId: string;
}

export interface LocationConnectionApi {
  edges: Array<{ node: LocationApiModel; cursor: string }>;
  pageInfo: {
    hasNextPage: boolean;
    endCursor?: string | null;
  };
}

export interface CreateLocationInput {
  restaurantId: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  businessHours?: string;
}

export interface UpdateLocationInput {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive?: boolean;
  businessHours?: string;
}

export type SedeFormValues = SedeFormPreviewValues;

import { PlantApiError } from '@/services/plant-api.service';

export function isPlantApiConflictWithMessage(error: unknown, fragment: string): boolean {
  return (
    error instanceof PlantApiError &&
    error.status === 409 &&
    typeof error.details?.message === 'string' &&
    error.details.message.includes(fragment)
  );
}

export function isPlantApiNotFoundWithMessage(error: unknown, fragment: string): boolean {
  return (
    error instanceof PlantApiError &&
    error.status === 404 &&
    typeof error.details?.message === 'string' &&
    error.details.message.includes(fragment)
  );
}

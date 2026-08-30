import { AttendanceValidationStatus } from '@prisma/client';

export interface GeofenceValidationResult {
  validationStatus: AttendanceValidationStatus;
  distanceMeters: number | null;
  radiusMeters: number | null;
  rejectionReason: string | null;
}

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function validateGeofence(
  clientLat: number,
  clientLng: number,
  sedeLat: number | null,
  sedeLng: number | null,
  radiusMeters: number | null,
): GeofenceValidationResult {
  if (sedeLat == null || sedeLng == null || radiusMeters == null) {
    return {
      validationStatus: AttendanceValidationStatus.PENDING,
      distanceMeters: null,
      rejectionReason: null,
      radiusMeters: null,
    };
  }

  const distanceMeters = haversineDistanceMeters(clientLat, clientLng, sedeLat, sedeLng);

  if (distanceMeters > radiusMeters) {
    return {
      validationStatus: AttendanceValidationStatus.REJECTED,
      distanceMeters,
      rejectionReason: 'OUTSIDE_RADIUS',
      radiusMeters,
    };
  }

  return {
    validationStatus: AttendanceValidationStatus.VALID,
    distanceMeters,
    rejectionReason: null,
    radiusMeters,
  };
}

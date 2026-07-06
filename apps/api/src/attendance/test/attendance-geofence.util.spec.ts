import { AttendanceValidationStatus } from '@prisma/client';
import { haversineDistanceMeters, validateGeofence } from '../utils/attendance-geofence.util';

describe('attendance-geofence.util', () => {
  const sedeLat = 4.6097;
  const sedeLng = -74.0817;
  const radius = 100;

  it('haversineDistanceMeters retorna ~0 para el mismo punto', () => {
    expect(haversineDistanceMeters(sedeLat, sedeLng, sedeLat, sedeLng)).toBeLessThan(1);
  });

  it('validateGeofence retorna VALID dentro del radio', () => {
    const result = validateGeofence(sedeLat, sedeLng, sedeLat, sedeLng, radius);
    expect(result.validationStatus).toBe(AttendanceValidationStatus.VALID);
    expect(result.rejectionReason).toBeNull();
  });

  it('validateGeofence retorna REJECTED fuera del radio', () => {
    const result = validateGeofence(4.7, sedeLng, sedeLat, sedeLng, radius);
    expect(result.validationStatus).toBe(AttendanceValidationStatus.REJECTED);
    expect(result.rejectionReason).toBe('OUTSIDE_RADIUS');
  });

  it('validateGeofence retorna PENDING sin geofence configurado', () => {
    const result = validateGeofence(sedeLat, sedeLng, null, null, null);
    expect(result.validationStatus).toBe(AttendanceValidationStatus.PENDING);
    expect(result.distanceMeters).toBeNull();
  });
});

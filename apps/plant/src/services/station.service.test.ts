import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStationId,
  isValidStationId,
  normalizeStationId,
  parseStationIdFromLaunchUrl,
  parseStationQrPayload,
  setStationId,
} from './station.service';

vi.mock('@/utils/platform', () => ({
  isNativePlatform: () => false,
}));

describe('station.service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validates station ids', () => {
    expect(isValidStationId('EST-02')).toBe(true);
    expect(isValidStationId('')).toBe(false);
    expect(normalizeStationId('est-02')).toBe('EST-02');
  });

  it('parses QR JSON payload', () => {
    expect(parseStationQrPayload('{"stationId":"EST-02"}')).toEqual({
      stationId: 'EST-02',
    });
  });

  it('parses launch URL query', () => {
    expect(parseStationIdFromLaunchUrl('https://plant.local/?stationId=EST-02')).toBe('EST-02');
  });

  it('persists to localStorage on web', async () => {
    await setStationId('EST-02');
    expect(await getStationId()).toBe('EST-02');
  });
});

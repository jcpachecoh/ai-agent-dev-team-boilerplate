import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { usePlantSocket } from './usePlantSocket';
import { useSessionStore } from '@/stores/session.store';
import * as socketService from '@/services/plant-socket.service';

const mockSocket = {
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
};

describe('usePlantSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ stationId: 'EST-02' });
    vi.spyOn(socketService, 'connectPlantSocket').mockReturnValue(
      mockSocket as unknown as ReturnType<typeof socketService.connectPlantSocket>,
    );
    vi.spyOn(socketService, 'onPlantEvent').mockReturnValue(() => {});
    vi.spyOn(socketService, 'disconnectPlantSocket').mockImplementation(() => {});
  });

  it('connects when stationId is set', () => {
    const { result } = renderHook(() => usePlantSocket());
    expect(socketService.connectPlantSocket).toHaveBeenCalledWith(
      expect.objectContaining({ stationId: 'EST-02' }),
    );
    expect(result.current.connected).toBe(true);
  });
});

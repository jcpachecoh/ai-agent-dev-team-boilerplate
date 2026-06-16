import { Test, TestingModule } from '@nestjs/testing';
import { LockService } from '../service/lock.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('LockService', () => {
  let service: LockService;
  let redlockMock: any;

  beforeEach(async () => {
    redlockMock = {
      lock: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LockService],
    }).compile();

    service = module.get<LockService>(LockService);
    // Inject mock redlock
    (service as any).redlock = redlockMock;
  });

  describe('acquireLock', () => {
    it('should acquire a lock', async () => {
      const lockMock = { unlock: jest.fn().mockResolvedValue(undefined) };
      redlockMock.lock.mockResolvedValue(lockMock);

      const lock = await service.acquireLock('resource', 1000);

      expect(lock).toBeDefined();
      expect(redlockMock.lock).toHaveBeenCalledWith('resource', 1000);
    });

    it('should throw InternalServerErrorException if lock fails', async () => {
      redlockMock.lock.mockRejectedValue(new Error('Failed'));

      await expect(service.acquireLock('resource', 1000)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('usingLock', () => {
    it('should execute callback and release lock', async () => {
      const lockMock = { unlock: jest.fn().mockResolvedValue(undefined) };
      redlockMock.lock.mockResolvedValue(lockMock);
      const callback = jest.fn().mockResolvedValue('result');

      const result = await service.usingLock('resource', 1000, callback);

      expect(result).toBe('result');
      expect(callback).toHaveBeenCalled();
      expect(lockMock.unlock).toHaveBeenCalled();
    });

    it('should release lock even if callback fails', async () => {
      const lockMock = { unlock: jest.fn().mockResolvedValue(undefined) };
      redlockMock.lock.mockResolvedValue(lockMock);
      const callback = jest.fn().mockRejectedValue(new Error('Callback failed'));

      await expect(service.usingLock('resource', 1000, callback)).rejects.toThrow(
        'Callback failed',
      );

      expect(lockMock.unlock).toHaveBeenCalled();
    });

    it('should not run callback if lock acquisition fails', async () => {
      redlockMock.lock.mockRejectedValue(new Error('Lock failed'));
      const callback = jest.fn();

      await expect(service.usingLock('resource', 1000, callback)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(callback).not.toHaveBeenCalled();
    });
  });
});

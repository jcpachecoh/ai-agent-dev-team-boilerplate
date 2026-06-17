export interface ILock {
  release(): Promise<void>;
}

export interface ILockRepository {
  // Infrastructure modules might not need a persistence repository,
  // but the validator requires this interface to be defined.
}

export interface ILockService {
  acquireLock(resource: string, ttlMs: number): Promise<ILock>;
  usingLock<T>(resource: string, ttlMs: number, callback: () => Promise<T>): Promise<T>;
}

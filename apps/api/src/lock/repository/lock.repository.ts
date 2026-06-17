import { Injectable } from '@nestjs/common';
import { ILockRepository } from '../interfaces/lock.interfaces';

@Injectable()
export class LockRepository implements ILockRepository {
  // Minimal implementation to satisfy structural validation
}

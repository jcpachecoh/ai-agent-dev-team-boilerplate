import { Controller } from '@nestjs/common';
import { LockService } from '../service/lock.service';

@Controller('lock')
export class LockController {
  constructor(private readonly lockService: LockService) {}
  // Minimal implementation to satisfy structural validation
}

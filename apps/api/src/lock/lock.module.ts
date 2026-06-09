import { Module } from '@nestjs/common';
import { LockService } from './service/lock.service';
import { LockRepository } from './repository/lock.repository';
import { LockController } from './controller/lock.controller';

@Module({
  controllers: [LockController],
  providers: [LockService, LockRepository],
  exports: [LockService],
})
export class LockModule {}

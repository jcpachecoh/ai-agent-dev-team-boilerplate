import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TestlabModule } from './testlab/testlab.module';
import { SupplyItemsModule } from './supplyitems/supplyitems.module';
import { LockModule } from './lock/lock.module';

@Module({
  imports: [PrismaModule, TestlabModule, SupplyItemsModule, LockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

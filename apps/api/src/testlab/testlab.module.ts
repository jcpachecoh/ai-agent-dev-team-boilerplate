import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TestlabController } from './controller/testlab.controller';
import { TestlabRepository } from './repository/testlab.repository';
import { TestlabService } from './service/testlab.service';

@Module({
  imports: [PrismaModule],
  controllers: [TestlabController],
  providers: [TestlabRepository, TestlabService],
})
export class TestlabModule {}

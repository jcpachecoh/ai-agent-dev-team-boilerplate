import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TestlabModule } from './testlab/testlab.module';

@Module({
  imports: [PrismaModule, TestlabModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

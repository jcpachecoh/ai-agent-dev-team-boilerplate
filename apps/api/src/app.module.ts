import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TestlabModule } from './testlab/testlab.module';
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [PrismaModule, TestlabModule, RecipesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RecipeCategoriesController } from './controller/recipe-categories.controller';
import { RecipeCategoriesRepository } from './repository/recipe-categories.repository';
import { RecipeCategoriesService } from './service/recipe-categories.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecipeCategoriesController],
  providers: [RecipeCategoriesRepository, RecipeCategoriesService],
  exports: [RecipeCategoriesService],
})
export class RecipeCategoriesModule {}

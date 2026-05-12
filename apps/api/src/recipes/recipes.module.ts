import { Module } from '@nestjs/common';
import { RecipesController } from './api/recipes.controller';
import { RecipesService } from './application/recipes.service';
import { RecipeCostService } from './application/recipe-cost.service';
import { RecipesRepository } from './infrastructure/recipes.repository';
import { RecipeItemsRepository } from './infrastructure/recipe-items.repository';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RecipesController],
  providers: [
    RecipesService,
    RecipeCostService,
    RecipesRepository,
    RecipeItemsRepository,
    PrismaService,
    // Provide repos with their tokens for the cost service
    {
      provide: 'RecipesRepository',
      useClass: RecipesRepository,
    },
    {
      provide: 'RecipeItemsRepository',
      useClass: RecipeItemsRepository,
    },
  ],
  exports: [RecipeCostService],
})
export class RecipesModule {}

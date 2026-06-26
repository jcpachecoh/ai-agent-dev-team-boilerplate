import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { RecipeImagesRepository } from './repository/recipe-images.repository';
import { RecipeImagesResolver } from './resolver/recipe-images.resolver';
import { RecipeImagesService } from './service/recipe-images.service';

@Module({
  imports: [PrismaModule],
  providers: [RecipeImagesRepository, RecipeImagesService, RecipeImagesResolver],
  exports: [RecipeImagesService],
})
export class RecipeImagesModule {}

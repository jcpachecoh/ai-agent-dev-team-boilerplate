import { Module } from '@nestjs/common';
import { PubSubModule } from '../pubsub/pubsub.module';
import { RecipeRepository } from './repository/recipe.repository';
import { RecipeService } from './service/recipe.service';
import { RecipeResolver } from './resolver/recipe.resolver';

@Module({
  imports: [PubSubModule],
  providers: [RecipeRepository, RecipeService, RecipeResolver],
  exports: [RecipeService],
})
export class RecipeModule {}

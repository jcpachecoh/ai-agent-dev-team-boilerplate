import { builder } from '../builder';
import { RecipeObject } from './recipe';
import { pubsub } from '../pubsub';
import type { Recipe } from '../../services/recipe.service';

builder.subscriptionField('recipeUpdated', (t) =>
  t.field({
    type: RecipeObject,
    description: 'Subscribe to recipe update events for the authenticated tenant',
    authScopes: { isAuthenticated: true },
    subscribe: (_root, _args, ctx): AsyncIterable<Recipe> => {
      const tenantId = ctx.tenantId ?? '';
      return pubsub.asyncIterator<Recipe>(`RECIPE_UPDATED:${tenantId}`);
    },
    resolve: (payload: Recipe) => payload,
  }),
);

export function publishRecipeUpdated(tenantId: string, recipe: Recipe): void {
  pubsub.publish(`RECIPE_UPDATED:${tenantId}`, recipe);
}

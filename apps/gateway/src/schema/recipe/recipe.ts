import { builder } from '../builder';
import { Recipe, RecipePhase } from '../../services/recipe.service';

/**
 * RecipePhase sub-type.
 * NOTE: Recipe is not yet in the Prisma schema — pending migration.
 */
const RecipePhaseObject = builder.objectRef<RecipePhase>('RecipePhase');
RecipePhaseObject.implement({
  description: 'A phase (stage) within a recipe',
  fields: (t) => ({
    name: t.exposeString('name'),
    order: t.exposeInt('order'),
    steps: t.stringList({ resolve: (p) => p.steps }),
  }),
});

/**
 * Recipe type — uses in-memory service until Prisma model is added.
 */
export const RecipeObject = builder.objectRef<Recipe>('Recipe');
RecipeObject.implement({
  description: 'A production recipe (pending Prisma migration for persistence)',
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    description: t.exposeString('description', { nullable: true }),
    tenantId: t.exposeString('tenantId'),
    phases: t.field({
      type: [RecipePhaseObject],
      resolve: (r) => r.phases,
    }),
    yieldAmount: t.float({ nullable: true, resolve: (r) => r.yieldAmount }),
    yieldUnit: t.exposeString('yieldUnit', { nullable: true }),
    isActive: t.exposeBoolean('isActive'),
    createdAt: t.expose('createdAt', { type: 'DateTime' }),
    updatedAt: t.expose('updatedAt', { type: 'DateTime' }),
  }),
});

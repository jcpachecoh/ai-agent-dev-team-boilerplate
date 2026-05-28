import { builder } from '../builder';
import { RecipeObject } from './recipe';
import { requireAuth } from '../../auth/roles.guard';
import { validate, CreateRecipeSchema } from '../../utils/validation';
import type { CreateRecipeData } from '../../services/recipe.service';

const RecipePhaseInput = builder.inputType('RecipePhaseInput', {
  fields: (t) => ({
    name: t.string({ required: true }),
    order: t.int({ required: true }),
    steps: t.stringList({ required: false }),
  }),
});

const CreateRecipeInput = builder.inputType('CreateRecipeInput', {
  description: 'Input for creating a new recipe',
  fields: (t) => ({
    name: t.string({ required: true }),
    description: t.string({ required: false }),
    phases: t.field({ type: [RecipePhaseInput], required: false }),
    yieldAmount: t.float({ required: false }),
    yieldUnit: t.string({ required: false }),
  }),
});

builder.mutationField('createRecipe', (t) =>
  t.field({
    type: RecipeObject,
    description: 'Create a new recipe',
    authScopes: { isAuthenticated: true },
    args: {
      input: t.arg({ type: CreateRecipeInput, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const user = requireAuth(ctx.user);

      const rawPhases: Array<{ name: string; order: number; steps: string[] }> | undefined =
        args.input.phases?.map((p) => ({
          name: p.name,
          order: p.order,
          steps: p.steps ?? [],
        }));

      const validated = validate(CreateRecipeSchema, {
        name: args.input.name,
        description: args.input.description ?? undefined,
        phases: rawPhases,
        yieldAmount: args.input.yieldAmount ?? undefined,
        yieldUnit: args.input.yieldUnit ?? undefined,
      });

      // Cast: Zod's optional().default([]) still gives `string[] | undefined` in its type
      // but at runtime the default ensures `steps` is always `string[]`.
      const data: CreateRecipeData = validated as unknown as CreateRecipeData;

      return ctx.services.recipe.create(user.tenantId, data);
    },
  }),
);

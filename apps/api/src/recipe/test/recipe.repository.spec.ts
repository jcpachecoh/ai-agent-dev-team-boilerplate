import { RecipeRepository } from '../repository/recipe.repository';

describe('RecipeRepository', () => {
  let repository: RecipeRepository;
  const tenantId = 'tenant-1';

  beforeEach(() => {
    repository = new RecipeRepository();
  });

  it('returns empty list for a new tenant', async () => {
    await expect(repository.findAll(tenantId, {})).resolves.toEqual([]);
  });

  it('creates and finds a recipe by id', async () => {
    const created = await repository.create(tenantId, {
      name: 'Pizza',
      phases: [{ name: 'Prep', order: 0, steps: ['mix'] }],
    });

    await expect(repository.findById(created.id, tenantId)).resolves.toEqual(created);
  });

  it('paginates active recipes', async () => {
    await repository.create(tenantId, { name: 'A' });
    await repository.create(tenantId, { name: 'B' });

    const page = await repository.findAll(tenantId, { limit: 1, offset: 0 });

    expect(page).toHaveLength(1);
  });

  it('returns null when recipe id is missing', async () => {
    await expect(repository.findById('missing', tenantId)).resolves.toBeNull();
  });
});

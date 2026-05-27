/**
 * RecipeService tests
 *
 * Covers the in-memory RecipeService CRUD operations.
 */

import { RecipeService } from '../../src/services/recipe.service';
import { NotFoundError } from '../../src/utils/errors';

function makeService() {
  const prisma = {} as never;
  const redis = {} as never;
  const log = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as never;
  return new RecipeService(prisma, redis, log);
}

describe('RecipeService', () => {
  let service: RecipeService;

  beforeEach(() => {
    service = makeService();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns empty array when no recipes exist', async () => {
      const result = await service.findAll('tenant-abc');
      expect(result).toEqual([]);
    });

    it('returns only active recipes for the tenant', async () => {
      await service.create('tenant-abc', { name: 'Baguette' });
      await service.create('tenant-abc', { name: 'Croissant' });
      await service.create('tenant-xyz', { name: 'Muffin' }); // different tenant

      const result = await service.findAll('tenant-abc');
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.tenantId === 'tenant-abc')).toBe(true);
    });

    it('does not return deleted recipes', async () => {
      const recipe = await service.create('tenant-abc', { name: 'To delete' });
      await service.delete(recipe.id, 'tenant-abc');

      const result = await service.findAll('tenant-abc');
      expect(result).toHaveLength(0);
    });

    it('respects limit and offset pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await service.create('tenant-abc', { name: `Recipe ${i}` });
      }
      const page1 = await service.findAll('tenant-abc', { limit: 2, offset: 0 });
      const page2 = await service.findAll('tenant-abc', { limit: 2, offset: 2 });
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0]?.id).not.toBe(page2[0]?.id);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a recipe with required fields', async () => {
      const recipe = await service.create('tenant-abc', { name: 'Sourdough' });
      expect(recipe.id).toBeDefined();
      expect(recipe.name).toBe('Sourdough');
      expect(recipe.tenantId).toBe('tenant-abc');
      expect(recipe.isActive).toBe(true);
      expect(recipe.phases).toEqual([]);
    });

    it('stores description and yieldAmount when provided', async () => {
      const recipe = await service.create('tenant-abc', {
        name: 'Focaccia',
        description: 'Italian flatbread',
        yieldAmount: 2,
        yieldUnit: 'loaves',
        phases: [{ name: 'Mix', order: 0, steps: ['Combine ingredients'] }],
      });
      expect(recipe.description).toBe('Italian flatbread');
      expect(recipe.yieldAmount).toBe(2);
      expect(recipe.yieldUnit).toBe('loaves');
      expect(recipe.phases).toHaveLength(1);
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('returns the recipe when found', async () => {
      const created = await service.create('tenant-abc', { name: 'Rye' });
      const found = await service.findById(created.id, 'tenant-abc');
      expect(found.id).toBe(created.id);
    });

    it('throws NotFoundError for unknown id', async () => {
      await expect(service.findById('nonexistent', 'tenant-abc')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when looking up from wrong tenant', async () => {
      const created = await service.create('tenant-abc', { name: 'Brioche' });
      await expect(service.findById(created.id, 'tenant-xyz')).rejects.toThrow(NotFoundError);
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates recipe fields', async () => {
      const created = await service.create('tenant-abc', { name: 'Original' });
      const updated = await service.update(created.id, 'tenant-abc', { name: 'Updated' });
      expect(updated.name).toBe('Updated');
      expect(updated.id).toBe(created.id);
    });

    it('throws NotFoundError when updating a non-existent recipe', async () => {
      await expect(
        service.update('nonexistent', 'tenant-abc', { name: 'Whatever' }),
      ).rejects.toThrow(NotFoundError);
    });

    it('preserves existing phases when not provided in update', async () => {
      const created = await service.create('tenant-abc', {
        name: 'Ciabatta',
        phases: [{ name: 'Mix', order: 0, steps: [] }],
      });
      const updated = await service.update(created.id, 'tenant-abc', { name: 'Ciabatta v2' });
      expect(updated.phases).toHaveLength(1);
    });
  });

  // ─── delete ──────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('soft-deletes a recipe (sets isActive to false)', async () => {
      const created = await service.create('tenant-abc', { name: 'To Delete' });
      const result = await service.delete(created.id, 'tenant-abc');
      expect(result).toBe(true);
      await expect(service.findById(created.id, 'tenant-abc')).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when deleting a non-existent recipe', async () => {
      await expect(service.delete('nonexistent', 'tenant-abc')).rejects.toThrow(NotFoundError);
    });
  });
});

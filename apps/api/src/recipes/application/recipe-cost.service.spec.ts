import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';
import { RecipeCostService } from './recipe-cost.service';

// Explicit Tenant-Safe Repository Mocks
const mockRecipesRepository = {
  findByIdForTenant: jest.fn(),
  updateFoodCost: jest.fn(),
};

const mockRecipeItemsRepository = {
  findByRecipeForTenant: jest.fn(),
  findRecipeIdsUsingSupplyItem: jest.fn(),
};

describe('RecipeCostService', () => {
  let service: RecipeCostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipeCostService,
        { provide: 'RecipesRepository', useValue: mockRecipesRepository },
        { provide: 'RecipeItemsRepository', useValue: mockRecipeItemsRepository },
      ],
    }).compile();

    service = module.get<RecipeCostService>(RecipeCostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const tenantId = 'tenant-123';
  const recipeId = 'recipe-abc';

  describe('calculateRecipeFoodCost', () => {
    it('should calculate food cost correctly for a multi-item recipe', async () => {
      const mockRecipe = { id: recipeId, tenantId, porciones: 2 };
      const mockItems = [
        {
          cantidad: new Decimal(2.5),
          supplyItem: { costoPromedioPonderado: new Decimal(10.0) }, // 25.0
        },
        {
          cantidad: new Decimal(1.0),
          supplyItem: { costoPromedioPonderado: new Decimal(5.0) }, // 5.0
        },
      ];

      mockRecipesRepository.findByIdForTenant.mockResolvedValue(mockRecipe);
      mockRecipeItemsRepository.findByRecipeForTenant.mockResolvedValue(mockItems);

      // (25 + 5) / 2 = 15.0
      const result = await service.calculateRecipeFoodCost(tenantId, recipeId);

      expect(result.toString()).toBe('15');
      expect(mockRecipesRepository.findByIdForTenant).toHaveBeenCalledWith(tenantId, recipeId);
      expect(mockRecipeItemsRepository.findByRecipeForTenant).toHaveBeenCalledWith(
        tenantId,
        recipeId,
      );
    });

    it('should handle precision correctly using Decimal-safe arithmetic', async () => {
      const mockRecipe = { id: recipeId, tenantId, porciones: 1 };
      const mockItems = [
        {
          cantidad: new Decimal(0.1),
          supplyItem: { costoPromedioPonderado: new Decimal(0.1) },
        },
        {
          cantidad: new Decimal(0.2),
          supplyItem: { costoPromedioPonderado: new Decimal(0.1) },
        },
      ];

      mockRecipesRepository.findByIdForTenant.mockResolvedValue(mockRecipe);
      mockRecipeItemsRepository.findByRecipeForTenant.mockResolvedValue(mockItems);

      // (0.1 * 0.1) + (0.2 * 0.1) = 0.01 + 0.02 = 0.03
      const result = await service.calculateRecipeFoodCost(tenantId, recipeId);

      expect(result.toString()).toBe('0.03');
    });

    it('should return Decimal zero if the recipe has no items', async () => {
      mockRecipesRepository.findByIdForTenant.mockResolvedValue({
        id: recipeId,
        tenantId,
        porciones: 1,
      });
      mockRecipeItemsRepository.findByRecipeForTenant.mockResolvedValue([]);

      const result = await service.calculateRecipeFoodCost(tenantId, recipeId);
      expect(result.toString()).toBe('0');
    });

    it('should throw an error if porciones is zero or negative', async () => {
      mockRecipesRepository.findByIdForTenant.mockResolvedValue({
        id: recipeId,
        tenantId,
        porciones: 0,
      });
      mockRecipeItemsRepository.findByRecipeForTenant.mockResolvedValue([
        {
          cantidad: new Decimal(1),
          supplyItem: { costoPromedioPonderado: new Decimal(10) },
        },
      ]);

      await expect(service.calculateRecipeFoodCost(tenantId, recipeId)).rejects.toThrow();
    });

    it('should not allow calculation using data from another tenant', async () => {
      // simulate repository returning null if tenantId + id don't match
      mockRecipesRepository.findByIdForTenant.mockResolvedValue(null);

      await expect(service.calculateRecipeFoodCost('other-tenant', recipeId)).rejects.toThrow();
    });
  });

  describe('recalculateRecipeFoodCost', () => {
    it('should update foodCostActual in the database after calculation', async () => {
      const mockRecipe = { id: recipeId, tenantId, porciones: 1 };
      const mockItems = [
        {
          cantidad: new Decimal(10),
          supplyItem: { costoPromedioPonderado: new Decimal(2) },
        },
      ];

      mockRecipesRepository.findByIdForTenant.mockResolvedValue(mockRecipe);
      mockRecipeItemsRepository.findByRecipeForTenant.mockResolvedValue(mockItems);

      await service.recalculateRecipeFoodCost(tenantId, recipeId);

      expect(mockRecipesRepository.updateFoodCost).toHaveBeenCalledTimes(1);
      const [calledTenantId, calledRecipeId, calledFoodCost] =
        mockRecipesRepository.updateFoodCost.mock.calls[0];
      expect(calledTenantId).toBe(tenantId);
      expect(calledRecipeId).toBe(recipeId);
      expect(calledFoodCost.toString()).toBe('20');
    });
  });

  describe('recalculateRecipesUsingSupplyItem', () => {
    it('should recalculate all recipes that use the given supplyItemId', async () => {
      const supplyItemId = 'supply-999';
      const mockRecipeIds = ['recipe-1', 'recipe-2'];

      mockRecipeItemsRepository.findRecipeIdsUsingSupplyItem.mockResolvedValue(mockRecipeIds);

      // Spy on recalculateRecipeFoodCost to verify it is called for each ID
      const recalculateSpy = jest
        .spyOn(service, 'recalculateRecipeFoodCost')
        .mockResolvedValue(undefined);

      await service.recalculateRecipesUsingSupplyItem(tenantId, supplyItemId);

      expect(mockRecipeItemsRepository.findRecipeIdsUsingSupplyItem).toHaveBeenCalledWith(
        tenantId,
        supplyItemId,
      );
      expect(recalculateSpy).toHaveBeenCalledTimes(2);
      expect(recalculateSpy).toHaveBeenCalledWith(tenantId, 'recipe-1');
      expect(recalculateSpy).toHaveBeenCalledWith(tenantId, 'recipe-2');
    });

    it('should succeed without error if no recipes use the supplyItem', async () => {
      const supplyItemId = 'supply-empty';
      mockRecipeItemsRepository.findRecipeIdsUsingSupplyItem.mockResolvedValue([]);

      const recalculateSpy = jest.spyOn(service, 'recalculateRecipeFoodCost');

      await service.recalculateRecipesUsingSupplyItem(tenantId, supplyItemId);

      expect(recalculateSpy).not.toHaveBeenCalled();
    });
  });
});

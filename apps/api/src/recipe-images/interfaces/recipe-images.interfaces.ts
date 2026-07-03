export interface RecipeImageRecord {
  id: string;
  tenantId: string;
  recipeId: string;
  alt: string | null;
  nameImage: string;
  url: string;
  storageObjectId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddRecipeImageData {
  recipeId: string;
  alt?: string;
  nameImage: string;
  url: string;
  storageObjectId?: string;
  sortOrder?: number;
}

export interface UpdateRecipeImageData {
  alt?: string;
  nameImage?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface IRecipeImagesRepository {
  findByRecipeId(
    tenantId: string,
    recipeId: string,
    includeInactive?: boolean,
  ): Promise<RecipeImageRecord[]>;
  findById(tenantId: string, id: string): Promise<RecipeImageRecord | null>;
  countActiveByRecipeId(tenantId: string, recipeId: string): Promise<number>;
  recipeExists(tenantId: string, recipeId: string): Promise<boolean>;
  create(tenantId: string, data: AddRecipeImageData): Promise<RecipeImageRecord>;
  update(tenantId: string, id: string, data: UpdateRecipeImageData): Promise<RecipeImageRecord>;
  deactivate(tenantId: string, id: string): Promise<RecipeImageRecord>;
}

export interface IRecipeImagesService {
  listByRecipe(
    tenantId: string,
    recipeId: string,
    includeInactive?: boolean,
  ): Promise<RecipeImageRecord[]>;
  add(tenantId: string, data: AddRecipeImageData): Promise<RecipeImageRecord>;
  update(tenantId: string, id: string, data: UpdateRecipeImageData): Promise<RecipeImageRecord>;
  deactivate(tenantId: string, id: string): Promise<RecipeImageRecord>;
}

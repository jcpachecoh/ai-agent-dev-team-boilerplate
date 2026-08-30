export const RECIPE_IMAGES_QUERY = `
  query RecipeImages($recipeId: ID!, $includeInactive: Boolean) {
    recipeImages(recipeId: $recipeId, includeInactive: $includeInactive) {
      id
      recipeId
      alt
      nameImage
      url
      storageObjectId
      sortOrder
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const ADD_RECIPE_IMAGE_MUTATION = `
  mutation AddRecipeImage($input: AddRecipeImageInput!) {
    addRecipeImage(input: $input) {
      id
      recipeId
      alt
      nameImage
      url
      sortOrder
      isActive
    }
  }
`;

export const UPDATE_RECIPE_IMAGE_MUTATION = `
  mutation UpdateRecipeImage($input: UpdateRecipeImageInput!) {
    updateRecipeImage(input: $input) {
      id
      alt
      nameImage
      sortOrder
      isActive
    }
  }
`;

export const DEACTIVATE_RECIPE_IMAGE_MUTATION = `
  mutation DeactivateRecipeImage($id: ID!) {
    deactivateRecipeImage(id: $id) {
      id
      isActive
    }
  }
`;

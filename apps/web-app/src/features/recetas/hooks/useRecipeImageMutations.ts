import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addRecipeImage,
  deactivateRecipeImage,
  updateRecipeImage,
  uploadRecipeImageFile,
} from '../api/recipe-images.api';
import { recipeImageKeys } from './useRecipeImages';

export function useRecipeImageMutations(recipeId: string) {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: recipeImageKeys.byRecipe(recipeId) });
  };

  const uploadAndAdd = useMutation({
    mutationFn: async ({ file, alt }: { file: File; alt?: string }) => {
      const upload = await uploadRecipeImageFile(recipeId, file);
      return addRecipeImage({
        recipeId,
        nameImage: upload.originalName,
        url: upload.publicUrl!,
        storageObjectId: upload.id,
        alt,
      });
    },
    onSuccess: invalidate,
  });

  const updateImage = useMutation({
    mutationFn: updateRecipeImage,
    onSuccess: invalidate,
  });

  const deactivateImage = useMutation({
    mutationFn: deactivateRecipeImage,
    onSuccess: invalidate,
  });

  return {
    uploadAndAdd,
    updateImage,
    deactivateImage,
  };
}

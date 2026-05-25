import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generationService,
  type GenerationPreview,
  type ConfirmGenerationPayload,
} from '@/services/generation.service';

export function useGenerateFromLinear(projectId: string) {
  const generate = useMutation({
    mutationFn: (issueId: string) => generationService.generate(projectId, issueId),
  });

  return { generate };
}

export function useConfirmGeneration(projectId: string, suiteId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (preview: GenerationPreview) =>
      generationService.confirm(projectId, {
        suiteId,
        milestone: preview.milestone,
        requirements: preview.requirements,
        testCases: preview.testCases,
      } satisfies ConfirmGenerationPayload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cases', projectId, suiteId] });
      void qc.invalidateQueries({ queryKey: ['milestones', projectId] });
      void qc.invalidateQueries({ queryKey: ['requirements', projectId] });
    },
  });
}

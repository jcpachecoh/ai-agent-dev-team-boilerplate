import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { milestonesService } from '../services/milestones.service';

export function useMilestoneCases(projectId: string, milestoneId: string) {
  return useQuery({
    queryKey: ['milestones', projectId, milestoneId, 'cases'],
    queryFn: () => milestonesService.getCases(projectId, milestoneId),
    enabled: Boolean(projectId && milestoneId),
    staleTime: 30_000,
  });
}

export function useLinkMilestoneCase(projectId: string, milestoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => milestonesService.linkCase(projectId, milestoneId, caseId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['milestones', projectId, milestoneId, 'cases'] });
    },
  });
}

export function useUnlinkMilestoneCase(projectId: string, milestoneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (caseId: string) => milestonesService.unlinkCase(projectId, milestoneId, caseId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['milestones', projectId, milestoneId, 'cases'] });
    },
  });
}

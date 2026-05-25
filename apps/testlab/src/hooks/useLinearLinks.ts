import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { linearService, type CreateLinkPayload, type LinearLink } from '@/services/linear.service';

export function useLinearTeams() {
  return useQuery({
    queryKey: ['linear', 'teams'],
    queryFn: () => linearService.listTeams(),
    staleTime: 5 * 60_000,
  });
}

export function useLinearIssues(teamId: string | undefined, query: string) {
  return useQuery({
    queryKey: ['linear', 'issues', teamId, query],
    queryFn: () => linearService.searchIssues(teamId!, query || undefined),
    enabled: Boolean(teamId),
    staleTime: 30_000,
  });
}

export function useProjectLinearLinks(projectId: string) {
  return useQuery({
    queryKey: ['linear', 'links', projectId],
    queryFn: () => linearService.listLinks(projectId),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });
}

export function useLinkLinearIssue(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLinkPayload) => linearService.createLink(projectId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['linear', 'links', projectId] });
    },
  });
}

export function useUnlinkLinearIssue(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (linkId: string) => linearService.deleteLink(projectId, linkId),
    onMutate: async (linkId: string) => {
      await qc.cancelQueries({ queryKey: ['linear', 'links', projectId] });
      const previous = qc.getQueryData<LinearLink[]>(['linear', 'links', projectId]);
      qc.setQueryData<LinearLink[]>(
        ['linear', 'links', projectId],
        (old) => old?.filter((l) => l.id !== linkId) ?? [],
      );
      return { previous };
    },
    onError: (_err, _linkId, context) => {
      if (context?.previous) {
        qc.setQueryData(['linear', 'links', projectId], context.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['linear', 'links', projectId] });
    },
  });
}

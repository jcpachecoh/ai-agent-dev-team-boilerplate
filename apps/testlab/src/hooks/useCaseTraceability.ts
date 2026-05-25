import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { casesService } from '../services/cases.service';
import type { Milestone } from '../services/milestones.service';
import type { Requirement } from '../services/requirements.service';

export function useCaseMilestones(projectId: string, suiteId: string, caseId: string) {
  return useQuery({
    queryKey: ['cases', projectId, suiteId, caseId, 'milestones'],
    queryFn: () => casesService.listMilestones(projectId, suiteId, caseId),
    enabled: Boolean(projectId && suiteId && caseId),
    staleTime: 30_000,
  });
}

export function useLinkCaseMilestone(projectId: string, suiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, caseId }: { milestoneId: string; caseId: string }) =>
      casesService.linkMilestone(projectId, milestoneId, caseId),
    onMutate: async ({ milestoneId, caseId }) => {
      const key = ['cases', projectId, suiteId, caseId, 'milestones'];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Milestone[]>(key);
      const allMilestones = qc.getQueryData<Milestone[]>(['milestones', projectId]);
      const toAdd = allMilestones?.find((m) => m.id === milestoneId);
      if (toAdd) {
        qc.setQueryData<Milestone[]>(key, (old = []) => [...old, toAdd]);
      }
      return { previous, caseId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        qc.setQueryData(
          ['cases', projectId, suiteId, context.caseId, 'milestones'],
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, { caseId }) => {
      void qc.invalidateQueries({ queryKey: ['cases', projectId, suiteId, caseId, 'milestones'] });
    },
  });
}

export function useUnlinkCaseMilestone(projectId: string, suiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, caseId }: { milestoneId: string; caseId: string }) =>
      casesService.unlinkMilestone(projectId, milestoneId, caseId),
    onMutate: async ({ milestoneId, caseId }) => {
      const key = ['cases', projectId, suiteId, caseId, 'milestones'];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Milestone[]>(key);
      qc.setQueryData<Milestone[]>(key, (old = []) => old.filter((m) => m.id !== milestoneId));
      return { previous, caseId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        qc.setQueryData(
          ['cases', projectId, suiteId, context.caseId, 'milestones'],
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, { caseId }) => {
      void qc.invalidateQueries({ queryKey: ['cases', projectId, suiteId, caseId, 'milestones'] });
    },
  });
}

export function useCaseRequirements(projectId: string, suiteId: string, caseId: string) {
  return useQuery({
    queryKey: ['cases', projectId, suiteId, caseId, 'requirements'],
    queryFn: () => casesService.listRequirements(projectId, suiteId, caseId),
    enabled: Boolean(projectId && suiteId && caseId),
    staleTime: 30_000,
  });
}

export function useLinkCaseRequirement(projectId: string, suiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requirementId, caseId }: { requirementId: string; caseId: string }) =>
      casesService.linkRequirement(projectId, requirementId, caseId),
    onMutate: async ({ requirementId, caseId }) => {
      const key = ['cases', projectId, suiteId, caseId, 'requirements'];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Requirement[]>(key);
      const allRequirements = qc.getQueryData<Requirement[]>(['requirements', projectId]);
      const toAdd = allRequirements?.find((r) => r.id === requirementId);
      if (toAdd) {
        qc.setQueryData<Requirement[]>(key, (old = []) => [...old, toAdd]);
      }
      return { previous, caseId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        qc.setQueryData(
          ['cases', projectId, suiteId, context.caseId, 'requirements'],
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, { caseId }) => {
      void qc.invalidateQueries({
        queryKey: ['cases', projectId, suiteId, caseId, 'requirements'],
      });
    },
  });
}

export function useUnlinkCaseRequirement(projectId: string, suiteId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requirementId, caseId }: { requirementId: string; caseId: string }) =>
      casesService.unlinkRequirement(projectId, requirementId, caseId),
    onMutate: async ({ requirementId, caseId }) => {
      const key = ['cases', projectId, suiteId, caseId, 'requirements'];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Requirement[]>(key);
      qc.setQueryData<Requirement[]>(key, (old = []) => old.filter((r) => r.id !== requirementId));
      return { previous, caseId };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        qc.setQueryData(
          ['cases', projectId, suiteId, context.caseId, 'requirements'],
          context.previous,
        );
      }
    },
    onSettled: (_data, _err, { caseId }) => {
      void qc.invalidateQueries({
        queryKey: ['cases', projectId, suiteId, caseId, 'requirements'],
      });
    },
  });
}

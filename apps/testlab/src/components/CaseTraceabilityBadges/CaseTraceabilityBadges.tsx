import { useState, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  useCaseMilestones,
  useLinkCaseMilestone,
  useUnlinkCaseMilestone,
  useCaseRequirements,
  useLinkCaseRequirement,
  useUnlinkCaseRequirement,
} from '../../hooks/useCaseTraceability';
import { milestonesService } from '../../services/milestones.service';
import { requirementsService } from '../../services/requirements.service';
import { LinkItemModal, type LinkableItem } from '../LinkItemModal';
import styles from './CaseTraceabilityBadges.module.css';

interface Props {
  projectId: string;
  suiteId: string;
  caseId: string;
}

type ModalType = 'milestone' | 'requirement' | null;

export function CaseTraceabilityBadges({ projectId, suiteId, caseId }: Props): JSX.Element {
  const [openModal, setOpenModal] = useState<ModalType>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  const { data: linkedMilestones = [], isLoading: msLoading } = useCaseMilestones(
    projectId,
    suiteId,
    caseId,
  );
  const { data: linkedRequirements = [], isLoading: reqLoading } = useCaseRequirements(
    projectId,
    suiteId,
    caseId,
  );

  const linkMilestone = useLinkCaseMilestone(projectId, suiteId);
  const unlinkMilestone = useUnlinkCaseMilestone(projectId, suiteId);
  const linkRequirement = useLinkCaseRequirement(projectId, suiteId);
  const unlinkRequirement = useUnlinkCaseRequirement(projectId, suiteId);

  const { data: allMilestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesService.list(projectId),
    enabled: openModal === 'milestone',
  });

  const { data: allRequirements = [] } = useQuery({
    queryKey: ['requirements', projectId],
    queryFn: () => requirementsService.list(projectId),
    enabled: openModal === 'requirement',
  });

  const linkedMilestoneIds = new Set(linkedMilestones.map((m) => m.id));
  const linkedRequirementIds = new Set(linkedRequirements.map((r) => r.id));

  const availableMilestones: LinkableItem[] = allMilestones
    .filter((m) => !linkedMilestoneIds.has(m.id))
    .map((m) => ({ id: m.id, label: m.name }));

  const availableRequirements: LinkableItem[] = allRequirements
    .filter((r) => !linkedRequirementIds.has(r.id))
    .map((r) => ({ id: r.id, label: r.title, sublabel: r.externalId ?? undefined }));

  function handleLinkMilestone(milestoneId: string): void {
    setLinkError(null);
    linkMilestone.mutate(
      { milestoneId, caseId },
      { onError: () => setLinkError('Failed to link milestone.') },
    );
  }

  function handleUnlinkMilestone(milestoneId: string): void {
    unlinkMilestone.mutate({ milestoneId, caseId });
  }

  function handleLinkRequirement(requirementId: string): void {
    setLinkError(null);
    linkRequirement.mutate(
      { requirementId, caseId },
      { onError: () => setLinkError('Failed to link requirement.') },
    );
  }

  function handleUnlinkRequirement(requirementId: string): void {
    unlinkRequirement.mutate({ requirementId, caseId });
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Milestones</span>
        <div className={styles.badges}>
          {msLoading && <span className={styles.hint}>…</span>}
          {!msLoading && linkedMilestones.length === 0 && (
            <span className={styles.empty}>No milestones</span>
          )}
          {linkedMilestones.map((m) => (
            <span key={m.id} className={styles.pill}>
              {m.name}
              <button
                className={styles.pillRemove}
                aria-label={`Unlink milestone ${m.name}`}
                disabled={unlinkMilestone.isPending}
                onClick={() => handleUnlinkMilestone(m.id)}
              >
                ×
              </button>
            </span>
          ))}
          <button
            className={styles.btnLink}
            aria-label="Link to milestone"
            onClick={() => setOpenModal('milestone')}
          >
            + Link
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionLabel}>Requirements</span>
        <div className={styles.badges}>
          {reqLoading && <span className={styles.hint}>…</span>}
          {!reqLoading && linkedRequirements.length === 0 && (
            <span className={styles.empty}>No requirements</span>
          )}
          {linkedRequirements.map((r) => (
            <span key={r.id} className={styles.pill}>
              {r.externalId ? `${r.externalId}: ${r.title}` : r.title}
              <button
                className={styles.pillRemove}
                aria-label={`Unlink requirement ${r.title}`}
                disabled={unlinkRequirement.isPending}
                onClick={() => handleUnlinkRequirement(r.id)}
              >
                ×
              </button>
            </span>
          ))}
          <button
            className={styles.btnLink}
            aria-label="Link to requirement"
            onClick={() => setOpenModal('requirement')}
          >
            + Link
          </button>
        </div>
      </div>

      {openModal === 'milestone' && (
        <LinkItemModal
          title="Link to Milestone"
          items={availableMilestones}
          isPending={linkMilestone.isPending}
          error={linkError}
          onClose={() => setOpenModal(null)}
          onSelect={handleLinkMilestone}
        />
      )}

      {openModal === 'requirement' && (
        <LinkItemModal
          title="Link to Requirement"
          items={availableRequirements}
          isPending={linkRequirement.isPending}
          error={linkError}
          onClose={() => setOpenModal(null)}
          onSelect={handleLinkRequirement}
        />
      )}
    </div>
  );
}

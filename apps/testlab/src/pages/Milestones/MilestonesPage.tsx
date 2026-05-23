import { useState, type JSX } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { milestonesService } from '@/services/milestones.service';
import { SimpleModal } from '@/components/SimpleModal';
import { LinkCaseModal } from '@/components/LinkCaseModal';
import { LinearChip } from '@/components/LinearChip';
import { LinearIssuePickerModal } from '@/components/LinearIssuePickerModal';
import { GenerationPanel } from '@/components/GenerationPanel';
import {
  useMilestoneCases,
  useLinkMilestoneCase,
  useUnlinkMilestoneCase,
} from '@/hooks/useMilestoneCaseLinks';
import {
  useProjectLinearLinks,
  useLinkLinearIssue,
  useUnlinkLinearIssue,
} from '@/hooks/useLinearLinks';
import { useGenerateFromLinear, useConfirmGeneration } from '@/hooks/useGenerateFromLinear';
import type { GenerationPreview } from '@/services/generation.service';
import type { LinearIssue } from '@/services/linear.service';
import styles from './MilestonesPage.module.css';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function dueStatus(
  dueDate: string | null,
  completed: boolean,
): 'done' | 'overdue' | 'upcoming' | 'none' {
  if (completed) return 'done';
  if (!dueDate) return 'none';
  return new Date(dueDate) < new Date() ? 'overdue' : 'upcoming';
}

interface LinkedCasesSectionProps {
  projectId: string;
  milestoneId: string;
}

function LinkedCasesSection({ projectId, milestoneId }: LinkedCasesSectionProps): JSX.Element {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const { data: linkedCases = [], isLoading } = useMilestoneCases(projectId, milestoneId);
  const linkMutation = useLinkMilestoneCase(projectId, milestoneId);
  const unlinkMutation = useUnlinkMilestoneCase(projectId, milestoneId);

  function handleLink(caseId: string): void {
    setLinkError(null);
    linkMutation.mutate(caseId, {
      onSuccess: () => setShowLinkModal(false),
      onError: () => setLinkError('Failed to link test case.'),
    });
  }

  function handleUnlink(caseId: string): void {
    unlinkMutation.mutate(caseId);
  }

  return (
    <div className={styles.casesWrap}>
      {isLoading && <p className={styles.casesEmpty}>Loading linked test cases…</p>}
      {!isLoading && linkedCases.length === 0 && (
        <p className={styles.casesEmpty}>No directly linked test cases.</p>
      )}
      {!isLoading && linkedCases.length > 0 && (
        <ul className={styles.casesList}>
          {linkedCases.map((tc) => (
            <li key={tc.id} className={styles.caseItem}>
              <span>{tc.title}</span>
              <div className={styles.caseItemActions}>
                <code className={styles.caseMeta}>
                  {tc.priority} · {tc.status}
                </code>
                <button
                  className={styles.btnUnlink}
                  disabled={unlinkMutation.isPending}
                  onClick={() => handleUnlink(tc.id)}
                >
                  Unlink
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <button className={styles.btnLinkCase} onClick={() => setShowLinkModal(true)}>
        + Link Case
      </button>
      {showLinkModal && (
        <LinkCaseModal
          projectId={projectId}
          milestoneId={milestoneId}
          linkedCases={linkedCases}
          isPending={linkMutation.isPending}
          error={linkError}
          onClose={() => setShowLinkModal(false)}
          onLink={handleLink}
        />
      )}
    </div>
  );
}

export function MilestonesPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const fromCaseId = searchParams.get('caseId');

  // Linear linking state
  const [linearLinkTarget, setLinearLinkTarget] = useState<string | null>(null); // milestoneId
  const [linearLinkError, setLinearLinkError] = useState<string | null>(null);

  // Generation state
  const [showGeneratePicker, setShowGeneratePicker] = useState(false);
  const [generationPreview, setGenerationPreview] = useState<GenerationPreview | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const { data: allLinearLinks = [] } = useProjectLinearLinks(projectId ?? '');
  const linkLinear = useLinkLinearIssue(projectId ?? '');
  const unlinkLinear = useUnlinkLinearIssue(projectId ?? '');
  const { generate } = useGenerateFromLinear(projectId ?? '');
  const confirmGeneration = useConfirmGeneration(projectId ?? '', '');

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => milestonesService.list(projectId!),
    enabled: !!projectId,
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      milestonesService.create(projectId!, {
        name: data['name'],
        dueDate: data['dueDate'] || undefined,
        description: data['description'] || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      setShowModal(false);
    },
  });

  function handleLinearLink(issue: LinearIssue): void {
    if (!linearLinkTarget) return;
    setLinearLinkError(null);
    linkLinear.mutate(
      {
        issueId: issue.identifier,
        entityType: 'milestone',
        entityId: linearLinkTarget,
        issueTitle: issue.title,
        issueUrl: issue.url,
      },
      {
        onSuccess: () => setLinearLinkTarget(null),
        onError: () => setLinearLinkError('Failed to link issue.'),
      },
    );
  }

  function handleGenerateSelect(issue: LinearIssue): void {
    setShowGeneratePicker(false);
    setGenerationError(null);
    generate.mutate(issue.id, {
      onSuccess: (preview) => setGenerationPreview(preview),
      onError: (err) => setGenerationError((err as Error).message ?? 'Generation failed.'),
    });
  }

  function handleConfirmGeneration(filtered: GenerationPreview): void {
    setGenerationError(null);
    confirmGeneration.mutate(filtered, {
      onSuccess: () => {
        setGenerationPreview(null);
        setGenerationError(null);
      },
      onError: (err) => setGenerationError((err as Error).message ?? 'Confirm failed.'),
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Milestones</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.btnGenerate}
            onClick={() => setShowGeneratePicker(true)}
            disabled={generate.isPending}
          >
            {generate.isPending ? 'Generating…' : '✦ Generate from Linear'}
          </button>
          <Link className={styles.btnAddCase} to={`/projects/${projectId}/suites`}>
            + Add Test Case
          </Link>
          <button className={styles.btnNew} onClick={() => setShowModal(true)}>
            + New Milestone
          </button>
        </div>
      </header>
      {fromCaseId && (
        <p className={styles.contextHint}>
          Select a milestone to review where test case <code>{fromCaseId}</code> should be tracked.
        </p>
      )}
      {isLoading && <p className={styles.empty}>Loading…</p>}
      {!isLoading && milestones.length === 0 && <p className={styles.empty}>No milestones yet.</p>}
      <ul className={styles.list}>
        {milestones.map((m) => {
          const status = dueStatus(m.dueDate, m.completed);
          return (
            <li key={m.id} className={styles.item}>
              <div className={styles.itemRow}>
                <span className={styles.itemName}>{m.name}</span>
                <span className={`${styles.badge} ${styles[`s_${status}`]}`}>
                  {status === 'done'
                    ? 'Completed'
                    : status === 'overdue'
                      ? 'Overdue'
                      : status === 'upcoming'
                        ? 'Upcoming'
                        : 'No due date'}
                </span>
              </div>
              <div className={styles.itemMeta}>
                {m.dueDate && <span>Due {formatDate(m.dueDate)}</span>}
                {m.description && <span className={styles.itemDesc}>{m.description}</span>}
              </div>
              <button
                className={styles.btnCases}
                onClick={() => setSelectedMilestoneId((prevId) => (prevId === m.id ? null : m.id))}
              >
                {selectedMilestoneId === m.id ? 'Hide linked cases' : 'Show linked cases'}
              </button>
              {selectedMilestoneId === m.id && projectId && (
                <LinkedCasesSection projectId={projectId} milestoneId={m.id} />
              )}
              <div className={styles.linearSection}>
                <span className={styles.linearLabel}>Linear</span>
                <div className={styles.linearChips}>
                  {allLinearLinks
                    .filter((l) => l.entityType === 'milestone' && l.entityId === m.id)
                    .map((l) => (
                      <LinearChip
                        key={l.id}
                        link={l}
                        onUnlink={() => unlinkLinear.mutate(l.id)}
                        isUnlinking={unlinkLinear.isPending}
                      />
                    ))}
                  <button
                    className={styles.btnLinkLinear}
                    onClick={() => {
                      setLinearLinkError(null);
                      setLinearLinkTarget(m.id);
                    }}
                  >
                    + Link
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {showModal && (
        <SimpleModal
          title="New Milestone"
          fields={[
            { name: 'name', label: 'Name', required: true, maxLength: 120 },
            { name: 'dueDate', label: 'Due Date', type: 'date' },
            { name: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
          ]}
          submitLabel="Create Milestone"
          isPending={mutation.isPending}
          error={mutation.isError ? (mutation.error as Error).message : null}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => mutation.mutate(data)}
        />
      )}

      {linearLinkTarget && (
        <LinearIssuePickerModal
          onSelect={handleLinearLink}
          onClose={() => setLinearLinkTarget(null)}
          isPending={linkLinear.isPending}
          error={linearLinkError}
        />
      )}

      {showGeneratePicker && (
        <LinearIssuePickerModal
          onSelect={handleGenerateSelect}
          onClose={() => setShowGeneratePicker(false)}
          isPending={generate.isPending}
        />
      )}

      {generationPreview && (
        <GenerationPanel
          preview={generationPreview}
          isPending={confirmGeneration.isPending}
          error={generationError}
          onConfirm={handleConfirmGeneration}
          onClose={() => setGenerationPreview(null)}
        />
      )}
    </div>
  );
}

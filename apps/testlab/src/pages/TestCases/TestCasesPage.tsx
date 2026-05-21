import { useState, type JSX } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SimpleModal } from '../../components/SimpleModal/SimpleModal';
import { CaseTraceabilityBadges } from '../../components/CaseTraceabilityBadges';
import { LinearChip } from '../../components/LinearChip';
import { LinearIssuePickerModal } from '../../components/LinearIssuePickerModal';
import { GenerationPanel } from '../../components/GenerationPanel';
import { casesService, type CaseStatus, type TestCase } from '../../services/cases.service';
import {
  useProjectLinearLinks,
  useLinkLinearIssue,
  useUnlinkLinearIssue,
} from '../../hooks/useLinearLinks';
import { useGenerateFromLinear, useConfirmGeneration } from '../../hooks/useGenerateFromLinear';
import type { GenerationPreview } from '../../services/generation.service';
import type { LinearIssue } from '../../services/linear.service';
import styles from './TestCasesPage.module.css';

const PRIORITY_OPTIONS = [
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const TYPE_OPTIONS = [
  { value: 'FUNCTIONAL', label: 'Functional' },
  { value: 'REGRESSION', label: 'Regression' },
  { value: 'SMOKE', label: 'Smoke' },
  { value: 'EXPLORATORY', label: 'Exploratory' },
  { value: 'AUTOMATED', label: 'Automated' },
  { value: 'ACCEPTANCE', label: 'Acceptance' },
];

const STATUS_OPTIONS: { value: CaseStatus; label: string }[] = [
  { value: 'UNTESTED', label: 'Untested' },
  { value: 'PASS', label: 'Pass' },
  { value: 'FAIL', label: 'Fail' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'RETEST', label: 'Retest' },
  { value: 'SKIPPED', label: 'Skipped' },
];

const PRIORITY_CLASS: Record<string, string> = {
  LOW: styles.p_low,
  MEDIUM: styles.p_medium,
  HIGH: styles.p_high,
  CRITICAL: styles.p_critical,
};

export function TestCasesPage(): JSX.Element {
  const { projectId = '', suiteId = '' } = useParams<{ projectId: string; suiteId: string }>();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Linear linking state
  const [linearLinkTarget, setLinearLinkTarget] = useState<string | null>(null); // caseId
  const [linearLinkError, setLinearLinkError] = useState<string | null>(null);

  // Generation state
  const [showGeneratePicker, setShowGeneratePicker] = useState(false);
  const [generationPreview, setGenerationPreview] = useState<GenerationPreview | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Linear hooks
  const { data: allLinearLinks = [] } = useProjectLinearLinks(projectId);
  const linkLinear = useLinkLinearIssue(projectId);
  const unlinkLinear = useUnlinkLinearIssue(projectId);

  // Generation hooks
  const { generate } = useGenerateFromLinear(projectId);
  const confirmGeneration = useConfirmGeneration(projectId, suiteId);

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases', projectId, suiteId],
    queryFn: () => casesService.list(projectId, suiteId),
    enabled: Boolean(projectId && suiteId),
    staleTime: 30_000,
    retry: 1,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      casesService.create(projectId, suiteId, {
        title: data.title,
        priority: data.priority as TestCase['priority'],
        type: data.type as TestCase['type'],
        preconditions: data.preconditions || undefined,
        expectedResult: data.expectedResult || undefined,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cases', projectId, suiteId] });
      setShowModal(false);
      setModalError(null);
    },
    onError: () => setModalError('Failed to create test case.'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ caseId, status }: { caseId: string; status: CaseStatus }) =>
      casesService.updateStatus(projectId, suiteId, caseId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cases', projectId, suiteId] });
    },
  });

  function handleStatusChange(caseId: string, status: CaseStatus): void {
    statusMutation.mutate({ caseId, status });
  }

  function handleLinearLink(issue: LinearIssue): void {
    if (!linearLinkTarget) return;
    setLinearLinkError(null);
    linkLinear.mutate(
      {
        issueId: issue.identifier,
        entityType: 'testCase',
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
      <div className={styles.header}>
        <h1 className={styles.title}>Test Cases</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.btnGenerate}
            onClick={() => setShowGeneratePicker(true)}
            disabled={generate.isPending}
          >
            {generate.isPending ? 'Generating…' : '✦ Generate from Linear'}
          </button>
          <button className={styles.btnNew} onClick={() => setShowModal(true)}>
            + New Case
          </button>
        </div>
      </div>

      {generationError && <p className={styles.genError}>{generationError}</p>}

      {isLoading && <p className={styles.empty}>Loading…</p>}
      {!isLoading && cases.length === 0 && (
        <p className={styles.empty}>No test cases yet. Create the first one.</p>
      )}

      {cases.length > 0 && (
        <ul className={styles.list}>
          {cases.map((tc) => (
            <li key={tc.id} className={styles.item}>
              <div className={styles.itemRow}>
                <span className={styles.itemTitle}>{tc.title}</span>
                <div className={styles.itemBadges}>
                  <span className={`${styles.badge} ${PRIORITY_CLASS[tc.priority] ?? ''}`}>
                    {tc.priority.charAt(0) + tc.priority.slice(1).toLowerCase()}
                  </span>
                  <span className={styles.typeBadge}>
                    {tc.type.charAt(0) + tc.type.slice(1).toLowerCase()}
                  </span>
                  <select
                    className={`${styles.statusSelect} ${styles[`st_${tc.status.toLowerCase()}`] ?? ''}`}
                    value={tc.status}
                    onChange={(e) => handleStatusChange(tc.id, e.target.value as CaseStatus)}
                    disabled={statusMutation.isPending}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {tc.preconditions && (
                <p className={styles.itemMeta}>
                  <span className={styles.metaLabel}>Preconditions:</span> {tc.preconditions}
                </p>
              )}
              {tc.expectedResult && (
                <p className={styles.itemMeta}>
                  <span className={styles.metaLabel}>Expected:</span> {tc.expectedResult}
                </p>
              )}
              <div className={styles.itemActions}>
                <CaseTraceabilityBadges projectId={projectId} suiteId={suiteId} caseId={tc.id} />
                <div className={styles.linearSection}>
                  <span className={styles.linearLabel}>Linear</span>
                  <div className={styles.linearChips}>
                    {allLinearLinks
                      .filter((l) => l.entityType === 'testCase' && l.entityId === tc.id)
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
                        setLinearLinkTarget(tc.id);
                      }}
                    >
                      + Link
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <SimpleModal
          title="New Test Case"
          submitLabel="Create"
          isPending={createMutation.isPending}
          error={modalError}
          onClose={() => {
            setShowModal(false);
            setModalError(null);
          }}
          onSubmit={(data) => createMutation.mutate(data)}
          fields={[
            { name: 'title', label: 'Title', required: true, maxLength: 200 },
            {
              name: 'priority',
              label: 'Priority',
              type: 'select',
              options: PRIORITY_OPTIONS,
              defaultValue: 'MEDIUM',
            },
            {
              name: 'type',
              label: 'Type',
              type: 'select',
              options: TYPE_OPTIONS,
              defaultValue: 'FUNCTIONAL',
            },
            { name: 'preconditions', label: 'Preconditions', type: 'textarea' },
            { name: 'expectedResult', label: 'Expected Result', type: 'textarea' },
          ]}
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

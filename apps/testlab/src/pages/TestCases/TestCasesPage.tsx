import { useState, type JSX } from 'react';
import { useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SimpleModal } from '../../components/SimpleModal/SimpleModal';
import { casesService, type CaseStatus, type TestCase } from '../../services/cases.service';
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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Test Cases</h1>
        <button className={styles.btnNew} onClick={() => setShowModal(true)}>
          + New Case
        </button>
      </div>

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
    </div>
  );
}

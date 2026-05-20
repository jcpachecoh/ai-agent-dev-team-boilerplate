import { useState, type JSX } from 'react';
import { useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { milestonesService } from '@/services/milestones.service';
import { SimpleModal } from '@/components/SimpleModal';
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

export function MilestonesPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [showModal, setShowModal] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const { data: milestoneCases = [], isLoading: isCasesLoading } = useQuery({
    queryKey: ['milestone-cases', projectId, selectedMilestoneId],
    queryFn: () => milestonesService.getCases(projectId!, selectedMilestoneId!),
    enabled: Boolean(projectId && selectedMilestoneId),
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Milestones</h1>
        <button className={styles.btnNew} onClick={() => setShowModal(true)}>
          + New Milestone
        </button>
      </header>
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
                {selectedMilestoneId === m.id ? 'Hide test cases' : 'Show test cases'}
              </button>
              {selectedMilestoneId === m.id && (
                <div className={styles.casesWrap}>
                  {isCasesLoading && (
                    <p className={styles.casesEmpty}>Loading linked test cases…</p>
                  )}
                  {!isCasesLoading && milestoneCases.length === 0 && (
                    <p className={styles.casesEmpty}>No linked test cases.</p>
                  )}
                  {!isCasesLoading && milestoneCases.length > 0 && (
                    <ul className={styles.casesList}>
                      {milestoneCases.map((testCase) => (
                        <li key={testCase.id} className={styles.caseItem}>
                          <span>{testCase.title}</span>
                          <code className={styles.caseMeta}>
                            {testCase.priority} · {testCase.status}
                          </code>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
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
    </div>
  );
}

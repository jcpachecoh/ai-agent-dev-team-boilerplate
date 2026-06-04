import { useState, type JSX } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runsService } from '@/services/runs.service';
import { SimpleModal } from '@/components/SimpleModal';
import styles from './RunsPage.module.css';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export function RunsPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ['runs', projectId],
    queryFn: () => runsService.list(projectId!),
    enabled: !!projectId,
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      runsService.create(projectId!, {
        name: data['name'],
        description: data['description'] || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['runs', projectId] });
      setShowModal(false);
    },
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Test Runs</h1>
        <button className={styles.btnNew} onClick={() => setShowModal(true)}>
          + New Run
        </button>
      </header>
      {isLoading && <p className={styles.empty}>Loading…</p>}
      {!isLoading && runs.length === 0 && <p className={styles.empty}>No test runs yet.</p>}
      <ul className={styles.list}>
        {runs.map((run) => (
          <li key={run.id} className={styles.item}>
            <Link to={`/projects/${projectId}/runs/${run.id}/report`} className={styles.itemLink}>
              <span className={styles.itemName}>{run.name}</span>
              <span className={`${styles.badge} ${styles[`status${run.status}`]}`}>
                {STATUS_LABELS[run.status] ?? run.status}
              </span>
            </Link>
            {run.description && <p className={styles.itemDesc}>{run.description}</p>}
          </li>
        ))}
      </ul>
      {showModal && (
        <SimpleModal
          title="New Test Run"
          fields={[
            { name: 'name', label: 'Name', required: true, maxLength: 120 },
            { name: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
          ]}
          submitLabel="Create Run"
          isPending={mutation.isPending}
          error={mutation.isError ? (mutation.error as Error).message : null}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => mutation.mutate(data)}
        />
      )}
    </div>
  );
}

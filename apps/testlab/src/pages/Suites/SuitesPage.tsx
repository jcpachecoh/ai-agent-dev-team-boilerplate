import { useState, type JSX } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suitesService } from '@/services/suites.service';
import { SimpleModal } from '@/components/SimpleModal';
import styles from './SuitesPage.module.css';

export function SuitesPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: suites = [], isLoading } = useQuery({
    queryKey: ['suites', projectId],
    queryFn: () => suitesService.list(projectId!),
    enabled: !!projectId,
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      suitesService.create(projectId!, {
        name: data['name'],
        description: data['description'] || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suites', projectId] });
      setShowModal(false);
    },
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Test Suites</h1>
        <button className={styles.btnNew} onClick={() => setShowModal(true)}>
          + New Suite
        </button>
      </header>
      {isLoading && <p className={styles.empty}>Loading…</p>}
      {!isLoading && suites.length === 0 && <p className={styles.empty}>No suites yet.</p>}
      <ul className={styles.list}>
        {suites.map((suite) => (
          <li key={suite.id} className={styles.item}>
            <Link
              to={`/projects/${projectId}/suites/${suite.id}/cases`}
              className={styles.itemLink}
            >
              <span className={styles.itemName}>{suite.name}</span>
              {suite.description && <span className={styles.itemDesc}>{suite.description}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {showModal && (
        <SimpleModal
          title="New Test Suite"
          fields={[
            { name: 'name', label: 'Name', required: true, maxLength: 120 },
            { name: 'description', label: 'Description', type: 'textarea', maxLength: 500 },
          ]}
          submitLabel="Create Suite"
          isPending={mutation.isPending}
          error={mutation.isError ? (mutation.error as Error).message : null}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => mutation.mutate(data)}
        />
      )}
    </div>
  );
}

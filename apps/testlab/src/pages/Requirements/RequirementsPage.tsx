import { useState, type JSX } from 'react';
import { useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requirementsService } from '@/services/requirements.service';
import { SimpleModal } from '@/components/SimpleModal';
import styles from './RequirementsPage.module.css';

export function RequirementsPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: requirements = [], isLoading } = useQuery({
    queryKey: ['requirements', projectId],
    queryFn: () => requirementsService.list(projectId!),
    enabled: !!projectId,
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      requirementsService.create(projectId!, {
        title: data['title'],
        externalId: data['externalId'] || undefined,
        description: data['description'] || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requirements', projectId] });
      setShowModal(false);
    },
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Requirements</h1>
        <button className={styles.btnNew} onClick={() => setShowModal(true)}>
          + New Requirement
        </button>
      </header>
      {isLoading && <p className={styles.empty}>Loading…</p>}
      {!isLoading && requirements.length === 0 && (
        <p className={styles.empty}>No requirements yet.</p>
      )}
      <ul className={styles.list}>
        {requirements.map((req) => (
          <li key={req.id} className={styles.item}>
            <div className={styles.itemRow}>
              <span className={styles.itemTitle}>{req.title}</span>
              {req.externalId && <code className={styles.extId}>{req.externalId}</code>}
            </div>
            {req.description && <p className={styles.itemDesc}>{req.description}</p>}
          </li>
        ))}
      </ul>
      {showModal && (
        <SimpleModal
          title="New Requirement"
          fields={[
            { name: 'title', label: 'Title', required: true, maxLength: 200 },
            {
              name: 'externalId',
              label: 'External ID',
              maxLength: 100,
              placeholder: 'e.g. REQ-42',
              hint: 'Ticket or spec reference',
            },
            { name: 'description', label: 'Description', type: 'textarea', maxLength: 1000 },
          ]}
          submitLabel="Create Requirement"
          isPending={mutation.isPending}
          error={mutation.isError ? (mutation.error as Error).message : null}
          onClose={() => setShowModal(false)}
          onSubmit={(data) => mutation.mutate(data)}
        />
      )}
    </div>
  );
}

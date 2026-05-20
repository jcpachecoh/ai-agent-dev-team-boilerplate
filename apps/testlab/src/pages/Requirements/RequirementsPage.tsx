import { useState, type JSX } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requirementsService } from '@/services/requirements.service';
import { SimpleModal } from '@/components/SimpleModal';
import styles from './RequirementsPage.module.css';

export function RequirementsPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const fromCaseId = searchParams.get('caseId');

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

  const { data: requirementCases = [], isLoading: isCasesLoading } = useQuery({
    queryKey: ['requirement-cases', projectId, selectedRequirementId],
    queryFn: () => requirementsService.getCases(projectId!, selectedRequirementId!),
    enabled: Boolean(projectId && selectedRequirementId),
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Requirements</h1>
        <div className={styles.headerActions}>
          <Link className={styles.btnAddCase} to={`/projects/${projectId}/suites`}>
            + Add Test Case
          </Link>
          <button className={styles.btnNew} onClick={() => setShowModal(true)}>
            + New Requirement
          </button>
        </div>
      </header>
      {fromCaseId && (
        <p className={styles.contextHint}>
          Select a requirement to review where test case <code>{fromCaseId}</code> should be linked.
        </p>
      )}
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
            <button
              className={styles.btnCases}
              onClick={() =>
                setSelectedRequirementId((prevId) => (prevId === req.id ? null : req.id))
              }
            >
              {selectedRequirementId === req.id ? 'Hide test cases' : 'Show test cases'}
            </button>
            {selectedRequirementId === req.id && (
              <div className={styles.casesWrap}>
                {isCasesLoading && <p className={styles.casesEmpty}>Loading linked test cases…</p>}
                {!isCasesLoading && requirementCases.length === 0 && (
                  <p className={styles.casesEmpty}>No linked test cases.</p>
                )}
                {!isCasesLoading && requirementCases.length > 0 && (
                  <ul className={styles.casesList}>
                    {requirementCases.map((testCase) => (
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

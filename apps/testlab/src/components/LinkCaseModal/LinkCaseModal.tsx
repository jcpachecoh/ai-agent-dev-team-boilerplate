import { useRef, useEffect, useState, type JSX } from 'react';
import { useQuery } from '@tanstack/react-query';
import { casesService, type TestCase } from '../../services/cases.service';
import type { MilestoneCase } from '../../services/milestones.service';
import styles from './LinkCaseModal.module.css';

interface Props {
  projectId: string;
  suiteId?: string;
  milestoneId: string;
  linkedCases: MilestoneCase[];
  isPending: boolean;
  error: string | null;
  onClose: () => void;
  onLink: (caseId: string) => void;
}

export function LinkCaseModal({
  projectId,
  suiteId = '',
  linkedCases,
  isPending,
  error,
  onClose,
  onLink,
}: Props): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const { data: allCases = [], isLoading } = useQuery({
    queryKey: ['all-cases-for-linking', projectId, suiteId],
    queryFn: () =>
      suiteId ? casesService.list(projectId, suiteId) : Promise.resolve([] as TestCase[]),
    enabled: Boolean(projectId),
    staleTime: 30_000,
  });

  const linkedIds = new Set(linkedCases.map((c) => c.id));
  const available = allCases.filter(
    (c) => !linkedIds.has(c.id) && c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <dialog ref={dialogRef} className={styles.dialog} onClose={onClose}>
      <h2 className={styles.title}>Link Test Case</h2>
      <input
        className={styles.search}
        type="search"
        placeholder="Search cases…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className={styles.list}>
        {isLoading && <p className={styles.hint}>Loading…</p>}
        {!isLoading && available.length === 0 && <p className={styles.hint}>No available cases.</p>}
        {available.map((tc) => (
          <button
            key={tc.id}
            className={styles.item}
            disabled={isPending}
            onClick={() => onLink(tc.id)}
          >
            <span className={styles.itemTitle}>{tc.title}</span>
            <span className={styles.itemPriority}>{tc.priority.toLowerCase()}</span>
          </button>
        ))}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.actions}>
        <button type="button" className={styles.btnCancel} onClick={onClose}>
          Cancel
        </button>
      </div>
    </dialog>
  );
}

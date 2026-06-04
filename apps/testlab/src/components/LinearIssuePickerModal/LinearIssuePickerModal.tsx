import { useState, useEffect, type JSX } from 'react';
import { useLinearTeams, useLinearIssues } from '@/hooks/useLinearLinks';
import type { LinearIssue } from '@/services/linear.service';
import styles from './LinearIssuePickerModal.module.css';

const PRIORITY_LABELS: Record<number, string> = {
  0: '—',
  1: '🔴',
  2: '🟠',
  3: '🟡',
  4: '🔵',
};

interface Props {
  onSelect: (issue: LinearIssue) => void;
  onClose: () => void;
  isPending?: boolean;
  error?: string | null;
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function LinearIssuePickerModal({
  onSelect,
  onClose,
  isPending,
  error,
}: Props): JSX.Element {
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const debouncedQuery = useDebounce(searchInput, 300);

  const { data: teams = [], isLoading: teamsLoading } = useLinearTeams();
  const { data: issues = [], isFetching: issuesFetching } = useLinearIssues(
    selectedTeamId || undefined,
    debouncedQuery,
  );

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Link Linear Issue</span>
          <button className={styles.btnClose} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.controls}>
          {teamsLoading ? (
            <span className={styles.hint}>Loading teams…</span>
          ) : (
            <select
              className={styles.teamSelect}
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.key}] {t.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search issues…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.results}>
          {issuesFetching && <p className={styles.hint}>Searching…</p>}
          {!issuesFetching && selectedTeamId && issues.length === 0 && (
            <p className={styles.hint}>No issues found.</p>
          )}
          {!selectedTeamId && <p className={styles.hint}>Select a team to browse issues.</p>}
          {issues.map((issue) => (
            <button
              key={issue.id}
              className={styles.issueRow}
              disabled={isPending}
              onClick={() => onSelect(issue)}
            >
              <span className={styles.priority}>{PRIORITY_LABELS[issue.priority] ?? '—'}</span>
              <span className={styles.identifier}>{issue.identifier}</span>
              <span className={styles.issueTitle}>{issue.title}</span>
              {issue.state && <span className={styles.state}>{issue.state}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

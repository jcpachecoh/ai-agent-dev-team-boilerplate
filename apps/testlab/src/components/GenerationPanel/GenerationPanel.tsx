import { useState, type JSX, type ChangeEvent } from 'react';
import type {
  GenerationPreview,
  GeneratedTestCase,
  GeneratedRequirement,
  GeneratedMilestone,
} from '@/services/generation.service';
import styles from './GenerationPanel.module.css';

interface Props {
  preview: GenerationPreview;
  isPending: boolean;
  error: string | null;
  onConfirm: (filtered: GenerationPreview) => void;
  onClose: () => void;
}

type CheckedState<T> = Array<T & { checked: boolean }>;

export function GenerationPanel({
  preview,
  isPending,
  error,
  onConfirm,
  onClose,
}: Props): JSX.Element {
  const [milestone, setMilestone] = useState<
    (GeneratedMilestone & { checked: boolean }) | undefined
  >(preview.milestone ? { ...preview.milestone, checked: true } : undefined);

  const [requirements, setRequirements] = useState<CheckedState<GeneratedRequirement>>(
    preview.requirements.map((r) => ({ ...r, checked: true })),
  );

  const [testCases, setTestCases] = useState<CheckedState<GeneratedTestCase>>(
    preview.testCases.map((tc) => ({ ...tc, checked: true })),
  );

  function handleConfirm(): void {
    const milestoneData: GeneratedMilestone | undefined = milestone?.checked
      ? { name: milestone.name, description: milestone.description, dueDate: milestone.dueDate }
      : undefined;
    onConfirm({
      milestone: milestoneData,
      requirements: requirements.filter((r) => r.checked).map(({ checked: _c, ...r }) => r),
      testCases: testCases.filter((tc) => tc.checked).map(({ checked: _c, ...tc }) => tc),
    });
  }

  function toggleMilestone(e: ChangeEvent<HTMLInputElement>): void {
    if (milestone) setMilestone({ ...milestone, checked: e.target.checked });
  }

  function toggleRequirement(idx: number, checked: boolean): void {
    setRequirements((prev) => prev.map((r, i) => (i === idx ? { ...r, checked } : r)));
  }

  function toggleTestCase(idx: number, checked: boolean): void {
    setTestCases((prev) => prev.map((tc, i) => (i === idx ? { ...tc, checked } : tc)));
  }

  const hasSelection =
    (milestone?.checked ?? false) ||
    requirements.some((r) => r.checked) ||
    testCases.some((tc) => tc.checked);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>AI Generation Preview</span>
          <button className={styles.btnClose} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <p className={styles.hint}>
          Review the generated items below and deselect any you don&apos;t want to save.
        </p>

        <div className={styles.body}>
          {milestone && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Milestone</h3>
              <label className={styles.checkRow}>
                <input type="checkbox" checked={milestone.checked} onChange={toggleMilestone} />
                <div className={styles.checkContent}>
                  <span className={styles.itemName}>{milestone.name}</span>
                  <span className={styles.itemDesc}>{milestone.description}</span>
                  {milestone.dueDate && (
                    <span className={styles.meta}>Due: {milestone.dueDate}</span>
                  )}
                </div>
              </label>
            </section>
          )}

          {requirements.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Requirements ({requirements.length})</h3>
              {requirements.map((r, i) => (
                <label key={i} className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={r.checked}
                    onChange={(e) => toggleRequirement(i, e.target.checked)}
                  />
                  <div className={styles.checkContent}>
                    <span className={styles.itemName}>{r.title}</span>
                    <span className={styles.meta}>ID: {r.externalId}</span>
                    <span className={styles.itemDesc}>{r.description}</span>
                  </div>
                </label>
              ))}
            </section>
          )}

          {testCases.length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Test Cases ({testCases.length})</h3>
              {testCases.map((tc, i) => (
                <label key={i} className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={tc.checked}
                    onChange={(e) => toggleTestCase(i, e.target.checked)}
                  />
                  <div className={styles.checkContent}>
                    <span className={styles.itemName}>{tc.title}</span>
                    <div className={styles.pillRow}>
                      <span className={styles.pill}>{tc.priority}</span>
                      <span className={styles.pill}>{tc.type}</span>
                    </div>
                    {tc.preconditions && (
                      <span className={styles.itemDesc}>
                        <strong>Pre:</strong> {tc.preconditions}
                      </span>
                    )}
                    {tc.expectedResult && (
                      <span className={styles.itemDesc}>
                        <strong>Expected:</strong> {tc.expectedResult}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </section>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.footer}>
          <button className={styles.btnCancel} onClick={onClose} disabled={isPending}>
            Cancel
          </button>
          <button
            className={styles.btnConfirm}
            onClick={handleConfirm}
            disabled={isPending || !hasSelection}
          >
            {isPending ? 'Saving…' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

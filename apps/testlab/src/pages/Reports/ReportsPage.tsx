import { useParams } from 'react-router';
import styles from './ReportsPage.module.css';

export function ReportsPage(): JSX.Element {
  const { projectId, runId } = useParams<{ projectId: string; runId: string }>();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Run Report</h1>
      <p className={styles.sub}>
        Project: {projectId} · Run: {runId}
      </p>
    </div>
  );
}

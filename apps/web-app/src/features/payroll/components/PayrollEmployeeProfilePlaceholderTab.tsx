import styles from './PayrollEmployeeProfilePlaceholderTab.module.scss';

interface PayrollEmployeeProfilePlaceholderTabProps {
  title: string;
  description: string;
}

export function PayrollEmployeeProfilePlaceholderTab({
  title,
  description,
}: PayrollEmployeeProfilePlaceholderTabProps): React.JSX.Element {
  return (
    <div className={styles.panel}>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

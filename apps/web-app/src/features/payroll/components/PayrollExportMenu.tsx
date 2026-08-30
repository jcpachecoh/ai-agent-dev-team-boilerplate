import styles from './PayrollExportMenu.module.scss';
import type { PayrollReportExportFormat } from '../types/payroll-reports.types';

interface PayrollExportMenuProps {
  theme: 'light' | 'dark';
  loading?: boolean;
  disabled?: boolean;
  onExport: (format: PayrollReportExportFormat) => void;
}

export function PayrollExportMenu({
  theme,
  loading = false,
  disabled = false,
  onExport,
}: PayrollExportMenuProps): React.JSX.Element {
  const themeClass = theme === 'light' ? styles.themeLight : styles.themeDark;

  return (
    <>
      <div className={styles.field}>
        <span className={styles.label}>Exportar PDF</span>
        <button
          type="button"
          className={[styles.button, styles.buttonPdf, themeClass].join(' ')}
          disabled={disabled || loading}
          onClick={() => onExport('PDF')}
        >
          {loading ? 'Exportando…' : 'Exportar PDF'}
        </button>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Exportar Excel</span>
        <button
          type="button"
          className={[styles.button, styles.buttonExcel, themeClass].join(' ')}
          disabled={disabled || loading}
          onClick={() => onExport('XLSX')}
        >
          {loading ? 'Exportando…' : 'Exportar Excel'}
        </button>
      </div>
    </>
  );
}

import {
  InventarioDistributionBar,
  InventarioExportActions,
  InventarioPageHeader,
  InventarioPanel,
  InventarioReportDataTable,
  InventarioReportFilterBar,
  InventarioSummaryStat,
  toast,
} from '@restopsiq/ui';
import { useState } from 'react';

import { fetchInventoryReport } from '@/api/inventory';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import type { InventoryReportData } from '@/types/inventory';
import { reportToCsv } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';
import styles from './InventoryReportsScreen.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

export function InventoryReportsScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const [reportType, setReportType] = useState('category');
  const [dateStart, setDateStart] = useState('2026-05-01');
  const [dateEnd, setDateEnd] = useState('2026-05-29');
  const [data, setData] = useState<InventoryReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await fetchInventoryReport(reportType, dateStart, dateEnd);
      setData(result);
      toast.success('Reporte generado');
    } catch {
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!data) {
      toast.error('Genere el reporte antes de exportar');
      return;
    }
    reportToCsv(data.rows);
    toast.success('CSV descargado');
  };

  const handleExportPdf = () => {
    toast.info('Exportación PDF — próximamente');
  };

  return (
    <div className={shared.screen}>
      <section className={shared.pageHeader}>
        <InventarioPageHeader
          title="Reportes de Inventario"
          subtitle="Genera reportes personalizados y exporta en CSV o PDF"
          theme={theme}
          size="xl"
          className={shared.pageHeaderHost}
        />
      </section>

      <section className={shared.contentSection}>
        <InventarioExportActions
          onExportCsv={handleExportCsv}
          onExportPdf={handleExportPdf}
          theme={theme}
          size="md"
        />
      </section>

      <section className={shared.toolbarSection}>
        <InventarioReportFilterBar
          reportTypeValue={reportType}
          onReportTypeChange={setReportType}
          startDate={dateStart}
          endDate={dateEnd}
          onStartDateChange={setDateStart}
          onEndDateChange={setDateEnd}
          onGenerate={() => void handleGenerate()}
          theme={theme}
          size="md"
        />
      </section>

      {loading ? (
        <section className={shared.stateSection}>
          <InventoryScreenState variant="loading" />
        </section>
      ) : null}

      {!loading && !data ? (
        <section className={shared.stateSection}>
          <InventoryScreenState
            variant="empty"
            message="Seleccione filtros y pulse Generar para ver el reporte."
          />
        </section>
      ) : null}

      {data ? (
        <>
          <section className={styles.dataSection}>
            <div className={styles.dataTableCell}>
              <div className={[shared.tableWrap, shared.tableWrapInset].join(' ')}>
                <div className={shared.tableBody}>
                  <InventarioReportDataTable rows={data.rows} theme={theme} size="xl" />
                </div>
              </div>
            </div>
            <div className={styles.visualCell}>
              <InventarioPanel
                title="Visualización"
                theme={theme}
                size="xl"
                className={styles.visualPanel}
              >
                <div className={styles.distributionList}>
                  {data.distribution.map((item) => (
                    <InventarioDistributionBar key={item.label} {...item} theme={theme} size="xl" />
                  ))}
                </div>
              </InventarioPanel>
            </div>
          </section>

          <section className={shared.chartSection}>
            <InventarioPanel title="Resumen del Período" theme={theme} size="xl">
              <div className={styles.statsRow}>
                {data.summary.map((stat) => (
                  <InventarioSummaryStat key={stat.label} {...stat} theme={theme} size="xl" />
                ))}
              </div>
            </InventarioPanel>
          </section>
        </>
      ) : null}
    </div>
  );
}

export default InventoryReportsScreen;

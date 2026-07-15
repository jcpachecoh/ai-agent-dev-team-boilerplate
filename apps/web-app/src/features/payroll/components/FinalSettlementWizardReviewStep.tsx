import { LoadingState } from '@restopsiq/ui';

import styles from './FinalSettlementWizardReviewStep.module.scss';
import { SettlementBlocksWarningsPanel } from './SettlementBlocksWarningsPanel';
import { SettlementLinesTable } from './SettlementLinesTable';
import type { SettlementPreviewResult } from '../types/final-settlement.types';

interface Props {
  mode: 'AUTOMATIC' | 'MANUAL';
  preview: SettlementPreviewResult | null;
  previewLoading: boolean;
  theme: 'light' | 'dark';
}

/** OS-591 (fase 4) — paso 2: muestra el resultado de `preview` exactamente como lo devuelve
 * el backend. En modo MANUAL no hay preview — el formulario manual se abre desde el footer
 * del wizard (`FinalSettlementManualModal`), orquestado por el componente padre. */
export function FinalSettlementWizardReviewStep({
  mode,
  preview,
  previewLoading,
  theme,
}: Props): React.JSX.Element {
  if (mode === 'MANUAL') {
    return (
      <div className={styles.manualPrompt}>
        Completa el formulario de liquidación manual con el botón «Abrir liquidación manual» en la
        parte inferior.
      </div>
    );
  }

  if (previewLoading) {
    return <LoadingState message="Calculando previsualización…" theme={theme} layout="compact" />;
  }

  if (!preview) {
    return <div className={styles.manualPrompt}>No se pudo generar la previsualización.</div>;
  }

  return (
    <div className={styles.stepBody}>
      <SettlementBlocksWarningsPanel blocks={preview.blocks} warnings={preview.warnings} />
      <SettlementLinesTable
        lines={preview.lines}
        grossDevengados={preview.grossDevengados}
        totalDeducciones={preview.totalDeducciones}
        netAmount={preview.netAmount}
        netNegativeAmount={preview.netNegativeAmount}
      />
    </div>
  );
}

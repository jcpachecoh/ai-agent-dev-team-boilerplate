import { FieldStatusCard } from '@restopsiq/ui';

import { useTimerStore } from '@/stores/timer.store';
import {
  formatElapsedMmSs,
  formatStandardDurationMmSs,
  getFieldStatusAccent,
  getTimerProgress,
  getTimerVisualState,
} from '@/utils/phase-timer';
import styles from './PhaseTimerBlock.module.scss';

export interface PhaseTimerBlockProps {
  standardDurationMs: number;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'xl';
}

export function PhaseTimerBlock({
  standardDurationMs,
  theme = 'dark',
  size = 'md',
}: PhaseTimerBlockProps): React.JSX.Element {
  const elapsedMs = useTimerStore((s) => s.elapsedMs);
  const visualState = getTimerVisualState(elapsedMs, standardDurationMs);
  const progress = getTimerProgress(elapsedMs, standardDurationMs);
  const accent = getFieldStatusAccent(visualState);
  const showAlert = visualState === 'warning' || visualState === 'over';

  return (
    <div
      data-testid={`phase-timer-${visualState}`}
      className={[styles.block, styles[`state--${visualState}`]].filter(Boolean).join(' ')}
    >
      <FieldStatusCard
        theme={theme}
        size={size === 'sm' ? 'sm' : 'xl'}
        title="Tiempo transcurrido"
        value={formatElapsedMmSs(elapsedMs)}
        subtitle={`Tiempo estándar: ${formatStandardDurationMmSs(standardDurationMs)}`}
        statusTag={showAlert ? 'Alerta' : undefined}
        progress={progress}
        progressLabel={`${progress}%`}
        accent={accent}
      />
    </div>
  );
}

export default PhaseTimerBlock;

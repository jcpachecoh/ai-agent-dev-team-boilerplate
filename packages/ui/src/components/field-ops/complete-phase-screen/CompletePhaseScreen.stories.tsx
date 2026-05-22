import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { CompletePhaseButton } from '../complete-phase-button';
import { DecimalKeypad } from '../decimal-keypad';
import { FieldObservationsPanel } from '../field-observations-panel';
import { PhaseBackButton } from '../phase-back-button';
import { PhaseCompletionHeader } from '../phase-completion-header';
import { PhaseInfoCard } from '../phase-info-card';
import { PhaseSummaryPanel } from '../phase-summary-panel';
import { QuantityInputDisplay } from '../quantity-input-display';
import { darkModeDecorator } from '../shared/story-decorators';
import styles from './CompletePhaseScreen.stories.module.scss';

const summaryRows = [
  { id: 'phase', label: 'Fase', value: '2 de 4' },
  { id: 'op', label: 'OP', value: 'OP-000012' },
  { id: 'time', label: 'Tiempo', value: '15:28', tone: 'gold' as const },
  { id: 'target', label: 'Meta', value: '50.0 kg' },
  { id: 'actual', label: 'Real', value: '48.5 kg', tone: 'success' as const },
];

function CompletePhaseScreenDemo({
  theme = 'light',
}: {
  theme?: 'light' | 'dark';
}): React.JSX.Element {
  const [quantity, setQuantity] = React.useState('48.5');

  return (
    <div className={styles.screen} data-theme={theme}>
      <div className={styles.main}>
        <PhaseCompletionHeader theme={theme} size="md" />
        <PhaseInfoCard
          theme={theme}
          size="md"
          opId="OP - 000012"
          phaseLabel="Fase 2 — Corte y porcionado"
          productName="Pollo asado porcionado"
        />
        <QuantityInputDisplay
          theme={theme}
          size="md"
          value={quantity || '0'}
          unit="kg"
          hint="Meta: 50.0 kg (-1.5 kg)"
        />
        <DecimalKeypad
          theme={theme}
          size="md"
          onKeyPress={(key) => {
            if (key === 'backspace') {
              setQuantity((v) => v.slice(0, -1));
            } else if (key === '.') {
              if (!quantity.includes('.')) setQuantity((v) => (v ? `${v}.` : '0.'));
            } else {
              setQuantity((v) => (v === '0' && key !== '.' ? key : v + key));
            }
          }}
          onBackspace={() => setQuantity((v) => v.slice(0, -1))}
        />
      </div>
      <aside className={styles.sidebar}>
        <FieldObservationsPanel theme={theme} size="md" />
        <PhaseSummaryPanel theme={theme} size="md" rows={summaryRows} />
        <PhaseBackButton theme={theme} size="xl" />
        <CompletePhaseButton theme={theme} size="xl" variant="confirm" />
      </aside>
    </div>
  );
}

const meta: Meta = {
  title: 'Field Ops/Complete Phase Screen',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <CompletePhaseScreenDemo theme="light" />,
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', background: '#f9f8f3', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

export const Dark: Story = {
  render: () => <CompletePhaseScreenDemo theme="dark" />,
  decorators: [
    darkModeDecorator,
    (Story) => (
      <div style={{ minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
};

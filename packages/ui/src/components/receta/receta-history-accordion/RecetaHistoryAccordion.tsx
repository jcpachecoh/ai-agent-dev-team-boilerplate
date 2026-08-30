import * as AccordionPrimitive from '@radix-ui/react-accordion';
import {
  AlertTriangle,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock,
  FileText,
  Target,
  UserRound,
} from 'lucide-react';
import React, { type JSX } from 'react';

import resultStyles from '../receta-result-button/RecetaResultButton.module.scss';
import type { RecetaResult, RecetaSize, RecetaTheme } from '../shared/receta-types';
import styles from './RecetaHistoryAccordion.module.scss';

export interface RecetaHistoryAccordionPhase {
  title: string;
  note: string;
  duration: string;
}

export interface RecetaHistoryAccordionItem {
  value: string;
  code: string;
  recipeName: string;
  operatorName: string;
  date: string;
  progress: string;
  result: RecetaResult;
  validationsOk: number;
  validationsFailed: number;
  duration: string;
  observations?: string;
  phases?: RecetaHistoryAccordionPhase[];
}

export interface RecetaHistoryAccordionProps {
  items: RecetaHistoryAccordionItem[];
  theme?: RecetaTheme;
  size?: RecetaSize;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const themeClasses: Record<RecetaTheme, string> = {
  light: styles.themeLight,
  dark: styles.themeDark,
};

const sizeClasses: Record<RecetaSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  xl: styles.sizeXl,
};

const resultClasses: Record<RecetaResult, string> = {
  ok: styles.resultOk,
  warning: styles.resultWarning,
  failed: styles.resultFailed,
};

const resultLabels: Record<RecetaResult, string> = {
  ok: 'OK',
  warning: 'ADVERTENCIA',
  failed: 'FALLIDO',
};

const resultIcons: Record<RecetaResult, JSX.Element> = {
  ok: <CircleCheck aria-hidden />,
  warning: <AlertTriangle aria-hidden />,
  failed: <CircleX aria-hidden />,
};

export function RecetaHistoryAccordion({
  items,
  theme = 'dark',
  size = 'xl',
  defaultValue,
  value,
  onValueChange,
  className,
}: RecetaHistoryAccordionProps): JSX.Element {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      className={[styles.root, themeClasses[theme], sizeClasses[size], className]
        .filter(Boolean)
        .join(' ')}
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
    >
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.value}
          value={item.value}
          className={[styles.item, resultClasses[item.result]].join(' ')}
        >
          <AccordionPrimitive.Header className={styles.header}>
            <AccordionPrimitive.Trigger asChild>
              <button type="button" className={styles.trigger}>
                <div className={styles.row}>
                  <span className={styles.code}>{item.code}</span>
                  <span className={styles.recipe}>
                    <span className={styles.recipeName}>{item.recipeName}</span>
                    <span className={styles.operator}>
                      <UserRound aria-hidden /> {item.operatorName}
                    </span>
                  </span>
                  <span className={styles.date}>{item.date}</span>
                  <span className={styles.progress}>{item.progress}</span>
                  <span className={styles.validation}>
                    <span className={styles.smallLabel}>Validaciones</span>
                    <span>
                      <strong>{item.validationsOk}</strong> <em>/</em>{' '}
                      <b>{item.validationsFailed}</b>
                    </span>
                  </span>
                  <span className={styles.duration}>
                    <span className={styles.smallLabel}>Duración</span>
                    <span className={styles.durationValue}>{item.duration}</span>
                  </span>
                  <span
                    className={[
                      styles.result,
                      resultStyles.button,
                      resultStyles[`theme--${theme}`],
                      resultStyles['size--sm'],
                      resultStyles[`variant--${item.result}`],
                    ].join(' ')}
                    aria-hidden
                  >
                    <span className={resultStyles.icon}>{resultIcons[item.result]}</span>
                    <span>{resultLabels[item.result]}</span>
                  </span>
                  <span className={styles.chevron} aria-hidden>
                    <ChevronDown />
                  </span>
                </div>
              </button>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>

          <AccordionPrimitive.Content className={styles.content}>
            <div className={styles.contentInner}>
              {item.observations ? (
                <section>
                  <h4 className={styles.sectionTitle}>
                    <FileText aria-hidden />
                    Observaciones
                  </h4>
                  <p className={styles.observations}>{item.observations}</p>
                </section>
              ) : null}

              {item.phases && item.phases.length > 0 ? (
                <section>
                  <h4 className={styles.sectionTitle}>
                    <Target aria-hidden />
                    Detalle de Fases
                  </h4>
                  <ul className={styles.phaseList}>
                    {item.phases.map((phase) => (
                      <li key={`${item.value}-${phase.title}`} className={styles.phaseItem}>
                        <div className={styles.phaseMain}>
                          <Target className={styles.phaseIcon} aria-hidden />
                          <div className={styles.phaseText}>
                            <span className={styles.phaseTitle}>{phase.title}</span>
                            <span className={styles.phaseNote}>{phase.note}</span>
                          </div>
                        </div>
                        <span className={styles.phaseDuration}>
                          <Clock aria-hidden />
                          {phase.duration}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}

export default RecetaHistoryAccordion;

import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginDemoCredentials, WebLoginSurfaceProps } from '../shared/web-login-types';
import styles from './WebLoginDemoPanel.module.scss';

export interface WebLoginDemoPanelProps extends WebLoginSurfaceProps {
  credentials: WebLoginDemoCredentials;
  onUseDemo?: () => void;
  title?: string;
  useDemoLabel?: string;
}

export function WebLoginDemoPanel({
  credentials,
  onUseDemo,
  title = 'Credenciales de demostración',
  useDemoLabel = 'Usar credenciales de demo',
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginDemoPanelProps): JSX.Element {
  return (
    <aside
      className={webLoginSurfaceClass(styles.panel, styles, { theme, size, className })}
      aria-label={title}
    >
      <p className={styles.title}>{title}</p>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Cédula</dt>
          <dd>{credentials.cedula}</dd>
        </div>
        <div className={styles.row}>
          <dt>PIN</dt>
          <dd>{credentials.pin}</dd>
        </div>
      </dl>
      {onUseDemo ? (
        <button type="button" className={styles.useDemo} onClick={onUseDemo}>
          {useDemoLabel}
        </button>
      ) : null}
    </aside>
  );
}

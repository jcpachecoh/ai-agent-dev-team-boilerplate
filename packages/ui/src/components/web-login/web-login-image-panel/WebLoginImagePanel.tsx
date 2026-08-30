import React, { type JSX } from 'react';

import { webLoginSurfaceClass } from '../shared/web-login-classnames';
import type { WebLoginSurfaceProps } from '../shared/web-login-types';
import styles from './WebLoginImagePanel.module.scss';

export interface WebLoginImagePanelProps extends WebLoginSurfaceProps {
  /** Background image URL (cover). */
  imageUrl: string;
  /** Accessible label when image is decorative context for the brand. */
  imageAlt?: string;
}

export function WebLoginImagePanel({
  imageUrl,
  imageAlt = 'RestOpsIQ — operaciones de restaurante',
  theme = 'dark',
  size = 'md',
  className,
}: WebLoginImagePanelProps): JSX.Element {
  return (
    <section
      className={webLoginSurfaceClass(styles.panel, styles, { theme, size, className })}
      style={{ backgroundImage: `url(${imageUrl})` }}
      role="img"
      aria-label={imageAlt}
    />
  );
}

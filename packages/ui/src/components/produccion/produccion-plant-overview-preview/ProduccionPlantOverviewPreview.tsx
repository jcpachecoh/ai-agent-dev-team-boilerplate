import React, { type JSX } from 'react';

import { ProduccionModuleTabs } from '../produccion-module-tabs';
import { ProduccionPlantMap } from '../produccion-plant-map';
import { ProduccionPlantShell } from '../produccion-plant-shell';
import styles from './ProduccionPlantOverviewPreview.module.scss';
import type { ProduccionSize, ProduccionTheme } from '../shared/produccion-types';
export interface ProduccionPlantOverviewPreviewProps {
  theme?: ProduccionTheme;
  size?: ProduccionSize;
  className?: string;
}
export function ProduccionPlantOverviewPreview({
  theme = 'dark',
  size = 'xl',
  className,
}: ProduccionPlantOverviewPreviewProps): JSX.Element {
  return (
    <div
      className={[styles.screen, styles[`theme--${theme}`], styles[`size--${size}`], className]
        .filter(Boolean)
        .join(' ')}
    >
      <ProduccionPlantShell theme={theme} size="xl">
        <ProduccionModuleTabs activeId="map" theme={theme} size={size} />
        <ProduccionPlantMap theme={theme} size="xl" />
      </ProduccionPlantShell>
    </div>
  );
}
export default ProduccionPlantOverviewPreview;

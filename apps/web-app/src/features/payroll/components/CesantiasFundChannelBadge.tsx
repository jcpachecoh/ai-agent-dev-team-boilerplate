import styles from './CesantiasFundChannelBadge.module.scss';
import type { CesantiasFundChannel } from '../types/cesantias.types';
import { CESANTIAS_FUND_CHANNEL_LABELS } from '../utils/cesantias-display';

interface Props {
  channel: CesantiasFundChannel;
}

export function CesantiasFundChannelBadge({ channel }: Props): React.JSX.Element {
  return <span className={styles.badge}>{CESANTIAS_FUND_CHANNEL_LABELS[channel]}</span>;
}

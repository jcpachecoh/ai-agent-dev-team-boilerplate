import { EmptyState } from '@restopsiq/ui';
import { useUiTheme } from '@/hooks/useUiTheme';

import styles from '../../proveedores.module.scss';

interface ProveedorPlaceholderTabProps {
  title: string;
  description: string;
}

export default function ProveedorPlaceholderTab({
  title,
  description,
}: ProveedorPlaceholderTabProps): React.JSX.Element {
  const theme = useUiTheme();
  return (
    <div className={styles.tabPanel}>
      <EmptyState variant="search" theme={theme} title={title} description={description} />
    </div>
  );
}

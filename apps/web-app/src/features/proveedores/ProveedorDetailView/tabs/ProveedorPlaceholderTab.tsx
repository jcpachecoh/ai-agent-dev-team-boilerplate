import { EmptyState } from '@restopsiq/ui';

import styles from '../../proveedores.module.scss';

interface ProveedorPlaceholderTabProps {
  title: string;
  description: string;
}

export default function ProveedorPlaceholderTab({
  title,
  description,
}: ProveedorPlaceholderTabProps): React.JSX.Element {
  return (
    <div className={styles.tabPanel}>
      <EmptyState variant="search" theme="dark" title={title} description={description} />
    </div>
  );
}

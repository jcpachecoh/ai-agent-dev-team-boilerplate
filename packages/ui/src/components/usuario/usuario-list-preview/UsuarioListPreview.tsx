import { Users } from 'lucide-react';
import type { JSX } from 'react';

import { defaultUsuarioDemoRows } from '../shared/usuario-demo-data';
import type { UsuarioSize, UsuarioTheme } from '../shared/usuario-types';
import type { UsuarioTableRowProps } from '../usuario-table-row';
import { UsuarioActionButton } from '../usuario-action-button';
import { UsuarioListToolbar } from '../usuario-list-toolbar';
import { UsuarioPage } from '../usuario-page';
import { UsuarioPageHeader } from '../usuario-page-header';
import { UsuarioPageSection } from '../usuario-page-section';
import { UsuarioTable } from '../usuario-table';
import { UsuarioTableItem } from '../usuario-table-item';
import styles from './UsuarioListPreview.module.scss';

export interface UsuarioListPreviewProps {
  title?: string;
  subtitle?: string;
  count?: number;
  rows?: UsuarioTableRowProps[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onCreate?: () => void;
  onEdit?: (id: string) => void;
  onDeactivate?: (id: string) => void;
  showActions?: boolean;
  theme?: UsuarioTheme;
  size?: UsuarioSize;
  className?: string;
}

export function UsuarioListPreview({
  title = 'Usuarios',
  subtitle = 'Gestión de cuentas de usuario y asignación de roles',
  count = 14,
  rows = defaultUsuarioDemoRows,
  searchValue = '',
  onSearchChange,
  onCreate,
  onEdit,
  onDeactivate,
  showActions = true,
  theme = 'dark',
  size = 'md',
  className,
}: UsuarioListPreviewProps): JSX.Element {
  return (
    <UsuarioPage theme={theme} size={size} className={className}>
      <UsuarioPageSection theme={theme} divider variant="header">
        <UsuarioPageHeader
          title={title}
          subtitle={subtitle}
          icon={<Users />}
          theme={theme}
          size={size}
        />
      </UsuarioPageSection>

      <UsuarioPageSection theme={theme} divider variant="toolbar">
        <UsuarioListToolbar
          count={count}
          searchValue={searchValue}
          onSearchChange={onSearchChange ?? (() => undefined)}
          theme={theme}
          size={size}
          primaryAction={
            showActions ? (
              <UsuarioActionButton theme={theme} size={size} onClick={onCreate} />
            ) : undefined
          }
        />
      </UsuarioPageSection>

      <UsuarioPageSection theme={theme} variant="body">
        <div className={styles.tableWrap}>
          <UsuarioTable theme={theme} size={size} showActions={showActions}>
            {rows.map((row) => (
              <UsuarioTableItem
                key={row.id}
                {...row}
                showActions={showActions}
                theme={theme}
                size={size}
                onEdit={() => onEdit?.(row.id)}
                onDeactivate={() => onDeactivate?.(row.id)}
              />
            ))}
          </UsuarioTable>
        </div>
      </UsuarioPageSection>
    </UsuarioPage>
  );
}

export default UsuarioListPreview;

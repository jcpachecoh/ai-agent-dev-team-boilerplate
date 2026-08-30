import {
  ProveedorActionButton,
  ProveedorDetailHeader,
  ProveedorDetailTabBar,
  LoadingState,
} from '@restopsiq/ui';
import { useUiTheme } from '@/hooks/useUiTheme';
import { Mail, Pencil } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { isGraphqlConfigured } from '@/lib/graphql-client';

import { PROVEEDOR_TABLE_SIZE } from '../constants';
import { useSupplier } from '../hooks/useSupplier';
import { formatNit } from '../mappers/display';
import styles from '../proveedores.module.scss';
import type { ProveedorDetailTabId } from '../types';
import ProveedorCatalogTab from './tabs/ProveedorCatalogTab';
import ProveedorDocumentationTab from './tabs/ProveedorDocumentationTab';
import ProveedorInfoTab from './tabs/ProveedorInfoTab';
import ProveedorPlaceholderTab from './tabs/ProveedorPlaceholderTab';

const VALID_TABS: ProveedorDetailTabId[] = [
  'info',
  'catalog',
  'history',
  'documentation',
  'payables',
];

function parseTab(value: string | null): ProveedorDetailTabId {
  if (value === 'quality') {
    return 'documentation';
  }
  if (value && VALID_TABS.includes(value as ProveedorDetailTabId)) {
    return value as ProveedorDetailTabId;
  }
  return 'info';
}

export default function ProveedorDetailView(): React.JSX.Element {
  const theme = useUiTheme();
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: supplier, isPending, isError } = useSupplier(supplierId);

  const activeTab = parseTab(searchParams.get('tab'));

  useEffect(() => {
    if (searchParams.get('tab') === 'quality') {
      setSearchParams({ tab: 'documentation' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (!supplierId) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <p className={styles.notFound}>Proveedor no encontrado.</p>
      </div>
    );
  }

  if (!isGraphqlConfigured()) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <p className={styles.configBanner}>
          Sesión no disponible. Inicia sesión de nuevo para consultar este proveedor en GraphQL.
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <LoadingState message="Cargando proveedor…" theme={theme === 'dark' ? 'dark' : 'light'} />
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className={`${styles.content} ${styles.contentPadded}`}>
        <p className={styles.notFound}>Proveedor no encontrado.</p>
      </div>
    );
  }

  const handleTabChange = (tabId: string): void => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const handleContact = (): void => {
    if (supplier.email) {
      window.location.href = `mailto:${supplier.email}`;
    }
  };

  const headerActions = (
    <>
      <ProveedorActionButton
        variant="secondary"
        label="CONTACTAR"
        icon={<Mail size={16} aria-hidden />}
        theme={theme}
        size="md"
        onClick={handleContact}
        disabled={!supplier.email}
      />
      <ProveedorActionButton
        variant="primary"
        label="EDITAR"
        icon={<Pencil size={16} aria-hidden />}
        theme={theme}
        size="md"
        onClick={() => navigate(`/proveedores/${supplierId}/editar`)}
      />
    </>
  );

  return (
    <div className={styles.content}>
      <section className={styles.detailHeaderSection}>
        <ProveedorDetailHeader
          name={supplier.razonSocial}
          code={supplier.displayCode}
          taxId={formatNit(supplier)}
          status={supplier.status}
          onBack={() => navigate('/proveedores')}
          actions={headerActions}
          theme={theme}
          size="xl"
        />
      </section>

      <section className={styles.detailTabSection}>
        <ProveedorDetailTabBar
          activeTabId={activeTab}
          onTabChange={handleTabChange}
          theme={theme}
          size={PROVEEDOR_TABLE_SIZE}
        />
      </section>

      <div className={styles.detailBody}>
        {activeTab === 'info' && <ProveedorInfoTab supplier={supplier} />}
        {activeTab === 'catalog' && <ProveedorCatalogTab supplierId={supplierId} />}
        {activeTab === 'history' && (
          <ProveedorPlaceholderTab
            title="Historial de órdenes de compra"
            description="Próximamente — conectaremos las órdenes de compra de este proveedor."
          />
        )}
        {activeTab === 'documentation' && <ProveedorDocumentationTab supplierId={supplierId} />}
        {activeTab === 'payables' && (
          <ProveedorPlaceholderTab
            title="Cuentas por pagar"
            description="Próximamente — saldos, facturas pendientes y pagos programados."
          />
        )}
      </div>
    </div>
  );
}

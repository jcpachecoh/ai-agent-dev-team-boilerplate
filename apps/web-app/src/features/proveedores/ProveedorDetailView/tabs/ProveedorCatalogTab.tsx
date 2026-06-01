import { getErrorMessage, isGraphqlConfigured } from '@/lib/graphql-client';

import EditableSupplierProductsTable from '../../components/EditableSupplierProductsTable';
import { useSupplierProducts } from '../../hooks/useSupplierProducts';
import styles from '../../proveedores.module.scss';

interface ProveedorCatalogTabProps {
  supplierId: string;
}

export default function ProveedorCatalogTab({
  supplierId,
}: ProveedorCatalogTabProps): React.JSX.Element {
  const { data: catalog = [], isPending, isError, error } = useSupplierProducts(supplierId);

  const linkedSupplyItemIds = new Set(catalog.map((row) => row.supplyItemId));

  if (!isGraphqlConfigured()) {
    return (
      <div className={styles.tabPanel}>
        <p className={styles.configBanner}>
          Inicia sesión para cargar el catálogo desde el gateway (JWT de sesión tras el login MES).
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.tabPanel}>
        <p className={`${styles.stateMessage} ${styles.stateMessageError}`} role="alert">
          {getErrorMessage(error)}
        </p>
      </div>
    );
  }

  return (
    <EditableSupplierProductsTable
      supplierId={supplierId}
      rows={catalog}
      linkedSupplyItemIds={linkedSupplyItemIds}
      isLoading={isPending}
    />
  );
}

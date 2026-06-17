import {
  InventarioPageToolbar,
  InventarioPrimaryButton,
  InventarioTableHeader,
  toast,
} from '@restopsiq/ui';
import { Download } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchInventoryMovements } from '@/api/inventory';
import {
  InventarioMovementCard,
  InventarioMovementRow,
} from '@/components/inventario/inventario-responsive';
import { ResponsiveTable } from '@/components/responsive-table';
import { InventoryMovementsFilterBar } from '@/components/inventory/InventoryMovementsFilterBar';
import { InventoryScreenState } from '@/components/inventory/InventoryScreenState';
import { INVENTARIO_MOVEMENT_RESPONSIVE_COLUMNS } from '@/features/inventario/responsive-columns';
import { headerColumnsFromResponsive } from '@/lib/responsive-columns';
import type { InventoryMovement } from '@/types/inventory';
import { formatMovementQuantity, movementsToCsv } from '@/utils/inventory';

import shared from '../inventory/shared.module.scss';
import { useUiTheme } from '@/hooks/useUiTheme';

export function InventoryMovementsScreen(): React.JSX.Element {
  const theme = useUiTheme();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('all');
  const [site, setSite] = useState('all');
  const [dateStart, setDateStart] = useState('2026-05-01');
  const [dateEnd, setDateEnd] = useState('2026-05-29');

  const load = useCallback(async () => {
    try {
      setError(false);
      setMovements(await fetchInventoryMovements());
    } catch {
      setError(true);
      toast.error('Error al cargar movimientos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements.filter((m) => {
      if (q && !m.product.toLowerCase().includes(q)) return false;
      if (movementType !== 'all' && m.movementType !== movementType) return false;
      if (site !== 'all' && m.site !== site) return false;
      const day = m.date.slice(0, 10);
      if (dateStart && day < dateStart) return false;
      if (dateEnd && day > dateEnd) return false;
      return true;
    });
  }, [movements, search, movementType, site, dateStart, dateEnd]);

  if (loading) {
    return (
      <div className={shared.screen}>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="loading" />
        </section>
      </div>
    );
  }
  if (error) {
    return (
      <div className={shared.screen}>
        <section className={shared.stateSection}>
          <InventoryScreenState variant="error" onRetry={() => void load()} />
        </section>
      </div>
    );
  }

  return (
    <div className={shared.screen}>
      <section className={shared.pageHeader}>
        <InventarioPageToolbar
          title="Movimientos de Stock"
          subtitle={`Total: ${filtered.length} movimientos`}
          showAction
          action={
            <InventarioPrimaryButton
              label="DESCARGAR CSV"
              variant="success"
              icon={<Download aria-hidden />}
              onClick={() => movementsToCsv(filtered)}
              theme={theme}
              size="md"
            />
          }
          theme={theme}
          size="xl"
          className={shared.pageHeaderHost}
        />
      </section>

      <section className={shared.toolbarSection}>
        <InventoryMovementsFilterBar
          theme={theme}
          className={shared.embedFilters}
          search={search}
          movementType={movementType}
          site={site}
          dateStart={dateStart}
          dateEnd={dateEnd}
          onSearchChange={setSearch}
          onTypeChange={setMovementType}
          onSiteChange={setSite}
          onDateStartChange={setDateStart}
          onDateEndChange={setDateEnd}
        />
      </section>

      <section className={shared.tableWrap}>
        <ResponsiveTable<InventoryMovement>
          columns={INVENTARIO_MOVEMENT_RESPONSIVE_COLUMNS}
          rows={filtered}
          keyExtractor={(movement) => movement.id}
          className={shared.responsiveTable}
          renderTableHeader={({ visibleColumns }) => (
            <div className={shared.tableHead}>
              <InventarioTableHeader
                variant="movement"
                theme={theme}
                size="xl"
                columns={headerColumnsFromResponsive(visibleColumns, {
                  type: 'center',
                  quantity: 'center',
                })}
              />
            </div>
          )}
          renderTableRow={(movement, { visibleColumns, columnsTemplate }) => (
            <InventarioMovementRow
              movement={movement}
              theme={theme}
              visibleColumns={visibleColumns}
              columnsTemplate={columnsTemplate}
              quantityLabel={formatMovementQuantity(movement.quantity)}
              userLabel={`${movement.user} · ${movement.site}`}
            />
          )}
          renderCard={(movement) => (
            <InventarioMovementCard
              movement={movement}
              theme={theme}
              quantityLabel={formatMovementQuantity(movement.quantity)}
              userLabel={`${movement.user} · ${movement.site}`}
            />
          )}
        />
      </section>
    </div>
  );
}

export default InventoryMovementsScreen;

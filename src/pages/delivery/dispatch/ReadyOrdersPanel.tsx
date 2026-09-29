import { useEffect, useMemo, useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { SelectField } from '@/components/forms/SelectField';
import { Pagination } from '@/components/common/Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { dispatchService, type ReadyOrder } from '@/services/dispatch.service';
import { zonesService } from '@/services/locations.service';
import { AssignRiderPanel } from './AssignRiderPanel';
import { ORDER_STATUS_VARIANTS } from './statusLabels';

/**
 * "Orders Ready for Delivery" — step 1 of the workflow.
 *
 * The admin can tick many orders (or Select All on the page), sees a running
 * "N orders selected" count, and hands the whole selection to the
 * Assign-to-Rider step in ONE operation. Individual orders keep their own
 * status once assigned; the backend re-validates eligibility on submit.
 */
export function ReadyOrdersPanel({ onAssigned }: { onAssigned?: () => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [zoneOptions, setZoneOptions] = useState<{ value: string; label: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const limit = 20;

  const { data, loading, error, refetch } = useAsync(
    () => dispatchService.listReadyOrders({ page, limit, search: debouncedSearch, zoneId: zoneId || undefined }),
    [page, debouncedSearch, zoneId]
  );

  // Zone options for the ready-queue filter (server supports ?zoneId).
  useEffect(() => {
    zonesService
      .list({ page: 1, limit: 200 })
      .then((res) =>
        setZoneOptions(res.zones.map((z) => ({ value: z._id, label: z.name })))
      )
      .catch(() => setZoneOptions([]));
  }, []);

  // Memoised so the row ids (and the selection pruning effect) stay stable
  // across renders instead of producing a new array every time.
  const orders = useMemo(() => data?.orders ?? [], [data]);
  const pageIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectedOrders = orders.filter((o) => selected.has(o.id));

  // Never keep a selection for a row that is no longer on screen.
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(pageIds);
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [pageIds]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...pageIds]);
    });
  };

  const handleAssigned = () => {
    setSelected(new Set());
    setPanelOpen(false);
    refetch();
    onAssigned?.();
  };

  return (
    <>
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search orders ready for delivery…"
              aria-label="Search ready orders"
            />
            <SelectField
              value={zoneId}
              onChange={(e) => { setZoneId(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Zones' }, ...zoneOptions]}
              className="w-44"
              aria-label="Filter ready orders by zone"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              disabled={orders.length === 0}
              className="h-4 w-4 rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
            />
            Select All
          </label>
        </div>
      </Card>

      {selected.size > 0 && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 border-primary-dark/40 p-4">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            {selected.size} order{selected.size === 1 ? '' : 's'} selected
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={() => setPanelOpen(true)}>
              Assign to Rider
            </Button>
          </div>
        </Card>
      )}

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-950">
                  <th scope="col" className="w-10 px-4 py-3" />
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Order</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Seller</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Pickup</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Customer</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Zone</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      Loading orders…
                    </td>
                  </tr>
                )}
                {!loading && orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                      No orders are ready for delivery.
                    </td>
                  </tr>
                )}
                {!loading &&
                  orders.map((order: ReadyOrder) => (
                    <tr key={order.id} className="border-b border-gray-100 dark:border-dark-600/50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select order ${order.orderId}`}
                          checked={selected.has(order.id)}
                          onChange={() => toggle(order.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-dark focus:ring-primary-dark"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                        {order.orderId}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{order.sellerName}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{order.pickup}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{order.customer}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{order.zoneName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label="Ready for Pickup"
                          variant={ORDER_STATUS_VARIANTS.pending}
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <Pagination
            className="mt-4"
            page={page}
            totalPages={data?.totalPages ?? 1}
            total={data?.total}
            onPageChange={setPage}
          />
        </>
      )}

      <AssignRiderPanel
        open={panelOpen}
        orders={selectedOrders}
        onClose={() => setPanelOpen(false)}
        onAssigned={handleAssigned}
      />
    </>
  );
}

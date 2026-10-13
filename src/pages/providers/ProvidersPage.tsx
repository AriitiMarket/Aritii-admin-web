/**
 * Partners & Providers — the ONE workspace for everyone who performs deliveries.
 *
 * Riders, delivery businesses and logistics partners are the same entity here,
 * distinguished only by `providerType`. The page is organised as four SECTIONS
 * over that single list: All, Pending Approval, Active, Deactivated.
 *
 * PROVIDER MANAGEMENT ONLY. The page answers exactly one question set: who are
 * the providers, are they approved/active, where do they operate (City / Zone /
 * Port), and can they receive assignments? To that end:
 *
 *   - STATUS is the provider's ACCOUNT status (Pending / Rejected / Active /
 *     Deactivated) — what the Admin controls: Approve, Reject, Activate,
 *     Deactivate.
 *   - AVAILABILITY (Available / Busy / Offline) is READ-ONLY information —
 *     the provider/system owns it. There is deliberately no Set Online /
 *     Set Offline / Set Busy control anywhere on this page (§7).
 *
 * Assignment work is not here: it happens inside each delivery on the
 * Deliveries page. The only delivery-related figures shown are the per-provider
 * counts the backend already returns (active deliveries, completed), read-only.
 *
 * All data comes from the existing `/delivery/provider` contract.
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ReasonDialog } from '@/components/common/ReasonDialog';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions } from '@/components/workspace/DataSection';
import { locationsService, zonesService } from '@/services/locations.service';
import { portsService } from '@/services/ports.service';
import {
  providersService,
  PROVIDER_TYPES,
  PROVIDER_TYPE_LABELS,
  type Provider,
} from '@/services/providers.service';
import {
  ACTIVE_PROVIDER_STATUSES,
  accountStateOf,
  operationalStateOf,
} from './providerStatus';
import { ProviderForm } from './ProviderForm';
import { ProviderDetailDrawer } from './ProviderDetailDrawer';

const LIMIT = 20;
/** Rows scanned per status when a section groups several provider statuses. */
const MERGE_LIMIT = 100;
/** Zone/port/city rows scanned to resolve the names behind a provider's ids. */
const ZONE_LOOKUP_LIMIT = 200;

interface Section {
  id: string;
  label: string;
  hint: string;
  /** The provider statuses the section covers; null = no status filter. */
  statuses: string[] | null;
}

const SECTIONS: Section[] = [
  { id: 'all', label: 'All Providers', hint: 'Every provider on record', statuses: null },
  { id: 'pending', label: 'Pending Approval', hint: 'Applications waiting for a decision', statuses: ['pending'] },
  { id: 'active', label: 'Active', hint: 'Approved and currently on the platform', statuses: ACTIVE_PROVIDER_STATUSES },
  { id: 'deactivated', label: 'Deactivated', hint: 'Approved providers taken off the platform', statuses: ['suspended'] },
];

/** Legacy ?status= deep links (e.g. /riders/pending) still resolve. */
const SECTION_FOR_STATUS: Record<string, string> = {
  pending: 'pending',
  suspended: 'deactivated',
  rejected: 'all',
  available: 'active',
  busy: 'active',
  offline: 'active',
};

export function ProvidersPage() {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState('');
  const [portId, setPortId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [approving, setApproving] = useState<Provider | null>(null);
  const [deactivating, setDeactivating] = useState<Provider | null>(null);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Provider | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const requestedSection = searchParams.get('section');
  const sectionId = SECTIONS.some((s) => s.id === requestedSection)
    ? (requestedSection as string)
    : SECTION_FOR_STATUS[searchParams.get('status') ?? ''] ?? 'all';
  const section = SECTIONS.find((s) => s.id === sectionId) ?? SECTIONS[0];

  const selectSection = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', id);
    next.delete('status');
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const statuses = section.statuses;
  const singleStatus = statuses?.length === 1 ? statuses[0] : undefined;
  const isMergedSection = !!statuses && statuses.length > 1;

  const {
    data,
    loading,
    error,
    refetch,
  } = useAsync(
    () =>
      providersService.list({
        page: isMergedSection ? 1 : page,
        limit: isMergedSection ? MERGE_LIMIT : LIMIT,
        search: debouncedSearch || undefined,
        status: singleStatus,
        providerType: providerType || undefined,
        zoneId: zoneId || undefined,
        portId: portId || undefined,
      }),
    [page, debouncedSearch, singleStatus, providerType, portId, zoneId, isMergedSection]
  );

  /** "Active" spans three statuses, so it merges one request per status. */
  const {
    data: mergedProviders,
    loading: mergedLoading,
    error: mergedError,
    refetch: refetchMerged,
  } = useAsync(
    async () => {
      if (!isMergedSection || !statuses) return null;
      const pages = await Promise.all(
        statuses.map((status) =>
          providersService.list({
            page: 1,
            limit: MERGE_LIMIT,
            search: debouncedSearch || undefined,
            status,
            providerType: providerType || undefined,
            zoneId: zoneId || undefined,
            portId: portId || undefined,
          })
        )
      );
      return pages.flatMap((res) => res.items);
    },
    [statuses?.join(','), debouncedSearch, providerType, portId, zoneId, isMergedSection]
  );

  // Filter/name sources reuse the existing Locations / Ports module data.
  const { data: ports } = useAsync(() => portsService.list({ limit: 200 }), []);
  const { data: zones } = useAsync(() => zonesService.list({ page: 1, limit: ZONE_LOOKUP_LIMIT }), []);
  const { data: cities } = useAsync(
    () => locationsService.list({ type: 'city', status: 'all', page: 1, limit: ZONE_LOOKUP_LIMIT }),
    []
  );

  const zoneNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const zone of zones?.zones ?? []) map.set(zone._id, zone.name);
    return map;
  }, [zones]);

  const portNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const port of ports?.ports ?? []) map.set(port._id, port.name);
    return map;
  }, [ports]);

  const cityNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const city of cities ?? []) map.set(city._id, city.name);
    return map;
  }, [cities]);

  const providers = isMergedSection ? (mergedProviders ?? []) : (data?.items ?? []);
  const busyState = isMergedSection ? mergedLoading : loading;
  const loadError = isMergedSection ? mergedError : error;
  const reload = isMergedSection ? refetchMerged : refetch;
  const isFiltered = !!(search || providerType || portId || zoneId);
  const reset = () => {
    setSearch(''); setProviderType(''); setPortId('');
    setZoneId(''); setPage(1);
  };

  const approveProvider = async (provider: Provider) => {
    if (!provider) return;
    setBusyId(provider._id);
    try {
      await providersService.approve(provider._id);
      showToast({
        type: 'success',
        title: 'Provider approved',
        message: `${provider.name} is approved — goes live when they come online.`,
      });
      setApproving(null);
      reload();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not approve provider',
        message: err instanceof Error ? err.message : 'Try again in a moment.',
      });
    } finally {
      setBusyId(null);
    }
  };

  /** Restoring a deactivated provider is not destructive, so it needs no dialog. */
  const activateProvider = async (provider: Provider) => {
    setBusyId(provider._id);
    try {
      // Back to ACTIVE-with-their-own-availability: the provider comes online
      // themselves — the Admin never sets Online/Offline (§7).
      await providersService.setStatus(provider._id, 'offline');
      showToast({ type: 'success', title: 'Provider activated', message: `${provider.name} can receive deliveries again.` });
      reload();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Could not activate provider',
        message: err instanceof Error ? err.message : 'Try again in a moment.',
      });
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Deactivation blocks new offers. It needs a reason (stored on the record)
   * and — when the provider still holds active deliveries — the admin is warned
   * that those deliveries continue and must be reassigned from the Deliveries
   * page under the existing reassignment rules (§6).
   */
  const deactivateProvider = async (reason: string) => {
    if (!deactivating) return;
    setBusyId(deactivating._id);
    setDeactivateError(null);
    try {
      await providersService.setStatus(deactivating._id, 'suspended', reason);
      showToast({
        type: 'success',
        title: 'Provider deactivated',
        message: `${deactivating.name} can no longer receive new delivery offers.`,
      });
      setDeactivating(null);
      reload();
    } catch (err) {
      setDeactivateError(err instanceof Error ? err.message : 'Could not deactivate provider');
    } finally {
      setBusyId(null);
    }
  };

  // Rejection needs a reason for the applicant, so it opens the branded
  // ReasonDialog rather than a bare prompt.
  const confirmRejectProvider = async (reason: string) => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget._id);
    setRejectError(null);
    try {
      await providersService.reject(rejectTarget._id, reason);
      showToast({
        type: 'success',
        title: 'Provider rejected',
        message: `${rejectTarget.name}'s application was rejected.`,
      });
      setRejectTarget(null);
      reload();
    } catch (err) {
      setRejectError(err instanceof Error ? err.message : 'Could not reject provider');
    } finally {
      setBusyId(null);
    }
  };

  const serviceAreas = (provider: Provider) => {
    const names = (provider.zoneIds ?? [])
      .map((id) => zoneNameById.get(id))
      .filter((name): name is string => !!name);
    return names.length ? names : [];
  };

  // Spec columns: Provider · Status · City · Zone · Port · Availability ·
  // Active Deliveries · Actions. Status is the ACCOUNT state the Admin
  // controls; Availability is read-only information (§14).
  const columns: Column<Provider>[] = [
    {
      key: 'name',
      header: 'Provider',
      render: (p) => (
        <div className="min-w-0">
          <p className="font-medium text-gray-800 dark:text-gray-100">{p.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {PROVIDER_TYPE_LABELS[p.providerType] ?? p.providerType}
            {p.actorType ? ` · ${p.actorType}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => {
        const account = accountStateOf(p.status);
        return <StatusBadge label={account.label} variant={account.variant} />;
      },
    },
    {
      key: 'city',
      header: 'City',
      render: (p) => (
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {p.cityId ? (cityNameById.get(p.cityId) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'zones',
      header: 'Zone',
      render: (p) => {
        const count = p.zoneIds?.length ?? 0;
        if (count === 0) return <span className="text-sm text-gray-400">—</span>;
        const names = serviceAreas(p);
        const text = names.length ? names.join(', ') : `${count} zone(s)`;
        return (
          <span className="text-sm text-gray-700 dark:text-gray-200" title={text}>
            {text}
          </span>
        );
      },
    },
    {
      key: 'port',
      header: 'Port',
      render: (p) => (
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {p.portId ? (p.portName ?? portNameById.get(p.portId) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'availability',
      header: 'Availability',
      render: (p) => {
        // READ-ONLY: the provider/system owns availability. No toggle here.
        const availability = operationalStateOf(p.status);
        return (
          <div className="flex flex-col gap-1">
            <StatusBadge label={availability.label} variant={availability.variant} />
            {p.availability?.lastSeenAt && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                seen {new Date(p.availability.lastSeenAt).toLocaleString()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'activeDeliveries',
      header: 'Active Deliveries',
      render: (p) => (
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {p.activeDeliveries ?? 0} / {p.maxActiveAssignments ?? '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (p) => (
        <div className="flex flex-wrap items-center gap-3">
          {p.status === 'pending' && (
            <>
              <button
                type="button"
                disabled={busyId === p._id}
                onClick={(e) => { e.stopPropagation(); setApproving(p); }}
                className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-60 dark:text-green-400"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === p._id}
                onClick={(e) => { e.stopPropagation(); setRejectTarget(p); }}
                className="text-sm font-semibold text-red-700 hover:underline disabled:opacity-60 dark:text-red-400"
              >
                Reject
              </button>
            </>
          )}
          {p.status === 'suspended' && (
            <button
              type="button"
              disabled={busyId === p._id}
              onClick={(e) => { e.stopPropagation(); void activateProvider(p); }}
              className="text-sm font-semibold text-green-700 hover:underline disabled:opacity-60 dark:text-green-400"
            >
              Activate
            </button>
          )}
          {['available', 'busy', 'offline'].includes(p.status) && (
            <button
              type="button"
              disabled={busyId === p._id}
              onClick={(e) => { e.stopPropagation(); setDeactivateError(null); setDeactivating(p); }}
              className="text-sm font-semibold text-amber-700 hover:underline disabled:opacity-60 dark:text-amber-400"
            >
              Deactivate
            </button>
          )}
          <RowActions
            onView={() => setDetailId(p._id)}
            onEdit={() => setEditing(p)}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Partners & Providers"
        description="The people and businesses that perform deliveries for Aritii Market — identity, coverage and approval."
        actions={
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            Add Delivery Provider
          </Button>
        }
      />

      <>
          {/* Section strip — the four views of the provider list. */}
          <div
            className="mb-4 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-dark-600"
            role="tablist"
            aria-label="Provider sections"
          >
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={section.id === id}
                onClick={() => selectSection(id)}
                className={
                  section.id === id
                    ? 'whitespace-nowrap border-b-2 border-primary-dark px-4 py-2.5 text-sm font-medium text-primary-dark'
                    : 'whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel">
            <FilterBar
              searchValue={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder="Search providers…"
              isFiltered={isFiltered}
              onReset={reset}
              resultSummary={
                isMergedSection
                  ? `${providers.length}+ provider${providers.length === 1 ? '' : 's'}`
                  : data
                    ? `${data.total} provider${data.total === 1 ? '' : 's'}`
                    : undefined
              }
              filters={[
                {
                  key: 'type', label: 'Type', value: providerType,
                  onChange: (v: string) => { setProviderType(v); setPage(1); },
                  options: [{ value: '', label: 'All' }, ...PROVIDER_TYPES],
                },
                {
                  key: 'port', label: 'Port', value: portId,
                  onChange: (v: string) => { setPortId(v); setPage(1); },
                  options: [{ value: '', label: 'All' }, ...(ports?.ports ?? []).map((pt) => ({ value: pt._id, label: pt.name }))],
                },
                {
                  key: 'zone', label: 'Zone', value: zoneId,
                  onChange: (v: string) => { setZoneId(v); setPage(1); },
                  options: [{ value: '', label: 'All' }, ...(zones?.zones ?? []).map((z) => ({ value: z._id, label: z.name }))],
                },
                // No Online/Offline filter: availability is shown as a read-only
                // column, not a management axis (§7).
              ]}
            />

            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{section.hint}</p>

            <DataSection
              error={loadError}
              onRetry={reload}
              isEmpty={!busyState && providers.length === 0}
              emptyTitle={isFiltered ? 'No providers match these filters' : `No providers in ${section.label.toLowerCase()}`}
              emptyDescription={
                isFiltered
                  ? 'Try widening or resetting the filters above.'
                  : section.id === 'pending'
                    ? 'New applications appear here waiting for approval.'
                    : 'Nothing to show in this section.'
              }
              emptyAction={
                isFiltered || section.id !== 'all'
                  ? undefined
                  : { label: 'Add Delivery Provider', onClick: () => setCreating(true) }
              }
            >
              <DataTable
                columns={columns}
                rows={providers}
                rowKey={(p) => p._id}
                loading={busyState}
                emptyTitle="No providers found"
                onRowClick={(p) => setDetailId(p._id)}
              />
              {!isMergedSection && (
                <Pagination
                  className="mt-4"
                  page={page}
                  totalPages={data?.totalPages ?? 1}
                  total={data?.total}
                  onPageChange={setPage}
                />
              )}
            </DataSection>
          </div>
      </>

      <ProviderForm open={creating} onClose={() => setCreating(false)} onSaved={() => { setCreating(false); reload(); }} />
      <ProviderForm open={!!editing} initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />

      <ProviderDetailDrawer
        providerId={detailId}
        onClose={() => setDetailId(null)}
        onChanged={reload}
      />

      {/* Approval action — confirmed before it changes the platform. */}
      <ConfirmDialog
        open={!!approving}
        onClose={() => setApproving(null)}
        onConfirm={() => void approveProvider(approving as Provider)}
        title={`Approve ${approving?.name ?? 'provider'}?`}
        message="Approving accepts this provider onto the platform. Their account is provisioned and they can be given deliveries."
        confirmLabel="Approve provider"
        loading={busyId === approving?._id}
      />

      {/* Deactivation needs a reason — and warns about work in flight (§6, §16). */}
      <ReasonDialog
        open={!!deactivating}
        title={`Deactivate ${deactivating?.name ?? 'provider'}?`}
        message={
          (deactivating?.activeDeliveries ?? 0) > 0
            ? `This provider currently has ${deactivating?.activeDeliveries} active deliver${deactivating?.activeDeliveries === 1 ? 'y' : 'ies'}. Deactivating blocks NEW offers only — those deliveries keep running and must be reassigned from the Deliveries page if the provider drops them.`
            : 'Deactivating blocks new delivery offers. Their configuration and history are kept, and you can activate them at any time.'
        }
        confirmLabel="Deactivate provider"
        placeholder="Why is this provider being deactivated?"
        loading={busyId === deactivating?._id}
        error={deactivateError}
        onClose={() => { setDeactivating(null); setDeactivateError(null); }}
        onConfirm={deactivateProvider}
      />

      {/* Rejection needs a reason for the applicant. */}
      <ReasonDialog
        open={!!rejectTarget}
        title={`Reject ${rejectTarget?.name ?? 'provider'}?`}
        message="The reason is shown to the applicant, so make it clear and specific."
        confirmLabel="Reject provider"
        placeholder="Why is this provider being rejected?"
        loading={busyId === rejectTarget?._id}
        error={rejectError}
        onClose={() => { setRejectTarget(null); setRejectError(null); }}
        onConfirm={confirmRejectProvider}
      />
    </div>
  );
}

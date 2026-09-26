import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { useLocations } from '../hooks/useLocations';
import { locationsService } from '@/services/locations.service';
import { EnhancedLocationForm } from '../components/EnhancedLocationForm';
import { FilterBar } from '@/components/workspace/FilterBar';
import { DataSection, RowActions } from '@/components/workspace/DataSection';
import { Facts } from '@/components/workspace/DetailList';
import { RecordDrawer, type DetailTab } from '@/components/workspace/RecordDrawer';
import { EXPANSION_STATUSES, EXPANSION_STATUS_LABELS } from '../constants';
import type { Location } from '../types';

const LIMIT = 20;

/** The six expansion stages, in lifecycle order. */
const STAGES = ['planned', 'preparing', 'testing', 'active', 'suspended', 'closed'] as const;

/**
 * Expansion tab: geographic expansion management, kept OUT of the normal
 * location list so planning work is not mixed with day-to-day locations.
 *
 * A location IS an expansion project — its `expansionStatus` is the stage —
 * so this tab is the location list narrowed to expansion, plus the setup
 * progress needed to take a stage to "active".
 */
export function ExpansionTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [detail, setDetail] = useState<Location | null>(null);
  const [detailTab, setDetailTab] = useState('plan');
  const [editing, setEditing] = useState<Location | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, loading, error, refetch } = useLocations({
    expansionStatus: stage || undefined,
    search: debouncedSearch,
    page,
    limit: LIMIT,
  });

  const locations = data?.items ?? [];
  const isFiltered = !!(search || stage);
  const reset = () => { setSearch(''); setStage(''); setPage(1); };

  const stageIndex = (s?: string) => STAGES.indexOf((s ?? 'active') as (typeof STAGES)[number]);

  const setStageFor = async (location: Location, next: string) => {
    await locationsService.update(location._id, { expansionStatus: next } as never);
    refetch();
  };

  /** Readiness = how far the project has progressed towards being operational. */
  const readiness = (l: Location) => {
    const checks = [l.serviceability?.serviceable ?? false, l.hub?.isHub ?? false, l.isActive];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const columns: Column<Location>[] = [
    {
      key: 'location',
      header: 'Location',
      render: (l) => (
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-100">{l.name}</p>
          <p className="text-xs capitalize text-gray-500">{l.type}</p>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (l) => (
        <StatusBadge
          label={EXPANSION_STATUS_LABELS[l.expansionStatus ?? 'active']}
          variant={l.expansionStatus === 'active' ? 'success' : 'warning'}
        />
      ),
    },
    { key: 'zones', header: 'Zones', render: (l) => (l.hub?.isHub ? 'Hub configured' : '—') },
    { key: 'routes', header: 'Routes', render: (l) => (l.serviceability?.serviceable ? 'Serviceable' : '—') },
    { key: 'readiness', header: 'Readiness', render: (l) => `${readiness(l)}%` },
    { key: 'updated', header: 'Last updated', render: (l) => l.updatedAt?.slice(0, 10) ?? '—' },
    {
      key: 'actions',
      header: 'Actions',
      render: (l) => (
        <RowActions
          onView={() => { setDetail(l); setDetailTab('plan'); }}
          onEdit={() => setEditing(l)}
          onManage={() => void setStageFor(l, l.expansionStatus === 'active' ? 'suspended' : 'active')}
        />
      ),
    },
  ];

const d = detail;
  const detailTabs: DetailTab[] = d
    ? [
      {
        id: 'plan',
        label: 'Expansion Plan',
        content: (
          <div className="space-y-4">
            {/* Stage stepper — every step derived from the real expansionStatus. */}
            <ol className="space-y-2">
              {STAGES.map((s, i) => {
                const current = stageIndex(d.expansionStatus);
                const reached = i <= current;
                return (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span
                      aria-hidden
                      className={
                        reached
                          ? 'flex h-6 w-6 items-center justify-center rounded-full bg-primary-dark text-xs text-white'
                          : 'flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-400'
                      }
                    >
                      {i + 1}
                    </span>
                    <span className={reached ? 'font-medium text-gray-800 dark:text-gray-100' : 'text-gray-400'}>
                      {EXPANSION_STATUS_LABELS[s]}
                    </span>
                    {s === (d.expansionStatus ?? 'active') && <StatusBadge label="Current" variant="info" />}
                  </li>
                );
              })}
            </ol>

            <Facts items={[
              ['Type', d.type],
              ['Current stage', EXPANSION_STATUS_LABELS[d.expansionStatus ?? 'active']],
              ['Serviceable', String(d.serviceability?.serviceable ?? false)],
              ['Hub configured', String(d.hub?.isHub ?? false)],
              ['Active', String(d.isActive)],
              ['Readiness', `${readiness(d)}%`],
            ]} />
          </div>
        ),
      },
      {
        id: 'readiness',
        label: 'Readiness',
        content: (
          <Facts items={[
            ['Location created', 'Yes'],
            ['Serviceability configured', String(d.serviceability?.serviceable ?? false)],
            ['Hub configured', String(d.hub?.isHub ?? false)],
            ['Location active', String(d.isActive)],
            ['Readiness score', `${readiness(d)}%`],
          ]} />
        ),
      },
      {
        id: 'activity',
        label: 'Activity',
        content: (
          <p className="text-sm text-gray-500">
            Last updated: {d.updatedAt ? new Date(d.updatedAt).toLocaleString() : '—'}
          </p>
        ),
      },
    ]
    : [];

  const stageCounts = STAGES.map((s) => ({
    stage: s,
    count: locations.filter((l) => (l.expansionStatus ?? 'active') === s).length,
  }));

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stageCounts.map(({ stage: s, count }) => (
          <Card key={s} className={`cursor-pointer p-3 ${stage === s ? 'border-primary-dark' : ''}`}>
            <button
              type="button"
              onClick={() => { setStage(stage === s ? '' : s); setPage(1); }}
              className="w-full text-left"
            >
              <p className="text-xs uppercase tracking-wide text-gray-500">{EXPANSION_STATUS_LABELS[s]}</p>
              <p className="mt-1 text-lg font-bold text-gray-800 dark:text-gray-100">{count}</p>
            </button>
          </Card>
        ))}
      </div>

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search expansion projects…"
        isFiltered={isFiltered}
        onReset={reset}
        resultSummary={data ? `${data.total} project${data.total === 1 ? '' : 's'}` : undefined}
        filters={[
          { key: 'stage', label: 'Stage', value: stage, onChange: (v) => { setStage(v); setPage(1); }, options: EXPANSION_STATUSES },
        ]}
      />

      <DataSection
        error={error}
        onRetry={refetch}
        isEmpty={!loading && locations.length === 0}
        emptyTitle={isFiltered ? 'No expansion projects match these filters' : 'No expansion projects'}
        emptyDescription={isFiltered ? 'Try resetting the filters above.' : 'Locations you create will appear here with their expansion stage.'}
      >
        <DataTable columns={columns} rows={locations} rowKey={(l) => l._id} loading={loading} emptyTitle="No expansion projects" />
        <Pagination className="mt-4" page={page} totalPages={data?.totalPages ?? 1} total={data?.total} onPageChange={setPage} />
      </DataSection>

      {editing && (
        <Modal open onClose={() => setEditing(null)} title={`Edit ${editing.name}`} size="lg">
          <EnhancedLocationForm initial={editing} onSuccess={() => { setEditing(null); refetch(); }} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      <RecordDrawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        subtitle={detail?.type}
        statusLabel={EXPANSION_STATUS_LABELS[detail?.expansionStatus ?? 'active']}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => detail && setEditing(detail)}>Edit</Button>
            {detail && detail.expansionStatus !== 'active' && (
              <Button variant="primary" size="sm" onClick={() => void setStageFor(detail, 'active')}>
                Activate
              </Button>
            )}
          </>
        }
        summary={[
          { label: 'Stage', value: EXPANSION_STATUS_LABELS[detail?.expansionStatus ?? 'active'] },
          { label: 'Readiness', value: detail ? `${readiness(detail)}%` : '—' },
          { label: 'Serviceable', value: detail?.serviceability?.serviceable ? 'Yes' : 'No' },
        ]}
        tabs={detailTabs}
        activeTab={detailTab}
        onTabChange={setDetailTab}
      />
    </>
  );
}

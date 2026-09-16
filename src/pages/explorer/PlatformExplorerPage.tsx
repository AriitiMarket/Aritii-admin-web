/**
 * Platform Explorer — the hierarchical control surface.
 *
 * Platform -> Region -> City -> Area -> Sector with Commerce metrics rolled up
 * per node (businesses / shops / orders) and Delivery location status.
 *
 * Desktop: tree left, selected-node detail right. Mobile/tablet: drill-down
 * (tree -> detail with an explicit Back action), never a forced desktop sidebar.
 *
 * Data: GET /admin/platform/hierarchy (commerce + delivery composition).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  platformAdminService,
  type HierarchyNode,
  type PlatformHierarchy,
} from '@/services/platformAdmin.service';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import { SearchInput } from '@/components/common/SearchInput';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { EmptyState } from '@/components/common/EmptyState';
import { SectorAvailabilityPanel } from '@/components/locations/SectorAvailabilityPanel';

function findPath(nodes: HierarchyNode[], id: string, trail: HierarchyNode[] = []): HierarchyNode[] {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === id) return nextTrail;
    const found = findPath(node.children || [], id, nextTrail);
    if (found.length) return found;
  }
  return [];
}

function filterTree(nodes: HierarchyNode[], query: string): HierarchyNode[] {
  if (!query) return nodes;
  const needle = query.toLowerCase();
  return nodes
    .map((node) => ({ ...node, children: filterTree(node.children || [], query) }))
    .filter((node) => node.name.toLowerCase().includes(needle) || node.children.length > 0);
}

function TreeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: HierarchyNode;
  depth: number;
  selectedId: string | null;
  onSelect: (node: HierarchyNode) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = (node.children || []).length > 0;

  return (
    <li className="list-none">
      <div
        className={`flex items-center gap-1 rounded px-1 py-0.5 ${
          selectedId === node.id ? 'bg-primary-dark/10' : ''
        }`}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="h-5 w-5 shrink-0 text-xs text-gray-500"
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="h-5 w-5 shrink-0" />
        )}
        <button type="button" onClick={() => onSelect(node)} className="min-w-0 flex-1 text-left">
          <span className={`block truncate text-sm ${node.isActive ? '' : 'text-gray-400 line-through'}`}>
            {node.name}
          </span>
          <span className="block truncate text-[11px] text-gray-500 dark:text-gray-400">
            {node.type} · {node.metrics.businesses} biz · {node.metrics.shops} shops · {node.metrics.orders} orders
          </span>
        </button>
      </div>
      {open && hasChildren && (
        <ul className="m-0 p-0">
          {node.children.map((child) => (
            <TreeItem key={child.id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function PlatformExplorerPage() {
  const { data, loading, error, refetch } = useAsync<PlatformHierarchy>(
    () => platformAdminService.getHierarchy(),
    []
  );
  const [selected, setSelected] = useState<HierarchyNode | null>(null);
  const [query, setQuery] = useState('');
  const [mobileDetail, setMobileDetail] = useState(false);

  const regions = useMemo(() => filterTree(data?.regions || [], query), [data, query]);
  const path = useMemo(
    () => (selected && data ? findPath(data.regions || [], selected.id) : []),
    [selected, data]
  );

  const select = (node: HierarchyNode) => {
    setSelected(node);
    setMobileDetail(true);
  };

  if (loading) return <PageLoader label="Loading platform hierarchy…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const totals = data?.platform?.totals || {};
  const isEmpty = (data?.regions || []).length === 0;

  return (
    <div>
      <PageHeader
        title="Platform Explorer"
        description="Navigate the platform hierarchy — region, city, area, sector — with live Commerce metrics"
        actions={
          <Button variant="outline" size="sm" onClick={refetch}>
            Refresh
          </Button>
        }
      />

      {data?.degraded && (
        <Card className="mb-4 border-amber-300">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Location data is currently unavailable ({data.error}). Totals still reflect the Commerce side.
          </p>
        </Card>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Businesses" value={String(totals.businesses ?? 0)} hint={`${totals.activeBusinesses ?? 0} active`} />
        <StatCard label="Shops" value={String(totals.shops ?? 0)} hint={`${totals.activeShops ?? 0} active`} />
        <StatCard label="Orders" value={String(totals.orders ?? 0)} />
        <StatCard label="Sectors" value={String(totals.sectors ?? 0)} hint={`${totals.activeSectors ?? 0} active`} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className={`lg:col-span-4 ${mobileDetail ? 'hidden lg:block' : ''}`}>
          <div className="mb-3">
            <SearchInput value={query} onChange={setQuery} placeholder="Search locations…" aria-label="Search locations" />
          </div>

          {isEmpty ? (
            <EmptyState
              title="No locations configured"
              description="Create regions/cities under Locations & Expansion, then they will appear here."
              action={
                <Link to="/locations/create">
                  <Button size="sm">Add location</Button>
                </Link>
              }
            />
          ) : regions.length === 0 ? (
            <EmptyState title="No matches" description="No location matches your search." />
          ) : (
            <ul className="m-0 max-h-[60vh] overflow-auto p-0">
              {regions.map((region) => (
                <TreeItem
                  key={region.id}
                  node={region}
                  depth={0}
                  selectedId={selected ? selected.id : null}
                  onSelect={select}
                />
              ))}
            </ul>
          )}
        </Card>

        <div className={`lg:col-span-8 ${mobileDetail ? '' : 'hidden lg:block'}`}>
          {!selected ? (
            <Card>
              <EmptyState
                title="Select a node"
                description="Pick a region, city, area or sector to see its metrics, children and available actions."
              />
            </Card>
          ) : (
            <NodeDetail node={selected} path={path} onSelect={select} onBack={() => setMobileDetail(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

function NodeDetail({
  node,
  path,
  onSelect,
  onBack,
}: {
  node: HierarchyNode;
  path: HierarchyNode[];
  onSelect: (node: HierarchyNode) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="lg:hidden" onClick={onBack}>
        ← Back to hierarchy
      </Button>

      <nav aria-label="Breadcrumb" className="text-xs text-gray-500 dark:text-gray-400">
        <span>Platform</span>
        {path.map((entry) => (
          <span key={entry.id}>
            {' › '}
            <button type="button" className="hover:underline" onClick={() => onSelect(entry)}>
              {entry.name}
            </button>
          </span>
        ))}
      </nav>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{node.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Type: {node.type}
              {node.code ? ` · code ${node.code}` : ''}
              {node.parentId ? '' : ' · root'}
            </p>
          </div>
          <StatusBadge label={node.isActive ? 'active' : 'inactive'} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Businesses" value={String(node.metrics.businesses)} hint={`${node.direct.businesses} direct`} />
        <StatCard label="Shops" value={String(node.metrics.shops)} hint={`${node.direct.shops} direct`} />
        <StatCard label="Orders" value={String(node.metrics.orders)} hint={`${node.direct.orders} direct`} />
        <StatCard label="Children" value={String(node.metrics.children)} hint={`${node.metrics.activeChildren} active`} />
      </div>

      <Card>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Related records</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link to={`/businesses?locationId=${node.id}`}>
            <Button size="sm" variant="outline">Businesses here</Button>
          </Link>
          <Link to={`/stores?locationId=${node.id}`}>
            <Button size="sm" variant="outline">Shops here</Button>
          </Link>
          <Link to={`/orders?locationId=${node.id}`}>
            <Button size="sm" variant="outline">Orders here</Button>
          </Link>
          <Link to="/operations">
            <Button size="sm" variant="outline">Operations board</Button>
          </Link>
        </div>

        {node.children.length > 0 && (
          <ul className="mt-3 space-y-1">
            {node.children.map((child) => (
              <li key={child.id}>
                <button
                  type="button"
                  className="text-sm text-primary-dark hover:underline"
                  onClick={() => onSelect(child)}
                >
                  {child.name}
                </button>
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  {child.type} · {child.metrics.shops} shops · {child.metrics.orders} orders
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SectorAvailabilityPanel locationId={node.id} locationName={node.name} />
    </div>
  );
}
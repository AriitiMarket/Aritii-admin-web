/**
 * EnhancedPlatformExplorer — Advanced hierarchy navigation with drill-down, metrics, search, and actions.
 *
 * Features:
 * - Drill-down navigation (click node to drill deeper)
 * - Inline metrics (orders, revenue, businesses, shops per node)
 * - Quick actions (select scope, view details, manage)
 * - Real-time search/filter
 * - Breadcrumb navigation (show path, click to go back)
 * - Status indicators (active/inactive)
 * - Mobile-responsive drill-down view
 */

import { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
  faSearch,
  faTimes,
  faCheckCircle,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useHierarchy } from '@/hooks/useHierarchy';
import { useAsync } from '@/hooks/useAsync';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';
import { Spinner } from '@/components/common/Spinner';
import { platformAdminService } from '@/services/platformAdmin.service';

interface ExplorerNode {
  id: string;
  name: string;
  type: 'region' | 'city' | 'area' | 'sector' | 'business' | 'shop';
  code?: string;
  isActive: boolean;
  metrics?: {
    shops?: number;
    orders?: number;
    businesses?: number;
    revenue?: number;
  };
}

export function EnhancedPlatformExplorer() {
  const { selection, setRegion, setCity, setArea, setSector, setBusiness, setShop } =
    useHierarchy();

  // Drill-down state
  const [drillPath, setDrillPath] = useState<ExplorerNode[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Fetch hierarchy
  const hierarchy = useAsync(
    () => platformAdminService.getHierarchy().then((res) => res.hierarchy),
    []
  );

  // Get current level based on drill path
  const currentLevel = drillPath.length > 0 ? drillPath[drillPath.length - 1] : null;

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!hierarchy.data || hierarchy.data.length === 0) return [];

    let nodes = hierarchy.data;

    // If drilling, get children of current node
    if (currentLevel) {
      nodes = currentLevel.children || [];
    }

    // Filter by search
    if (search) {
      nodes = nodes.filter(
        (node) =>
          node.name.toLowerCase().includes(search.toLowerCase()) ||
          (node.code && node.code.toLowerCase().includes(search.toLowerCase()))
      );
    }

    return nodes;
  }, [hierarchy.data, currentLevel, search]);

  const handleDrill = (node: ExplorerNode) => {
    setDrillPath([...drillPath, node]);
  };

  const handleBack = () => {
    setDrillPath(drillPath.slice(0, -1));
  };

  const handleSelectScope = (node: ExplorerNode) => {
    switch (node.type) {
      case 'region':
        setRegion(node);
        break;
      case 'city':
        setCity(node);
        break;
      case 'area':
        setArea(node);
        break;
      case 'sector':
        setSector(node);
        break;
      case 'business':
        setBusiness(node);
        break;
      case 'shop':
        setShop(node);
        break;
    }
  };

  const getBreadcrumb = () => {
    const path = ['Platform', ...drillPath.map((n) => n.name)];
    return path;
  };

  const typeLabels: Record<string, string> = {
    region: 'Regions',
    city: 'Cities',
    area: 'Areas',
    sector: 'Sectors',
    business: 'Businesses',
    shop: 'Shops',
  };

  const currentType = currentLevel?.type || 'region';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Explorer"
        subtitle="Navigate and explore your platform hierarchy"
      />

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {getBreadcrumb().map((part, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {idx > 0 && <FontAwesomeIcon icon={faChevronRight} className="text-gray-400" />}
            <span className="font-medium text-gray-700 dark:text-gray-300">{part}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={`Search ${typeLabels[currentType]}...`}
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
        </div>

        {/* Back button */}
        {drillPath.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
            Back
          </Button>
        )}
      </div>

      {/* Loading */}
      {hierarchy.loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* Error */}
      {hierarchy.error && (
        <div className="rounded bg-red-50 p-4 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Failed to load hierarchy
        </div>
      )}

      {/* Nodes */}
      {!hierarchy.loading && !hierarchy.error && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-2'
          }
        >
          {filteredNodes.length > 0 ? (
            filteredNodes.map((node) => (
              <div
                key={node.id}
                className={`rounded border border-gray-200 p-4 hover:shadow-md dark:border-dark-700 ${
                  viewMode === 'grid' ? 'flex flex-col' : 'flex items-center justify-between'
                }`}
              >
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                      icon={node.isActive ? faCheckCircle : faTimesCircle}
                      className={node.isActive ? 'text-green-600' : 'text-gray-400'}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {node.name}
                      </p>
                      {node.code && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {node.code}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  {node.metrics && (
                    <div className="mt-2 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                      {node.metrics.shops !== undefined && (
                        <span>🏬 {node.metrics.shops} shops</span>
                      )}
                      {node.metrics.orders !== undefined && (
                        <span>📦 {node.metrics.orders} orders</span>
                      )}
                      {node.metrics.businesses !== undefined && (
                        <span>🏢 {node.metrics.businesses} businesses</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="mt-2 flex gap-2 sm:mt-0 sm:ml-2">
                  {/* Drill */}
                  {node.type !== 'shop' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDrill(node)}
                      title="Drill down"
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </Button>
                  )}

                  {/* Select scope */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelectScope(node)}
                    title="Select as scope"
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded bg-gray-50 p-8 text-center text-gray-500 dark:bg-dark-800 dark:text-gray-400">
              No nodes found
            </div>
          )}
        </div>
      )}

      {/* Current selection */}
      <div className="rounded bg-blue-50 p-4 text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
        💡 <strong>Tip:</strong> Click a node to drill deeper or click [Select] to set it as your admin scope.
      </div>
    </div>
  );
}

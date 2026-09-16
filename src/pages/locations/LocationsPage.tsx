import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsService } from '@/services/locations.service';
import type { LocationListFilter } from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { SelectField } from '@/components/forms/SelectField';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { Card } from '@/components/common/Card';
import type { Location } from '@/types';
import { adminApi } from '@/api/admin';
import styles from './LocationsPage.module.css';

interface HierarchyNode {
  id: string;
  name: string;
  type: 'region' | 'city' | 'area' | 'sector' | 'business' | 'shop';
  parentId: string | null;
  isActive: boolean;
  children?: HierarchyNode[];
  businessCount?: number;
  shopCount?: number;
  orderCount?: number;
}

interface Business {
  id: string;
  name: string;
  owner: string;
  sector: string;
  status: 'active' | 'pending' | 'rejected';
  createdAt: string;
}

interface Shop {
  id: string;
  name: string;
  businessId: string;
  location: string;
  status: 'active' | 'inactive';
  createdAt: string;
  address?: string;
}

interface Order {
  id: string;
  orderId: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
  pickupStatus?: string;
  deliveryStatus?: string;
}

export function LocationsManagementPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();

  // Tab state: 'hierarchy' or 'list'
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'list'>('hierarchy');

  // List view state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [isActive, setIsActive] = useState('all');
  const debouncedSearch = useDebounce(search, 300);

  // Hierarchy state
  const [hierarchyTree, setHierarchyTree] = useState<HierarchyNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<any[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [hierarchyError, setHierarchyError] = useState<string | null>(null);

  // Data loading state for hierarchy levels
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const filter: LocationListFilter = {
    page,
    limit: 20,
    search: debouncedSearch,
    ...(type !== 'all' ? { type } : {}),
    ...(isActive !== 'all' ? { isActive: isActive === 'active' } : {}),
  };

  const { data, loading, error, refetch } = useAsync(
    () => locationsService.list(filter),
    [page, debouncedSearch, type, isActive]
  );

  // Load hierarchy on mount
  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setHierarchyLoading(true);
      setHierarchyError(null);
      const response = await adminApi.getPlatformHierarchy();
      setHierarchyTree(response.data?.regions || []);
    } catch (err) {
      setHierarchyError(String(err));
      console.error('Failed to load hierarchy:', err);
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Load data for selected hierarchy level
  const loadHierarchyData = async (path: any[]) => {
    try {
      setDataLoading(true);
      setDataError(null);
      
      setBusinesses([]);
      setShops([]);
      setOrders([]);

      if (path.length === 0) return;

      const lastLevel = path[path.length - 1];

      if (lastLevel.type === 'business') {
        try {
          const shopResponse = await adminApi.getShops({
            business: lastLevel.id,
            page: 1,
            limit: 100,
          });
          setShops(shopResponse?.items || []);
        } catch (err) {
          console.error('Failed to load shops:', err);
        }
      } else if (lastLevel.type === 'shop') {
        try {
          const orderResponse = await adminApi.getOrders({
            shop: lastLevel.id,
            page: 1,
            limit: 50,
          });
          
          const ordersWithStatus = await Promise.all(
            (orderResponse?.items || []).map(async (order: any) => {
              try {
                const deliveryInfo = await adminApi.getOrderPickupDeliveryLifecycle(order.id);
                return {
                  ...order,
                  pickupStatus: deliveryInfo?.status || 'UNKNOWN',
                  deliveryStatus: deliveryInfo?.currentStage || 'NOT_STARTED',
                };
              } catch {
                return order;
              }
            })
          );
          setOrders(ordersWithStatus);
        } catch (err) {
          console.error('Failed to load orders:', err);
        }
      } else if (lastLevel.type === 'sector') {
        try {
          const businessResponse = await adminApi.getBusinesses({
            sector: lastLevel.id,
            page: 1,
            limit: 100,
          });
          setBusinesses(businessResponse?.items || []);
        } catch (err) {
          console.error('Failed to load businesses:', err);
        }

        try {
          const orderResponse = await adminApi.getOrdersWithFilters({
            location: lastLevel.id,
            page: 1,
            limit: 50,
          });
          setOrders(orderResponse?.items || []);
        } catch (err) {
          console.error('Failed to load orders:', err);
        }
      } else if (lastLevel.type === 'area') {
        try {
          const businessResponse = await adminApi.getBusinesses({
            area: lastLevel.id,
            page: 1,
            limit: 100,
          });
          setBusinesses(businessResponse?.items || []);
        } catch (err) {
          console.error('Failed to load businesses:', err);
        }
      } else if (lastLevel.type === 'city') {
        try {
          const businessResponse = await adminApi.getBusinesses({
            city: lastLevel.id,
            page: 1,
            limit: 100,
          });
          setBusinesses(businessResponse?.items || []);
        } catch (err) {
          console.error('Failed to load businesses:', err);
        }
      } else if (lastLevel.type === 'region') {
        try {
          const businessResponse = await adminApi.getBusinesses({
            region: lastLevel.id,
            page: 1,
            limit: 100,
          });
          setBusinesses(businessResponse?.items || []);
        } catch (err) {
          console.error('Failed to load businesses:', err);
        }
      }
    } catch (err) {
      setDataError(String(err));
      console.error('Failed to load hierarchy data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const loadShopsForBusiness = (businessId: string, businessName: string) => {
    const newPath = [...selectedPath, {
      id: businessId,
      name: businessName,
      type: 'business',
      level: selectedPath.length,
    }];
    setSelectedPath(newPath);
    loadHierarchyData(newPath);
  };

  const loadOrdersForShop = (shopId: string, shopName: string) => {
    const newPath = [...selectedPath, {
      id: shopId,
      name: shopName,
      type: 'shop',
      level: selectedPath.length,
    }];
    setSelectedPath(newPath);
    loadHierarchyData(newPath);
  };

  const locationTypes = [
    { value: 'all', label: t('All types') },
    { value: 'country', label: t('Country') },
    { value: 'region', label: t('Region') },
    { value: 'city', label: t('City') },
    { value: 'town', label: t('Town') },
    { value: 'area', label: t('Area') },
    { value: 'sector', label: t('Sector') },
    { value: 'community', label: t('Community') },
    { value: 'village', label: t('Village') },
    { value: 'rural', label: t('Rural') },
  ];

  const activeOptions = [
    { value: 'all', label: t('All') },
    { value: 'active', label: t('Active') },
    { value: 'inactive', label: t('Inactive') },
  ];

  const columns: Column<Location>[] = [
    {
      key: 'name',
      header: t('Name'),
      render: (row) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {row.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: t('Type'),
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-100">
          {row.type}
        </span>
      ),
    },
    { key: 'code', header: t('Code'), accessor: (row) => row.code || '-' },
    { key: 'description', header: t('Description'), accessor: (row) => row.description || '-' },
    {
      key: 'isActive',
      header: t('Status'),
      render: (row) => (
        <StatusBadge label={row.isActive ? 'ACTIVE' : 'INACTIVE'} />
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════════════
  // HIERARCHY TREE RENDERING
  // ═══════════════════════════════════════════════════════════════

  const handleNodeClick = (node: HierarchyNode, level: number) => {
    const newPath: any[] = selectedPath.slice(0, level);
    newPath.push({
      id: node.id,
      name: node.name,
      type: node.type,
      level: level,
    });
    setSelectedPath(newPath);

    const nodeKey = `${node.type}_${node.id}`;
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeKey)) {
        next.delete(nodeKey);
      } else {
        next.add(nodeKey);
      }
      return next;
    });

    // Load data for this level
    loadHierarchyData(newPath);
  };

  const handleBreadcrumbClick = (index: number) => {
    const newPath = selectedPath.slice(0, index + 1);
    setSelectedPath(newPath);
    loadHierarchyData(newPath);
  };

  const handleResetHierarchy = () => {
    setSelectedPath([]);
    setExpandedNodes(new Set());
  };

  const renderNode = (node: HierarchyNode, level: number): React.ReactNode => {
    const nodeKey = `${node.type}_${node.id}`;
    const isExpanded = expandedNodes.has(nodeKey);
    const isSelected =
      selectedPath.length > level &&
      selectedPath[level].id === node.id;

    const hierarchyLevels = ['Region', 'City', 'Area', 'Sector'];
    const displayLevel = hierarchyLevels[level] || node.type;

    return (
      <div key={nodeKey} className={styles.treeNode}>
        <div
          className={`${styles.nodeContent} ${isSelected ? styles.nodeSelected : ''}`}
          onClick={() => handleNodeClick(node, level)}
        >
          {node.children && node.children.length > 0 && (
            <span className={styles.expandIcon}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}

          <div className={styles.nodeInfo}>
            <span className={styles.nodeType}>[{displayLevel}]</span>
            <span className={styles.nodeName}>{node.name}</span>

            {node.businessCount && (
              <span className={styles.nodeMeta}>
                {node.businessCount} businesses
              </span>
            )}
            {node.shopCount && (
              <span className={styles.nodeMeta}>
                {node.shopCount} shops
              </span>
            )}
            {node.orderCount && (
              <span className={styles.nodeMeta}>
                {node.orderCount} orders
              </span>
            )}

            {!node.isActive && (
              <span className={styles.nodeInactive}>[Inactive]</span>
            )}
          </div>
        </div>

        {isExpanded && node.children && node.children.length > 0 && (
          <div className={styles.nodeChildren}>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderBreadcrumb = () => {
    if (selectedPath.length === 0) {
      return <span className={styles.breadcrumbItem}>Platform</span>;
    }

    const items: React.ReactNode[] = [
      <span
        key="root"
        className={styles.breadcrumbItem}
        onClick={handleResetHierarchy}
        style={{ cursor: 'pointer' }}
      >
        Platform
      </span>,
    ];

    selectedPath.forEach((item, index) => {
      items.push(
        <span key={`separator_${index}`} className={styles.breadcrumbSeparator}>
          /
        </span>
      );
      items.push(
        <span
          key={`item_${index}`}
          className={styles.breadcrumbItem}
          onClick={() => handleBreadcrumbClick(index)}
          style={{ cursor: 'pointer' }}
        >
          {item.name} <small>[{item.type.toUpperCase()}]</small>
        </span>
      );
    });

    return items;
  };

  const renderDetailsPanel = () => {
    if (selectedPath.length === 0) {
      return (
        <div className={styles.detailsPanel}>
          <h3>Platform Overview</h3>
          <p>Click a region to begin exploring the hierarchy.</p>
          <p>
            The platform is organized in this hierarchy:
            <br />
            Region → City → Area → Sector → Business → Shop → Orders
          </p>
        </div>
      );
    }

    const lastItem = selectedPath[selectedPath.length - 1];

    return (
      <div className={styles.detailsPanel}>
        <h3>{lastItem.name}</h3>
        <p>
          <strong>Type:</strong> {lastItem.type.toUpperCase()}
          <br />
          <strong>Level:</strong> {lastItem.level + 1}
          <br />
          <strong>ID:</strong> {lastItem.id}
        </p>

        {businesses.length > 0 && (
          <div className={styles.dataSection}>
            <h4>Businesses ({businesses.length})</h4>
            <div className={styles.dataList}>
              {businesses.slice(0, 8).map((b) => (
                <div
                  key={b.id}
                  className={styles.clickableItem}
                  onClick={() => loadShopsForBusiness(b.id, b.name)}
                  title="Click to view shops"
                >
                  <span className={styles.dataName}>{b.name}</span>
                  <span className={`${styles.dataBadge} ${styles[`status_${b.status}`]}`}>
                    {b.status.toUpperCase()}
                  </span>
                </div>
              ))}
              {businesses.length > 8 && (
                <p className={styles.dataMore}>+{businesses.length - 8} more businesses</p>
              )}
            </div>
          </div>
        )}

        {shops.length > 0 && (
          <div className={styles.dataSection}>
            <h4>Shops ({shops.length})</h4>
            <div className={styles.dataList}>
              {shops.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className={styles.clickableItem}
                  onClick={() => loadOrdersForShop(s.id, s.name)}
                  title="Click to view orders"
                >
                  <span className={styles.dataName}>{s.name}</span>
                  <span className={styles.dataMeta}>{s.address || s.location}</span>
                </div>
              ))}
              {shops.length > 8 && (
                <p className={styles.dataMore}>+{shops.length - 8} more shops</p>
              )}
            </div>
          </div>
        )}

        {orders.length > 0 && (
          <div className={styles.dataSection}>
            <h4>Orders ({orders.length})</h4>
            <div className={styles.dataList}>
              {orders.slice(0, 8).map((o) => (
                <div key={o.id} className={styles.dataItem}>
                  <div className={styles.orderInfo}>
                    <span className={styles.dataName}>{o.orderId}</span>
                    <span className={styles.dataMeta}>${o.total}</span>
                  </div>
                  {(o.pickupStatus || o.deliveryStatus) && (
                    <div className={styles.statusRow}>
                      {o.pickupStatus && (
                        <span className={`${styles.statusBadge} ${styles[`pickup_${o.pickupStatus?.toLowerCase()}`]}`}>
                          📦 {o.pickupStatus}
                        </span>
                      )}
                      {o.deliveryStatus && (
                        <span className={`${styles.statusBadge} ${styles[`delivery_${o.deliveryStatus?.toLowerCase()}`]}`}>
                          🚚 {o.deliveryStatus}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {orders.length > 8 && (
                <p className={styles.dataMore}>+{orders.length - 8} more orders</p>
              )}
            </div>
          </div>
        )}

        {dataLoading && <p className={styles.loading}>Loading data...</p>}

        {!dataLoading && businesses.length === 0 && shops.length === 0 && orders.length === 0 && lastItem.level >= 2 && (
          <p className={styles.noData}>No data at this level</p>
        )}

        <button
          className={styles.resetButton}
          onClick={handleResetHierarchy}
        >
          Reset to Platform Root
        </button>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={t('Locations')}
        description={t('Manage geographic locations and delivery coverage')}
        actions={
          <Button onClick={() => navigate('/locations/create')} variant="primary">
            {t('Add Location')}
          </Button>
        }
      />

      {/* TABS */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === 'hierarchy' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('hierarchy')}
        >
          🌍 Platform Hierarchy
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'list' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('list')}
        >
          📋 Locations List
        </button>
      </div>

      {/* HIERARCHY TAB */}
      {activeTab === 'hierarchy' && (
        <div>
          {hierarchyError && (
            <ErrorState message={hierarchyError} onRetry={loadHierarchy} />
          )}

          <div className={styles.breadcrumbBar}>
            <div className={styles.breadcrumb}>{renderBreadcrumb()}</div>
          </div>

          <div className={styles.explorerContainer}>
            {/* LEFT PANEL: TREE */}
            <div className={styles.treePanel}>
              <h3>Hierarchy Tree</h3>
              {hierarchyLoading ? (
                <p>{t('Loading hierarchy...')}</p>
              ) : hierarchyTree.length > 0 ? (
                <div className={styles.tree}>
                  {hierarchyTree.map((region) => renderNode(region, 0))}
                </div>
              ) : (
                <p>{t('No hierarchy data available')}</p>
              )}
            </div>

            {/* RIGHT PANEL: DETAILS */}
            <div className={styles.rightPanel}>
              {renderDetailsPanel()}
            </div>
          </div>
        </div>
      )}

      {/* LIST TAB */}
      {activeTab === 'list' && (
        <div className="mt-4">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <SelectField
                aria-label={t('Type')}
                value={type}
                options={locationTypes}
                onChange={(event) => setType(event.target.value)}
                className="h-9 w-40"
              />
              <SelectField
                aria-label={t('Status')}
                value={isActive}
                options={activeOptions}
                onChange={(event) => setIsActive(event.target.value)}
                className="h-9 w-40"
              />
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t('Search locations')}
                aria-label={t('Search')}
              />
            </div>

            {error ? (
              <ErrorState message={error} onRetry={refetch} />
            ) : (
              <>
                <DataTable<Location>
                  columns={columns}
                  rows={data?.items ?? []}
                  rowKey={(row) => row.id}
                  loading={loading}
                  emptyTitle={t('No locations found')}
                  onRowClick={(row) => { if (row.id) navigate(`/locations/${row.id}`); }}
                />
                <Pagination
                  className="mt-4"
                  page={page}
                  totalPages={data?.totalPages ?? 0}
                  total={data?.total}
                  onPageChange={setPage}
                />
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/TextField';
import { Spinner } from '@/components/common/Spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { LocationTree } from '@/components/locations/LocationTree';
import { LocationForm } from '@/components/locations/LocationForm';
import {
  locationsService,
  type LocationTreeNode,
} from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';

const ROOT_TYPES = [
  { label: 'All', value: '' },
  { label: 'Country', value: 'country' },
  { label: 'Region', value: 'region' },
  { label: 'City', value: 'city' },
  { label: 'Rural', value: 'rural' },
];

export default function LocationsPage() {
  const {
    data: tree,
    loading,
    error,
    refetch,
  } = useAsync(() => locationsService.getHierarchy(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateRoot, setShowCreateRoot] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function filterTree(nodes: LocationTreeNode[]): LocationTreeNode[] {
    return nodes
      .filter((node) => {
        const matchesType = !typeFilter || node.type === typeFilter;
        const matchesSearch =
          !searchQuery ||
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (node.code &&
            node.code.toLowerCase().includes(searchQuery.toLowerCase()));
        const childMatch =
          node.children && filterTree(node.children).length > 0;
        return (matchesType && matchesSearch) || childMatch;
      })
      .map((node) => ({
        ...node,
        children: node.children ? filterTree(node.children) : [],
      }));
  }

  const filteredTree = tree ? filterTree(tree) : [];

  function countAll(nodes: LocationTreeNode[]): number {
    return nodes.reduce((sum, n) => sum + 1 + countAll(n.children), 0);
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Manage the official geographic location hierarchy used across the platform."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refetch}>
              Refresh
            </Button>
            <Button onClick={() => setShowCreateRoot(true)}>
              Add Root Location
            </Button>
          </div>
        }
      />

      {/* Summary stats */}
      {tree && (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="card p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Total Locations
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {countAll(tree)}
            </p>
          </div>
          <div className="card p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Root Locations
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {tree.length}
            </p>
          </div>
          <div className="card p-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Region Types
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {tree.map((n) => (
                <span
                  key={n._id}
                  className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                >
                  {n.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <Card className="p-4">
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <TextField
            label=""
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-10 rounded-md border border-dark-border bg-white px-3 text-sm text-gray-900 focus:border-primary-dark focus:ring-1 focus:ring-primary-dark dark:border-dark-600 dark:bg-dark-900 dark:text-white"
          >
            {ROOT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tree */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <p className="font-medium">Failed to load locations</p>
            <p className="mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={refetch}
            >
              Retry
            </Button>
          </div>
        ) : filteredTree.length === 0 ? (
          <EmptyState
            title="No locations found"
            description={
              searchQuery || typeFilter
                ? 'No locations match your filters.'
                : 'Get started by creating the first location in the hierarchy.'
            }
            action={
              !searchQuery && !typeFilter ? (
                <Button onClick={() => setShowCreateRoot(true)}>
                  Add Root Location
                </Button>
              ) : undefined
            }
          />
        ) : (
          <LocationTree
            nodes={filteredTree}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        )}
      </Card>

      {/* Create root location modal */}
      <Modal
        open={showCreateRoot}
        onClose={() => setShowCreateRoot(false)}
        title="Create Root Location"
      >
        <LocationForm
          onSuccess={() => {
            setShowCreateRoot(false);
            refetch();
          }}
          onCancel={() => setShowCreateRoot(false)}
        />
      </Modal>
    </div>
  );
}

/**
 * AdvancedReporting — Saved scopes, comparisons, growth tracking.
 *
 * Features:
 * - Save hierarchy scopes as filters
 * - Compare two scopes side-by-side
 * - Growth tracking per hierarchy level
 * - Export reports as CSV/PDF
 * - Scheduled reports
 */

import { useState } from 'react';
import { useHierarchy } from '@/hooks/useHierarchy';
import { buildHierarchyScopeLabel, getSelectedLevelName } from '@/utils/hierarchyQueryBuilder';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Tabs } from '@/components/common/Tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faDownload, faBars } from '@fortawesome/free-solid-svg-icons';

interface SavedScope {
  id: string;
  name: string;
  scope: string;
  createdAt: string;
}

export function AdvancedReporting() {
  const { selection } = useHierarchy();
  const scopeLabel = buildHierarchyScopeLabel(selection);
  const levelName = getSelectedLevelName(selection);

  const [activeTab, setActiveTab] = useState<'saved' | 'compare' | 'growth' | 'export'>('saved');
  const [savedScopes, setSavedScopes] = useState<SavedScope[]>([]);
  const [scopeName, setScopeName] = useState('');
  const [compareMode, setCompareMode] = useState<'region' | 'city' | 'sector'>('sector');

  const handleSaveScope = () => {
    if (scopeName.trim()) {
      setSavedScopes([
        ...savedScopes,
        {
          id: `scope-${Date.now()}`,
          name: scopeName,
          scope: scopeLabel,
          createdAt: new Date().toLocaleDateString(),
        },
      ]);
      setScopeName('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Reporting"
        subtitle="Analyze, compare, and track growth by hierarchy"
      />

      {/* Tabs */}
      <Tabs
        tabs={[
          { label: 'Saved Scopes', value: 'saved' },
          { label: 'Compare', value: 'compare' },
          { label: 'Growth Tracking', value: 'growth' },
          { label: 'Export', value: 'export' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Saved Scopes Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {/* Save current scope */}
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Save Current Scope
            </h3>
            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              Current: {scopeLabel}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={scopeName}
                onChange={(e) => setScopeName(e.target.value)}
                placeholder="e.g., 'Addis Food Sector'"
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm dark:border-dark-600 dark:bg-dark-800"
              />
              <Button
                variant="primary"
                onClick={handleSaveScope}
                disabled={!scopeName.trim()}
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                Save
              </Button>
            </div>
          </Card>

          {/* Saved scopes list */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Saved Scopes ({savedScopes.length})
            </h3>
            {savedScopes.length > 0 ? (
              <div className="space-y-2">
                {savedScopes.map((scope) => (
                  <Card key={scope.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {scope.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {scope.scope} · Saved {scope.createdAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Load
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        Delete
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="rounded bg-gray-50 p-4 text-sm text-gray-600 dark:bg-dark-800 dark:text-gray-400">
                No saved scopes yet. Save your current scope to create one.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Compare by {compareMode}
            </h3>

            {/* Comparison mode selector */}
            <div className="mb-4 flex gap-2">
              {(['region', 'city', 'sector'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={compareMode === mode ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setCompareMode(mode)}
                >
                  By {mode}
                </Button>
              ))}
            </div>

            {/* Comparison table placeholder */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-dark-700">
                    <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                      {compareMode}
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                      Orders
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                      Businesses
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                      Shops
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-dark-700">
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      [Sample Data]
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                      1,234
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                      45
                    </td>
                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                      120
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Growth Tracking Tab */}
      {activeTab === 'growth' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Growth Tracking
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Track growth metrics across your hierarchy levels
            </p>

            <div className="space-y-3">
              <div className="flex justify-between rounded bg-blue-50 p-3 dark:bg-blue-900/20">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  30-day Order Growth
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  +12.5%
                </span>
              </div>

              <div className="flex justify-between rounded bg-green-50 p-3 dark:bg-green-900/20">
                <span className="text-sm font-medium text-green-900 dark:text-green-300">
                  30-day Revenue Growth
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  +8.3%
                </span>
              </div>

              <div className="flex justify-between rounded bg-amber-50 p-3 dark:bg-amber-900/20">
                <span className="text-sm font-medium text-amber-900 dark:text-amber-300">
                  Business Growth (new approvals)
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  +3 businesses
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Export Report
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Export data for: {scopeLabel}
            </p>

            <div className="space-y-2">
              <Button variant="primary" className="w-full">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export as CSV
              </Button>
              <Button variant="ghost" className="w-full">
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Export as PDF
              </Button>
              <Button variant="ghost" className="w-full">
                <FontAwesomeIcon icon={faBars} className="mr-2" />
                Schedule Daily Report
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

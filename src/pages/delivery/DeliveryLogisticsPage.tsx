// Delivery & Logistics Overview — the module dashboard.

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { OverviewTab } from './tabs/OverviewTab';

/**
 * Delivery & Logistics -> Overview.
 *
 * A control centre, not a second management page: it summarises the current
 * state, flags what needs attention and links to the working views (Deliveries,
 * Requests, Locations, Providers). It owns no status editing, so nothing here
 * is duplicated from those pages.
 *
 * The dashboard body lives in OverviewTab; this page only drives the
 * Refresh / auto-refresh clock and passes it down as `refreshKey`.
 */
export function DeliveryLogisticsPage() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
      setLastUpdated(new Date().toLocaleTimeString());
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  return (
    <div>
      <PageHeader
        title="Delivery & Logistics"
        description="Control centre — delivery status, exceptions and shortcuts to the pages that manage them."
        actions={
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? 'primary' : 'outline'}
              onClick={handleToggleAutoRefresh}
              size="sm"
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        }
      />

      {lastUpdated && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Last updated: {lastUpdated}
        </p>
      )}

      <OverviewTab refreshKey={refreshKey} />
    </div>
  );
}

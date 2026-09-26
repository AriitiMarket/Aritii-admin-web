// Main Delivery & Logistics Page with Tab Navigation

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { PageLoader } from '@/components/common/PageLoader';
import { Button } from '@/components/common/Button';
import { Tabs, TabContent } from '@/components/common/Tabs';
import { OverviewTab } from './tabs/OverviewTab';
import { RidersTab } from './tabs/RidersTab';
import { AssignmentsTab } from './tabs/AssignmentsTab';
import { ActiveDeliveriesTab } from './tabs/ActiveDeliveriesTab';
import { useDeliveryStats } from './hooks/useDeliveryStats';

export function DeliveryLogisticsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const { stats, loading: statsLoading, error: statsError, refetch: refetchOverview } = useDeliveryStats();

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetchOverview();
      setLastUpdated(new Date().toLocaleTimeString());
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [autoRefresh, refetchOverview]);

  const handleRefresh = () => {
    refetchOverview();
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleNavigateToAssignments = () => {
    setActiveTab('assignments');
  };

  if (statsLoading && !stats) return <PageLoader label="Loading" />;

  return (
    <div>
      <PageHeader
        title="Delivery & Logistics"
        description="Manage delivery operations, riders, and assignments"
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

      {statsError ? (
        <ErrorState message={statsError} onRetry={refetchOverview} />
      ) : (
        <>
          {lastUpdated && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Last updated: {lastUpdated}
            </p>
          )}

          <Tabs
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'riders', label: 'Riders & Actors' },
              { value: 'assignments', label: 'Assignments' },
              { value: 'active', label: 'Active Deliveries' },
            ]}
          />

          <TabContent>
            {activeTab === 'overview' && <OverviewTab onNavigateToAssignments={handleNavigateToAssignments} />}
            {activeTab === 'riders' && <RidersTab />}
            {activeTab === 'assignments' && <AssignmentsTab />}
            {activeTab === 'active' && <ActiveDeliveriesTab />}
          </TabContent>
        </>
      )}
    </div>
  );
}
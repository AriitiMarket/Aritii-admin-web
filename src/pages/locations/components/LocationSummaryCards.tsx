// Summary cards component for Locations page

import { Card } from '@/components/common/Card';
import { formatNumber } from '@/utils/format';
import type { LocationStats } from '../types';

interface LocationSummaryCardsProps {
  /** Null until the stats request resolves — every card shows a dash meanwhile. */
  stats: LocationStats | null;
  loading?: boolean;
}

export function LocationSummaryCards({ stats, loading }: LocationSummaryCardsProps) {
  const value = (n: number | undefined) => (loading || n === undefined ? '—' : formatNumber(n));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card className="flex flex-col items-center gap-2 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Total Locations</p>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {value(stats?.totalLocations)}
        </p>
      </Card>
      <Card className="flex flex-col items-center gap-2 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Active Locations</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
          {value(stats?.activeLocations)}
        </p>
      </Card>
      <Card className="flex flex-col items-center gap-2 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Serviceable</p>
        <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
          {value(stats?.serviceableLocations)}
        </p>
      </Card>
      <Card className="flex flex-col items-center gap-2 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Hubs</p>
        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {value(stats?.hubs)}
        </p>
      </Card>
      <Card className="flex flex-col items-center gap-2 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Expansion</p>
        <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {value(stats?.pendingExpansion)}
        </p>
      </Card>
    </div>
  );
}
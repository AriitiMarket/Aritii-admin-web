import { useMemo } from 'react';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import type { Store, Location } from '@/types';

interface LocationBreakdownCardProps {
  stores: Store[];
  locations: Location[];
}

export function LocationBreakdownCard({ stores, locations }: LocationBreakdownCardProps) {
  const { t } = useLocalization();

  const breakdown = useMemo(() => {
    const locationMap = new Map<string, { name: string; count: number; percentage: number }>();

    stores.forEach((store) => {
      const locationId = store.locationId || 'unassigned';
      const location = locations.find((loc) => loc.id === locationId);
      const locationName = location?.name || `Location ${locationId.substring(0, 8)}`;

      if (!locationMap.has(locationId)) {
        locationMap.set(locationId, { name: locationName, count: 0, percentage: 0 });
      }

      const entry = locationMap.get(locationId)!;
      entry.count += 1;
    });

    // Calculate percentages
    const total = stores.length;
    locationMap.forEach((entry) => {
      entry.percentage = (entry.count / total) * 100;
    });

    return Array.from(locationMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 locations
  }, [stores, locations]);

  const topLocation = breakdown[0];
  const topPercentage = topLocation ? topLocation.percentage : 0;

  return (
    <Card>
      <div className="mb-4">
        <h3 className="heading-5 dark:text-white">{t('Shop Distribution by Location')}</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('Total shops')}: {stores.length}
        </p>
      </div>

      <div className="space-y-3">
        {breakdown.map((item) => (
          <div key={item.name}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
              <span className="text-gray-600 dark:text-gray-400">
                {item.count} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {breakdown.length === 0 && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          {t('No shop data available')}
        </div>
      )}
    </Card>
  );
}

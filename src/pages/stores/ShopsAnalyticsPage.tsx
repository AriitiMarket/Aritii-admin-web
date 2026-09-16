import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SelectField } from '@/components/forms/SelectField';

interface LocationMetrics {
  name: string;
  activeShops: number;
  suspendedShops: number;
  pendingShops: number;
  totalGMV: number;
  avgRating: number;
  topShops: Array<{ name: string; gmv: number; rating: number }>;
}

export function ShopsAnalyticsPage() {
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('30'); // days
  const [groupBy, setGroupBy] = useState('location'); // location or sector

  // Mock data
  const mockMetrics: LocationMetrics[] = [
    {
      name: 'Addis Ababa',
      activeShops: 1250,
      suspendedShops: 45,
      pendingShops: 23,
      totalGMV: 125400000,
      avgRating: 4.5,
      topShops: [
        { name: 'Supreme Electronics', gmv: 2500000, rating: 4.8 },
        { name: 'Fashion World', gmv: 1800000, rating: 4.6 },
        { name: 'Food Paradise', gmv: 1500000, rating: 4.4 },
      ],
    },
    {
      name: 'Dire Dawa',
      activeShops: 420,
      suspendedShops: 12,
      pendingShops: 8,
      totalGMV: 28500000,
      avgRating: 4.3,
      topShops: [
        { name: 'City Mall', gmv: 850000, rating: 4.7 },
        { name: 'Local Store', gmv: 620000, rating: 4.2 },
        { name: 'Quick Mart', gmv: 450000, rating: 4.1 },
      ],
    },
    {
      name: 'Hawassa',
      activeShops: 280,
      suspendedShops: 8,
      pendingShops: 5,
      totalGMV: 15200000,
      avgRating: 4.2,
      topShops: [
        { name: 'Market Plus', gmv: 450000, rating: 4.5 },
        { name: 'Trading Hub', gmv: 380000, rating: 4.0 },
        { name: 'Tech Store', gmv: 320000, rating: 4.3 },
      ],
    },
  ];

  const StatCard = ({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) => (
    <Card className="text-center">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtext && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtext}</p>}
    </Card>
  );

  const totalMetrics = mockMetrics.reduce(
    (acc, m) => ({
      activeShops: acc.activeShops + m.activeShops,
      suspendedShops: acc.suspendedShops + m.suspendedShops,
      pendingShops: acc.pendingShops + m.pendingShops,
      totalGMV: acc.totalGMV + m.totalGMV,
      avgRating: (acc.avgRating + m.avgRating) / 2,
    }),
    { activeShops: 0, suspendedShops: 0, pendingShops: 0, totalGMV: 0, avgRating: 0 }
  );

  return (
    <div>
      <PageHeader
        title={t('Shops Analytics')}
        description={t('View shop metrics and performance by location and sector')}
        actions={
          <div className="flex gap-2">
            <SelectField
              value={timeRange}
              options={[
                { value: '7', label: 'Last 7 days' },
                { value: '30', label: 'Last 30 days' },
                { value: '90', label: 'Last 90 days' },
                { value: '365', label: 'Last year' },
              ]}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-40"
            />
            <SelectField
              value={groupBy}
              options={[
                { value: 'location', label: 'Group by Location' },
                { value: 'sector', label: 'Group by Sector' },
              ]}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-40"
            />
            <Button onClick={() => navigate('/stores')} variant="outline">
              {t('Back')}
            </Button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
        <StatCard label="Active Shops" value={totalMetrics.activeShops.toLocaleString()} />
        <StatCard label="Pending Approval" value={totalMetrics.pendingShops} />
        <StatCard label="Suspended" value={totalMetrics.suspendedShops} />
        <StatCard
          label="Total GMV"
          value={`${(totalMetrics.totalGMV / 1000000).toFixed(1)}M`}
          subtext="ETB"
        />
      </div>

      {/* By Location/Sector */}
      <div className="space-y-4">
        {mockMetrics.map((metric) => (
          <Card key={metric.name}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('Location')}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{metric.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('Active Shops')}</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {metric.activeShops}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('Pending')}</p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {metric.pendingShops}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('Total GMV')}</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {(metric.totalGMV / 1000000).toFixed(1)}M
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('Avg Rating')}</p>
                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {metric.avgRating.toFixed(1)} ★
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('Top Shops')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {metric.topShops.map((shop, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">{shop.name}</p>
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                      <span>{(shop.gmv / 1000000).toFixed(1)}M ETB</span>
                      <span>{shop.rating} ★</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

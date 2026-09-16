import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { locationsService } from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { TextField } from '@/components/forms/TextField';
import { DataTable, type Column } from '@/components/tables/DataTable';

interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  estimatedDeliveryTime: number; // minutes
  isActive: boolean;
}

export function LocationDeliveryZonesPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const { t } = useLocalization();
  const navigate = useNavigate();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZone, setNewZone] = useState<Partial<DeliveryZone>>({
    name: '',
    deliveryFee: 0,
    estimatedDeliveryTime: 30,
    isActive: true,
  });
  const [showForm, setShowForm] = useState(false);

  // Guard against a missing/stale id (e.g. a bookmarked `/locations/undefined`):
  // never issue `GET /delivery/location/undefined`.
  const hasValidId = Boolean(locationId && locationId !== 'undefined');
  const { data: location, loading, error, refetch } = useAsync(
    () => (hasValidId
      ? locationsService.get(locationId as string)
      : Promise.reject(new Error('Missing location identifier'))),
    [locationId]
  );


  const handleAddZone = () => {
    if (newZone.name && newZone.deliveryFee !== undefined && newZone.estimatedDeliveryTime !== undefined) {
      const zone: DeliveryZone = {
        id: Math.random().toString(36).substr(2, 9),
        name: newZone.name,
        deliveryFee: newZone.deliveryFee,
        estimatedDeliveryTime: newZone.estimatedDeliveryTime,
        isActive: newZone.isActive ?? true,
      };
      setZones([...zones, zone]);
      setNewZone({ name: '', deliveryFee: 0, estimatedDeliveryTime: 30, isActive: true });
      setShowForm(false);
    }
  };

  const handleDeleteZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !location) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  const columns: Column<DeliveryZone>[] = [
    { key: 'name', header: t('Zone Name'), accessor: (row) => row.name },
    {
      key: 'deliveryFee',
      header: t('Delivery Fee'),
      render: (row) => `${row.deliveryFee} ETB`,
    },
    {
      key: 'estimatedDeliveryTime',
      header: t('Estimated Time'),
      render: (row) => `${row.estimatedDeliveryTime} min`,
    },
    {
      key: 'isActive',
      header: t('Status'),
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            row.isActive
              ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100'
              : 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-100'
          }`}
        >
          {row.isActive ? t('Active') : t('Inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      render: (row) => (
        <Button
          onClick={() => handleDeleteZone(row.id)}
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          {t('Delete')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${location.name} - Delivery Zones`}
        description={t('Manage delivery zones and fees for this location')}
        actions={
          <Button onClick={() => navigate('/locations')} variant="outline">
            {t('Back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Delivery Zones')}</p>
          {zones.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('No delivery zones configured')}
            </div>
          ) : (
            <DataTable<DeliveryZone>
              columns={columns}
              rows={zones}
              rowKey={(row) => row.id}
              loading={false}
              emptyTitle={t('No zones')}
            />
          )}
        </Card>

        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Add Zone')}</p>
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} variant="primary" className="w-full">
              {t('New Delivery Zone')}
            </Button>
          ) : (
            <form className="space-y-3">
              <TextField
                label={t('Zone Name')}
                value={newZone.name || ''}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="e.g., Downtown Area"
              />
              <TextField
                label={t('Delivery Fee (ETB)')}
                type="number"
                value={newZone.deliveryFee || ''}
                onChange={(e) => setNewZone({ ...newZone, deliveryFee: Number(e.target.value) })}
              />
              <TextField
                label={t('Estimated Delivery Time (minutes)')}
                type="number"
                value={newZone.estimatedDeliveryTime || ''}
                onChange={(e) => setNewZone({ ...newZone, estimatedDeliveryTime: Number(e.target.value) })}
              />
              <div className="flex gap-2">
                <Button type="button" onClick={handleAddZone} variant="primary" size="sm">
                  {t('Add')}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  size="sm"
                >
                  {t('Cancel')}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

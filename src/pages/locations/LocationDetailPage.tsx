import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { locationsService } from '@/services/locations.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';

export function LocationDetailPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const { t } = useLocalization();
  const [isEditing, setIsEditing] = useState(false);

  // Guard against a missing/stale id (e.g. a bookmarked `/locations/undefined`):
  // never issue `GET /delivery/location/undefined`.
  const hasValidId = Boolean(locationId && locationId !== 'undefined');
  const { data: location, loading, error, refetch } = useAsync(
    () => (hasValidId
      ? locationsService.get(locationId as string)
      : Promise.reject(new Error('Missing location identifier'))),
    [locationId]
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !location) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  const handleToggleActive = async () => {
    try {
      await locationsService.setActive(location.id, !location.isActive);
      refetch();
    } catch (err) {
      console.error('Failed to toggle active status:', err);
    }
  };

  return (
    <div>
      <PageHeader
        title={location.name}
        description={`${location.type} • ${location.code || 'No code'}`}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleToggleActive}
              variant={location.isActive ? 'outline' : 'primary'}
            >
              {location.isActive ? t('Deactivate') : t('Activate')}
            </Button>
            <Button onClick={() => setIsEditing(!isEditing)} variant="outline">
              {isEditing ? t('Cancel') : t('Edit')}
            </Button>
            <Link to="/locations">
              <Button variant="outline">{t('Back')}</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Type')}</p>
              <p className="heading-5 dark:text-white">{location.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Status')}</p>
              <StatusBadge label={location.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('Code')}</p>
              <p className="text-gray-800 dark:text-gray-100">
                {location.code || '—'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Details')}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <dt className="text-gray-500 dark:text-gray-400">{t('Name')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{location.name}</dd>
            
            <dt className="text-gray-500 dark:text-gray-400">{t('Description')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {location.description || '—'}
            </dd>
            
            <dt className="text-gray-500 dark:text-gray-400">{t('Parent Location')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {location.parentId ? (
                <Link to={`/locations/${location.parentId}`} className="text-blue-600 hover:underline">
                  View Parent
                </Link>
              ) : (
                '—'
              )}
            </dd>
            
            <dt className="text-gray-500 dark:text-gray-400">{t('Created')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatDate(location.createdAt)}
            </dd>
            
            <dt className="text-gray-500 dark:text-gray-400">{t('Updated')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatDate(location.updatedAt)}
            </dd>
          </dl>
        </Card>

        {location.metadata && Object.keys(location.metadata).length > 0 && (
          <Card className="lg:col-span-3">
            <p className="card-h1 mb-4 dark:text-white">{t('Metadata')}</p>
            <pre className="text-xs text-gray-800 dark:text-gray-100 overflow-auto">
              {JSON.stringify(location.metadata, null, 2)}
            </pre>
          </Card>
        )}
      </div>
    </div>
  );
}

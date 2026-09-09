import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usersService } from '@/services/users.service';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);

  const { data: user, loading, error, refetch } = useAsync(
    () => usersService.get(userId ?? ''),
    [userId]
  );

  const toggleActive = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      await usersService.update(user.id, {
        isActive: !user.isActive,
      });
      showToast({
        type: 'success',
        title: t('Success'),
        message: t('Status Changed Successfully'),
      });
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : t('Something went wrong - Please try again'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !user) return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;

  return (
    <div>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Link to="/users">
            <Button variant="outline">{t('Back to users')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex flex-col items-center gap-3 text-center">
          <Avatar src={undefined} name={user.name} size="lg" />
          <div>
            <p className="heading-5 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <StatusBadge label={user.status} />
          <Button
            variant={user.isActive ? 'danger' : 'secondary'}
            loading={actionLoading}
            onClick={toggleActive}
          >
            {user.isActive ? t('Block user') : t('Activate user')}
          </Button>
        </Card>

        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Details')}</p>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <dt className="text-gray-500 dark:text-gray-400">{t('Phone')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{user.phone ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('User type')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{user.userType}</dd>
            <dt className="text-gray-500 dark:text-gray-400">{t('Registration')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">{user.registrationMethod ?? '—'}</dd>
            <dt className="text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="text-gray-800 dark:text-gray-100">{formatDate(user.createdAt)}</dd>
            <dt className="text-gray-500 dark:text-gray-400">Last login</dt>
            <dd className="text-gray-800 dark:text-gray-100">{formatDate(user.lastLoginAt)}</dd>
            <dt className="text-gray-500 dark:text-gray-400">Sectors</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {user.sectors.length > 0 ? user.sectors.join(', ') : 'All'}
            </dd>
          </dl>
        </Card>
      </div>
    </div>
  );
}
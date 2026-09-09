import { Link, useParams } from 'react-router-dom';
import { adminsService } from '@/services/admins.service';
import { useAsync } from '@/hooks/useAsync';
import { useLocalization } from '@/i18n/I18nProvider';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoader } from '@/components/common/PageLoader';
import { ErrorState } from '@/components/common/ErrorState';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';

export function AdminDetailPage() {
  const { adminId } = useParams<{ adminId: string }>();
  const { t } = useLocalization();
  const { data: admin, loading, error, refetch } = useAsync(
    () => adminsService.get(adminId ?? ''),
    [adminId]
  );

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !admin) {
    return <ErrorState message={error ?? 'Not found'} onRetry={refetch} />;
  }

  return (
    <div>
      <PageHeader
        title={admin.name}
        description={admin.email}
        actions={
          <Link to="/admins">
            <Button variant="outline">{t('Back to admins')}</Button>
          </Link>
        }
      />

      <Card className="mx-auto max-w-md flex flex-col items-center gap-3 text-center">
        <Avatar name={admin.name} size="lg" />
        <p className="heading-5 dark:text-white">{admin.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</p>
        <div className="flex items-center gap-2">
          <StatusBadge label={admin.status} />
          <StatusBadge label={admin.role} variant="info" />
        </div>
        <dl className="w-full border-t border-gray-100 pt-3 dark:border-dark-600">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">{t('Sectors')}</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {admin.sectors.length === 3 ? 'All' : `${admin.sectors.length} sectors`}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="text-gray-800 dark:text-gray-100">
              {formatDate(admin.createdAt)}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
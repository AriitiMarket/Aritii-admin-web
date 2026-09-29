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

const USER_ROLES: Record<string, string> = {
  BUYER: 'Buyer',
  SELLER: 'Seller',
  AGENT: 'Agent',
  ADMIN: 'Admin',
};

const SELLER_STATUS_LABELS: Record<string, string> = {
  INACTIVE: 'Not a Seller',
  PENDING: 'Pending Approval',
  ACTIVE: 'Active Seller',
  REJECTED: 'Application Rejected',
};

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useLocalization();
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    action: 'suspend' | 'reactivate' | 'ban' | 'unban';
    reason?: string;
  } | null>(null);

  const { data: user, loading, error, refetch } = useAsync(
    () => usersService.get(userId ?? ''),
    [userId]
  );

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'suspended' | 'banned') => {
    if (!user) return;
    setActionLoading(true);
    try {
      await usersService.update(user.id, { status: newStatus });
      showToast({
        type: 'success',
        title: t('Success'),
        message: `User ${newStatus === 'active' ? 'reactivated' : newStatus === 'suspended' ? 'suspended' : 'banned'} successfully`,
      });
      refetch();
      setConfirmDialog(null);
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : t('Failed to update user status'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <PageLoader label={t('Loading')} />;
  if (error || !user) return <ErrorState message={error ?? 'User not found'} onRetry={refetch} />;

  const canSuspend = user.status === 'active';
  const canReactivate = user.status === 'inactive' || user.status === 'suspended';
  const canBan = user.status !== 'banned';
  const canUnban = user.status === 'banned';

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <Link to="/users">
            <Button variant="outline">{t('Back')}</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="flex flex-col items-center gap-4 text-center lg:col-span-1">
          <Avatar name={user.name} size="lg" />
          <div>
            <p className="heading-5 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <StatusBadge label={user.status} />
          
          {/* Status Actions */}
          <div className="w-full space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            {canSuspend && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => setConfirmDialog({ action: 'suspend' })}
              >
                {t('Suspend')}
              </Button>
            )}
            {canReactivate && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => handleStatusChange('active')}
              >
                {t('Reactivate')}
              </Button>
            )}
            {canBan && (
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => setConfirmDialog({ action: 'ban' })}
              >
                {t('Ban')}
              </Button>
            )}
            {canUnban && (
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => handleStatusChange('active')}
              >
                {t('Unban')}
              </Button>
            )}
          </div>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <p className="card-h1 mb-4 dark:text-white">{t('Account Details')}</p>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                {t('Email')}
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">{user.email}</dd>
            </div>
            
            {user.phoneNumber && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                  {t('Phone')}
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">{user.phoneNumber}</dd>
              </div>
            )}
            
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                {t('Role')}
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {USER_ROLES[user.role] || user.role}
              </dd>
            </div>
            
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                {t('Status')}
              </dt>
              <dd className="text-gray-900 dark:text-gray-100 capitalize">
                {user.status}
              </dd>
            </div>
            
            {user.isVerified !== undefined && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                  {t('Verified')}
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {user.isVerified ? 'Yes' : 'No'}
                </dd>
              </div>
            )}
            
            {user.role === 'SELLER' && user.sellerStatus && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                  {t('Seller Status')}
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {SELLER_STATUS_LABELS[user.sellerStatus] || user.sellerStatus}
                </dd>
              </div>
            )}
            
            <div>
              <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                {t('Member Since')}
              </dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {formatDate(user.createdAt)}
              </dd>
            </div>
            
            {user.updatedAt && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                  {t('Last Updated')}
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {formatDate(user.updatedAt)}
                </dd>
              </div>
            )}
            
            {user.lastLoginAt && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                  {t('Last Login')}
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {formatDate(user.lastLoginAt)}
                </dd>
              </div>
            )}
            
            {user.lastActivityAt && (
              <div>
                <dt className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
                  {t('Last Activity')}
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {formatDate(user.lastActivityAt)}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Seller Shops - if user is a seller */}
      {user.role === 'SELLER' && user.shopId && (
        <Card>
          <p className="card-h1 mb-4 dark:text-white">{t('Shop Information')}</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('Shop ID')}: <span className="font-mono text-gray-900 dark:text-white">{user.shopId}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This seller has a linked shop. Navigate to the Shops module for full shop management.
            </p>
          </div>
        </Card>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="max-w-md w-full mx-4">
            <div className="mb-4">
              <h3 className="heading-5 dark:text-white mb-2">
                {confirmDialog.action === 'suspend' && t('Suspend User?')}
                {confirmDialog.action === 'ban' && t('Ban User?')}
                {confirmDialog.action === 'reactivate' && t('Reactivate User?')}
                {confirmDialog.action === 'unban' && t('Unban User?')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {confirmDialog.action === 'suspend' && 
                  'This user will be unable to access their account. They can be reactivated later.'}
                {confirmDialog.action === 'ban' && 
                  'This user will be permanently banned. This action is restrictive and should only be used for violations.'}
                {confirmDialog.action === 'reactivate' && 
                  'This user will regain access to their account.'}
                {confirmDialog.action === 'unban' && 
                  'This user will be allowed to access the platform again.'}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDialog(null)}
              >
                {t('Cancel')}
              </Button>
              <Button
                variant={confirmDialog.action === 'ban' || confirmDialog.action === 'suspend' ? 'danger' : 'secondary'}
                className="flex-1"
                loading={actionLoading}
                onClick={() => {
                  if (confirmDialog.action === 'suspend') handleStatusChange('suspended');
                  if (confirmDialog.action === 'ban') handleStatusChange('banned');
                  if (confirmDialog.action === 'reactivate') handleStatusChange('active');
                  if (confirmDialog.action === 'unban') handleStatusChange('active');
                }}
              >
                {confirmDialog.action === 'suspend' && t('Suspend')}
                {confirmDialog.action === 'ban' && t('Ban')}
                {confirmDialog.action === 'reactivate' && t('Reactivate')}
                {confirmDialog.action === 'unban' && t('Unban')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
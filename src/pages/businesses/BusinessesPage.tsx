import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheckCircle, faTimesCircle, faChartLine } from '@fortawesome/free-solid-svg-icons';
import { businessesService, type SellerApplication } from '@/services/businesses.service';
import { useAsync } from '@/hooks/useAsync';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { useLocalization } from '@/i18n/I18nProvider';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { ErrorState } from '@/components/common/ErrorState';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, type Column } from '@/components/tables/DataTable';
import { formatDate, formatNumber } from '@/utils/format';

interface VerificationStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  documentsVerified: boolean;
}

interface RiskScore {
  score: number; // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
}

// Export applications to CSV
const exportApplicationsToCSV = (apps: SellerApplication[]) => {
  const headers = ['Business Name', 'Owner', 'Email', 'Location', 'Status', 'Risk Level', 'Email Verified', 'Submitted Date'];
  const rows = apps.map(app => [
    app.businessName || '',
    app.ownerName,
    app.ownerEmail,
    app.location?.city || app.location?.region || '',
    app.status,
    calculateRiskScore(app).level,
    getVerificationStatus(app).emailVerified ? 'Yes' : 'No',
    new Date(app.submittedAt || app.createdAt || '').toLocaleDateString(),
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `applications-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Calculate verification status
const getVerificationStatus = (app: SellerApplication): VerificationStatus => {
  return {
    emailVerified: app.ownerEmail ? app.ownerEmail.includes('@') : false,
    phoneVerified: false, // TODO: Add phone field to SellerApplication
    kycVerified: false, // TODO: Add KYC field to SellerApplication
    documentsVerified: false, // TODO: Add documents field to SellerApplication
  };
};

// Calculate risk score based on application details
const calculateRiskScore = (app: SellerApplication): RiskScore => {
  let score = 0;
  const flags: string[] = [];

  // Check for recent submissions (rushed applications)
  if (app.submittedAt) {
    const submittedDate = new Date(app.submittedAt);
    const daysSinceSubmission = (new Date().getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceSubmission < 1) {
      score += 15;
      flags.push('Recently submitted');
    }
  }

  // Check for incomplete business info
  if (!app.businessName || app.businessName.length < 3) {
    score += 20;
    flags.push('Incomplete business name');
  }

  if (!app.businessCategory) {
    score += 10;
    flags.push('Missing category');
  }

  // Check for missing location
  if (!app.location?.city && !app.location?.region) {
    score += 15;
    flags.push('Missing location details');
  }

  // Check for address verification
  if (!app.location?.address) {
    score += 10;
    flags.push('No address provided');
  }

  // Determine risk level
  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (score >= 60) level = 'HIGH';
  else if (score >= 30) level = 'MEDIUM';

  return { score: Math.min(100, score), level, flags };
};

export function BusinessesManagementPage() {
  const { t } = useLocalization();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [showQuickApprovalDialog, setShowQuickApprovalDialog] = useState(false);
  const [quickApprovalApp, setQuickApprovalApp] = useState<SellerApplication | null>(null);
  const [quickApprovalLocation, setQuickApprovalLocation] = useState('');
  const [quickApprovalSector, setQuickApprovalSector] = useState('');
  
  // Hierarchy filtering (new)
  const [hierarchyFilter, setHierarchyFilter] = useState<{ type: string; id: string; name: string } | null>(null);
  const [showHierarchyBreadcrumb, setShowHierarchyBreadcrumb] = useState(false);
  
  const debouncedSearch = useDebounce(search, 300);

  // Fetch all for statistics
  const { data: allAppsData } = useAsync(
    useCallback(
      () => businessesService.listApplications({ page: 1, limit: 1000 }),
      []
    ),
    []
  );

  const { data, loading, error, refetch } = useAsync(
    () => businessesService.listApplications({
      page,
      limit: 10,
      status: statusFilter,
      search: debouncedSearch,
    }),
    [page, statusFilter, debouncedSearch]
  );

  const toggleSelectAll = () => {
    if (selectedApps.size === data?.items?.length) {
      setSelectedApps(new Set());
    } else {
      const allIds = new Set((data?.items ?? []).map(a => a.id));
      setSelectedApps(allIds);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedApps);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedApps(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedApps.size === 0) {
      showToast({
        type: 'warning',
        title: t('Warning'),
        message: 'Please select applications to approve',
      });
      return;
    }

    setBulkActionLoading(true);
    try {
      let approved = 0;
      for (const id of selectedApps) {
        try {
          await businessesService.approveApplication(id);
          approved++;
        } catch (err) {
          console.error(`Failed to approve ${id}:`, err);
        }
      }
      showToast({
        type: 'success',
        title: t('Success'),
        message: `${approved} applications approved`,
      });
      setSelectedApps(new Set());
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: 'Failed to approve applications',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedApps.size === 0) {
      showToast({
        type: 'warning',
        title: t('Warning'),
        message: 'Please select applications to reject',
      });
      return;
    }

    if (!bulkRejectReason.trim()) {
      showToast({
        type: 'warning',
        title: t('Warning'),
        message: 'Please provide a rejection reason',
      });
      return;
    }

    setBulkActionLoading(true);
    try {
      let rejected = 0;
      for (const id of selectedApps) {
        try {
          await businessesService.rejectApplication(id, bulkRejectReason);
          rejected++;
        } catch (err) {
          console.error(`Failed to reject ${id}:`, err);
        }
      }
      showToast({
        type: 'success',
        title: t('Success'),
        message: `${rejected} applications rejected`,
      });
      setSelectedApps(new Set());
      setBulkRejectReason('');
      setShowBulkRejectDialog(false);
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: 'Failed to reject applications',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleQuickApprove = (app: SellerApplication) => {
    setQuickApprovalApp(app);
    setShowQuickApprovalDialog(true);
  };

  const handleConfirmQuickApprove = async () => {
    if (!quickApprovalApp) return;

    setBulkActionLoading(true);
    try {
      await businessesService.approveApplication(quickApprovalApp.id);
      showToast({
        type: 'success',
        title: t('Success'),
        message: `${quickApprovalApp.businessName} approved`,
      });
      setShowQuickApprovalDialog(false);
      setQuickApprovalApp(null);
      refetch();
    } catch (err) {
      showToast({
        type: 'error',
        title: t('Error'),
        message: err instanceof Error ? err.message : 'Failed to approve',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleResetPage = () => setPage(1);

  // Filter applications by risk score
  const filteredByRisk = (data?.items ?? []).filter(app => {
    if (riskFilter === 'ALL') return true;
    const riskScore = calculateRiskScore(app);
    return riskScore.level === riskFilter;
  });

  // Calculate statistics
  const stats = allAppsData?.items ? {
    total: allAppsData.total || 0,
    pending: allAppsData.items.filter((a: SellerApplication) => a.status === 'PENDING_REVIEW').length,
    approved: allAppsData.items.filter((a: SellerApplication) => a.status === 'APPROVED').length,
    rejected: allAppsData.items.filter((a: SellerApplication) => a.status === 'REJECTED').length,
    suspended: allAppsData.items.filter((a: SellerApplication) => a.status === 'SUSPENDED').length,
  } : { total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 };

  const columns: Column<SellerApplication>[] = [
    {
      key: 'select',
      header: '',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedApps.has(row.id)}
          onChange={() => handleToggleSelect(row.id)}
          aria-label={`Select ${row.businessName}`}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      key: 'businessName',
      header: t('Business'),
      render: (row) => {
        const riskScore = calculateRiskScore(row);
        const verification = getVerificationStatus(row);
        return (
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.businessName || 'N/A'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.shopName || ''}</p>
            {/* Verification badges */}
            <div className="flex gap-1 mt-1">
              {verification.emailVerified && (
                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded text-xs">
                  ✓ Email
                </span>
              )}
              {verification.phoneVerified && (
                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded text-xs">
                  ✓ Phone
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'ownerName',
      header: t('Owner'),
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{row.ownerName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{row.ownerEmail}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: t('Location'),
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {row.location?.sector || row.location?.area || row.location?.city || row.location?.region || '—'}
          </span>
          {row.location && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {[row.location?.sector, row.location?.area, row.location?.city, row.location?.region]
                .filter(Boolean)
                .reverse()
                .join(' › ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'risk',
      header: t('Risk'),
      render: (row) => {
        const risk = calculateRiskScore(row);
        const colors = {
          LOW: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
          MEDIUM: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
          HIGH: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
        };
        return (
          <div>
            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colors[risk.level]}`}>
              {risk.level} ({risk.score})
            </span>
            {risk.flags.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {risk.flags[0]}...
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: t('Status'),
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'submittedAt',
      header: t('Submitted'),
      render: (row) => <span className="text-sm">{formatDate(row.submittedAt || row.createdAt)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Businesses & Applications')}
        description={`Manage seller applications — ${formatNumber(stats.total)} total`}
        actions={
          <div className="flex gap-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by business or owner..."
              aria-label={t('Search')}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => exportApplicationsToCSV(allAppsData?.items || [])}
              title={t('Export applications as CSV')}
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              {t('Export')}
            </Button>
          </div>
        }
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Total')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Pending')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Approved')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Rejected')}</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.suspended}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('Suspended')}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((status) => (
          <Card
            key={status}
            className={`p-3 cursor-pointer transition ${
              statusFilter === status
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
            onClick={() => {
              setStatusFilter(status);
              handleResetPage();
            }}
          >
            <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
              {status.replace('_', ' ')}
            </p>
          </Card>
        ))}
      </div>

      {error ? (
        <ErrorState message={String(error)} onRetry={refetch} />
      ) : (
        <>
          <DataTable<SellerApplication>
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id || (row as any)._id || 'unknown'}
            loading={loading}
            emptyTitle={t('No applications found')}
            onRowClick={(row) => navigate(`/businesses/${row.id}`)}
          />
          {(data?.totalPages ?? 0) > 1 && (
            <Pagination
              className="mt-4"
              page={page}
              totalPages={data?.totalPages ?? 0}
              total={data?.total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

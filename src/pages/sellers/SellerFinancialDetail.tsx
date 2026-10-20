/**
 * Seller Financial Detail Page
 * View complete seller wallet information and transaction history
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { walletService } from '@/services/financial.service';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/common/Spinner';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import './SellerFinancialDetail.css';

interface Wallet {
  id: string;
  sellerId: string;
  sellerName: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  commissionPaid: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  reference: string;
  reason?: string;
  balanceAfter: number;
  createdAt: string;
}

const SellerFinancialDetail = () => {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('');
  const [transactionPage, setTransactionPage] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const fetchSellerData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch wallet
      const walletRes = await walletService.getWalletById(sellerId!);
      setWallet(walletRes.data);

      // Fetch transactions
      const txRes = await walletService.getWalletTransactions(sellerId!, {
        limit: 15,
        offset: transactionPage * 15,
        type: transactionFilter || undefined
      });
      setTransactions(txRes.data || []);
      setTotalTransactions(txRes.total || 0);
    } catch (error) {
      console.error('Failed to fetch seller data:', error);
    } finally {
      setLoading(false);
    }
  }, [sellerId, transactionPage, transactionFilter]);

  useEffect(() => {
    if (sellerId) {
      fetchSellerData();
    }
  }, [sellerId, fetchSellerData]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'ORDER_ALLOCATION': '#10b981',
      'PENDING_RELEASE': '#f59e0b',
      'REFUND_CREDITED': '#3b82f6',
      'ADJUSTMENT': '#8b5cf6',
      'PAYOUT_COMPLETED': '#10b981',
      'PAYOUT_REVERSED': '#ef4444'
    };
    return colors[type] || '#6b7280';
  };

  const transactionColumns = [
    {
      key: 'type',
      label: 'Type',
      width: '150px',
      render: (value: string) => (
        <span
          className="transaction-type-badge"
          style={{ backgroundColor: getTransactionTypeColor(value), color: 'white' }}
        >
          {value}
        </span>
      )
    },
    {
      key: 'description',
      label: 'Description',
      width: '200px'
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number) => (
        <span style={{ color: value >= 0 ? '#10b981' : '#ef4444' }}>
          {value >= 0 ? '+' : ''}{formatCurrency(value)} {wallet?.currency}
        </span>
      )
    },
    {
      key: 'balanceAfter',
      label: 'Balance After',
      render: (value: number) => `${formatCurrency(value)} ${wallet?.currency}`
    },
    {
      key: 'reason',
      label: 'Reason',
      width: '200px',
      render: (value?: string) => value || '-'
    },
    {
      key: 'createdAt',
      label: 'Date',
      width: '180px',
      render: (value: string) => formatDate(value)
    }
  ];

  if (loading && !wallet) {
    return (
      <div className="seller-detail-loading">
        <Spinner />
        <p>Loading seller financial details...</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="seller-detail-error">
        <p>Seller wallet not found</p>
      </div>
    );
  }

  return (
    <div className="seller-financial-detail">
      <PageHeader title={`${wallet.sellerName} - Financial Detail`} />

      <div className="wallet-summary">
        <StatCard
          title="Available Balance"
          value={`${formatCurrency(wallet.availableBalance)} ${wallet.currency}`}
          subtitle="Ready for payout"
          variant="success"
        />
        <StatCard
          title="Pending Balance"
          value={`${formatCurrency(wallet.pendingBalance)} ${wallet.currency}`}
          subtitle="In settlement window"
          variant="warning"
        />
        <StatCard
          title="Total Earned"
          value={`${formatCurrency(wallet.totalEarned)} ${wallet.currency}`}
          subtitle="All time earnings"
          variant="info"
        />
        <StatCard
          title="Commission Paid"
          value={`${formatCurrency(wallet.commissionPaid || 0)} ${wallet.currency}`}
          subtitle="Total commission"
          variant="secondary"
        />
      </div>

      <div className="seller-info">
        <h3>Seller Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Seller ID</label>
            <p>{wallet.sellerId}</p>
          </div>
          <div className="info-item">
            <label>Shop Name</label>
            <p>{wallet.sellerName}</p>
          </div>
          <div className="info-item">
            <label>Status</label>
            <p>
              <span className={`status-badge status-${wallet.status.toLowerCase()}`}>
                {wallet.status}
              </span>
            </p>
          </div>
          <div className="info-item">
            <label>Currency</label>
            <p>{wallet.currency}</p>
          </div>
          <div className="info-item">
            <label>Wallet Created</label>
            <p>{formatDate(wallet.createdAt)}</p>
          </div>
          <div className="info-item">
            <label>Last Updated</label>
            <p>{formatDate(wallet.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="transactions-section">
        <h3>Transaction History</h3>

        <div className="transaction-filters">
          <SearchInput
            placeholder="Filter by type..."
            value={transactionFilter}
            onChange={setTransactionFilter}
          />
          <button onClick={fetchSellerData} className="refresh-btn">
            Refresh
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        ) : (
          <>
            <DataTable
              columns={transactionColumns}
              data={transactions}
              onPageChange={setTransactionPage}
              currentPage={transactionPage}
              pageSize={15}
              total={totalTransactions}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SellerFinancialDetail;

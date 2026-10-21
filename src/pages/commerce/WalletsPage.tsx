/**
 * Wallets Management Page
 * Admin view for all seller wallets
 */

import { useCallback, useEffect, useState } from 'react';
import { walletService, type WalletFilters } from '@/services/financial.service';
import { PageHeader } from '@/components/common/PageHeader';
import { Spinner } from '@/components/common/Spinner';
import { DataTable } from '@/components/tables/DataTable';
import { SearchInput } from '@/components/common/SearchInput';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import './WalletsPage.css';

interface Wallet {
  id: string;
  sellerId: string;
  sellerName: string;
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
  status: string;
  createdAt: string;
}

const WalletsPage = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [adjustData, setAdjustData] = useState({
    amount: '',
    type: 'INCREASE',
    reason: ''
  });

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      const filters: WalletFilters = {
        limit: 20,
        offset: page * 20,
        status: status !== 'all' ? status : undefined
      };
      if (search) filters.search = search;

      const response = await walletService.getAllWallets(filters);
      setWallets(response.data || []);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleAdjustBalance = async () => {
    if (!selectedWallet || !adjustData.amount || !adjustData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await walletService.adjustWallet(selectedWallet.id, adjustData);
      setShowAdjustModal(false);
      setAdjustData({ amount: '', type: 'INCREASE', reason: '' });
      fetchWallets();
    } catch (error) {
      console.error('Failed to adjust wallet:', error);
      alert('Failed to adjust wallet balance');
    }
  };

  const handleSuspend = async (wallet: Wallet) => {
    if (confirm(`Suspend wallet for ${wallet.sellerName}?`)) {
      try {
        await walletService.suspendWallet(wallet.id, 'Suspended by admin');
        fetchWallets();
      } catch (error) {
        console.error('Failed to suspend wallet:', error);
        alert('Failed to suspend wallet');
      }
    }
  };

  const columns = [
    {
      key: 'sellerId',
      label: 'Seller ID',
      width: '150px'
    },
    {
      key: 'sellerName',
      label: 'Shop Name',
      width: '200px'
    },
    {
      key: 'availableBalance',
      label: 'Available',
      render: (value: number) => `${value.toFixed(2)} ETB`
    },
    {
      key: 'pendingBalance',
      label: 'Pending',
      render: (value: number) => `${value.toFixed(2)} ETB`
    },
    {
      key: 'totalEarned',
      label: 'Total Earned',
      render: (value: number) => `${value.toFixed(2)} ETB`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`status-badge status-${value.toLowerCase()}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      render: (_: unknown, row: Wallet) => (
        <div className="actions">
          <Button
            size="sm"
            onClick={() => {
              setSelectedWallet(row);
              setShowAdjustModal(true);
            }}
          >
            Adjust
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleSuspend(row)}
            disabled={row.status === 'SUSPENDED'}
          >
            {row.status === 'SUSPENDED' ? 'Suspended' : 'Suspend'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="wallets-page">
      <PageHeader title="Seller Wallets" />

      <div className="toolbar">
        <SearchInput
          placeholder="Search by seller ID or name..."
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
        />
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
        <Button onClick={fetchWallets} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Refresh'}
        </Button>
      </div>

      {loading && !wallets.length ? (
        <div className="loading-state">
          <Spinner />
          <p>Loading wallets...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={wallets}
          onPageChange={setPage}
          currentPage={page}
          pageSize={20}
          total={total}
        />
      )}

      {showAdjustModal && selectedWallet && (
        <Modal
          title="Adjust Wallet Balance"
          onClose={() => setShowAdjustModal(false)}
          actions={[
            { label: 'Cancel', onClick: () => setShowAdjustModal(false) },
            { label: 'Adjust', onClick: handleAdjustBalance, primary: true }
          ]}
        >
          <div className="adjust-form">
            <p><strong>Seller:</strong> {selectedWallet.sellerName}</p>
            <p><strong>Current Available:</strong> {selectedWallet.availableBalance.toFixed(2)} ETB</p>

            <div className="form-group">
              <label>Adjustment Type</label>
              <select
                value={adjustData.type}
                onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
              >
                <option value="INCREASE">Increase</option>
                <option value="DECREASE">Decrease</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount (ETB)</label>
              <input
                type="number"
                value={adjustData.amount}
                onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Reason *</label>
              <textarea
                value={adjustData.reason}
                onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                placeholder="Reason for adjustment..."
                rows={3}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WalletsPage;

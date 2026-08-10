import { useConfiguration } from '@/lib/hooks/useConfiguration';
import DashboardStatsTable from '@/lib/ui/useable-components/dashboard-stats-table';
import { useTranslations } from 'next-intl';
import React, { useMemo, useState, useEffect } from 'react';

// API
import { adminAPI } from '@/lib/api/api';

export default function StatesTable() {
  // Hooks
  const t = useTranslations();

  // Context
  const { CURRENCY_CODE } = useConfiguration();

  // State
  const [data, setData] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);

  // Fetch dashboard orders by type
  useEffect(() => {
    const fetchDashboardOrders = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardOrdersByType();
        setData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard orders by type:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardOrders();
  }, []);

  // Fetch dashboard sales by type
  useEffect(() => {
    const fetchDashboardSales = async () => {
      try {
        setSalesLoading(true);
        const response = await adminAPI.getDashboardSalesByType();
        setSalesData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard sales by type:', err);
      } finally {
        setSalesLoading(false);
      }
    };
    fetchDashboardSales();
  }, []);

  // Memoize the data
  const dashboardOrdersByType = useMemo(() => {
    if (!data) return null;
    return data?.getDashboardOrdersByType;
  }, [data]);

  const dashboardSalesByType = useMemo(() => {
    if (!salesData) return null;
    return salesData?.getDashboardSalesByType;
  }, [salesData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 p-3">
      <DashboardStatsTable
        loading={loading}
        title={t('Orders')}
        data={dashboardOrdersByType ?? []}
        amountConfig={{ format: 'number', currency: CURRENCY_CODE ?? 'USD' }}
      />
      <DashboardStatsTable
        loading={salesLoading}
        title={t('Sales')}
        data={dashboardSalesByType ?? []}
        amountConfig={{ format: 'currency', currency: CURRENCY_CODE ?? 'USD' }}
      />
    </div>
  );
}

// Context imports
import { ToastContext } from '@/lib/context/global/toast.context';

// Custom hooks
import useDebounce from '@/lib/hooks/useDebounce';

// UI components
import Table from '@/lib/ui/useable-components/table';

// API imports
import { adminAPI } from '@/lib/api/api';

// Type definitions
import { ICommissionRateRestaurantResponse } from '@/lib/utils/interfaces';

// React hooks
import { useContext, useEffect, useState } from 'react';

// Table column definitions
import { COMMISSION_RATE_ACTIONS } from '@/lib/utils/constants';

import CommissionRateHeader from '../header/table-header';
import { useTranslations } from 'next-intl';
import { COMMISSION_RATE_COLUMNS } from '@/lib/ui/useable-components/table/columns/comission-rate-columns';

export default function CommissionRateMain() {
  //Hooks
  const t = useTranslations();

  // States
  const [restaurants, setRestaurants] = useState<ICommissionRateRestaurantResponse[] | null>(null);
  const [editingRestaurantIds, setEditingRestaurantIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedRestaurants, setSelectedRestaurants] = useState<
    ICommissionRateRestaurantResponse[]
  >([]);
  const [loadingRestaurant, setLoadingRestaurant] = useState<string | null>(
    null
  );
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Context
  const { showToast } = useContext(ToastContext);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch commission rates using REST API
  const fetchCommissionRates = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllVendors(currentPage, rowsPerPage);
      const vendors = response.data?.vendors || [];
      setRestaurants(vendors);
      setTotalRecords(response.data?.total || 0);
    } catch (error) {
      const err = error as Error;
      showToast({
        type: 'error',
        title: t('Error Fetching Restaurants'),
        message: t(
          'An error occurred while fetching restaurants - Please try again later'
        ),
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleSave = async (restaurantId: string) => {
    const restaurant = restaurants?.find((r) => r._id === restaurantId);
    if (!restaurant?.commissionRate) {
      return showToast({
        type: 'error',
        title: t('Commission Updated'),
        message: `${t('Commission')} ${t('Update')} ${t('failed')}`,
      });
    }
    if (restaurant) {
      setLoadingRestaurant(restaurantId);
      if (restaurant?.commissionRate > 100) {
        setLoadingRestaurant(null);
        return showToast({
          type: 'error',
          title: t('Commission Updated'),
          message: t(
            'As commission rate is a %age value so it cannot exceed a max value of 100'
          ),
        });
      }
      try {
        await adminAPI.updateVendor(restaurantId, { commissionRate: parseFloat(String(restaurant?.commissionRate)) });
        showToast({
          type: 'success',
          title: t('Commission Updated'),
          message: `${t('Commission rate updated for')} ${restaurant.name}`,
          duration: 2000,
        });
        setEditingRestaurantIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(restaurantId);
          return newSet;
        });
        fetchCommissionRates();
      } catch (error) {
        const err = error as Error;
        showToast({
          type: 'error',
          title: t('Error'),
          message: `${t('Error updating commission rate for')} ${restaurant.name}`,
          duration: 2000,
        });
      } finally {
        setLoadingRestaurant(null);
      }
    }
  };

  const handleCommissionRateChange = (restaurantId: string, value: number) => {
    setRestaurants((prevRestaurants) =>
      prevRestaurants
        ? prevRestaurants.map((restaurant) =>
          restaurant._id === restaurantId
            ? { ...restaurant, commissionRate: value }
            : restaurant
        )
        : null
    );
    setEditingRestaurantIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(restaurantId);
      return newSet;
    });
  };

  const getFilteredRestaurants = () => {
    if (!restaurants) return [];
    return restaurants.filter((restaurant) => {
      const nameMatches = restaurant.name
        .toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase());

      // Always show restaurants that are currently being edited
      if (editingRestaurantIds.has(restaurant._id)) {
        return true;
      }

      // Apply name filter
      if (!nameMatches) {
        return false;
      }

      // If no commission rate filters are applied, show all name matches
      if (selectedActions.length === 0) {
        return true;
      }

      // Apply commission rate filters
      return selectedActions.some((action) => {
        switch (action) {
          case COMMISSION_RATE_ACTIONS.MORE_THAN_5:
            return restaurant.commissionRate > 5;
          case COMMISSION_RATE_ACTIONS.MORE_THAN_10:
            return restaurant.commissionRate > 10;
          case COMMISSION_RATE_ACTIONS.MORE_THAN_20:
            return restaurant.commissionRate > 20;
          default:
            return false;
        }
      });
    });
  };

  // Use Effects
  useEffect(() => {
    fetchCommissionRates();
  }, [currentPage, rowsPerPage, debouncedSearchTerm]);

  return (
    <div className="p-3">
      <Table
        data={
          (loading || restaurants === null) ? [] : getFilteredRestaurants()
        }
        setSelectedData={setSelectedRestaurants}
        selectedData={selectedRestaurants}
        columns={COMMISSION_RATE_COLUMNS({
          handleSave,
          handleCommissionRateChange,
          loadingRestaurant,
        })}
        loading={loading || restaurants === null}
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        totalRecords={totalRecords}
        onPageChange={(page, rows) => {
          setCurrentPage(page);
          setRowsPerPage(rows);
        }}
        header={
          <CommissionRateHeader
            selectedActions={selectedActions}
            setSelectedActions={setSelectedActions}
            onSearch={setSearchTerm}
          />
        }
      />
    </div>
  );
}

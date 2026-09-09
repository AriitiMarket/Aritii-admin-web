// Components
import StatsCard from '@/lib/ui/useable-components/stats-card';

// Icons
import {
  IDashboardUsersResponseGraphQL,
} from '@/lib/utils/interfaces';

import {
  faMotorcycle,
  faStore,
  faUsers,
  faUtensils,
} from '@fortawesome/free-solid-svg-icons';
import { useMemo, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

// API
import { adminAPI } from '@/lib/api/api';

export default function UserStats() {
  // Hooks
  const t = useTranslations();
  const [data, setData] = useState<IDashboardUsersResponseGraphQL | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard users using REST API
  useEffect(() => {
    const fetchDashboardUsers = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardUsers();
        setData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardUsers();
  }, []);

  const dashboardUsers = useMemo(() => {
    if (!data) return null;
    return {
      usersCount: data?.getDashboardUsers?.usersCount ?? 0,
      vendorsCount: data?.getDashboardUsers?.vendorsCount ?? 0,
      restaurantsCount: data?.getDashboardUsers?.restaurantsCount ?? 0,
      ridersCount: data?.getDashboardUsers?.ridersCount ?? 0,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-3 cursor-pointer">
      <StatsCard
        label={t('Total Users')}
        total={dashboardUsers?.usersCount ?? 0}
        description={t("eight_point_five_up_from_yesterday")}
        icon={faUsers}
        route="/general/users"
        loading={loading}
      />
      <StatsCard
        label={t('Total Vendors')}
        total={dashboardUsers?.vendorsCount ?? 0}
        description={t("two_point_four_up_from_yesterday")}
        icon={faStore}
        route="/general/vendors"
        loading={loading}
      />
      <StatsCard
        label={t('Total Stores')}
        total={dashboardUsers?.restaurantsCount ?? 0}
        description={t("six_point_one_down_from_yesterday")}
        icon={faUtensils}
        route="/general/stores"
        loading={loading}
      />
      <StatsCard
        label={t('Total Riders')}
        total={dashboardUsers?.ridersCount ?? 0}
        description={t("one_point_nine_up_from_yesterday")}
        icon={faMotorcycle}
        route="/general/riders"
        loading={loading}
      />
    </div>
  );
}

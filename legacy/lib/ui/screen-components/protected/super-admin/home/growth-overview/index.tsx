// Core
import { useEffect, useMemo, useState } from 'react';

// Prime React
import { Chart } from 'primereact/chart';
import {
  IDashboardUsersByYearResponseGraphQL,
} from '@/lib/utils/interfaces';
import DashboardUsersByYearStatsSkeleton from '@/lib/ui/useable-components/custom-skeletons/dasboard.user.year.stats.skeleton';
import { useTranslations } from 'next-intl';

// API
import { adminAPI } from '@/lib/api/api';

// Dummy

export default function GrowthOverView() {
  // Hooks
  const t = useTranslations();

  // States
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  const [data, setData] = useState<IDashboardUsersByYearResponseGraphQL | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard users by year using REST API
  useEffect(() => {
    const fetchDashboardUsersByYear = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getDashboardUsersByYear(new Date().getFullYear());
        setData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard users by year:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardUsersByYear();
  }, []);

  const dashboardUsersByYear = useMemo(() => {
    if (!data) return null;
    return {
      usersCount: data?.getDashboardUsersByYear?.usersCount ?? [],
      vendorsCount: data?.getDashboardUsersByYear?.vendorsCount ?? [],
      restaurantsCount: data?.getDashboardUsersByYear?.restaurantsCount ?? [],
      ridersCount: data?.getDashboardUsersByYear?.ridersCount ?? 0,
    };
  }, [data]);

  // Handlers
  const onChartDataChange = () => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue(
      '--text-color-secondary'
    );
    const surfaceBorder = '#4b5563'; // tailwind gray-600
    const data = {
      labels: [
        t('January'),
        t('February'),
        t('March'),
        t('April'),
        t('May'),
        t('June'),
        t('July'),
        t('August'),
        t('September'),
        t('October'),
        t('November'),
        t('December'),
      ],
      datasets: [
        {
          label: t('Stores'),
          data: dashboardUsersByYear?.restaurantsCount ?? [],
          fill: false,
          borderColor: documentStyle.getPropertyValue('--pink-500'),
          backgroundColor: documentStyle.getPropertyValue('--pink-100'),
          tension: 0.5,
        },
        {
          label: t('Vendors'),
          data: dashboardUsersByYear?.vendorsCount ?? [],
          fill: false,
          borderColor: documentStyle.getPropertyValue('--blue-500'),
          backgroundColor: documentStyle.getPropertyValue('--blue-100'),
          tension: 0.5,
        },
        {
          label: t('Riders'),
          data: dashboardUsersByYear?.ridersCount ?? [],
          fill: false,
          borderColor: documentStyle.getPropertyValue('--yellow-500'),
          backgroundColor: documentStyle.getPropertyValue('--yellow-100'),
          tension: 0.5,
        },
        {
          label: t('Users'),
          data: dashboardUsersByYear?.usersCount ?? [],
          fill: true,

          borderColor: 'rgba(90, 193, 47, 1)',
          backgroundColor: 'rgba(201, 232, 189, 0.2)',
          tension: 0.5,
        },
      ],
    };
    const options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,

      plugins: {
        legend: {
          marginBottom: '20px',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            backgroundColor: textColor,
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };

    setChartData(data);
    setChartOptions(options);
  };
  // Use Effect
  useEffect(() => {
    onChartDataChange();
  }, [dashboardUsersByYear]);

  return (
    <div className={`w-full p-3`}>
      <h2 className="text-lg font-semibold">{t('Growth Overview')}</h2>
      <p className="text-gray-500">
        {t('Tracking Stakeholders Growth Over the Year')}
      </p>
      <div className="mt-4 bg-white dark:bg-dark-950">
        {loading ? (
          <DashboardUsersByYearStatsSkeleton />
        ) : (
          <Chart type="line" data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
}

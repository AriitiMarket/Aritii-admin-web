import { useState, useEffect, useCallback } from 'react';
import {
  analyticsService,
  type AnalyticsAnomaly,
  type ForecastPoint,
  type GrowthPoint,
  type PlatformStats,
  type TypeBreakdown,
} from '@/services/analytics.admin.service';

/** Inclusive day range shared by every analytics call. */
export type DateRange = {
  dateFrom: string;
  dateTo: string;
};

/**
 * Analytics Dashboard Hook
 */
export function useAnalyticsDashboard() {
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [ordersByType, setOrdersByType] = useState<TypeBreakdown>({});
  const [salesByType, setSalesByType] = useState<TypeBreakdown>({});
  const [anomalies, setAnomalies] = useState<AnalyticsAnomaly[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });

  const clearError = useCallback(() => setError(null), []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashData, statsData, growthData, ordersData, salesData, anomaliesData, forecastData] = await Promise.all([
        analyticsService.getDashboard(dateRange),
        analyticsService.getPlatformStats(dateRange),
        analyticsService.getUsersGrowth(dateRange),
        analyticsService.getOrdersByType(dateRange),
        analyticsService.getSalesByType(dateRange),
        analyticsService.getAnomalies(dateRange),
        analyticsService.getForecast(dateRange),
      ]);

      setDashboard(dashData);
      setStats(statsData);
      setGrowth(growthData);
      setOrdersByType(ordersData);
      setSalesByType(salesData);
      setAnomalies(anomaliesData);
      setForecast(forecastData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const updateDateRange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  return {
    dashboard,
    stats,
    growth,
    ordersByType,
    salesByType,
    anomalies,
    forecast,
    loading,
    error,
    dateRange,
    clearError,
    updateDateRange,
    reload: loadDashboard,
  };
}

/**
 * Analytics Dashboard Page
 */
export function AnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    stats,
    growth,
    ordersByType,
    salesByType,
    anomalies,
    forecast,
    loading,
    error,
    dateRange,
    clearError,
    updateDateRange,
  } = useAnalyticsDashboard();

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>

      {error && (
        <div className="alert alert-error" onClick={clearError}>
          {error} ✕
        </div>
      )}

      <DateRangeFilter dateRange={dateRange} onUpdate={updateDateRange} />

      <div className="analytics-tabs">
        {['overview', 'growth', 'anomalies', 'forecast'].map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="analytics-content">
        {activeTab === 'overview' && <OverviewTab stats={stats} ordersByType={ordersByType} salesByType={salesByType} />}
        {activeTab === 'growth' && <GrowthTab growth={growth} />}
        {activeTab === 'anomalies' && <AnomaliesTab anomalies={anomalies} />}
        {activeTab === 'forecast' && <ForecastTab forecast={forecast} />}
      </div>
    </div>
  );
}

/**
 * Date Range Filter Component
 */
function DateRangeFilter({
  dateRange,
  onUpdate,
}: {
  dateRange: DateRange;
  onUpdate: (range: DateRange) => void;
}) {
  return (
    <div className="date-range-filter">
      <div className="filter-group">
        <label>From:</label>
        <input
          type="date"
          value={dateRange.dateFrom}
          onChange={(e) => onUpdate({ ...dateRange, dateFrom: e.target.value })}
        />
      </div>

      <div className="filter-group">
        <label>To:</label>
        <input
          type="date"
          value={dateRange.dateTo}
          onChange={(e) => onUpdate({ ...dateRange, dateTo: e.target.value })}
        />
      </div>

      <div className="quick-filters">
        <button onClick={() => onUpdate({
          dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0],
        })}>
          Last 7 Days
        </button>
        <button onClick={() => onUpdate({
          dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0],
        })}>
          Last 30 Days
        </button>
        <button onClick={() => onUpdate({
          dateFrom: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateTo: new Date().toISOString().split('T')[0],
        })}>
          Last Year
        </button>
      </div>
    </div>
  );
}

/**
 * Overview Tab - Key metrics
 */
function OverviewTab({
  stats,
  ordersByType,
  salesByType,
}: {
  stats: PlatformStats | null;
  ordersByType: TypeBreakdown;
  salesByType: TypeBreakdown;
}) {
  return (
    <div className="overview-tab">
      <div className="metrics-grid">
        {stats && Object.entries(stats).map(([key, value]) => (
          <MetricCard key={key} label={key} value={value} />
        ))}
      </div>

      <div className="breakdown-section">
        <div className="breakdown-half">
          <h3>Orders by Type</h3>
          <BreakdownChart data={ordersByType} />
        </div>
        <div className="breakdown-half">
          <h3>Sales by Type</h3>
          <BreakdownChart data={salesByType} />
        </div>
      </div>
    </div>
  );
}

/**
 * Growth Tab - Users and orders growth
 */
function GrowthTab({ growth }: { growth: GrowthPoint[] }) {
  return (
    <div className="growth-tab">
      <h3>Growth Over Time</h3>
      <div className="growth-chart">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Users</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {growth.map((item, idx) => (
              <tr key={idx}>
                <td>{new Date(item.date).toLocaleDateString()}</td>
                <td>{item.users || 0}</td>
                <td>{item.orders || 0}</td>
                <td>${(item.revenue || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Anomalies Tab - Alert detection
 */
function AnomaliesTab({ anomalies }: { anomalies: AnalyticsAnomaly[] }) {
  if (!anomalies || anomalies.length === 0) {
    return <div className="no-anomalies">No anomalies detected</div>;
  }

  return (
    <div className="anomalies-tab">
      <h3>Detected Anomalies</h3>
      <div className="anomalies-list">
        {anomalies.map((anomaly, idx) => (
          <div key={idx} className="anomaly-item">
            <div className="anomaly-header">
              <h4>{anomaly.metric}</h4>
              <span className={`severity ${anomaly.severity}`}>{anomaly.severity}</span>
            </div>
            <p>{anomaly.description}</p>
            <small>Detected: {new Date(anomaly.detectedAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Forecast Tab - Future predictions
 */
function ForecastTab({ forecast }: { forecast: ForecastPoint[] }) {
  return (
    <div className="forecast-tab">
      <h3>Forecast</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Predicted Orders</th>
            <th>Confidence</th>
            <th>Predicted Revenue</th>
          </tr>
        </thead>
        <tbody>
          {forecast.map((item, idx) => (
            <tr key={idx}>
              <td>{new Date(item.date).toLocaleDateString()}</td>
              <td>{item.predictedOrders || 0}</td>
              <td>{((item.confidence || 0) * 100).toFixed(1)}%</td>
              <td>${(item.predictedRevenue || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({ label, value }: { label: string; value: number | string }) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="metric-card">
      <p className="metric-label">{label}</p>
      <p className="metric-value">{formatValue(value)}</p>
    </div>
  );
}

/**
 * Breakdown Chart Component
 */
function BreakdownChart({ data }: { data: TypeBreakdown }) {
  const total = Object.values(data).reduce((sum, val) => sum + (val || 0), 0);

  return (
    <div className="breakdown-chart">
      {Object.entries(data).map(([label, value]) => {
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return (
          <div key={label} className="breakdown-item">
            <div className="breakdown-label">{label}</div>
            <div className="breakdown-bar">
              <div
                className="breakdown-fill"
                style={{ width: `${percentage}%` }}
              />
              <span className="breakdown-percent">{percentage}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

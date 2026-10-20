import { useState, useEffect } from 'react';

/** A product that buyers added to a wishlist. */
export interface WishlistedProduct {
  id: string;
  name: string;
  category: string;
  wishlists: number;
  conversions: number;
}

/** One day of the wishlist trend series. */
export interface WishlistTrend {
  date: string;
  wishlists: number;
  conversions: number;
}

/** The wishlist metrics rendered by this page. */
export interface WishlistAnalytics {
  totalWishlists: number;
  totalItems: number;
  activeUsers: number;
  avgItemsPerUser: number;
  conversionRate: number;
  topWishlisted: WishlistedProduct[];
  trends: WishlistTrend[];
}

/**
 * ADMIN WISHLIST ANALYTICS PAGE - Monitor wishlist metrics and trends
 */
export function AdminWishlistAnalyticsPage() {
  const [analytics, setAnalytics] = useState<WishlistAnalytics>({
    totalWishlists: 0,
    totalItems: 0,
    activeUsers: 0,
    avgItemsPerUser: 0,
    conversionRate: 0,
    topWishlisted: [],
    trends: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedProduct, setSelectedProduct] = useState<WishlistedProduct | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data - in real implementation, call your analytics service
      const mockData = {
        totalWishlists: 4521,
        totalItems: 18432,
        activeUsers: 3842,
        avgItemsPerUser: 4.8,
        conversionRate: 23.5,
        topWishlisted: [
          {
            id: '1',
            name: 'Wireless Headphones',
            category: 'Electronics',
            wishlists: 1247,
            conversions: 284,
          },
          {
            id: '2',
            name: 'Running Shoes',
            category: 'Fashion',
            wishlists: 892,
            conversions: 156,
          },
          {
            id: '3',
            name: 'Yoga Mat',
            category: 'Fitness',
            wishlists: 756,
            conversions: 98,
          },
          {
            id: '4',
            name: 'Coffee Maker',
            category: 'Home',
            wishlists: 634,
            conversions: 127,
          },
          {
            id: '5',
            name: 'Desk Lamp',
            category: 'Office',
            wishlists: 521,
            conversions: 85,
          },
        ],
        trends: [
          { date: '2024-01-08', wishlists: 3200, conversions: 650 },
          { date: '2024-01-09', wishlists: 3450, conversions: 720 },
          { date: '2024-01-10', wishlists: 3800, conversions: 850 },
          { date: '2024-01-11', wishlists: 4100, conversions: 920 },
          { date: '2024-01-12', wishlists: 4300, conversions: 980 },
          { date: '2024-01-13', wishlists: 4500, conversions: 1050 },
          { date: '2024-01-14', wishlists: 4521, conversions: 1062 },
        ],
      };
      setAnalytics(mockData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || 'Failed to load analytics'
          : 'Failed to load analytics'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-state"><p>Loading analytics...</p></div>;
  }

  return (
    <div className="admin-wishlist-analytics-page">
      <div className="page-header">
        <h1>Wishlist Analytics</h1>
        <div className="date-range-selector">
          <label>Time Range:</label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" onClick={() => setError(null)}>
          {error} ✕
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Wishlists"
          value={analytics.totalWishlists.toLocaleString()}
          icon="❤️"
          trend="+12.5%"
        />
        <MetricCard
          title="Total Items"
          value={analytics.totalItems.toLocaleString()}
          icon="📦"
          trend="+8.3%"
        />
        <MetricCard
          title="Active Users"
          value={analytics.activeUsers.toLocaleString()}
          icon="👥"
          trend="+5.2%"
        />
        <MetricCard
          title="Avg Items/User"
          value={analytics.avgItemsPerUser.toFixed(1)}
          icon="📊"
          trend="+2.1%"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${analytics.conversionRate.toFixed(1)}%`}
          icon="✓"
          trend="+3.7%"
        />
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h2>Wishlist Trends</h2>
          <div className="chart-placeholder">
            <TrendChart data={analytics.trends} />
          </div>
        </div>
      </div>

      {/* Top Wishlisted Products */}
      <div className="table-section">
        <h2>Top Wishlisted Products</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Times Wishlisted</th>
              <th>Conversions</th>
              <th>Conversion Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {analytics.topWishlisted.map((product) => {
              const conversionRateValue =
                (product.conversions / product.wishlists) * 100;
              const conversionRate = conversionRateValue.toFixed(1);
              return (
                <tr key={product.id}>
                  <td className="product-name">{product.name}</td>
                  <td>{product.category}</td>
                  <td>
                    <strong>{product.wishlists.toLocaleString()}</strong>
                  </td>
                  <td>{product.conversions.toLocaleString()}</td>
                  <td>
                    <span className={`conversion-badge ${
                      conversionRateValue > 30 ? 'high' :
                      conversionRateValue > 20 ? 'medium' : 'low'
                    }`}>
                      {conversionRate}%
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="btn btn-sm btn-secondary"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        <h2>Key Insights</h2>
        <div className="insights-grid">
          <InsightCard
            title="Most Popular Category"
            value="Electronics"
            description="45% of all wishlisted items are from the Electronics category"
            icon="💡"
          />
          <InsightCard
            title="Peak Wishlist Time"
            value="8:00 PM - 10:00 PM"
            description="Users add items to wishlists most frequently during evening hours"
            icon="⏰"
          />
          <InsightCard
            title="Avg Wishlist Size"
            value="4.8 items"
            description="On average, each user saves 4.8 items to their wishlist"
            icon="📈"
          />
          <InsightCard
            title="Wishlist Retention"
            value="78%"
            description="78% of items remain in wishlists for more than 30 days"
            icon="💾"
          />
        </div>
      </div>

      {/* Selected Product Details */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

            <div className="product-details-modal">
              <h2>{selectedProduct.name}</h2>

              <div className="details-grid">
                <div className="detail-item">
                  <label>Category</label>
                  <span>{selectedProduct.category}</span>
                </div>
                <div className="detail-item">
                  <label>Times Wishlisted</label>
                  <span>{selectedProduct.wishlists.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Conversions</label>
                  <span>{selectedProduct.conversions.toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <label>Conversion Rate</label>
                  <span>
                    {(
                      (selectedProduct.conversions / selectedProduct.wishlists) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <a href={`/admin/products/${selectedProduct.id}`} className="btn btn-primary">
                  View Product
                </a>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="btn btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Metric Card Component
 */
function MetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: string;
  trend: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <p className="metric-title">{title}</p>
        <div className="metric-value-row">
          <span className="metric-value">{value}</span>
          <span className="metric-trend">{trend}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Insight Card Component
 */
function InsightCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="insight-card">
      <div className="insight-header">
        <span className="insight-icon">{icon}</span>
        <h3>{title}</h3>
      </div>
      <div className="insight-value">{value}</div>
      <p className="insight-description">{description}</p>
    </div>
  );
}

/**
 * Simple Trend Chart Component
 */
function TrendChart({ data }: { data: WishlistTrend[] }) {
  if (!data || data.length === 0) return <div>No data</div>;

  const maxValue = Math.max(...data.map((d) => d.wishlists));
  const barHeight = (value: number) => value / maxValue * 100;

  return (
    <div className="trend-chart">
      <div className="chart-bars">
        {data.map((point, idx) => (
          <div key={idx} className="bar-container">
            <div
              className="bar"
              style={{ height: `${barHeight(point.wishlists)}%` }}
              title={`${point.wishlists} wishlists, ${point.conversions} conversions`}
            />
            <span className="bar-date">
              {new Date(point.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        <span>Wishlists added</span>
        <span>Peak: {Math.max(...data.map((d) => d.wishlists)).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default AdminWishlistAnalyticsPage;
